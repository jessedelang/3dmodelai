import * as THREE from 'three';

/**
 * Animation System for LLM-Controlled Characters
 *
 * This system uses a semantic animation format that language models can generate.
 * Animations are defined as sequences of keyframes with bone rotations in degrees.
 */

// Easing functions for smooth interpolation
export const Easing = {
    linear: t => t,
    easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeIn: t => t * t,
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    elastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }
};

/**
 * Animation Controller
 * Manages playback and blending of animations
 */
export class AnimationController {
    constructor(humanoid) {
        this.humanoid = humanoid;
        this.currentAnimation = null;
        this.animationTime = 0;
        this.isPlaying = false;
        this.loop = true;
        this.speed = 1.0;

        // For blending between animations
        this.blendDuration = 0.3;
        this.blendTime = 0;
        this.previousPose = null;
        this.isBlending = false;

        // Store initial pose
        this.defaultPose = this.captureCurrentPose();
    }

    /**
     * Capture the current pose of all bones
     */
    captureCurrentPose() {
        const pose = {};
        for (const boneName of this.humanoid.getBoneNames()) {
            const bone = this.humanoid.getBone(boneName);
            pose[boneName] = {
                x: bone.rotation.x,
                y: bone.rotation.y,
                z: bone.rotation.z
            };
        }
        return pose;
    }

    /**
     * Play an animation (semantic format)
     */
    play(animation, options = {}) {
        // Capture current pose for blending
        this.previousPose = this.captureCurrentPose();
        this.isBlending = true;
        this.blendTime = 0;
        this.blendDuration = options.blendDuration ?? 0.3;

        // Set up new animation
        this.currentAnimation = this.normalizeAnimation(animation);
        this.animationTime = 0;
        this.isPlaying = true;
        this.loop = options.loop ?? animation.loop ?? true;
        this.speed = options.speed ?? animation.speed ?? 1.0;
    }

    /**
     * Stop the current animation
     */
    stop() {
        this.isPlaying = false;
    }

    /**
     * Normalize animation to internal format
     * Converts semantic descriptions to concrete bone rotations
     */
    normalizeAnimation(animation) {
        const normalized = {
            name: animation.name || 'unnamed',
            duration: animation.duration || this.calculateDuration(animation),
            keyframes: [],
            easing: animation.easing || 'easeInOut'
        };

        // Process keyframes
        if (animation.keyframes) {
            normalized.keyframes = animation.keyframes.map(kf => this.normalizeKeyframe(kf));
        } else if (animation.poses) {
            // Alternative format: array of poses with timestamps
            normalized.keyframes = animation.poses.map(pose => this.normalizeKeyframe(pose));
        }

        // Sort keyframes by time
        normalized.keyframes.sort((a, b) => a.time - b.time);

        return normalized;
    }

    /**
     * Normalize a single keyframe
     */
    normalizeKeyframe(keyframe) {
        const normalized = {
            time: keyframe.time || 0,
            bones: {},
            easing: keyframe.easing
        };

        // Direct bone specification
        for (const [key, value] of Object.entries(keyframe)) {
            if (key === 'time' || key === 'easing') continue;

            // Check if it's a bone name
            if (this.humanoid.getBone(key)) {
                normalized.bones[key] = this.normalizeRotation(value);
            }
            // Check for semantic body part groups
            else if (key === 'leftArm') {
                this.applyArmPose(normalized.bones, 'left', value);
            }
            else if (key === 'rightArm') {
                this.applyArmPose(normalized.bones, 'right', value);
            }
            else if (key === 'leftLeg') {
                this.applyLegPose(normalized.bones, 'left', value);
            }
            else if (key === 'rightLeg') {
                this.applyLegPose(normalized.bones, 'right', value);
            }
            else if (key === 'torso' || key === 'body') {
                this.applyTorsoPose(normalized.bones, value);
            }
        }

        return normalized;
    }

