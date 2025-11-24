import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Humanoid } from './humanoid.js';
import { AnimationController } from './animation.js';
import { animations } from './animations.js';
import { AnimationValidator, createLLMFeedback } from './validator.js';
import { SceneManager, exampleScript } from './scene-manager.js';

/**
 * AI Humanoid Animation System - Main Entry Point
 *
 * Features:
 * - Semantic animation format for LLM control
 * - Animation validation with feedback
 * - Multi-character scene management
 * - NavMesh pathfinding with collision avoidance
 */

class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // Scene manager for multi-character support
        this.sceneManager = null;

        // Validator for animation feedback
        this.validator = new AnimationValidator();

        // Mode: 'single' or 'multi'
        this.mode = 'single';

        // Single character mode
        this.humanoid = null;
        this.animController = null;

        this.init();
        this.setupUI();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Create camera
        const container = document.getElementById('canvas-container');
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        this.camera.position.set(0, 4, 8);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Create controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI * 0.9;

        // Add lights
        this.setupLights();

        // Add ground and environment
        this.setupEnvironment();

        // Initialize scene manager
        this.sceneManager = new SceneManager(this.scene);

        // Set up validation callbacks
        this.sceneManager.onValidationError = (result) => {
            this.showValidationFeedback(result.feedback);
        };

        // Create single humanoid for single mode
        this.humanoid = new Humanoid();
        this.scene.add(this.humanoid.getObject());
        this.animController = new AnimationController(this.humanoid);
        this.animController.play(animations.idle);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xff9800, 0.2);
        rimLight.position.set(0, 3, -5);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a4a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid helper
        const grid = new THREE.GridHelper(20, 40, 0x4fc3f7, 0x1a1a3e);
        grid.position.y = 0.01;
        this.scene.add(grid);

        // Add subtle fog
        this.scene.fog = new THREE.Fog(0x1a1a2e, 8, 25);
    }

    setupUI() {
        // Animation buttons
        const buttons = document.querySelectorAll('.animation-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const animName = btn.dataset.animation;
                if (animations[animName]) {
                    this.playAnimation(animName);
                    this.updateActiveButton(btn);
                }
            });
        });

        // LLM input execution
        const executeBtn = document.getElementById('execute-btn');
        const llmInput = document.getElementById('llm-input');

        executeBtn.addEventListener('click', () => {
            this.executeInput(llmInput.value);
        });

        llmInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.executeInput(llmInput.value);
            }
        });

        // Set example
        llmInput.value = this.getExampleInput();

        // Mode toggle
        const modeToggle = document.getElementById('mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('click', () => this.toggleMode());
        }

        // Nav mesh toggle
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                this.sceneManager.toggleNavMeshDebug();
            });
        }

        // Demo script button
        const demoBtn = document.getElementById('demo-btn');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.runDemoScript());
        }
    }

    getExampleInput() {
        if (this.mode === 'multi') {
            return JSON.stringify({
                action: 'spawn',
                id: 'actor1',
                name: 'Actor 1',
                position: { x: -2, z: 0 },
                color: '#4a90d9'
            }, null, 2);
        }

        return `{
  "name": "custom_greeting",
  "duration": 2,
  "loop": false,
  "keyframes": [
    {
      "time": 0,
      "head": [0, 0, 0],
      "rightUpperArm": [0, 0, 0]
    },
    {
      "time": 0.5,
      "head": [15, 0, 0],
      "rightUpperArm": [0, 0, -120],
      "rightLowerArm": [-30, 0, 0]
    },
    {
      "time": 1.5,
      "head": [10, 10, 5],
      "rightUpperArm": [0, 0, -120],
      "rightLowerArm": [-60, 0, 0]
    },
    {
      "time": 2,
      "head": [0, 0, 0],
      "rightUpperArm": [0, 0, 0],
      "rightLowerArm": [0, 0, 0]
    }
  ]
}`;
    }

    toggleMode() {
        if (this.mode === 'single') {
            // Switch to multi-character mode
            this.mode = 'multi';
            this.humanoid.getObject().visible = false;

            // Add some characters
            this.sceneManager.addCharacter('char1', {
                name: 'Alice',
                position: { x: -2, z: 0 },
                color: '#4a90d9'
            });
            this.sceneManager.addCharacter('char2', {
                name: 'Bob',
                position: { x: 2, z: 0 },
                color: '#d94a4a'
            });

            this.updateStatus('Multi-character mode - 2 characters spawned');
            this.camera.position.set(0, 6, 12);
            this.controls.target.set(0, 0.5, 0);
        } else {
            // Switch back to single mode
            this.mode = 'single';
            this.humanoid.getObject().visible = true;

            // Remove scene manager characters
            for (const [id] of this.sceneManager.characters) {
                this.sceneManager.removeCharacter(id);
            }

            this.updateStatus('Single character mode');
            this.camera.position.set(0, 4, 8);
            this.controls.target.set(0, 1, 0);
        }

        // Update example input
        document.getElementById('llm-input').value = this.getExampleInput();
    }

    runDemoScript() {
        if (this.mode === 'single') {
            this.toggleMode();
        }

        // Clear existing characters
        for (const [id] of this.sceneManager.characters) {
            this.sceneManager.removeCharacter(id);
        }

        // Run the example script
        this.sceneManager.executeScript(exampleScript);
        this.updateStatus('Running demo script...');
    }

    executeInput(input) {
        try {
            const jsonMatch = input.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Try natural language
                const animation = this.animController.parseAnimationText(input);
                if (animation) {
                    this.playCustomAnimation(animation);
                } else {
                    this.updateStatus('Could not parse input');
                }
                return;
            }

            const data = JSON.parse(jsonMatch[0]);

            // Check if it's a scene command
            if (data.action) {
                if (this.mode === 'single') {
                    this.toggleMode();
                }
                const result = this.sceneManager.executeCommand(data);
                this.updateStatus(result.feedback);

                if (!result.success) {
                    this.showValidationFeedback(result.feedback);
                }

                if (result.fixedAnimation) {
                    console.log('Auto-fixed animation:', result.fixedAnimation);
                }
            }
            // Check if it's an animation
            else if (data.keyframes || data.poses) {
                this.playCustomAnimation(data);
            }
            else {
                this.updateStatus('Unknown input format');
            }
        } catch (e) {
            console.error('Parse error:', e);
            this.updateStatus(`Error: ${e.message}`);
        }
    }

    playAnimation(name) {
        if (this.mode === 'single') {
            const anim = animations[name];
            if (anim) {
                this.animController.play(anim);
                this.updateStatus(`Playing: ${anim.name}`);
            }
        } else {
            // Play on all characters in multi mode
            for (const [id, char] of this.sceneManager.characters) {
                char.animController.play(animations[name]);
            }
            this.updateStatus(`All characters: ${name}`);
        }
    }

    playCustomAnimation(animation) {
        // Validate first
        const feedback = createLLMFeedback(animation, this.validator);

        if (!feedback.success) {
            this.showValidationFeedback(feedback.feedback);

            // Offer to play fixed version
            if (feedback.fixedAnimation) {
                this.updateStatus('Animation had errors - playing auto-fixed version');
                animation = feedback.fixedAnimation;
            } else {
                return;
            }
        } else if (feedback.score < 100) {
            // Show warnings but still play
            this.showValidationFeedback(feedback.feedback);
        }

        if (this.mode === 'single') {
            this.animController.play(animation, { loop: animation.loop ?? false });
        } else {
            // Play on first character
            const firstChar = this.sceneManager.characters.values().next().value;
            if (firstChar) {
                firstChar.animController.play(animation, { loop: animation.loop ?? false });
            }
        }

        this.updateStatus(`Playing: ${animation.name || 'custom'} (score: ${feedback.score}/100)`);
        this.clearActiveButtons();
    }

    showValidationFeedback(feedback) {
        const feedbackEl = document.getElementById('validation-feedback');
        if (feedbackEl) {
            feedbackEl.textContent = feedback;
            feedbackEl.style.display = 'block';
            setTimeout(() => {
                feedbackEl.style.display = 'none';
            }, 8000);
        } else {
            console.log('Validation feedback:', feedback);
        }
    }

    updateActiveButton(activeBtn) {
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    clearActiveButtons() {
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    updateStatus(text) {
        document.getElementById('status').textContent = text;
    }

    onResize() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate > 500) {
            const fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
            document.getElementById('fps-value').textContent = fps;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Update based on mode
        if (this.mode === 'single') {
            this.animController.update(deltaTime);
        } else {
            this.sceneManager.update(deltaTime);
        }

        // Update controls
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
