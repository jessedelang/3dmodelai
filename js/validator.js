/**
 * Animation Validator & Feedback System
 *
 * Provides real-time validation and feedback for LLM-generated animations.
 * This allows the LLM to iteratively improve animations based on structured feedback.
 */

// Human joint limits (in degrees) - based on biomechanical research
export const JOINT_LIMITS = {
    head: {
        x: [-45, 45],    // Flexion/extension (nodding)
        y: [-80, 80],    // Rotation (shaking head)
        z: [-40, 40]     // Lateral flexion (tilting)
    },
    neck: {
        x: [-40, 40],
        y: [-60, 60],
        z: [-35, 35]
    },
    spine: {
        x: [-30, 45],    // Forward bend / back arch
        y: [-35, 35],    // Rotation
        z: [-25, 25]     // Side bend
    },
    chest: {
        x: [-25, 35],
        y: [-30, 30],
        z: [-20, 20]
    },
    hips: {
        x: [-30, 30],
        y: [-45, 45],
        z: [-20, 20]
    },
    // Shoulders
    leftShoulder: { x: [-20, 20], y: [-15, 30], z: [-30, 10] },
    rightShoulder: { x: [-20, 20], y: [-30, 15], z: [-10, 30] },
    // Upper arms (shoulder joint)
    leftUpperArm: {
        x: [-60, 180],   // Flexion/extension
        y: [-50, 90],    // Abduction rotation
        z: [-180, 60]    // Abduction/adduction (raise sideways)
    },
    rightUpperArm: {
        x: [-60, 180],
        y: [-90, 50],
        z: [-60, 180]    // Mirrored
    },
    // Lower arms (elbow)
    leftLowerArm: {
        x: [-150, 0],    // Elbow flexion only (can't hyperextend)
        y: [-90, 90],    // Forearm rotation
        z: [-10, 10]
    },
    rightLowerArm: {
        x: [-150, 0],
        y: [-90, 90],
        z: [-10, 10]
    },
    // Hands (wrist)
    leftHand: {
        x: [-70, 80],    // Flexion/extension
        y: [-20, 35],    // Radial/ulnar deviation
        z: [-40, 40]     // (limited rotation)
    },
    rightHand: {
        x: [-70, 80],
        y: [-35, 20],
        z: [-40, 40]
    },
    // Upper legs (hip joint)
    leftUpperLeg: {
        x: [-120, 45],   // Flexion/extension (lifting leg forward)
        y: [-45, 45],    // Rotation
        z: [-45, 30]     // Abduction/adduction
    },
    rightUpperLeg: {
        x: [-120, 45],
        y: [-45, 45],
        z: [-30, 45]     // Mirrored
    },
    // Lower legs (knee)
    leftLowerLeg: {
        x: [0, 150],     // Knee flexion only (can't hyperextend)
        y: [-10, 10],
        z: [-5, 5]
    },
    rightLowerLeg: {
        x: [0, 150],
        y: [-10, 10],
        z: [-5, 5]
    },
    // Feet (ankle)
    leftFoot: {
        x: [-50, 30],    // Plantarflexion/dorsiflexion
        y: [-25, 25],    // Rotation
        z: [-20, 20]     // Inversion/eversion
    },
    rightFoot: {
        x: [-50, 30],
        y: [-25, 25],
        z: [-20, 20]
    }
};

// Maximum angular velocity per bone (degrees per second)
// Prevents teleporting/unnatural snapping
export const MAX_ANGULAR_VELOCITY = {
    default: 360,        // Most bones: 1 full rotation per second max
    head: 180,           // Head moves slower
    neck: 150,
    spine: 120,
    chest: 120,
    hips: 150,
    hand: 500,           // Hands can move fast
    foot: 300
};

/**
 * Validation result structure
 */
