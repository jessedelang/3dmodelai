/**
 * Navigation & Pathfinding System
 *
 * Provides AI-controlled character movement with:
 * - Grid-based NavMesh for walkable areas
 * - A* pathfinding
 * - Steering behaviors (seek, arrive, avoid, separate)
 * - Collision avoidance between characters
 *
 * Designed to be controlled by LLM scene descriptions.
 */

import * as THREE from 'three';

/**
 * 2D Vector helper for pathfinding calculations
 */
class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    div(s) { return new Vec2(this.x / s, this.y / s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const len = this.length();
        return len > 0 ? this.div(len) : new Vec2();
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
    distanceTo(v) { return this.sub(v).length(); }
    clone() { return new Vec2(this.x, this.y); }

    static fromThree(v3) { return new Vec2(v3.x, v3.z); }
    toThree(y = 0) { return new THREE.Vector3(this.x, y, this.y); }
}

/**
 * NavMesh Grid Cell
 */
class NavCell {
    constructor(x, y, walkable = true) {
        this.x = x;
        this.y = y;
        this.walkable = walkable;
        this.cost = 1; // Movement cost (higher = slower)

        // A* pathfinding data
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }

    reset() {
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

/**
 * Navigation Mesh
 * Grid-based walkable area definition
 */
export class NavMesh {
    constructor(options = {}) {
        this.cellSize = options.cellSize || 0.5;  // Size of each grid cell
        this.width = options.width || 20;          // World units
        this.height = options.height || 20;        // World units
        this.offsetX = options.offsetX || -10;     // World offset
        this.offsetY = options.offsetY || -10;

        this.gridWidth = Math.ceil(this.width / this.cellSize);
        this.gridHeight = Math.ceil(this.height / this.cellSize);

        this.grid = [];
        this.obstacles = [];

        this.initGrid();
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push(new NavCell(x, y, true));
            }
            this.grid.push(row);
        }
    }

    /**
     * Convert world position to grid coordinates
     */
    worldToGrid(worldX, worldZ) {
        const x = Math.floor((worldX - this.offsetX) / this.cellSize);
        const y = Math.floor((worldZ - this.offsetY) / this.cellSize);
        return { x, y };
    }

    /**
     * Convert grid coordinates to world position (center of cell)
     */
    gridToWorld(gridX, gridY) {
        const x = gridX * this.cellSize + this.offsetX + this.cellSize / 2;
        const z = gridY * this.cellSize + this.offsetY + this.cellSize / 2;
        return new THREE.Vector3(x, 0, z);
    }

    /**
     * Get cell at grid coordinates
     */
    getCell(x, y) {
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return null;
        }
        return this.grid[y][x];
    }

    /**
     * Get cell at world position
     */
    getCellAtWorld(worldX, worldZ) {
        const { x, y } = this.worldToGrid(worldX, worldZ);
        return this.getCell(x, y);
    }

    /**
     * Add a rectangular obstacle
     */
    addObstacle(x, z, width, depth) {
        const obstacle = { x, z, width, depth };
        this.obstacles.push(obstacle);

        // Mark cells as unwalkable
        const minGrid = this.worldToGrid(x - width / 2, z - depth / 2);
        const maxGrid = this.worldToGrid(x + width / 2, z + depth / 2);

        for (let gy = minGrid.y; gy <= maxGrid.y; gy++) {
            for (let gx = minGrid.x; gx <= maxGrid.x; gx++) {
                const cell = this.getCell(gx, gy);
                if (cell) cell.walkable = false;
            }
        }

        return obstacle;
    }

    /**
     * Add a circular obstacle
     */
    addCircularObstacle(x, z, radius) {
        const obstacle = { x, z, radius, isCircle: true };
        this.obstacles.push(obstacle);

        // Mark cells as unwalkable
        const minGrid = this.worldToGrid(x - radius, z - radius);
        const maxGrid = this.worldToGrid(x + radius, z + radius);

        for (let gy = minGrid.y; gy <= maxGrid.y; gy++) {
            for (let gx = minGrid.x; gx <= maxGrid.x; gx++) {
                const cell = this.getCell(gx, gy);
                if (cell) {
                    const worldPos = this.gridToWorld(gx, gy);
                    const dist = Math.sqrt((worldPos.x - x) ** 2 + (worldPos.z - z) ** 2);
                    if (dist <= radius) {
                        cell.walkable = false;
                    }
                }
            }
        }

        return obstacle;
    }

