/**
 * Scene Manager
 *
 * Orchestrates multiple AI characters in a scene.
 * Provides a high-level interface for LLM scene control.
 */

import * as THREE from 'three';
import { Humanoid } from './humanoid.js';
import { AnimationController } from './animation.js';
import { animations } from './animations.js';
import { AnimationValidator, createLLMFeedback } from './validator.js';
import { NavMesh, Pathfinder, NavAgent } from './navigation.js';

/**
 * Character wrapper that combines humanoid, animation, and navigation
 */
export class Character {
    constructor(id, options = {}) {
        this.id = id;
        this.name = options.name || `Character_${id}`;

        // Create humanoid
        this.humanoid = new Humanoid();
        this.animController = new AnimationController(this.humanoid);

        // Navigation agent (set up by scene manager)
        this.navAgent = null;

        // State
        this.currentAction = 'idle';
        this.targetCharacter = null; // For interactions
        this.dialogue = null;

        // Colors for different characters
        if (options.color) {
            this.setColor(options.color);
        }
    }

    setColor(color) {
        const colorObj = new THREE.Color(color);
        this.humanoid.group.traverse((child) => {
            if (child.isMesh && child.material) {
                // Keep skin color for hands/head, change clothing
                if (child.material.color && child.material.color.getHex() === 0x4a90d9) {
                    child.material = child.material.clone();
                    child.material.color = colorObj;
                }
            }
        });
    }

    getObject() {
        return this.humanoid.getObject();
    }

    update(deltaTime) {
        this.animController.update(deltaTime);
    }
}

/**
 * Scene Manager
 * Main controller for multi-character AI scenes
 */