export class ValidationResult {
    constructor() {
        this.valid = true;
        this.errors = [];      // Critical issues that break the animation
        this.warnings = [];    // Suggestions for improvement
        this.suggestions = []; // LLM-friendly improvement hints
        this.score = 100;      // Quality score 0-100
    }

    addError(bone, message, details = {}) {
        this.valid = false;
        this.errors.push({ bone, message, ...details });
        this.score = Math.max(0, this.score - 20);
    }

    addWarning(bone, message, details = {}) {
        this.warnings.push({ bone, message, ...details });
        this.score = Math.max(0, this.score - 5);
    }

    addSuggestion(message) {
        this.suggestions.push(message);
    }

    /**
     * Generate LLM-friendly feedback string
     */
    toLLMFeedback() {
        let feedback = [];

        if (this.valid && this.warnings.length === 0) {
            feedback.push("✓ Animation validated successfully.");
        } else {
            feedback.push(`Animation Quality Score: ${this.score}/100\n`);
        }

        if (this.errors.length > 0) {
            feedback.push("ERRORS (must fix):");
            this.errors.forEach(e => {
                feedback.push(`  • ${e.bone}: ${e.message}`);
                if (e.current !== undefined && e.limit !== undefined) {
                    feedback.push(`    Current: ${e.current.toFixed(1)}°, Limit: ${e.limit}°`);
                }
            });
        }

        if (this.warnings.length > 0) {
            feedback.push("\nWARNINGS (should fix):");
            this.warnings.forEach(w => {
                feedback.push(`  • ${w.bone}: ${w.message}`);
            });
        }

        if (this.suggestions.length > 0) {
            feedback.push("\nSUGGESTIONS:");
            this.suggestions.forEach(s => {
                feedback.push(`  • ${s}`);
            });
        }

        return feedback.join("\n");
    }

    /**
     * Generate structured JSON feedback for programmatic use
     */
    toJSON() {
        return {
            valid: this.valid,
            score: this.score,
            errors: this.errors,
            warnings: this.warnings,
            suggestions: this.suggestions
        };
    }
}

/**
 * Animation Validator
 */
export class AnimationValidator {
    constructor(options = {}) {
        this.jointLimits = options.jointLimits || JOINT_LIMITS;
        this.maxAngularVelocity = options.maxAngularVelocity || MAX_ANGULAR_VELOCITY;
        this.strictMode = options.strictMode ?? false;
    }

    /**
     * Validate an entire animation
     */
    validate(animation) {
        const result = new ValidationResult();

        // Check basic structure
        if (!animation) {
            result.addError('animation', 'Animation is null or undefined');
            return result;
        }

        const keyframes = animation.keyframes || animation.poses || [];
        if (keyframes.length === 0) {
            result.addError('animation', 'Animation has no keyframes');
            return result;
        }

        if (keyframes.length === 1) {
            result.addWarning('animation', 'Animation has only 1 keyframe - consider adding more for smooth motion');
        }

        // Validate each keyframe
        keyframes.forEach((kf, index) => {
            this.validateKeyframe(kf, index, result);
        });

        // Validate transitions between keyframes
        for (let i = 0; i < keyframes.length - 1; i++) {
            this.validateTransition(keyframes[i], keyframes[i + 1], result);
        }

        // Check for common issues
        this.checkCommonIssues(animation, result);

        // Add suggestions based on animation content
        this.generateSuggestions(animation, result);

        return result;
    }