    /**
     * Check if a world position is walkable
     */
    isWalkable(worldX, worldZ) {
        const cell = this.getCellAtWorld(worldX, worldZ);
        return cell ? cell.walkable : false;
    }

    /**
     * Get neighboring cells for pathfinding
     */
    getNeighbors(cell) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        for (const dir of directions) {
            const neighbor = this.getCell(cell.x + dir.x, cell.y + dir.y);
            if (neighbor && neighbor.walkable) {
                // For diagonal movement, check if we can actually move diagonally
                if (dir.x !== 0 && dir.y !== 0) {
                    const adj1 = this.getCell(cell.x + dir.x, cell.y);
                    const adj2 = this.getCell(cell.x, cell.y + dir.y);
                    if (!adj1?.walkable || !adj2?.walkable) continue;
                }
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Reset pathfinding data for all cells
     */
    resetPathfinding() {
        for (const row of this.grid) {
            for (const cell of row) {
                cell.reset();
            }
        }
    }

    /**
     * Create debug visualization
     */
    createDebugMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                const worldPos = this.gridToWorld(x, y);

                // Create a small square for each cell
                const halfSize = this.cellSize * 0.45;
                const h = 0.02;

                // Two triangles per cell
                const corners = [
                    [worldPos.x - halfSize, h, worldPos.z - halfSize],
                    [worldPos.x + halfSize, h, worldPos.z - halfSize],
                    [worldPos.x + halfSize, h, worldPos.z + halfSize],
                    [worldPos.x - halfSize, h, worldPos.z + halfSize]
                ];

                positions.push(...corners[0], ...corners[1], ...corners[2]);
                positions.push(...corners[0], ...corners[2], ...corners[3]);

                const color = cell.walkable ? [0.2, 0.5, 0.2] : [0.6, 0.2, 0.2];
                for (let i = 0; i < 6; i++) {
                    colors.push(...color);
                }
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }
}

/**
 * A* Pathfinding
 */
export class Pathfinder {
    constructor(navMesh) {
        this.navMesh = navMesh;
    }

    /**
     * Find path between two world positions
     */
    findPath(startWorld, endWorld) {
        this.navMesh.resetPathfinding();

        const startGrid = this.navMesh.worldToGrid(startWorld.x, startWorld.z);
        const endGrid = this.navMesh.worldToGrid(endWorld.x, endWorld.z);

        const startCell = this.navMesh.getCell(startGrid.x, startGrid.y);
        const endCell = this.navMesh.getCell(endGrid.x, endGrid.y);

        if (!startCell || !endCell) return null;
        if (!startCell.walkable || !endCell.walkable) return null;

        const openList = [startCell];
        const closedSet = new Set();

        startCell.g = 0;
        startCell.h = this.heuristic(startCell, endCell);
        startCell.f = startCell.h;

        while (openList.length > 0) {
            // Find cell with lowest f score
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();

            if (current === endCell) {
                return this.reconstructPath(current);
            }

            closedSet.add(`${current.x},${current.y}`);

            for (const neighbor of this.navMesh.getNeighbors(current)) {
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

                const isDiagonal = current.x !== neighbor.x && current.y !== neighbor.y;
                const moveCost = isDiagonal ? 1.414 : 1;
                const tentativeG = current.g + moveCost * neighbor.cost;

                const inOpen = openList.includes(neighbor);

                if (!inOpen || tentativeG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, endCell);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!inOpen) {
                        openList.push(neighbor);
                    }
                }
            }
        }

        return null; // No path found
    }

    /**
     * Heuristic: diagonal distance
     */
    heuristic(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    }

    /**
     * Reconstruct path from end cell
     */
    reconstructPath(endCell) {
        const path = [];
        let current = endCell;

        while (current) {
            const worldPos = this.navMesh.gridToWorld(current.x, current.y);
            path.unshift(worldPos);
            current = current.parent;
        }

        return this.smoothPath(path);
    }

    /**
     * Smooth path by removing unnecessary waypoints
     */
    smoothPath(path) {
        if (path.length <= 2) return path;

        const smoothed = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = smoothed[smoothed.length - 1];
            const curr = path[i];
            const next = path[i + 1];

            // Check if we can skip this waypoint
            const dir1 = new THREE.Vector3().subVectors(curr, prev).normalize();
            const dir2 = new THREE.Vector3().subVectors(next, curr).normalize();

            if (dir1.dot(dir2) < 0.98) { // Direction changed significantly
                smoothed.push(curr);
            }
        }

        smoothed.push(path[path.length - 1]);
        return smoothed;
    }
}

