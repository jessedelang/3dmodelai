# AI Humanoid Animation System

A proof of concept demonstrating how language models can control 3D humanoid characters through a semantic animation format.

## The Approach

The key challenge in having AI animate 3D characters is bridging the gap between natural language understanding and precise skeletal transformations. This system solves it with a **Semantic Pose Language** - a JSON-based format that:

1. **Uses degrees instead of radians** - More intuitive for LLMs (90° vs 1.5708 rad)
2. **Supports semantic body part groups** - `leftArm`, `rightLeg`, `torso` instead of requiring individual bone names
3. **Keyframe-based with interpolation** - Define key poses, system handles smooth transitions
4. **Multiple easing functions** - Natural motion curves (easeInOut, bounce, elastic)
5. **Natural language fallback** - Can interpret simple commands like "wave" or "nod"

## Quick Start

1. Serve the files with any HTTP server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

2. Open `http://localhost:8000` in your browser

3. Try the preset animations or enter custom JSON in the input panel

## Animation Format

### Basic Structure

```json
{
  "name": "my_animation",
  "duration": 2.0,
  "loop": false,
  "easing": "easeInOut",
  "keyframes": [
    { "time": 0, "head": [0, 0, 0] },
    { "time": 1, "head": [15, 0, 0] },
    { "time": 2, "head": [0, 0, 0] }
  ]
}
```

### Rotation Format

Rotations are specified in degrees as `[x, y, z]` (pitch, yaw, roll):
- **X (pitch)**: Forward/back tilt
- **Y (yaw)**: Left/right rotation
- **Z (roll)**: Side tilt

### Direct Bone Control

```json
{
  "keyframes": [
    {
      "time": 0,
      "head": [0, 0, 0],
      "neck": [0, 0, 0],
      "spine": [0, 0, 0],
      "rightUpperArm": [0, 0, -90],
      "rightLowerArm": [-45, 0, 0]
    }
  ]
}
```

### Semantic Body Parts

Group related bones together:

```json
{
  "keyframes": [
    {
      "time": 0,
      "rightArm": {
        "shoulder": [0, 0, 0],
        "upper": [0, 0, -90],
        "lower": [-45, 0, 0],
        "hand": [0, 0, 0]
      },
      "torso": {
        "spine": [5, 0, 0],
        "chest": [3, 0, 0],
        "head": [10, 0, 0]
      }
    }
  ]
}
```

## Available Bones

| Bone Name | Description |
|-----------|-------------|
| `hips` | Root bone, pelvis |
| `spine` | Lower back |
| `chest` | Upper torso |
| `neck` | Neck |
| `head` | Head |
| `leftShoulder` / `rightShoulder` | Clavicle/shoulder |
| `leftUpperArm` / `rightUpperArm` | Upper arm |
| `leftLowerArm` / `rightLowerArm` | Forearm |
| `leftHand` / `rightHand` | Hand |
| `leftUpperLeg` / `rightUpperLeg` | Thigh |
| `leftLowerLeg` / `rightLowerLeg` | Shin |
| `leftFoot` / `rightFoot` | Foot |

## LLM Integration Example

Here's how an LLM could generate animations:

```javascript
// Prompt to LLM:
// "Generate a JSON animation of a character looking surprised and stepping back"

// LLM Response:
{
  "name": "surprised_reaction",
  "duration": 1.5,
  "keyframes": [
    {
      "time": 0,
      "head": [0, 0, 0],
      "spine": [0, 0, 0],
      "leftUpperArm": [0, 0, 5],
      "rightUpperArm": [0, 0, -5]
    },
    {
      "time": 0.3,
      "head": [-15, 0, 0],
      "spine": [-10, 0, 0],
      "chest": [-5, 0, 0],
      "leftUpperArm": [0, 40, 60],
      "leftLowerArm": [-30, 0, 0],
      "rightUpperArm": [0, -40, -60],
      "rightLowerArm": [-30, 0, 0],
      "leftUpperLeg": [10, 0, 0],
      "rightUpperLeg": [10, 0, 0]
    },
    {
      "time": 1.5,
      "head": [-5, 0, 0],
      "spine": [-5, 0, 0],
      "leftUpperArm": [0, 20, 30],
      "leftLowerArm": [-20, 0, 0],
      "rightUpperArm": [0, -20, -30],
      "rightLowerArm": [-20, 0, 0]
    }
  ]
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM (Claude, GPT, etc.)                  │
│                                                             │
│  "Make the character wave hello enthusiastically"          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Semantic Animation JSON                      │
│                                                             │
│  { "keyframes": [{ "rightArm": { "upper": [0,0,-140] }}] } │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Animation Controller                          │
│                                                             │
│  - Normalizes semantic format to bone rotations            │
│  - Handles keyframe interpolation                          │
│  - Applies easing functions                                │
│  - Manages animation blending                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Humanoid Skeleton                           │
│                                                             │
│  - 19 bones with proper hierarchy                          │
│  - Rotation in radians applied to bones                    │
│  - Mesh deformation follows skeleton                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Three.js Renderer                          │
│                                                             │
│  - Real-time 3D rendering                                  │
│  - Smooth 60 FPS playback                                  │
└─────────────────────────────────────────────────────────────┘
```

## Future Extensions

For a full AI-generated entertainment system, this could be extended with:

1. **Motion Capture Library** - Pre-recorded mocap data that LLMs can reference and blend
2. **Inverse Kinematics** - Specify end-effector positions instead of joint angles
3. **Facial Animation** - Blend shapes for expressions
4. **Scene Graph** - Multiple characters interacting
5. **Dialogue Sync** - Lip sync and gesture timing based on speech
6. **Emotion System** - Map emotional states to animation styles

## Tech Stack

- **Three.js** - 3D rendering
- **Vanilla JavaScript** - No framework dependencies
- **ES Modules** - Modern module system

## License

MIT