export class SceneManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.characters = new Map();
        this.validator = new AnimationValidator();

        // Navigation setup
        this.navMesh = new NavMesh({
            width: options.navWidth || 20,
            height: options.navHeight || 20,
            cellSize: options.navCellSize || 0.5,
            offsetX: options.navOffsetX || -10,
            offsetY: options.navOffsetY || -10
        });
        this.pathfinder = new Pathfinder(this.navMesh);

        // Scene objects/obstacles
        this.sceneObjects = [];

        // Debug visualization
        this.debugMesh = null;
        this.showNavMesh = false;

        // Action queue for sequential actions
        this.actionQueue = [];
        this.isProcessingQueue = false;

        // Event callbacks
        this.onActionComplete = null;
        this.onValidationError = null;
    }

    /**
     * Add a character to the scene
     */
    addCharacter(id, options = {}) {
        if (this.characters.has(id)) {
            console.warn(`Character ${id} already exists`);
            return this.characters.get(id);
        }

        const character = new Character(id, options);

        // Set up navigation agent
        character.navAgent = new NavAgent(character.humanoid, this.navMesh, this.pathfinder);

        // Set initial position
        const startPos = options.position || { x: 0, z: 0 };
        character.getObject().position.set(startPos.x, 0, startPos.z);
        character.navAgent.syncFromCharacter();

        // Navigation callbacks
        character.navAgent.onReachDestination = () => {
            this.onCharacterReachDestination(character);
        };

        // Add to scene
        this.scene.add(character.getObject());
        this.characters.set(id, character);

        // Start with idle animation
        character.animController.play(animations.idle);

        return character;
    }

    /**
     * Remove a character from the scene
     */
    removeCharacter(id) {
        const character = this.characters.get(id);
        if (character) {
            this.scene.remove(character.getObject());
            this.characters.delete(id);
        }
    }

    /**
     * Get a character by ID
     */
    getCharacter(id) {
        return this.characters.get(id);
    }

    /**
     * Add an obstacle to the scene
     */
    addObstacle(mesh, options = {}) {
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Add to navmesh
        if (options.isCircle) {
            this.navMesh.addCircularObstacle(center.x, center.z, options.radius || size.x / 2);
        } else {
            this.navMesh.addObstacle(center.x, center.z, size.x + 0.5, size.z + 0.5);
        }

        this.sceneObjects.push({
            mesh,
            x: center.x,
            z: center.z,
            width: size.x,
            depth: size.z,
            radius: options.radius,
            isCircle: options.isCircle
        });

        this.scene.add(mesh);
        return mesh;
    }

    /**
     * Toggle navmesh debug visualization
     */
    toggleNavMeshDebug() {
        this.showNavMesh = !this.showNavMesh;

        if (this.showNavMesh) {
            this.debugMesh = this.navMesh.createDebugMesh();
            this.scene.add(this.debugMesh);
        } else if (this.debugMesh) {
            this.scene.remove(this.debugMesh);
            this.debugMesh = null;
        }
    }

    /**
     * Update all characters (call every frame)
     */
    update(deltaTime) {
        // Get all agent positions for collision avoidance
        const agents = Array.from(this.characters.values()).map(c => c.navAgent);

        for (const character of this.characters.values()) {
            // Update navigation
            character.navAgent.update(deltaTime, agents, this.sceneObjects);

            // Switch between walk and idle animations based on movement
            const isMoving = character.navAgent.isMoving;
            const speed = Math.sqrt(
                character.navAgent.velocity.x ** 2 +
                character.navAgent.velocity.z ** 2
            );

            if (isMoving && speed > 0.2 && character.currentAction !== 'walk') {
                character.currentAction = 'walk';
                character.animController.play(animations.walk);
            } else if ((!isMoving || speed < 0.1) && character.currentAction === 'walk') {
                character.currentAction = 'idle';
                character.animController.play(animations.idle);
            }

            // Update animation
            character.update(deltaTime);
        }

        // Process action queue
        this.processActionQueue();
    }

    /**
     * Handle character reaching destination
     */
    onCharacterReachDestination(character) {
        if (this.onActionComplete) {
            this.onActionComplete(character.id, 'move');
        }
    }

    // ============================================
    // LLM Control Interface
    // ============================================

    /**
     * Execute a scene command from LLM
     * Returns validation feedback
     */
    executeCommand(command) {
        const result = {
            success: true,
            feedback: '',
            errors: []
        };

        try {
            switch (command.action) {
                case 'move':
                    return this.cmdMove(command);
                case 'animate':
                    return this.cmdAnimate(command);
                case 'speak':
                    return this.cmdSpeak(command);
                case 'interact':
                    return this.cmdInteract(command);
                case 'lookAt':
                    return this.cmdLookAt(command);
                case 'spawn':
                    return this.cmdSpawn(command);
                default:
                    result.success = false;
                    result.feedback = `Unknown action: ${command.action}`;
            }
        } catch (e) {
            result.success = false;
            result.feedback = `Error executing command: ${e.message}`;
            result.errors.push(e.message);
        }

        return result;
    }

    /**
     * Move command: Move character to position
     */
    cmdMove(command) {
        const character = this.getCharacter(command.character);
        if (!character) {
            return { success: false, feedback: `Character not found: ${command.character}` };
        }

        const target = new THREE.Vector3(
            command.target?.x ?? 0,
            0,
            command.target?.z ?? command.target?.y ?? 0
        );

        // Check if position is walkable
        if (!this.navMesh.isWalkable(target.x, target.z)) {
            return {
                success: false,
                feedback: `Target position (${target.x.toFixed(1)}, ${target.z.toFixed(1)}) is not walkable. Try a different location.`
            };
        }

        const pathFound = character.navAgent.setDestination(target);

        if (!pathFound) {
            return {
                success: false,
                feedback: `No path found to (${target.x.toFixed(1)}, ${target.z.toFixed(1)}). The destination may be blocked.`
            };
        }

        return {
            success: true,
            feedback: `${character.name} moving to (${target.x.toFixed(1)}, ${target.z.toFixed(1)})`
        };
    }

    /**
     * Animate command: Play animation on character
     */
    cmdAnimate(command) {
        const character = this.getCharacter(command.character);
        if (!character) {
            return { success: false, feedback: `Character not found: ${command.character}` };
        }

        let animation;

        // Check if it's a preset animation
        if (typeof command.animation === 'string') {
            animation = animations[command.animation];
            if (!animation) {
                const available = Object.keys(animations).join(', ');
                return {
                    success: false,
                    feedback: `Unknown animation: ${command.animation}. Available: ${available}`
                };
            }
        } else {
            // Custom animation - validate it
            animation = command.animation;
            const validation = createLLMFeedback(animation, this.validator);

            if (!validation.success) {
                return {
                    success: false,
                    feedback: validation.feedback,
                    fixedAnimation: validation.fixedAnimation
                };
            }

            if (validation.score < 80) {
                // Animation is valid but has warnings
                const result = {
                    success: true,
                    feedback: validation.feedback,
                    warnings: true
                };

                // Still play the animation
                character.animController.play(animation, { loop: command.loop ?? false });
                character.currentAction = animation.name || 'custom';

                return result;
            }
        }

        character.animController.play(animation, { loop: command.loop ?? animation.loop ?? false });
        character.currentAction = animation.name || 'custom';

        return {
            success: true,
            feedback: `${character.name} playing animation: ${animation.name || 'custom'}`
        };
    }

    /**
     * Speak command: Set dialogue for character
     */
    cmdSpeak(command) {
        const character = this.getCharacter(command.character);
        if (!character) {
            return { success: false, feedback: `Character not found: ${command.character}` };
        }

        character.dialogue = command.text;

        // Play talking animation
        if (command.animate !== false) {
            character.animController.play(animations.talk, { loop: true });
            character.currentAction = 'talk';
        }

        return {
            success: true,
            feedback: `${character.name}: "${command.text}"`
        };
    }

    /**
     * Interact command: Character interacts with another
     */
    cmdInteract(command) {
        const character = this.getCharacter(command.character);
        const target = this.getCharacter(command.target);

        if (!character) {
            return { success: false, feedback: `Character not found: ${command.character}` };
        }
        if (!target) {
            return { success: false, feedback: `Target character not found: ${command.target}` };
        }

        // Move toward target
        const targetPos = target.getObject().position.clone();
        const charPos = character.getObject().position;
        const direction = new THREE.Vector3().subVectors(charPos, targetPos).normalize();

        // Stop 1 unit away from target
        const destination = targetPos.clone().add(direction.multiplyScalar(1.2));

        character.navAgent.setDestination(destination);
        character.targetCharacter = target;

        return {
            success: true,
            feedback: `${character.name} approaching ${target.name}`
        };
    }

    /**
     * LookAt command: Make character face a position or another character
     */
    cmdLookAt(command) {
        const character = this.getCharacter(command.character);
        if (!character) {
            return { success: false, feedback: `Character not found: ${command.character}` };
        }

        let targetPos;

        if (command.target && typeof command.target === 'string') {
            const targetChar = this.getCharacter(command.target);
            if (!targetChar) {
                return { success: false, feedback: `Target character not found: ${command.target}` };
            }
            targetPos = targetChar.getObject().position;
        } else {
            targetPos = new THREE.Vector3(
                command.position?.x ?? 0,
                0,
                command.position?.z ?? command.position?.y ?? 0
            );
        }

        // Calculate rotation
        const charPos = character.getObject().position;
        const angle = Math.atan2(targetPos.x - charPos.x, targetPos.z - charPos.z);
        character.getObject().rotation.y = angle;
        character.navAgent.rotation = angle;

        return {
            success: true,
            feedback: `${character.name} looking at target`
        };
    }

    /**
     * Spawn command: Add new character
     */
    cmdSpawn(command) {
        const id = command.id || `char_${this.characters.size + 1}`;

        if (this.characters.has(id)) {
            return { success: false, feedback: `Character ${id} already exists` };
        }

        const position = {
            x: command.position?.x ?? 0,
            z: command.position?.z ?? command.position?.y ?? 0
        };

        // Check if position is walkable
        if (!this.navMesh.isWalkable(position.x, position.z)) {
            return {
                success: false,
                feedback: `Cannot spawn at (${position.x}, ${position.z}) - position not walkable`
            };
        }

        this.addCharacter(id, {
            name: command.name || id,
            position,
            color: command.color
        });

        return {
            success: true,
            feedback: `Spawned ${command.name || id} at (${position.x}, ${position.z})`
        };
    }

    /**
     * Queue an action for sequential execution
     */
    queueAction(command) {
        this.actionQueue.push(command);
    }

    /**
     * Process queued actions
     */
    processActionQueue() {
        if (this.isProcessingQueue || this.actionQueue.length === 0) return;

        // Check if any character is mid-action
        for (const char of this.characters.values()) {
            if (char.navAgent.isMoving) return;
        }

        this.isProcessingQueue = true;
        const command = this.actionQueue.shift();
        const result = this.executeCommand(command);

        if (!result.success && this.onValidationError) {
            this.onValidationError(result);
        }

        this.isProcessingQueue = false;
    }

    /**
     * Execute a scene script (array of commands)
     */
    executeScript(script) {
        const results = [];

        for (const command of script) {
            if (command.delay) {
                // Queue with delay
                setTimeout(() => {
                    const result = this.executeCommand(command);
                    results.push(result);
                }, command.delay * 1000);
            } else if (command.queue) {
                // Add to sequential queue
                this.queueAction(command);
                results.push({ success: true, feedback: 'Queued' });
            } else {
                // Execute immediately
                const result = this.executeCommand(command);
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Get current scene state for LLM context
     */
    getSceneState() {
        const state = {
            characters: {},
            obstacles: this.sceneObjects.map(o => ({
                x: o.x,
                z: o.z,
                width: o.width,
                depth: o.depth
            }))
        };

        for (const [id, char] of this.characters) {
            const pos = char.getObject().position;
            state.characters[id] = {
                name: char.name,
                position: { x: pos.x.toFixed(2), z: pos.z.toFixed(2) },
                rotation: (char.navAgent.rotation * 180 / Math.PI).toFixed(0),
                action: char.currentAction,
                isMoving: char.navAgent.isMoving,
                dialogue: char.dialogue
            };
        }

        return state;
    }

    /**
     * Generate LLM prompt context
     */
    getLLMContext() {
        const state = this.getSceneState();
        let context = `Current Scene State:\n`;
        context += `Characters:\n`;

        for (const [id, info] of Object.entries(state.characters)) {
            context += `  - ${info.name} (${id}): at (${info.position.x}, ${info.position.z}), `;
            context += `facing ${info.rotation}°, ${info.isMoving ? 'moving' : info.action}\n`;
        }

        if (state.obstacles.length > 0) {
            context += `\nObstacles:\n`;
            state.obstacles.forEach((o, i) => {
                context += `  - Object ${i + 1}: at (${o.x.toFixed(1)}, ${o.z.toFixed(1)}), size ${o.width.toFixed(1)}x${o.depth.toFixed(1)}\n`;
            });
        }

        context += `\nAvailable animations: ${Object.keys(animations).join(', ')}\n`;
        context += `Walkable area: -10 to 10 on both X and Z axes\n`;

        return context;
    }
}

/**
 * Example scene script that an LLM might generate
 */
export const exampleScript = [
    {
        action: 'spawn',
        id: 'alice',
        name: 'Alice',
        position: { x: -3, z: 0 },
        color: '#4a90d9'
    },
    {
        action: 'spawn',
        id: 'bob',
        name: 'Bob',
        position: { x: 3, z: 0 },
        color: '#d94a4a'
    },
    {
        action: 'move',
        character: 'alice',
        target: { x: 0, z: 2 },
        delay: 0.5
    },
    {
        action: 'move',
        character: 'bob',
        target: { x: 0, z: -1 },
        delay: 0.5
    },
    {
        action: 'lookAt',
        character: 'alice',
        target: 'bob',
        delay: 3
    },
    {
        action: 'lookAt',
        character: 'bob',
        target: 'alice',
        delay: 3
    },
    {
        action: 'animate',
        character: 'alice',
        animation: 'wave',
        delay: 3.5
    },
    {
        action: 'speak',
        character: 'alice',
        text: 'Hey Bob! How are you?',
        delay: 5
    }
];
