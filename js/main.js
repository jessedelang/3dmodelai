import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Humanoid } from './humanoid.js';
import { AnimationController } from './animation.js';
import { animations } from './animations.js';

/**
 * AI Humanoid Animation System - Main Entry Point
 *
 * This proof of concept demonstrates how language models can control
 * 3D humanoid characters through a semantic animation format.
 */

class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.humanoid = null;
        this.animController = null;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

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
        this.camera.position.set(0, 1.2, 3.5);

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
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI * 0.9;

        // Add lights
        this.setupLights();

        // Add ground and environment
        this.setupEnvironment();

        // Create humanoid
        this.humanoid = new Humanoid();
        this.scene.add(this.humanoid.getObject());

        // Create animation controller
        this.animController = new AnimationController(this.humanoid);

        // Start with idle animation
        this.animController.play(animations.idle);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);

        // Main directional light (sun-like)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -5;
        mainLight.shadow.camera.right = 5;
        mainLight.shadow.camera.top = 5;
        mainLight.shadow.camera.bottom = -5;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);

        // Rim light
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
        this.scene.fog = new THREE.Fog(0x1a1a2e, 5, 20);
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
            this.executeCustomAnimation(llmInput.value);
        });

        // Allow Ctrl+Enter to execute
        llmInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.executeCustomAnimation(llmInput.value);
            }
        });

        // Set example in textarea
        llmInput.value = this.getExampleAnimation();
    }

    getExampleAnimation() {
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

    playAnimation(name) {
        const anim = animations[name];
        if (anim) {
            this.animController.play(anim);
            this.updateStatus(`Playing: ${anim.name}`);
        }
    }

    executeCustomAnimation(input) {
        try {
            // Try to parse as JSON first
            let animation;

            const jsonMatch = input.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                animation = JSON.parse(jsonMatch[0]);
            } else {
                // Try natural language interpretation
                animation = this.animController.parseAnimationText(input);
            }

            if (animation) {
                this.animController.play(animation, { loop: animation.loop ?? false });
                this.updateStatus(`Playing custom: ${animation.name || 'unnamed'}`);
                this.clearActiveButtons();
            } else {
                this.updateStatus('Could not parse animation');
            }
        } catch (e) {
            console.error('Animation parse error:', e);
            this.updateStatus(`Error: ${e.message}`);
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

        // Update animation
        this.animController.update(deltaTime);

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
