import * as THREE from 'three';

/**
 * Humanoid Character System
 * Creates a procedural humanoid with a proper skeleton rig
 * that can be controlled via semantic bone descriptions
 */

export class Humanoid {
    constructor() {
        this.group = new THREE.Group();
        this.bones = {};
        this.meshes = {};
        this.skeleton = null;

        // Body proportions (in units, roughly meters)
        this.proportions = {
            height: 1.8,
            headSize: 0.22,
            torsoLength: 0.5,
            armLength: 0.6,
            legLength: 0.85,
            shoulderWidth: 0.45,
            hipWidth: 0.3
        };

        this.createSkeleton();
        this.createBody();
    }

    createSkeleton() {
        const p = this.proportions;

        // Create all bones with proper hierarchy
        // Root bone (hips)
        this.bones.hips = new THREE.Bone();
        this.bones.hips.name = 'hips';
        this.bones.hips.position.y = p.legLength;

        // Spine chain
        this.bones.spine = new THREE.Bone();
        this.bones.spine.name = 'spine';
        this.bones.spine.position.y = 0.15;
        this.bones.hips.add(this.bones.spine);

        this.bones.chest = new THREE.Bone();
        this.bones.chest.name = 'chest';
        this.bones.chest.position.y = 0.2;
        this.bones.spine.add(this.bones.chest);

        this.bones.neck = new THREE.Bone();
        this.bones.neck.name = 'neck';
        this.bones.neck.position.y = 0.2;
        this.bones.chest.add(this.bones.neck);

        this.bones.head = new THREE.Bone();
        this.bones.head.name = 'head';
        this.bones.head.position.y = 0.1;
        this.bones.neck.add(this.bones.head);

        // Left arm chain
        this.bones.leftShoulder = new THREE.Bone();
        this.bones.leftShoulder.name = 'leftShoulder';
        this.bones.leftShoulder.position.set(0.08, 0.15, 0);
        this.bones.chest.add(this.bones.leftShoulder);

        this.bones.leftUpperArm = new THREE.Bone();
        this.bones.leftUpperArm.name = 'leftUpperArm';
        this.bones.leftUpperArm.position.set(0.15, 0, 0);
        this.bones.leftShoulder.add(this.bones.leftUpperArm);

        this.bones.leftLowerArm = new THREE.Bone();
        this.bones.leftLowerArm.name = 'leftLowerArm';
        this.bones.leftLowerArm.position.set(0.28, 0, 0);
        this.bones.leftUpperArm.add(this.bones.leftLowerArm);

        this.bones.leftHand = new THREE.Bone();
        this.bones.leftHand.name = 'leftHand';
        this.bones.leftHand.position.set(0.25, 0, 0);
        this.bones.leftLowerArm.add(this.bones.leftHand);

        // Right arm chain
        this.bones.rightShoulder = new THREE.Bone();
        this.bones.rightShoulder.name = 'rightShoulder';
        this.bones.rightShoulder.position.set(-0.08, 0.15, 0);
        this.bones.chest.add(this.bones.rightShoulder);

        this.bones.rightUpperArm = new THREE.Bone();
        this.bones.rightUpperArm.name = 'rightUpperArm';
        this.bones.rightUpperArm.position.set(-0.15, 0, 0);
        this.bones.rightShoulder.add(this.bones.rightUpperArm);

        this.bones.rightLowerArm = new THREE.Bone();
        this.bones.rightLowerArm.name = 'rightLowerArm';
        this.bones.rightLowerArm.position.set(-0.28, 0, 0);
        this.bones.rightUpperArm.add(this.bones.rightLowerArm);

        this.bones.rightHand = new THREE.Bone();
        this.bones.rightHand.name = 'rightHand';
        this.bones.rightHand.position.set(-0.25, 0, 0);
        this.bones.rightLowerArm.add(this.bones.rightHand);

        // Left leg chain
        this.bones.leftUpperLeg = new THREE.Bone();
        this.bones.leftUpperLeg.name = 'leftUpperLeg';
        this.bones.leftUpperLeg.position.set(0.1, 0, 0);
        this.bones.hips.add(this.bones.leftUpperLeg);

        this.bones.leftLowerLeg = new THREE.Bone();
        this.bones.leftLowerLeg.name = 'leftLowerLeg';
        this.bones.leftLowerLeg.position.y = -0.45;
        this.bones.leftUpperLeg.add(this.bones.leftLowerLeg);

        this.bones.leftFoot = new THREE.Bone();
        this.bones.leftFoot.name = 'leftFoot';
        this.bones.leftFoot.position.y = -0.45;
        this.bones.leftLowerLeg.add(this.bones.leftFoot);

        // Right leg chain
        this.bones.rightUpperLeg = new THREE.Bone();
        this.bones.rightUpperLeg.name = 'rightUpperLeg';
        this.bones.rightUpperLeg.position.set(-0.1, 0, 0);
        this.bones.hips.add(this.bones.rightUpperLeg);

        this.bones.rightLowerLeg = new THREE.Bone();
        this.bones.rightLowerLeg.name = 'rightLowerLeg';
        this.bones.rightLowerLeg.position.y = -0.45;
        this.bones.rightUpperLeg.add(this.bones.rightLowerLeg);

        this.bones.rightFoot = new THREE.Bone();
        this.bones.rightFoot.name = 'rightFoot';
        this.bones.rightFoot.position.y = -0.45;
        this.bones.rightLowerLeg.add(this.bones.rightFoot);

        // Create skeleton
        const boneArray = Object.values(this.bones);
        this.skeleton = new THREE.Skeleton(boneArray);
    }

