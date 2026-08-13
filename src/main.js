import { Pose } from '@mediapipe/pose';

/**
 * Cosmic Fit - Real-time Gamified AI Fitness Tracker
 * Uses MediaPipe Pose for high-precision real-time joint landmark tracking.
 */

// Global State
let score = 0;
let isHandsClappedAboveHead = false;
let soundEnabled = true;
let isCameraActive = false;
let videoStream = null;
let poseDetector = null;
let animFrameId = null;
let isProcessingFrame = false;

// Telemetry & Stats
let lastFrameTime = performance.now();
let fps = 0;
let particles = [];

// DOM Elements
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('skeletonCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const scoreCard = document.getElementById('scoreCard');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const cameraToggleBtn = document.getElementById('cameraToggleBtn');
const cameraBtnText = document.getElementById('cameraBtnText');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');

const timerBtn = document.getElementById('timerBtn');
const timerBtnText = document.getElementById('timerBtnText');
const timerDisplay = document.getElementById('timerDisplay');
const timerValue = document.getElementById('timerValue');
let timerInterval = null;
let timeLeft = 60;
let isTimerActive = false;

const focusToggleBtn = document.getElementById('focusToggleBtn');
const focusIcon = document.getElementById('focusIcon');
const focusText = document.getElementById('focusText');
const overlayScore = document.getElementById('overlayScore');
const overlayScoreValue = document.getElementById('overlayScoreValue');
const appContainer = document.getElementById('app');
let isFocusMode = false;

const poseStatusBadge = document.getElementById('poseStatusBadge');
const statusText = document.getElementById('statusText');
const targetBanner = document.getElementById('targetBanner');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

const fpsValue = document.getElementById('fpsValue');
const distValue = document.getElementById('distValue');
const overheadValue = document.getElementById('overheadValue');

const proximityPercentage = document.getElementById('proximityPercentage');
const proximityMeterFill = document.getElementById('proximityMeterFill');
const elevationStatus = document.getElementById('elevationStatus');
const elevationMeterFill = document.getElementById('elevationMeterFill');

// Web Audio API Synthesizer
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playScoreChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Primary Tone (C5 -> E5 -> G5 fast arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      
      gain.gain.setValueAtTime(0, now + index * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, now + index * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.3);
    });
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