    /**
     * Normalize rotation value to {x, y, z} in radians
     */
    normalizeRotation(value) {
        if (Array.isArray(value)) {
            return {
                x: THREE.MathUtils.degToRad(value[0] || 0),
                y: THREE.MathUtils.degToRad(value[1] || 0),
                z: THREE.MathUtils.degToRad(value[2] || 0)
            };
        } else if (typeof value === 'object') {
            return {
                x: THREE.MathUtils.degToRad(value.x || value.pitch || 0),
                y: THREE.MathUtils.degToRad(value.y || value.yaw || 0),
                z: THREE.MathUtils.degToRad(value.z || value.roll || 0)
            };
        }
        return { x: 0, y: 0, z: 0 };
    }

    /**
     * Apply semantic arm pose
     */
    applyArmPose(bones, side, pose) {
        const prefix = side === 'left' ? 'left' : 'right';

        if (pose.shoulder) {
            bones[`${prefix}Shoulder`] = this.normalizeRotation(pose.shoulder);
        }
        if (pose.upper || pose.upperArm) {
            bones[`${prefix}UpperArm`] = this.normalizeRotation(pose.upper || pose.upperArm);
        }
        if (pose.lower || pose.lowerArm || pose.elbow) {
            bones[`${prefix}LowerArm`] = this.normalizeRotation(pose.lower || pose.lowerArm || pose.elbow);
        }
        if (pose.hand) {
            bones[`${prefix}Hand`] = this.normalizeRotation(pose.hand);
        }
    }

    /**
     * Apply semantic leg pose
     */
    applyLegPose(bones, side, pose) {
        const prefix = side === 'left' ? 'left' : 'right';

        if (pose.upper || pose.upperLeg || pose.hip) {
            bones[`${prefix}UpperLeg`] = this.normalizeRotation(pose.upper || pose.upperLeg || pose.hip);
        }
        if (pose.lower || pose.lowerLeg || pose.knee) {
            bones[`${prefix}LowerLeg`] = this.normalizeRotation(pose.lower || pose.lowerLeg || pose.knee);
        }
        if (pose.foot || pose.ankle) {
            bones[`${prefix}Foot`] = this.normalizeRotation(pose.foot || pose.ankle);
        }
    }

    /**
     * Apply semantic torso pose
     */
    applyTorsoPose(bones, pose) {
        if (pose.hips) bones.hips = this.normalizeRotation(pose.hips);
        if (pose.spine) bones.spine = this.normalizeRotation(pose.spine);
        if (pose.chest) bones.chest = this.normalizeRotation(pose.chest);
        if (pose.neck) bones.neck = this.normalizeRotation(pose.neck);
        if (pose.head) bones.head = this.normalizeRotation(pose.head);
    }

    /**
     * Calculate animation duration from keyframes
     */
    calculateDuration(animation) {
        const keyframes = animation.keyframes || animation.poses || [];
        if (keyframes.length === 0) return 1;
        return Math.max(...keyframes.map(kf => kf.time || 0));
    }

    /**
     * Update animation (call every frame)
     */
    update(deltaTime) {
        if (!this.isPlaying || !this.currentAnimation) return;

        // Update blend
        if (this.isBlending) {
            this.blendTime += deltaTime;
            if (this.blendTime >= this.blendDuration) {
                this.isBlending = false;
            }
        }

        // Update animation time
        this.animationTime += deltaTime * this.speed;

        const duration = this.currentAnimation.duration;

        // Handle looping
        if (this.animationTime >= duration) {
            if (this.loop) {
                this.animationTime = this.animationTime % duration;
            } else {
                this.animationTime = duration;
                this.isPlaying = false;
            }
        }

        // Apply animation
        this.applyAnimation();
    }

    /**
     * Apply current animation state to humanoid
     */
    applyAnimation() {
        if (!this.currentAnimation) return;

        const keyframes = this.currentAnimation.keyframes;
        if (keyframes.length === 0) return;

        // Find surrounding keyframes
        let prevKeyframe = keyframes[0];
        let nextKeyframe = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (keyframes[i].time <= this.animationTime &&
                keyframes[i + 1].time >= this.animationTime) {
                prevKeyframe = keyframes[i];
                nextKeyframe = keyframes[i + 1];
                break;
            }
        }