    createBody() {
        const material = new THREE.MeshPhongMaterial({
            color: 0x4a90d9,
            shininess: 30,
            flatShading: false
        });

        const skinMaterial = new THREE.MeshPhongMaterial({
            color: 0xe0b89d,
            shininess: 20
        });

        // Head
        const headGeom = new THREE.SphereGeometry(0.12, 32, 24);
        this.meshes.head = new THREE.Mesh(headGeom, skinMaterial);
        this.meshes.head.position.y = 0.06;
        this.bones.head.add(this.meshes.head);

        // Face features
        const eyeGeom = new THREE.SphereGeometry(0.02, 16, 16);
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(0.04, 0.08, 0.1);
        this.bones.head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(-0.04, 0.08, 0.1);
        this.bones.head.add(rightEye);

        // Neck
        const neckGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
        this.meshes.neck = new THREE.Mesh(neckGeom, skinMaterial);
        this.meshes.neck.position.y = 0.05;
        this.bones.neck.add(this.meshes.neck);

        // Torso (chest)
        const chestGeom = new THREE.BoxGeometry(0.35, 0.25, 0.2);
        chestGeom.translate(0, 0.1, 0);
        this.meshes.chest = new THREE.Mesh(chestGeom, material);
        this.bones.chest.add(this.meshes.chest);

        // Torso (spine/lower)
        const spineGeom = new THREE.BoxGeometry(0.32, 0.2, 0.18);
        spineGeom.translate(0, 0.1, 0);
        this.meshes.spine = new THREE.Mesh(spineGeom, material);
        this.bones.spine.add(this.meshes.spine);

        // Hips
        const hipsGeom = new THREE.BoxGeometry(0.32, 0.15, 0.18);
        hipsGeom.translate(0, 0.05, 0);
        this.meshes.hips = new THREE.Mesh(hipsGeom, material);
        this.bones.hips.add(this.meshes.hips);

        // Arms
        this.createLimb('leftUpperArm', 0.07, 0.26, material, [0.12, 0, 0]);
        this.createLimb('leftLowerArm', 0.055, 0.24, skinMaterial, [0.11, 0, 0]);
        this.createLimb('rightUpperArm', 0.07, 0.26, material, [-0.12, 0, 0]);
        this.createLimb('rightLowerArm', 0.055, 0.24, skinMaterial, [-0.11, 0, 0]);

        // Hands
        const handGeom = new THREE.BoxGeometry(0.06, 0.1, 0.03);
        this.meshes.leftHand = new THREE.Mesh(handGeom, skinMaterial);
        this.meshes.leftHand.position.set(0.03, 0, 0);
        this.bones.leftHand.add(this.meshes.leftHand);

        this.meshes.rightHand = new THREE.Mesh(handGeom, skinMaterial);
        this.meshes.rightHand.position.set(-0.03, 0, 0);
        this.bones.rightHand.add(this.meshes.rightHand);

        // Legs
        this.createLimb('leftUpperLeg', 0.085, 0.42, material, [0, -0.22, 0], true);
        this.createLimb('leftLowerLeg', 0.07, 0.42, material, [0, -0.22, 0], true);
        this.createLimb('rightUpperLeg', 0.085, 0.42, material, [0, -0.22, 0], true);
        this.createLimb('rightLowerLeg', 0.07, 0.42, material, [0, -0.22, 0], true);

        // Feet
        const footGeom = new THREE.BoxGeometry(0.1, 0.06, 0.2);
        this.meshes.leftFoot = new THREE.Mesh(footGeom, material);
        this.meshes.leftFoot.position.set(0, -0.03, 0.05);
        this.bones.leftFoot.add(this.meshes.leftFoot);

        this.meshes.rightFoot = new THREE.Mesh(footGeom, material);
        this.meshes.rightFoot.position.set(0, -0.03, 0.05);
        this.bones.rightFoot.add(this.meshes.rightFoot);

        // Add skeleton root to group
        this.group.add(this.bones.hips);

        // Add skeleton helper for debugging (optional)
        // const helper = new THREE.SkeletonHelper(this.bones.hips);
        // this.group.add(helper);
    }