/**
 * Steering Behaviors for smooth character movement
 */
export class SteeringBehavior {
    constructor() {
        this.maxSpeed = 1.5;
        this.maxForce = 3.0;
        this.arrivalRadius = 0.5;
        this.slowingRadius = 2.0;
        this.separationRadius = 1.0;
        this.separationWeight = 2.0;
        this.obstacleAvoidanceWeight = 3.0;
        this.pathFollowWeight = 1.5;
    }

    /**
     * Seek: Move toward a target
     */
    seek(position, velocity, target) {
        const desired = new Vec2(target.x - position.x, target.z - position.z);
        const distance = desired.length();

        if (distance < 0.01) return new Vec2();

        desired.x = (desired.x / distance) * this.maxSpeed;
        desired.y = (desired.y / distance) * this.maxSpeed;

        return new Vec2(
            desired.x - velocity.x,
            desired.y - velocity.z
        );
    }

    /**
     * Arrive: Move toward target and slow down when close
     */
    arrive(position, velocity, target) {
        const desired = new Vec2(target.x - position.x, target.z - position.z);
        const distance = desired.length();

        if (distance < 0.01) return new Vec2();

        let speed = this.maxSpeed;
        if (distance < this.slowingRadius) {
            speed = this.maxSpeed * (distance / this.slowingRadius);
        }

        desired.x = (desired.x / distance) * speed;
        desired.y = (desired.y / distance) * speed;

        return new Vec2(
            desired.x - velocity.x,
            desired.y - velocity.z
        );
    }

    /**
     * Separation: Avoid crowding other characters
     */
    separate(position, others) {
        const steering = new Vec2();
        let count = 0;

        for (const other of others) {
            const dx = position.x - other.x;
            const dz = position.z - other.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0 && distance < this.separationRadius) {
                // Push away from neighbor, stronger when closer
                const strength = (this.separationRadius - distance) / this.separationRadius;
                steering.x += (dx / distance) * strength;
                steering.y += (dz / distance) * strength;
                count++;
            }
        }

        if (count > 0) {
            steering.x /= count;
            steering.y /= count;
            steering.x *= this.separationWeight;
            steering.y *= this.separationWeight;
        }

        return steering;
    }

    /**
     * Obstacle avoidance
     */
    avoidObstacles(position, velocity, obstacles) {
        const steering = new Vec2();
        const lookAhead = 1.5;

        // Project position forward
        const velLength = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (velLength < 0.1) return steering;

        const ahead = new Vec2(
            position.x + (velocity.x / velLength) * lookAhead,
            position.z + (velocity.z / velLength) * lookAhead
        );

        let nearestObstacle = null;
        let nearestDist = Infinity;

        for (const obs of obstacles) {
            const dist = Math.sqrt(
                (ahead.x - obs.x) ** 2 + (ahead.y - obs.z) ** 2
            );
            const radius = obs.radius || Math.max(obs.width || 0, obs.depth || 0) / 2;

            if (dist < radius + 0.5 && dist < nearestDist) {
                nearestObstacle = obs;
                nearestDist = dist;
            }
        }

        if (nearestObstacle) {
            steering.x = ahead.x - nearestObstacle.x;
            steering.y = ahead.y - nearestObstacle.z;
            const len = steering.length();
            if (len > 0) {
                steering.x = (steering.x / len) * this.obstacleAvoidanceWeight;
                steering.y = (steering.y / len) * this.obstacleAvoidanceWeight;
            }
        }

        return steering;
    }

    /**
     * Limit force magnitude
     */
    limit(force, max = this.maxForce) {
        const len = force.length();
        if (len > max) {
            force.x = (force.x / len) * max;
            force.y = (force.y / len) * max;
        }
        return force;
    }
}

/**
 * Navigation Agent
 * Wraps a character with navigation capabilities
 */