        // Calculate interpolation factor
        const timeDiff = nextKeyframe.time - prevKeyframe.time;
        let t = timeDiff > 0 ?
            (this.animationTime - prevKeyframe.time) / timeDiff : 0;

        // Apply easing
        const easingName = nextKeyframe.easing || this.currentAnimation.easing || 'easeInOut';
        const easingFn = Easing[easingName] || Easing.easeInOut;
        t = easingFn(t);

        // Collect all affected bones
        const allBones = new Set([
            ...Object.keys(prevKeyframe.bones),
            ...Object.keys(nextKeyframe.bones)
        ]);

        // Interpolate bone rotations
        for (const boneName of allBones) {
            const bone = this.humanoid.getBone(boneName);
            if (!bone) continue;

            const prevRot = prevKeyframe.bones[boneName] || { x: 0, y: 0, z: 0 };
            const nextRot = nextKeyframe.bones[boneName] || prevRot;

            // Interpolate
            let targetX = this.lerp(prevRot.x, nextRot.x, t);
            let targetY = this.lerp(prevRot.y, nextRot.y, t);
            let targetZ = this.lerp(prevRot.z, nextRot.z, t);

            // Apply blend from previous animation
            if (this.isBlending && this.previousPose) {
                const blendT = easingFn(this.blendTime / this.blendDuration);
                const prevPoseBone = this.previousPose[boneName];
                if (prevPoseBone) {
                    targetX = this.lerp(prevPoseBone.x, targetX, blendT);
                    targetY = this.lerp(prevPoseBone.y, targetY, blendT);
                    targetZ = this.lerp(prevPoseBone.z, targetZ, blendT);
                }
            }

            bone.rotation.set(targetX, targetY, targetZ);
        }
    }

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Parse LLM-generated animation text
     * Attempts to extract JSON from various formats
     */
    parseAnimationText(text) {
        // Try to find JSON in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse animation JSON:', e);
            }
        }

        // Try to interpret natural language
        return this.interpretNaturalLanguage(text);
    }

    /**
     * Interpret natural language animation descriptions
     */
    interpretNaturalLanguage(text) {
        const lower = text.toLowerCase();

        // Simple keyword-based interpretation
        if (lower.includes('wave') || lower.includes('hello') || lower.includes('greet')) {
            return {
                name: 'wave',
                duration: 2,
                keyframes: [
                    { time: 0, rightUpperArm: [0, 0, 0], rightLowerArm: [0, 0, 0] },
                    { time: 0.5, rightUpperArm: [0, 0, -150], rightLowerArm: [0, 0, 0] },
                    { time: 0.75, rightUpperArm: [0, 0, -150], rightLowerArm: [-30, 0, 0] },
                    { time: 1.0, rightUpperArm: [0, 0, -150], rightLowerArm: [30, 0, 0] },
                    { time: 1.25, rightUpperArm: [0, 0, -150], rightLowerArm: [-30, 0, 0] },
                    { time: 1.5, rightUpperArm: [0, 0, -150], rightLowerArm: [30, 0, 0] },
                    { time: 2, rightUpperArm: [0, 0, 0], rightLowerArm: [0, 0, 0] }
                ]
            };
        }

        if (lower.includes('nod') || lower.includes('yes')) {
            return {
                name: 'nod',
                duration: 1,
                keyframes: [
                    { time: 0, head: [0, 0, 0] },
                    { time: 0.25, head: [20, 0, 0] },
                    { time: 0.5, head: [-10, 0, 0] },
                    { time: 0.75, head: [15, 0, 0] },
                    { time: 1, head: [0, 0, 0] }
                ]
            };
        }

        if (lower.includes('shake') || lower.includes('no')) {
            return {
                name: 'shake_head',
                duration: 1,
                keyframes: [
                    { time: 0, head: [0, 0, 0] },
                    { time: 0.2, head: [0, -30, 0] },
                    { time: 0.4, head: [0, 30, 0] },
                    { time: 0.6, head: [0, -25, 0] },
                    { time: 0.8, head: [0, 20, 0] },
                    { time: 1, head: [0, 0, 0] }
                ]
            };
        }

        // Default: return empty animation
        console.warn('Could not interpret animation:', text);
        return null;
    }
}