    createLimb(boneName, radius, length, material, offset, vertical = false) {
        const geom = new THREE.CapsuleGeometry(radius, length - radius * 2, 8, 16);

        if (!vertical) {
            geom.rotateZ(Math.PI / 2);
        }

        this.meshes[boneName] = new THREE.Mesh(geom, material);
        this.meshes[boneName].position.set(...offset);
        this.bones[boneName].add(this.meshes[boneName]);
    }

    /**
     * Get a bone by name
     */
    getBone(name) {
        return this.bones[name] || null;
    }

    /**
     * Set bone rotation in degrees (more intuitive for LLM)
     */
    setBoneRotation(boneName, x, y, z) {
        const bone = this.bones[boneName];
        if (bone) {
            bone.rotation.x = THREE.MathUtils.degToRad(x);
            bone.rotation.y = THREE.MathUtils.degToRad(y);
            bone.rotation.z = THREE.MathUtils.degToRad(z);
        }
    }

    /**
     * Set bone rotation from euler angles in radians
     */
    setBoneRotationRad(boneName, x, y, z) {
        const bone = this.bones[boneName];
        if (bone) {
            bone.rotation.set(x, y, z);
        }
    }

    /**
     * Get bone rotation in degrees
     */
    getBoneRotation(boneName) {
        const bone = this.bones[boneName];
        if (bone) {
            return {
                x: THREE.MathUtils.radToDeg(bone.rotation.x),
                y: THREE.MathUtils.radToDeg(bone.rotation.y),
                z: THREE.MathUtils.radToDeg(bone.rotation.z)
            };
        }
        return null;
    }

    /**
     * Reset all bones to default pose
     */
    resetPose() {
        for (const bone of Object.values(this.bones)) {
            bone.rotation.set(0, 0, 0);
        }
    }

    /**
     * Get the Three.js group containing the humanoid
     */
    getObject() {
        return this.group;
    }

    /**
     * Get all bone names
     */
    getBoneNames() {
        return Object.keys(this.bones);
    }

    /**
     * Export current pose as JSON (useful for creating animations)
     */
    exportPose() {
        const pose = {};
        for (const [name, bone] of Object.entries(this.bones)) {
            pose[name] = {
                rotation: [
                    THREE.MathUtils.radToDeg(bone.rotation.x),
                    THREE.MathUtils.radToDeg(bone.rotation.y),
                    THREE.MathUtils.radToDeg(bone.rotation.z)
                ]
            };
        }
        return pose;
    }

    /**
     * Apply a pose from JSON
     */
    applyPose(pose) {
        for (const [name, data] of Object.entries(pose)) {
            if (this.bones[name] && data.rotation) {
                this.setBoneRotation(name, ...data.rotation);
            }
        }
    }
}