// Particle System for Score Burst FX
function createScoreParticles(x, y) {
  const colors = ['#00f2fe', '#4facfe', '#7928ca', '#ff007f', '#10b981', '#ffffff'];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Slight upward drift
      radius: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.03 + 0.015
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // Gravity
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Update Score Display
function incrementScore(particleX, particleY) {
  if (timeLeft === 0 && !isTimerActive && timerValue.textContent === "TIME'S UP!") return;

  score += 1;
  scoreValue.textContent = score;
  overlayScoreValue.textContent = score;
  
  // UI Animations
  scoreCard.classList.add('bounce', 'scored');
  overlayScore.classList.add('bounce');
  setTimeout(() => {
    scoreCard.classList.remove('bounce', 'scored');
    overlayScore.classList.remove('bounce');
  }, 400);

  // Audio & Visual Effects
  playScoreChime();
  if (particleX && particleY) {
    createScoreParticles(particleX, particleY);
  } else {
    createScoreParticles(canvas.width / 2, canvas.height / 3);
  }
}

// Skeleton Drawing Helper
function drawSkeleton(landmarks) {
  if (!landmarks || landmarks.length === 0) return;

  const w = canvas.width;
  const h = canvas.height;

  // MediaPipe Pose Landmark Indices
  const NOSE = landmarks[0];
  const LEFT_SHOULDER = landmarks[11];
  const RIGHT_SHOULDER = landmarks[12];
  const LEFT_ELBOW = landmarks[13];
  const RIGHT_ELBOW = landmarks[14];
  const LEFT_WRIST = landmarks[15];
  const RIGHT_WRIST = landmarks[16];

  // Helper convert landmark to canvas pixel coords
  const toPx = (lm) => ({ x: lm.x * w, y: lm.y * h });

  // Key Joint Positions
  const nosePt = toPx(NOSE);
  const lShoulder = toPx(LEFT_SHOULDER);
  const rShoulder = toPx(RIGHT_SHOULDER);
  const lElbow = toPx(LEFT_ELBOW);
  const rElbow = toPx(RIGHT_ELBOW);
  const lWrist = toPx(LEFT_WRIST);
  const rWrist = toPx(RIGHT_WRIST);

  // Connection Pairs
  const connections = [
    [lShoulder, rShoulder],
    [lShoulder, lElbow],
    [lElbow, lWrist],
    [rShoulder, rElbow],
    [rElbow, rWrist],
  ];

  ctx.lineWidth = 4;

  // Draw Bones with Neon Glow
  connections.forEach(([p1, p2]) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f2fe';
    ctx.stroke();
  });

  // Draw Nose Node
  ctx.beginPath();
  ctx.arc(nosePt.x, nosePt.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#f59e0b';
  ctx.fill();

  // Draw Line between wrists for Proximity visual feedback
  ctx.beginPath();
  ctx.moveTo(lWrist.x, lWrist.y);
  ctx.lineTo(rWrist.x, rWrist.y);
  ctx.lineWidth = isHandsClappedAboveHead ? 5 : 2;
  ctx.strokeStyle = isHandsClappedAboveHead ? '#ff007f' : 'rgba(255, 255, 255, 0.4)';
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Draw Wrists
  [lWrist, rWrist].forEach((wrist) => {
    ctx.beginPath();
    ctx.arc(wrist.x, wrist.y, isHandsClappedAboveHead ? 12 : 9, 0, Math.PI * 2);
    ctx.fillStyle = isHandsClappedAboveHead ? '#ff007f' : '#10b981';
    ctx.shadowBlur = 18;
    ctx.shadowColor = isHandsClappedAboveHead ? '#ff007f' : '#10b981';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
}

// MediaPipe Results Processing Callback
function onPoseResults(results) {
  // Update FPS
  const now = performance.now();
  fps = Math.round(1000 / (now - lastFrameTime));
  lastFrameTime = now;
  fpsValue.textContent = fps;

  // Match Canvas Size with Video Element
  if (webcam.videoWidth && webcam.videoHeight) {
    if (canvas.width !== webcam.videoWidth || canvas.height !== webcam.videoHeight) {
      canvas.width = webcam.videoWidth;
      canvas.height = webcam.videoHeight;
    }
  }

  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results || !results.poseLandmarks) {
    updateUIForNoPose();
    updateAndDrawParticles();
    return;
  }

  const landmarks = results.poseLandmarks;

  // Key Landmarks: NOSE (0), LEFT_WRIST (15), RIGHT_WRIST (16)
  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  if (!nose || !leftWrist || !rightWrist) {
    updateUIForNoPose();
    updateAndDrawParticles();
    return;
  }

  // 1. Check Overhead Condition: Y=0 is top of screen, so Y < Nose.Y means above nose
  const isLeftWristAboveNose = leftWrist.y < nose.y;
  const isRightWristAboveNose = rightWrist.y < nose.y;
  const isOverhead = isLeftWristAboveNose && isRightWristAboveNose;

  // 2. Check Proximity Condition: Normalized Euclidean distance between wrists
  const dx = leftWrist.x - rightWrist.x;
  const dy = leftWrist.y - rightWrist.y;
  const wristDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalized threshold < 0.15
  const PROXIMITY_THRESHOLD = 0.15;
  const RESET_PROXIMITY_THRESHOLD = 0.22;
  const isClapped = wristDistance < PROXIMITY_THRESHOLD;

  // Render Skeleton Overlay
  drawSkeleton(landmarks);

  // Update Real-time Telemetry & Meters
  distValue.textContent = wristDistance.toFixed(3);
  overheadValue.textContent = isOverhead ? 'YES' : 'NO';
  
  // Proximity meter (mapped 0.35 -> 0.0)
  const proximityPercent = Math.min(100, Math.max(0, ((0.35 - wristDistance) / 0.35) * 100));
  proximityPercentage.textContent = `${Math.round(proximityPercent)}%`;
  proximityMeterFill.style.width = `${proximityPercent}%`;
  if (isClapped) {
    proximityMeterFill.className = 'meter-bar-fill meter-purple';
  } else {
    proximityMeterFill.className = 'meter-bar-fill meter-blue';
  }

  // Elevation meter
  elevationStatus.textContent = isOverhead ? 'YES 🙌' : 'NO';
  const noseY = nose.y;
  const avgWristY = (leftWrist.y + rightWrist.y) / 2;
  const heightDiff = noseY - avgWristY; // Positive when wrists above nose
  const elevationPercent = Math.min(100, Math.max(0, (heightDiff / 0.4 + 0.3) * 100));
  elevationMeterFill.style.width = `${elevationPercent}%`;

  // 3. Gesture Logic & State Lock (Debouncing)
  const midWristPxX = ((leftWrist.x + rightWrist.x) / 2) * canvas.width;
  const midWristPxY = ((leftWrist.y + rightWrist.y) / 2) * canvas.height;

  if (isOverhead && isClapped) {
    if (!isHandsClappedAboveHead) {
      // Transition: Just clapped above head!
      isHandsClappedAboveHead = true;
      incrementScore(midWristPxX, midWristPxY);
    }
    
    // Status Display
    poseStatusBadge.className = 'status-badge status-active';
    statusText.textContent = 'SCORED! 🙌 Lower hands to clap again.';
    targetBanner.classList.remove('hidden');
  } else {
    // Check release / lowering condition to reset state lock
    if (!isOverhead || wristDistance > RESET_PROXIMITY_THRESHOLD) {
      isHandsClappedAboveHead = false;
    }

    targetBanner.classList.add('hidden');
    poseStatusBadge.className = 'status-badge status-tracking';

    if (isOverhead && !isClapped) {
      statusText.textContent = 'Hands Above Head! Bring wrists closer to clap!';
    } else if (!isOverhead && isClapped) {
      statusText.textContent = 'Wrists close, but raise hands ABOVE NOSE level!';
    } else {
      statusText.textContent = 'Tracking Pose - Clap hands high above head!';
    }
  }

  // Draw any active burst particles
  updateAndDrawParticles();
}

function updateUIForNoPose() {
  distValue.textContent = '--';
  overheadValue.textContent = '--';
  proximityPercentage.textContent = '0%';
  proximityMeterFill.style.width = '0%';
  elevationStatus.textContent = 'NO';
  elevationMeterFill.style.width = '0%';
  
  if (isCameraActive) {
    poseStatusBadge.className = 'status-badge status-idle';
    statusText.textContent = 'Searching for body pose...';
  }
}

// MediaPipe Model Initialization
async function initPoseDetector() {
  if (poseDetector) return true;

  loadingOverlay.classList.remove('hidden');
  loadingText.textContent = 'Initializing AI Pose Detection...';

  try {
    const PoseClass = Pose || window.Pose;
    if (!PoseClass) {
      throw new Error('MediaPipe Pose library is not loaded properly.');
    }

    poseDetector = new PoseClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    poseDetector.onResults(onPoseResults);
    await poseDetector.initialize();
    loadingOverlay.classList.add('hidden');
    return true;
  } catch (err) {
    console.error('Pose initialization error:', err);
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = 'Failed to load AI Pose model. Check internet connection.';
    return false;
  }
}

// Dedicated High-Performance Frame Loop
async function processWebcamLoop() {
  if (!isCameraActive) return;

  if (webcam.readyState >= 2 && !webcam.paused && poseDetector && !isProcessingFrame) {
    isProcessingFrame = true;
    try {
      await poseDetector.send({ image: webcam });
    } catch (err) {
      console.error('Pose processing error:', err);
    } finally {
      isProcessingFrame = false;
    }
  }

  if (isCameraActive) {
    animFrameId = requestAnimationFrame(processWebcamLoop);
  }
}

// Camera Toggle Control
async function startCamera() {
  getAudioContext(); // Enable audio context on user action

  // Ensure pose model is initialized first
  const initialized = await initPoseDetector();
  if (!initialized) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Webcam API is not supported in this browser or environment (requires HTTPS or localhost).');
    return;
  }

  try {
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = 'Accessing Webcam...';

    let stream;
    try {
      // Primary attempt with HD resolution preference
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
    } catch (constraintErr) {
      console.warn('Ideal video constraints failed, trying basic video constraints...', constraintErr);
      // Fallback attempt with basic video constraints
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
    }

    videoStream = stream;
    webcam.srcObject = videoStream;

    // Wait until video metadata has loaded so videoWidth and videoHeight are ready
    await new Promise((resolve) => {
      if (webcam.readyState >= 1) {
        resolve();
      } else {
        webcam.onloadedmetadata = () => resolve();
      }
    });

    await webcam.play();

    // Set state to active BEFORE starting frame loop
    isCameraActive = true;
    isProcessingFrame = false;

    // Start requestAnimationFrame loop
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    animFrameId = requestAnimationFrame(processWebcamLoop);

    cameraBtnText.textContent = 'Stop Camera';
    cameraToggleBtn.classList.replace('btn-primary', 'btn-secondary');
    loadingOverlay.classList.add('hidden');

    poseStatusBadge.className = 'status-badge status-tracking';
    statusText.textContent = 'Camera Active - Tracking Pose';
  } catch (err) {
    console.error('Camera access error:', err);
    isCameraActive = false;
    loadingOverlay.classList.add('hidden');
    
    let message = 'Webcam access failed. ';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      message += 'Camera permission was denied. Please allow camera access in your browser settings.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      message += 'No camera device was found on your system.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      message += 'Camera is currently in use by another application.';
    } else {
      message += err.message || 'Please check your camera connections and permissions.';
    }
    alert(message);
  }
}