export class NavAgent {
    constructor(character, navMesh, pathfinder) {
        this.character = character;
        this.navMesh = navMesh;
        this.pathfinder = pathfinder;
        this.steering = new SteeringBehavior();

        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = 0;

        this.path = null;
        this.currentWaypoint = 0;
        this.isMoving = false;

        this.waypointReachThreshold = 0.3;
        this.destinationReachThreshold = 0.2;

        // State callbacks
        this.onReachDestination = null;
        this.onPathBlocked = null;
    }

    /**
     * Set target destination
     */
    setDestination(target) {
        this.path = this.pathfinder.findPath(this.position, target);

        if (this.path && this.path.length > 0) {
            this.currentWaypoint = 0;
            this.isMoving = true;
            return true;
        } else {
            this.isMoving = false;
            if (this.onPathBlocked) {
                this.onPathBlocked(target);
            }
            return false;
        }
    }

    /**
     * Stop movement
     */
    stop() {
        this.isMoving = false;
        this.path = null;
        this.velocity.set(0, 0, 0);
    }

    /**
     * Update agent (call every frame)
     */
    update(deltaTime, otherAgents = [], obstacles = []) {
        if (!this.isMoving || !this.path || this.path.length === 0) {
            // Apply friction when stopped
            this.velocity.multiplyScalar(0.9);
            this.updateCharacterPosition(deltaTime);
            return;
        }

        // Get current target waypoint
        const target = this.path[this.currentWaypoint];

        // Calculate steering forces
        const seekForce = this.currentWaypoint === this.path.length - 1
            ? this.steering.arrive(this.position, this.velocity, target)
            : this.steering.seek(this.position, this.velocity, target);

        // Separation from other agents
        const otherPositions = otherAgents
            .filter(a => a !== this)
            .map(a => a.position);
        const separationForce = this.steering.separate(this.position, otherPositions);

        // Obstacle avoidance
        const avoidanceForce = this.steering.avoidObstacles(
            this.position,
            this.velocity,
            obstacles
        );

        // Combine forces
        const totalForce = new Vec2(
            seekForce.x * this.steering.pathFollowWeight +
            separationForce.x +
            avoidanceForce.x,
            seekForce.y * this.steering.pathFollowWeight +
            separationForce.y +
            avoidanceForce.y
        );

        this.steering.limit(totalForce);

        // Apply force to velocity
        this.velocity.x += totalForce.x * deltaTime;
        this.velocity.z += totalForce.y * deltaTime;

        // Limit speed
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (speed > this.steering.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.steering.maxSpeed;
            this.velocity.z = (this.velocity.z / speed) * this.steering.maxSpeed;
        }

        // Check if reached current waypoint
        const distToWaypoint = this.position.distanceTo(target);
        if (distToWaypoint < this.waypointReachThreshold) {
            this.currentWaypoint++;

            if (this.currentWaypoint >= this.path.length) {
                // Reached destination
                this.isMoving = false;
                this.velocity.set(0, 0, 0);
                if (this.onReachDestination) {
                    this.onReachDestination();
                }
                return;
            }
        }

        this.updateCharacterPosition(deltaTime);
    }

    /**
     * Update character transform
     */
    updateCharacterPosition(deltaTime) {
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Update rotation to face movement direction
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (speed > 0.1) {
            const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
            // Smooth rotation
            const rotationDiff = targetRotation - this.rotation;
            let adjustedDiff = rotationDiff;
            if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
            if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;
            this.rotation += adjustedDiff * Math.min(1, deltaTime * 10);
        }

        // Apply to character
        if (this.character) {
            const obj = this.character.getObject ? this.character.getObject() : this.character;
            obj.position.copy(this.position);
            obj.rotation.y = this.rotation;
        }
    }

    /**
     * Sync position from character
     */
    syncFromCharacter() {
        if (this.character) {
            const obj = this.character.getObject ? this.character.getObject() : this.character;
            this.position.copy(obj.position);
            this.rotation = obj.rotation.y;
        }
    }

    /**
     * Get current state for LLM
     */
    getState() {
        return {
            position: { x: this.position.x, z: this.position.z },
            rotation: this.rotation * (180 / Math.PI),
            isMoving: this.isMoving,
            velocity: Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2),
            hasPath: this.path !== null,
            waypointsRemaining: this.path ? this.path.length - this.currentWaypoint : 0
        };
    }
}
