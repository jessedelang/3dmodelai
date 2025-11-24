/**
 * Preset Animations Library
 *
 * These animations demonstrate the semantic format that LLMs can generate.
 * Each animation uses degrees for rotations (more intuitive than radians)
 * and semantic body part descriptions where applicable.
 */

export const animations = {
    /**
     * Idle breathing animation
     */
    idle: {
        name: 'idle',
        duration: 4,
        loop: true,
        keyframes: [
            {
                time: 0,
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                head: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                rightUpperArm: [0, 0, -5]
            },
            {
                time: 2,
                spine: [2, 0, 0],
                chest: [3, 0, 0],
                head: [2, 0, 0],
                leftUpperArm: [0, 0, 8],
                rightUpperArm: [0, 0, -8]
            },
            {
                time: 4,
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                head: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                rightUpperArm: [0, 0, -5]
            }
        ]
    },

    /**
     * Friendly wave animation
     */
    wave: {
        name: 'wave',
        duration: 3,
        loop: false,
        keyframes: [
            {
                time: 0,
                rightShoulder: [0, 0, 0],
                rightUpperArm: [0, 0, 0],
                rightLowerArm: [0, 0, 0],
                rightHand: [0, 0, 0],
                head: [0, 0, 0],
                spine: [0, 0, 0]
            },
            {
                time: 0.4,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [0, 0, 20],
                head: [0, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 0.7,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [-30, 0, 20],
                head: [0, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 1.0,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [30, 0, 20],
                head: [0, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 1.3,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [-30, 0, 20],
                head: [5, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 1.6,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [30, 0, 20],
                head: [-5, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 2.0,
                rightShoulder: [0, 0, -20],
                rightUpperArm: [0, -30, -140],
                rightLowerArm: [0, 0, -45],
                rightHand: [0, 0, 20],
                head: [0, 15, 5],
                spine: [0, 5, 2]
            },
            {
                time: 3.0,
                rightShoulder: [0, 0, 0],
                rightUpperArm: [0, 0, 0],
                rightLowerArm: [0, 0, 0],
                rightHand: [0, 0, 0],
                head: [0, 0, 0],
                spine: [0, 0, 0]
            }
        ]
    },

    /**
     * Walk cycle animation
     */
    walk: {
        name: 'walk',
        duration: 1.2,
        loop: true,
        keyframes: [
            {
                time: 0,
                hips: [0, 0, -2],
                spine: [0, 0, 2],
                chest: [0, 0, 3],
                // Left leg forward
                leftUpperLeg: [-30, 0, 0],
                leftLowerLeg: [15, 0, 0],
                leftFoot: [10, 0, 0],
                // Right leg back
                rightUpperLeg: [30, 0, 0],
                rightLowerLeg: [45, 0, 0],
                rightFoot: [-20, 0, 0],
                // Arms swing opposite to legs
                leftUpperArm: [20, 0, 5],
                leftLowerArm: [0, 0, 0],
                rightUpperArm: [-30, 0, -5],
                rightLowerArm: [-25, 0, 0],
                head: [0, 0, 0]
            },
            {
                time: 0.3,
                hips: [0, 0, 0],
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                // Left leg passing
                leftUpperLeg: [0, 0, 0],
                leftLowerLeg: [35, 0, 0],
                leftFoot: [0, 0, 0],
                // Right leg passing
                rightUpperLeg: [0, 0, 0],
                rightLowerLeg: [35, 0, 0],
                rightFoot: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                leftLowerArm: [-15, 0, 0],
                rightUpperArm: [0, 0, -5],
                rightLowerArm: [-15, 0, 0],
                head: [0, 0, 0]
            },
            {
                time: 0.6,
                hips: [0, 0, 2],
                spine: [0, 0, -2],
                chest: [0, 0, -3],
                // Right leg forward
                rightUpperLeg: [-30, 0, 0],
                rightLowerLeg: [15, 0, 0],
                rightFoot: [10, 0, 0],
                // Left leg back
                leftUpperLeg: [30, 0, 0],
                leftLowerLeg: [45, 0, 0],
                leftFoot: [-20, 0, 0],
                // Arms swing
                rightUpperArm: [20, 0, -5],
                rightLowerArm: [0, 0, 0],
                leftUpperArm: [-30, 0, 5],
                leftLowerArm: [-25, 0, 0],
                head: [0, 0, 0]
            },
            {
                time: 0.9,
                hips: [0, 0, 0],
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                leftUpperLeg: [0, 0, 0],
                leftLowerLeg: [35, 0, 0],
                leftFoot: [0, 0, 0],
                rightUpperLeg: [0, 0, 0],
                rightLowerLeg: [35, 0, 0],
                rightFoot: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                leftLowerArm: [-15, 0, 0],
                rightUpperArm: [0, 0, -5],
                rightLowerArm: [-15, 0, 0],
                head: [0, 0, 0]
            },
            {
                time: 1.2,
                hips: [0, 0, -2],
                spine: [0, 0, 2],
                chest: [0, 0, 3],
                leftUpperLeg: [-30, 0, 0],
                leftLowerLeg: [15, 0, 0],
                leftFoot: [10, 0, 0],
                rightUpperLeg: [30, 0, 0],
                rightLowerLeg: [45, 0, 0],
                rightFoot: [-20, 0, 0],
                leftUpperArm: [20, 0, 5],
                leftLowerArm: [0, 0, 0],
                rightUpperArm: [-30, 0, -5],
                rightLowerArm: [-25, 0, 0],
                head: [0, 0, 0]
            }
        ]
    },

    /**
     * Sit down animation
     */
    sit: {
        name: 'sit',
        duration: 2,
        loop: false,
        keyframes: [
            {
                time: 0,
                hips: [0, 0, 0],
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                neck: [0, 0, 0],
                head: [0, 0, 0],
                leftUpperLeg: [0, 0, 0],
                leftLowerLeg: [0, 0, 0],
                rightUpperLeg: [0, 0, 0],
                rightLowerLeg: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                leftLowerArm: [0, 0, 0],
                rightUpperArm: [0, 0, -5],
                rightLowerArm: [0, 0, 0]
            },
            {
                time: 0.5,
                hips: [10, 0, 0],
                spine: [-5, 0, 0],
                leftUpperLeg: [-20, 0, 5],
                leftLowerLeg: [30, 0, 0],
                rightUpperLeg: [-20, 0, -5],
                rightLowerLeg: [30, 0, 0],
                leftUpperArm: [10, 0, 15],
                rightUpperArm: [10, 0, -15]
            },
            {
                time: 1.2,
                hips: [45, 0, 0],
                spine: [-15, 0, 0],
                chest: [-10, 0, 0],
                leftUpperLeg: [-90, 0, 5],
                leftLowerLeg: [90, 0, 0],
                rightUpperLeg: [-90, 0, -5],
                rightLowerLeg: [90, 0, 0],
                leftUpperArm: [20, 0, 20],
                leftLowerArm: [-30, 0, 0],
                rightUpperArm: [20, 0, -20],
                rightLowerArm: [-30, 0, 0]
            },
            {
                time: 2,
                hips: [45, 0, 0],
                spine: [-10, 0, 0],
                chest: [-5, 0, 0],
                neck: [10, 0, 0],
                head: [5, 0, 0],
                leftUpperLeg: [-90, 0, 10],
                leftLowerLeg: [85, 0, 0],
                leftFoot: [10, 0, 0],
                rightUpperLeg: [-90, 0, -10],
                rightLowerLeg: [85, 0, 0],
                rightFoot: [10, 0, 0],
                leftUpperArm: [15, 0, 25],
                leftLowerArm: [-70, 0, 0],
                leftHand: [0, 0, 10],
                rightUpperArm: [15, 0, -25],
                rightLowerArm: [-70, 0, 0],
                rightHand: [0, 0, -10]
            }
        ]
    },

    /**
     * Talking with gestures
     */
    talk: {
        name: 'talk',
        duration: 3,
        loop: true,
        keyframes: [
            {
                time: 0,
                head: [0, 0, 0],
                neck: [0, 0, 0],
                spine: [0, 0, 0],
                leftUpperArm: [0, 20, 30],
                leftLowerArm: [-30, 0, 0],
                rightUpperArm: [0, -20, -30],
                rightLowerArm: [-30, 0, 0]
            },
            {
                time: 0.4,
                head: [5, -10, 3],
                neck: [0, -5, 0],
                spine: [0, -3, 0],
                leftUpperArm: [10, 30, 40],
                leftLowerArm: [-45, 0, 0],
                leftHand: [10, 0, 15],
                rightUpperArm: [-5, -15, -25],
                rightLowerArm: [-20, 0, 0]
            },
            {
                time: 0.8,
                head: [-3, 5, -2],
                neck: [0, 5, 0],
                spine: [0, 2, 0],
                leftUpperArm: [-5, 15, 25],
                leftLowerArm: [-25, 0, 0],
                rightUpperArm: [15, -35, -50],
                rightLowerArm: [-50, 0, 0],
                rightHand: [-15, 0, -20]
            },
            {
                time: 1.3,
                head: [8, -8, 0],
                neck: [3, -3, 0],
                leftUpperArm: [20, 40, 50],
                leftLowerArm: [-60, 0, 0],
                leftHand: [20, 10, 25],
                rightUpperArm: [20, -40, -50],
                rightLowerArm: [-60, 0, 0],
                rightHand: [20, -10, -25]
            },
            {
                time: 1.8,
                head: [0, 12, 5],
                neck: [0, 8, 2],
                spine: [3, 5, 0],
                leftUpperArm: [-10, 25, 35],
                leftLowerArm: [-35, 0, 0],
                rightUpperArm: [10, -45, -60],
                rightLowerArm: [-70, 0, 0],
                rightHand: [0, 0, -15]
            },
            {
                time: 2.3,
                head: [-5, -5, -3],
                neck: [-2, -3, -1],
                leftUpperArm: [15, 35, 45],
                leftLowerArm: [-55, 0, 0],
                leftHand: [-10, 5, 20],
                rightUpperArm: [-10, -20, -35],
                rightLowerArm: [-25, 0, 0]
            },
            {
                time: 3,
                head: [0, 0, 0],
                neck: [0, 0, 0],
                spine: [0, 0, 0],
                leftUpperArm: [0, 20, 30],
                leftLowerArm: [-30, 0, 0],
                leftHand: [0, 0, 0],
                rightUpperArm: [0, -20, -30],
                rightLowerArm: [-30, 0, 0],
                rightHand: [0, 0, 0]
            }
        ]
    },

    /**
     * Thinking pose
     */
    think: {
        name: 'think',
        duration: 4,
        loop: true,
        keyframes: [
            {
                time: 0,
                head: [10, 0, 5],
                neck: [5, 0, 3],
                spine: [5, 0, 0],
                chest: [3, 0, 0],
                hips: [0, 0, 0],
                leftUpperArm: [30, 30, 20],
                leftLowerArm: [-120, 0, 0],
                leftHand: [30, -20, 0],
                rightUpperArm: [20, 0, -15],
                rightLowerArm: [-40, 0, 0],
                leftUpperLeg: [0, 0, 5],
                rightUpperLeg: [0, 0, -5]
            },
            {
                time: 1,
                head: [15, 5, 8],
                neck: [8, 3, 4],
                spine: [7, 2, 0],
                leftUpperArm: [35, 35, 25],
                leftLowerArm: [-125, 0, 0],
                leftHand: [35, -15, 5]
            },
            {
                time: 2,
                head: [8, -5, 3],
                neck: [4, -2, 2],
                spine: [4, -1, 0],
                leftUpperArm: [28, 28, 18],
                leftLowerArm: [-118, 0, 0],
                leftHand: [25, -25, -5]
            },
            {
                time: 3,
                head: [12, 8, 6],
                neck: [6, 5, 3],
                spine: [6, 3, 0],
                leftUpperArm: [33, 33, 23],
                leftLowerArm: [-122, 0, 0],
                leftHand: [32, -18, 3]
            },
            {
                time: 4,
                head: [10, 0, 5],
                neck: [5, 0, 3],
                spine: [5, 0, 0],
                chest: [3, 0, 0],
                leftUpperArm: [30, 30, 20],
                leftLowerArm: [-120, 0, 0],
                leftHand: [30, -20, 0],
                rightUpperArm: [20, 0, -15],
                rightLowerArm: [-40, 0, 0]
            }
        ]
    },

    /**
     * Celebration animation
     */
    celebrate: {
        name: 'celebrate',
        duration: 2.5,
        loop: false,
        keyframes: [
            {
                time: 0,
                hips: [0, 0, 0],
                spine: [0, 0, 0],
                head: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                rightUpperArm: [0, 0, -5],
                leftLowerArm: [0, 0, 0],
                rightLowerArm: [0, 0, 0],
                leftUpperLeg: [0, 0, 0],
                rightUpperLeg: [0, 0, 0]
            },
            {
                time: 0.3,
                hips: [-10, 0, 0],
                spine: [-5, 0, 0],
                chest: [-5, 0, 0],
                leftUpperLeg: [15, 0, 0],
                leftLowerLeg: [30, 0, 0],
                rightUpperLeg: [15, 0, 0],
                rightLowerLeg: [30, 0, 0]
            },
            {
                time: 0.5,
                hips: [5, 0, 0],
                spine: [5, 0, 0],
                chest: [5, 0, 0],
                head: [-15, 0, 0],
                leftUpperArm: [0, 0, -170],
                leftLowerArm: [0, 0, 0],
                leftHand: [0, 30, 0],
                rightUpperArm: [0, 0, 170],
                rightLowerArm: [0, 0, 0],
                rightHand: [0, -30, 0],
                leftUpperLeg: [-5, 0, 0],
                leftLowerLeg: [0, 0, 0],
                rightUpperLeg: [-5, 0, 0],
                rightLowerLeg: [0, 0, 0]
            },
            {
                time: 0.8,
                hips: [-8, 0, 0],
                leftUpperLeg: [12, 0, 0],
                leftLowerLeg: [25, 0, 0],
                rightUpperLeg: [12, 0, 0],
                rightLowerLeg: [25, 0, 0],
                leftHand: [0, -30, 0],
                rightHand: [0, 30, 0]
            },
            {
                time: 1.1,
                hips: [5, 0, 0],
                head: [-20, 10, 0],
                leftUpperLeg: [-5, 0, 0],
                leftLowerLeg: [0, 0, 0],
                rightUpperLeg: [-5, 0, 0],
                rightLowerLeg: [0, 0, 0],
                leftHand: [0, 30, 0],
                rightHand: [0, -30, 0]
            },
            {
                time: 1.4,
                hips: [-8, 0, 0],
                head: [-20, -10, 0],
                leftUpperLeg: [12, 0, 0],
                leftLowerLeg: [25, 0, 0],
                rightUpperLeg: [12, 0, 0],
                rightLowerLeg: [25, 0, 0],
                leftHand: [0, -30, 0],
                rightHand: [0, 30, 0]
            },
            {
                time: 1.7,
                hips: [5, 0, 0],
                head: [-15, 0, 0],
                leftUpperLeg: [-5, 0, 0],
                leftLowerLeg: [0, 0, 0],
                rightUpperLeg: [-5, 0, 0],
                rightLowerLeg: [0, 0, 0],
                leftHand: [0, 20, 0],
                rightHand: [0, -20, 0]
            },
            {
                time: 2.5,
                hips: [0, 0, 0],
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                head: [0, 0, 0],
                leftUpperArm: [0, 0, 5],
                leftLowerArm: [0, 0, 0],
                leftHand: [0, 0, 0],
                rightUpperArm: [0, 0, -5],
                rightLowerArm: [0, 0, 0],
                rightHand: [0, 0, 0],
                leftUpperLeg: [0, 0, 0],
                leftLowerLeg: [0, 0, 0],
                rightUpperLeg: [0, 0, 0],
                rightLowerLeg: [0, 0, 0]
            }
        ]
    }
};

/**
 * Example of how an LLM might generate a custom animation
 * This demonstrates the semantic format
 */
export const llmExampleAnimation = {
    name: "pointing_and_explaining",
    description: "Character points at something while appearing to explain it",
    duration: 4,
    loop: false,
    easing: "easeInOut",
    keyframes: [
        {
            time: 0,
            // Starting neutral pose
            torso: {
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                head: [0, 0, 0]
            },
            rightArm: {
                shoulder: [0, 0, 0],
                upper: [0, 0, 0],
                lower: [0, 0, 0],
                hand: [0, 0, 0]
            },
            leftArm: {
                shoulder: [0, 0, 0],
                upper: [0, 0, 0],
                lower: [0, 0, 0],
                hand: [0, 0, 0]
            }
        },
        {
            time: 0.5,
            // Raise right arm to point
            rightArm: {
                upper: [0, -45, -90],
                lower: [0, 0, 0],
                hand: [0, 0, 0]
            },
            // Turn head and body slightly toward pointing direction
            torso: {
                spine: [0, 15, 0],
                chest: [0, 10, 0],
                head: [0, 20, 0]
            }
        },
        {
            time: 1.5,
            // Gesturing with left hand while pointing
            leftArm: {
                upper: [20, 30, 40],
                lower: [-50, 0, 0],
                hand: [15, 0, 10]
            },
            // Slight head movement as if explaining
            head: [5, 15, 3]
        },
        {
            time: 2.5,
            // Different gesture
            leftArm: {
                upper: [15, 40, 50],
                lower: [-60, 0, 0],
                hand: [-10, 0, 15]
            },
            head: [-5, 25, -3]
        },
        {
            time: 4,
            // Return to neutral
            torso: {
                spine: [0, 0, 0],
                chest: [0, 0, 0],
                head: [0, 0, 0]
            },
            rightArm: {
                shoulder: [0, 0, 0],
                upper: [0, 0, 0],
                lower: [0, 0, 0],
                hand: [0, 0, 0]
            },
            leftArm: {
                shoulder: [0, 0, 0],
                upper: [0, 0, 0],
                lower: [0, 0, 0],
                hand: [0, 0, 0]
            }
        }
    ]
};