function stopCamera() {
  isCameraActive = false;
  
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  isProcessingFrame = false;

  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }

  webcam.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  cameraBtnText.textContent = 'Start Camera';
  cameraToggleBtn.classList.replace('btn-secondary', 'btn-primary');

  poseStatusBadge.className = 'status-badge status-idle';
  statusText.textContent = 'Camera Inactive - Click "Start Camera"';
  updateUIForNoPose();
}

// Event Listeners
cameraToggleBtn.addEventListener('click', () => {
  if (isCameraActive) {
    stopCamera();
  } else {
    startCamera();
  }
});

resetScoreBtn.addEventListener('click', () => {
  score = 0;
  scoreValue.textContent = '0';
  overlayScoreValue.textContent = '0';
  isHandsClappedAboveHead = false;
  scoreCard.classList.add('bounce');
  overlayScore.classList.add('bounce');
  setTimeout(() => {
    scoreCard.classList.remove('bounce');
    overlayScore.classList.remove('bounce');
  }, 300);
});

focusToggleBtn.addEventListener('click', () => {
  isFocusMode = !isFocusMode;
  if (isFocusMode) {
    appContainer.classList.add('focus-mode');
    focusIcon.textContent = 'Minimize';
    focusText.textContent = 'Exit Focus';
  } else {
    appContainer.classList.remove('focus-mode');
    focusIcon.textContent = '👁️';
    focusText.textContent = 'Focus';
  }
});

function startTimer() {
  if (isTimerActive) return;
  
  // Reset score for the challenge
  score = 0;
  scoreValue.textContent = '0';
  overlayScoreValue.textContent = '0';
  isHandsClappedAboveHead = false;
  
  timeLeft = 60;
  isTimerActive = true;
  timerBtnText.textContent = 'Stop';
  timerDisplay.classList.remove('danger');
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 10) {
      timerDisplay.classList.add('danger');
    }
    
    if (timeLeft <= 0) {
      stopTimer();
      timerValue.textContent = "TIME'S UP!";
    }
  }, 1000);
}

function stopTimer() {
  isTimerActive = false;
  clearInterval(timerInterval);
  timerBtnText.textContent = 'Start';
  timerDisplay.classList.remove('danger');
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  timerValue.textContent = `${m}:${s}`;
}

timerBtn.addEventListener('click', () => {
  if (isTimerActive) {
    stopTimer();
    timerValue.textContent = '01:00';
  } else {
    startTimer();
  }
});

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  soundToggleBtn.title = soundEnabled ? 'Audio Enabled' : 'Audio Muted';
});

// Auto-initialize pose detector on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPoseDetector();
});