    /**
     * Validate a single keyframe
     */
    validateKeyframe(keyframe, index, result) {
        if (keyframe.time === undefined) {
            result.addWarning('keyframe', `Keyframe ${index} missing time property`);
        }

        // Check each bone rotation
        for (const [boneName, rotation] of Object.entries(keyframe)) {
            if (boneName === 'time' || boneName === 'easing') continue;

            // Skip semantic groups (handled by animation system)
            if (['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'torso', 'body'].includes(boneName)) {
                continue;
            }

            const limits = this.jointLimits[boneName];
            if (!limits) continue; // Unknown bone

            const rot = this.normalizeRotation(rotation);

            // Check X limit
            if (rot.x < limits.x[0] || rot.x > limits.x[1]) {
                result.addError(boneName, `X rotation ${rot.x.toFixed(1)}° exceeds limit [${limits.x[0]}, ${limits.x[1]}]`, {
                    axis: 'x',
                    current: rot.x,
                    limit: rot.x < limits.x[0] ? limits.x[0] : limits.x[1],
                    keyframe: index
                });
            }

            // Check Y limit
            if (rot.y < limits.y[0] || rot.y > limits.y[1]) {
                result.addError(boneName, `Y rotation ${rot.y.toFixed(1)}° exceeds limit [${limits.y[0]}, ${limits.y[1]}]`, {
                    axis: 'y',
                    current: rot.y,
                    limit: rot.y < limits.y[0] ? limits.y[0] : limits.y[1],
                    keyframe: index
                });
            }

            // Check Z limit
            if (rot.z < limits.z[0] || rot.z > limits.z[1]) {
                result.addError(boneName, `Z rotation ${rot.z.toFixed(1)}° exceeds limit [${limits.z[0]}, ${limits.z[1]}]`, {
                    axis: 'z',
                    current: rot.z,
                    limit: rot.z < limits.z[0] ? limits.z[0] : limits.z[1],
                    keyframe: index
                });
            }
        }
    }

    /**
     * Validate transition between two keyframes
     */
    validateTransition(kf1, kf2, result) {
        const timeDelta = (kf2.time || 0) - (kf1.time || 0);
        if (timeDelta <= 0) {
            result.addError('keyframe', `Invalid time sequence: ${kf1.time} -> ${kf2.time}`);
            return;
        }

        // Check angular velocity for each bone
        const allBones = new Set([...Object.keys(kf1), ...Object.keys(kf2)]);

        for (const boneName of allBones) {
            if (['time', 'easing', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'torso', 'body'].includes(boneName)) {
                continue;
            }

            const rot1 = this.normalizeRotation(kf1[boneName] || [0, 0, 0]);
            const rot2 = this.normalizeRotation(kf2[boneName] || rot1);

            // Calculate angular distance
            const dx = Math.abs(rot2.x - rot1.x);
            const dy = Math.abs(rot2.y - rot1.y);
            const dz = Math.abs(rot2.z - rot1.z);
            const maxDelta = Math.max(dx, dy, dz);

            // Calculate velocity
            const velocity = maxDelta / timeDelta;
            const maxVel = this.getMaxVelocity(boneName);

            if (velocity > maxVel) {
                result.addWarning(boneName,
                    `Movement too fast: ${velocity.toFixed(0)}°/s (max: ${maxVel}°/s). Consider adding intermediate keyframes.`, {
                    velocity,
                    maxVelocity: maxVel
                });
            }
        }
    }

    /**
     * Check for common animation issues
     */
    checkCommonIssues(animation, result) {
        const keyframes = animation.keyframes || animation.poses || [];

        // Check if animation returns to neutral (for looping)
        if (animation.loop) {
            const first = keyframes[0];
            const last = keyframes[keyframes.length - 1];

            const firstBones = Object.keys(first).filter(k => k !== 'time' && k !== 'easing');
            const lastBones = Object.keys(last).filter(k => k !== 'time' && k !== 'easing');

            const allBones = new Set([...firstBones, ...lastBones]);
            let loopMismatch = false;

            for (const bone of allBones) {
                const rot1 = this.normalizeRotation(first[bone] || [0, 0, 0]);
                const rot2 = this.normalizeRotation(last[bone] || [0, 0, 0]);

                const diff = Math.abs(rot1.x - rot2.x) + Math.abs(rot1.y - rot2.y) + Math.abs(rot1.z - rot2.z);
                if (diff > 10) {
                    loopMismatch = true;
                    break;
                }
            }

            if (loopMismatch) {
                result.addWarning('animation',
                    'Looping animation does not return to starting pose - may cause jerky loop transition');
            }
        }

        // Check duration
        if ((animation.duration || 0) < 0.1) {
            result.addWarning('animation', 'Animation duration very short - may appear too fast');
        }

        // Check for symmetry issues in walking/idle animations
        if (animation.name && (animation.name.includes('walk') || animation.name.includes('idle'))) {
            // Could add symmetry checking here
        }
    }

    /**
     * Generate improvement suggestions
     */
    generateSuggestions(animation, result) {
        const keyframes = animation.keyframes || animation.poses || [];

        if (keyframes.length < 3 && (animation.duration || 1) > 1) {
            result.addSuggestion('Add more keyframes for smoother motion (aim for 1 keyframe per 0.3-0.5 seconds)');
        }

        if (!animation.easing) {
            result.addSuggestion('Consider adding "easing": "easeInOut" for more natural motion');
        }

        // Check if only a few bones are animated
        const animatedBones = new Set();
        keyframes.forEach(kf => {
            Object.keys(kf).forEach(k => {
                if (k !== 'time' && k !== 'easing') animatedBones.add(k);
            });
        });

        if (animatedBones.size < 3) {
            result.addSuggestion('Animation only moves ' + animatedBones.size + ' bone(s). Consider adding subtle motion to spine, chest, or head for more life-like movement.');
        }

        // Check for counter-motion
        const hasArmMotion = [...animatedBones].some(b => b.includes('Arm'));
        const hasSpineMotion = animatedBones.has('spine') || animatedBones.has('chest');

        if (hasArmMotion && !hasSpineMotion) {
            result.addSuggestion('Arm movements look more natural with subtle spine/chest rotation (counter-motion)');
        }
    }

    /**
     * Normalize rotation to {x, y, z} object
     */
    normalizeRotation(rotation) {
        if (Array.isArray(rotation)) {
            return { x: rotation[0] || 0, y: rotation[1] || 0, z: rotation[2] || 0 };
        } else if (typeof rotation === 'object' && rotation !== null) {
            return { x: rotation.x || 0, y: rotation.y || 0, z: rotation.z || 0 };
        }
        return { x: 0, y: 0, z: 0 };
    }

    /**
     * Get max angular velocity for a bone
     */
    getMaxVelocity(boneName) {
        for (const [key, value] of Object.entries(this.maxAngularVelocity)) {
            if (boneName.toLowerCase().includes(key)) {
                return value;
            }
        }
        return this.maxAngularVelocity.default;
    }

    /**
     * Auto-fix common issues in an animation
     */
    autoFix(animation) {
        const fixed = JSON.parse(JSON.stringify(animation)); // Deep clone
        const keyframes = fixed.keyframes || fixed.poses || [];

        keyframes.forEach(kf => {
            for (const [boneName, rotation] of Object.entries(kf)) {
                if (boneName === 'time' || boneName === 'easing') continue;

                const limits = this.jointLimits[boneName];
                if (!limits) continue;

                const rot = this.normalizeRotation(rotation);

                // Clamp to limits
                rot.x = Math.max(limits.x[0], Math.min(limits.x[1], rot.x));
                rot.y = Math.max(limits.y[0], Math.min(limits.y[1], rot.y));
                rot.z = Math.max(limits.z[0], Math.min(limits.z[1], rot.z));

                kf[boneName] = [rot.x, rot.y, rot.z];
            }
        });

        return fixed;
    }
}

/**
 * Create a validation report suitable for LLM feedback loop
 */
export function createLLMFeedback(animation, validator = new AnimationValidator()) {
    const result = validator.validate(animation);

    return {
        success: result.valid,
        score: result.score,
        feedback: result.toLLMFeedback(),
        structured: result.toJSON(),
        fixedAnimation: result.valid ? null : validator.autoFix(animation)
    };
}
