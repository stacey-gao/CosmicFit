# Cosmic Fit - Project Context for AI Agents

## Project Overview
**Cosmic Fit** is a real-time gamified AI fitness tracker. It uses the device's webcam and the **MediaPipe Pose** machine learning model to track user body joint landmarks in real-time. The initial implementation features an "Overhead Clap Detector" that scores users for successfully clapping their hands above their head.

## Technology Stack
- **Core**: HTML5, Vanilla JavaScript (ES Modules).
- **Styling**: Vanilla CSS (`src/style.css`).
- **Build Tool**: Vite (`npm run dev`, `npm run build`).
- **AI/ML**: MediaPipe Pose (loaded via CDN in `index.html`).

## Design System & Aesthetics
- **Theme**: Dark, space-themed, premium design with glassmorphism (blurred translucent backgrounds) and neon glow effects.
- **Color Palette**:
  - Background: `#0a0e1a` (Deep dark blue/black)
  - Primary: `#4E8EFF` (Vibrant Blue)
  - Accent: `#FA9D28` (Cosmic Orange)
- **Typography**: `Outfit` for headings, `Inter` for body text (loaded via Google Fonts).
- **Animations**: CSS keyframes for bouncing, glowing, particle effects (handled in JS Canvas), and smooth transitions.

## Key Files & Architecture
- **`index.html`**: The main entry point. Contains the UI layout, loads external fonts and MediaPipe scripts.
- **`src/main.js`**: Core application logic.
  - Initializes MediaPipe Pose and the webcam stream.
  - Processes frame-by-frame pose results, calculating joint coordinates.
  - Handles the scoring logic (e.g., wrist proximity and elevation above the nose).
  - Draws the neon skeleton overlay and particle effects using HTML5 Canvas.
  - Manages UI state and audio feedback (Web Audio API).
- **`src/style.css`**: All styling. Uses CSS custom properties (variables) for theme consistency.

## AI Agent Guidelines
When modifying this project, AI agents should adhere to the following:
1. **Preserve the Vanilla Tech Stack**: Do not introduce heavy frontend frameworks (like React or Vue) unless explicitly requested. Continue using Vanilla JS and CSS.
2. **Maintain Premium Aesthetics**: Any new UI components must match the existing glassmorphic, glowing, space-themed design. Use the defined CSS variables.
3. **MediaPipe Pose Handling**: When interacting with the pose data, remember that coordinates (`x`, `y`, `z`) are normalized `[0.0, 1.0]`. Canvas rendering must scale these to the canvas dimensions.
4. **Performance**: Keep the frame processing loop (`processWebcamLoop` and `onPoseResults`) optimized. Avoid heavy DOM manipulations or excessive garbage collection during the tracking phase to maintain high FPS.
