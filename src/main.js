import { Pose } from '@mediapipe/pose';

/**
 * Cosmic Fit - Real-time Gamified AI Fitness Tracker
 * Uses MediaPipe Pose for high-precision real-time joint landmark tracking.
 */

// Global State
let score = 0;

let level = 1;
let xp = 0;
const xpPerLevel = 1000;
const xpPerClap = 200; // Fast progression for demo

const milestonesData = [
  { 
    id: 'sprint',
    target: 5, 
    name: 'GALACTIC SPRINT', 
    desc: 'CLAPS',
    cluster: 'Sprint Cluster',
    color: '#00f2fe',
    iconSVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4h.01M4 12h4l1.5-3 2.5 3 2.5-3L18 12h2M12 20v-4M8 16l-3 4"/></svg>`,
    constellationSVG: `<svg class="sticker-svg" viewBox="0 0 50 50" width="60" height="60" fill="none" stroke-width="1.5"><path d="M10,15 L25,25 L40,15 M25,25 L30,40 M15,35 L25,25"/><circle cx="10" cy="15" r="1.5"/><circle cx="25" cy="25" r="2"/><circle cx="40" cy="15" r="1.5"/><circle cx="30" cy="40" r="1.5"/><circle cx="15" cy="35" r="1.5"/></svg>`
  },
  { 
    id: 'lift',
    target: 20, 
    name: 'STELLAR LIFT', 
    desc: 'CLAPS',
    cluster: 'Crux Nebula',
    color: '#FA9D28',
    iconSVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14M18 5v14M2 12h20M9 12v3M15 12v3"/></svg>`,
    constellationSVG: `<svg class="sticker-svg" viewBox="0 0 50 50" width="60" height="60" fill="none" stroke-width="1.5"><path d="M10,20 L20,30 L35,25 L45,15"/><circle cx="10" cy="20" r="1.5"/><circle cx="20" cy="30" r="2"/><circle cx="35" cy="25" r="1.5"/><circle cx="45" cy="15" r="1.5"/></svg>`
  },
  { 
    id: 'streak',
    target: 30, 
    name: 'COSMIC STREAK', 
    desc: 'CLAPS',
    cluster: 'Leo Minoris',
    color: '#FA9D28',
    iconSVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polyline points="12 7 12 14 15 16"/></svg>`,
    constellationSVG: `<svg class="sticker-svg" viewBox="0 0 50 50" width="60" height="60" fill="none" stroke-width="1.5"><path d="M15,40 L35,40 L45,25 L35,15 L15,15"/><circle cx="15" cy="40" r="1.5"/><circle cx="35" cy="40" r="1.5"/><circle cx="45" cy="25" r="2"/><circle cx="35" cy="15" r="1.5"/><circle cx="15" cy="15" r="1.5"/></svg>`
  }
];

function updateProgressionUI() {
  const levelText = document.getElementById('levelText');
  const xpText = document.getElementById('xpText');
  const progressPath = document.getElementById('progressPath');
  const milestoneList = document.getElementById('milestoneList');
  
  if(levelText) levelText.textContent = `Level ${level}`;
  if(xpText) xpText.textContent = `${xp}/${xpPerLevel} XP`;
  
  if(progressPath) {
    const progressPercent = Math.min(xp / xpPerLevel, 1);
    const dashOffset = 400 - (progressPercent * 400);
    progressPath.style.strokeDashoffset = dashOffset;
  }

  if(milestoneList) {
    milestoneList.innerHTML = '';
    
    milestonesData.forEach(m => {
      const isUnlocked = score >= m.target;
      const progressValue = Math.min(score, m.target);
      const progressPercent = (progressValue / m.target) * 100;
      
      const item = document.createElement('div');
      item.className = `milestone-item ${isUnlocked ? 'unlocked' : ''}`;
      // Use style override for the category color
      item.style.setProperty('--primary', m.color);
      item.innerHTML = `
        <div class="milestone-icon" style="color: ${m.color}; border-color: ${m.color}40;">
          ${m.iconSVG}
        </div>
        <div class="milestone-info">
          <div class="milestone-info-header">
            <h5>${m.name}</h5>
            <span class="milestone-progress-text">${progressValue}/${m.target} ${m.desc}</span>
            <span class="milestone-progress-text">${Math.floor(progressPercent)}%</span>
          </div>
          <div class="milestone-progress-track">
            <div class="milestone-progress-fill" style="width: ${progressPercent}%; background: ${m.color}; box-shadow: 0 0 8px ${m.color};"></div>
          </div>
          <div class="milestone-cluster">${m.cluster}</div>
        </div>
        <div class="milestone-sticker" style="color: ${m.color};">
          ${m.constellationSVG}
        </div>
      `;
      milestoneList.appendChild(item);
    });
  }
}
let isHandsClappedAboveHead = false;
let currentExercise = 'claps'; // 'claps' or 'circles'

// Circle State
let leftAccumulatedAngle = 0;
let rightAccumulatedAngle = 0;
let leftPrevAngle = null;
let rightPrevAngle = null;

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

const timerLengthSelect = document.getElementById('timerLengthSelect');
const keyboardHintOverlay = document.getElementById('keyboardHintOverlay');
const keyboardHintText = document.getElementById('keyboardHintText');

const dashboardToggleBtn = document.getElementById('dashboardToggleBtn');
const dashboardDrawer = document.getElementById('dashboardDrawer');
const constellationBtn = document.getElementById('constellationBtn');
const constellationDropdown = document.getElementById('constellationDropdown');

const overlayScore = document.getElementById('overlayScore');
const overlayScoreValue = document.getElementById('overlayScoreValue');
const appContainer = document.getElementById('app');

const poseStatusBadge = document.getElementById('poseStatusBadge');
const statusText = document.getElementById('statusText');
const targetBanner = document.getElementById('targetBanner');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

const fpsValue = document.getElementById('fpsValue');
const distValue = document.getElementById('distValue');
const overheadValue = document.getElementById('overheadValue');

const meterOneLabel = document.getElementById('meterOneLabel');
const meterOneValue = document.getElementById('meterOneValue');
const meterOneFill = document.getElementById('meterOneFill');
const meterOneMarker = document.getElementById('meterOneMarker');
const meterOneSubtext = document.getElementById('meterOneSubtext');

const meterTwoLabel = document.getElementById('meterTwoLabel');
const meterTwoValue = document.getElementById('meterTwoValue');
const meterTwoFill = document.getElementById('meterTwoFill');
const meterTwoMarker = document.getElementById('meterTwoMarker');
const meterTwoSubtext = document.getElementById('meterTwoSubtext');

const scoreHint = document.getElementById('scoreHint');
const exerciseSelect = document.getElementById('exerciseSelect');
const instructionsClaps = document.getElementById('instructionsClaps');
const instructionsCircles = document.getElementById('instructionsCircles');

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
  // Only block scoring if the timer challenge just finished and hasn't been reset
  if (!isTimerActive && timerValue.textContent === "TIME'S UP!") return;
  console.log("Scoring! Current score:", score + 1);

  score += 1;
  scoreValue.textContent = score;
  overlayScoreValue.textContent = score;
  
  // Progression
  xp += xpPerClap;
  if (xp >= xpPerLevel) {
    level += 1;
    xp -= xpPerLevel;
  }
  updateProgressionUI();
  
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
  drawSkeleton(landmarks);

  if (currentExercise === 'claps') {
    trackOverheadClaps(landmarks);
  } else if (currentExercise === 'circles') {
    trackArmCircles(landmarks);
  }

  // Draw any active burst particles
  updateAndDrawParticles();
}

function trackOverheadClaps(landmarks) {
  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  if (!nose || !leftWrist || !rightWrist) {
    updateUIForNoPose();
    return;
  }

  const isLeftWristAboveNose = leftWrist.y < nose.y;
  const isRightWristAboveNose = rightWrist.y < nose.y;
  const isOverhead = isLeftWristAboveNose && isRightWristAboveNose;

  const dx = leftWrist.x - rightWrist.x;
  const dy = leftWrist.y - rightWrist.y;
  const wristDistance = Math.sqrt(dx * dx + dy * dy);
  
  const PROXIMITY_THRESHOLD = 0.15;
  const isClapped = wristDistance < PROXIMITY_THRESHOLD;

  distValue.textContent = wristDistance.toFixed(3);
  overheadValue.textContent = isOverhead ? 'YES' : 'NO';
  
  const proximityPercent = Math.min(100, Math.max(0, ((0.35 - wristDistance) / 0.35) * 100));
  meterOneValue.textContent = `${Math.round(proximityPercent)}%`;
  meterOneFill.style.width = `${proximityPercent}%`;
  if (isClapped) {
    meterOneFill.className = 'meter-bar-fill meter-purple';
  } else {
    meterOneFill.className = 'meter-bar-fill meter-blue';
  }

  meterTwoValue.textContent = isOverhead ? 'YES 🙌' : 'NO';
  const noseY = nose.y;
  const avgWristY = (leftWrist.y + rightWrist.y) / 2;
  const heightDiff = noseY - avgWristY; 
  const elevationPercent = Math.min(100, Math.max(0, (heightDiff / 0.4 + 0.3) * 100));
  meterTwoFill.style.width = `${elevationPercent}%`;

  const midWristPxX = ((leftWrist.x + rightWrist.x) / 2) * canvas.width;
  const midWristPxY = ((leftWrist.y + rightWrist.y) / 2) * canvas.height;

  if (isOverhead && isClapped) {
    if (!isHandsClappedAboveHead) {
      isHandsClappedAboveHead = true;
      incrementScore(midWristPxX, midWristPxY);
    }
    poseStatusBadge.className = 'status-badge status-active';
    statusText.textContent = 'SCORED! 🙌 Lower hands or separate them to score again.';
    targetBanner.classList.remove('hidden');
    targetBanner.innerHTML = '<span>🙌 HANDS CLAPPED ABOVE HEAD DETECTED</span>';
  } else {
    if (!isOverhead || !isClapped) {
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
}

function trackArmCircles(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    updateUIForNoPose();
    return;
  }

  const EXTENSION_THRESHOLD = 0.2; // roughly extended arm
  const PI2 = 2 * Math.PI;

  const leftDx = leftWrist.x - leftShoulder.x;
  const leftDy = leftWrist.y - leftShoulder.y;
  const rightDx = rightWrist.x - rightShoulder.x;
  const rightDy = rightWrist.y - rightShoulder.y;

  const leftDist = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
  const rightDist = Math.sqrt(rightDx * rightDx + rightDy * rightDy);

  const isLeftExtended = leftDist > EXTENSION_THRESHOLD;
  const isRightExtended = rightDist > EXTENSION_THRESHOLD;

  let leftAngle = Math.atan2(leftDy, leftDx);
  let rightAngle = Math.atan2(rightDy, rightDx);

  if (isLeftExtended) {
    if (leftPrevAngle !== null) {
      let delta = leftAngle - leftPrevAngle;
      if (delta > Math.PI) delta -= PI2;
      if (delta < -Math.PI) delta += PI2;
      leftAccumulatedAngle += delta;
    }
    leftPrevAngle = leftAngle;
  } else {
    leftPrevAngle = null;
  }

  if (isRightExtended) {
    if (rightPrevAngle !== null) {
      let delta = rightAngle - rightPrevAngle;
      if (delta > Math.PI) delta -= PI2;
      if (delta < -Math.PI) delta += PI2;
      rightAccumulatedAngle += delta;
    }
    rightPrevAngle = rightAngle;
  } else {
    rightPrevAngle = null;
  }

  // Update Extension Meter
  const extensionPercent = Math.min(100, (Math.min(leftDist, rightDist) / 0.4) * 100);
  meterOneValue.textContent = `${Math.round(extensionPercent)}%`;
  meterOneFill.style.width = `${extensionPercent}%`;
  meterOneFill.className = (isLeftExtended && isRightExtended) ? 'meter-bar-fill meter-purple' : 'meter-bar-fill meter-blue';

  // Update Circle Progress
  const avgCircleProgress = (Math.abs(leftAccumulatedAngle) + Math.abs(rightAccumulatedAngle)) / 2;
  const progressPercent = Math.min(100, (avgCircleProgress / PI2) * 100);
  meterTwoValue.textContent = `${Math.round(progressPercent)}%`;
  meterTwoFill.style.width = `${progressPercent}%`;

  distValue.textContent = leftDist.toFixed(2);
  overheadValue.textContent = rightDist.toFixed(2);

  if (!isLeftExtended || !isRightExtended) {
    poseStatusBadge.className = 'status-badge status-tracking';
    statusText.textContent = 'Extend your arms straight out to begin circles!';
    targetBanner.classList.add('hidden');
    return;
  }

  if (Math.abs(leftAccumulatedAngle) >= PI2 && Math.abs(rightAccumulatedAngle) >= PI2) {
    // Both completed a circle
    leftAccumulatedAngle -= Math.sign(leftAccumulatedAngle) * PI2;
    rightAccumulatedAngle -= Math.sign(rightAccumulatedAngle) * PI2;
    
    const midPxX = ((leftWrist.x + rightWrist.x) / 2) * canvas.width;
    const midPxY = ((leftWrist.y + rightWrist.y) / 2) * canvas.height;
    incrementScore(midPxX, midPxY);
    
    poseStatusBadge.className = 'status-badge status-active';
    statusText.textContent = 'SCORED! 🙌 Keep spinning!';
    targetBanner.classList.remove('hidden');
    targetBanner.innerHTML = '<span>🙌 FULL CIRCLE COMPLETED</span>';
  } else {
    poseStatusBadge.className = 'status-badge status-tracking';
    statusText.textContent = `Circling... ${Math.round(progressPercent)}% complete`;
    targetBanner.classList.add('hidden');
  }

  // Draw any active burst particles
  updateAndDrawParticles();
}

function updateUIForNoPose() {
  distValue.textContent = '--';
  overheadValue.textContent = '--';
  meterOneValue.textContent = '0%';
  meterOneFill.style.width = '0%';
  meterTwoValue.textContent = 'NO';
  meterTwoFill.style.width = '0%';
  
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

    keyboardHintText.innerHTML = 'Press <kbd>Space</kbd> to Start Timer';
    if (!isTimerActive) {
      keyboardHintOverlay.classList.remove('hidden');
    }

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
  
  keyboardHintText.innerHTML = 'Press <kbd>C</kbd> to Start Camera';
  keyboardHintOverlay.classList.remove('hidden');
  
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
  xp = 0;
  level = 1;
  isHandsClappedAboveHead = false;
  
  if (timerValue.textContent === "TIME'S UP!") {
    timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
    updateTimerDisplay();
  }
  
  updateProgressionUI();
  scoreCard.classList.add('bounce');
  overlayScore.classList.add('bounce');
  setTimeout(() => {
    scoreCard.classList.remove('bounce');
    overlayScore.classList.remove('bounce');
  }, 300);
});

dashboardToggleBtn.addEventListener('click', () => {
  dashboardDrawer.classList.toggle('open');
});

constellationBtn.addEventListener('click', (e) => {
  // Prevent click from propagating to document
  e.stopPropagation();
  constellationDropdown.classList.toggle('hidden');
});

// Close dropdown and drawer when clicking outside
document.addEventListener('click', (e) => {
  if (!constellationBtn.contains(e.target)) {
    constellationDropdown.classList.add('hidden');
  }
  
  if (!dashboardToggleBtn.contains(e.target) && !dashboardDrawer.contains(e.target)) {
    dashboardDrawer.classList.remove('open');
  }
});

function startTimer() {
  if (isTimerActive) return;
  
  // Reset score for the challenge
  score = 0;
  scoreValue.textContent = '0';
  overlayScoreValue.textContent = '0';
  isHandsClappedAboveHead = false;
  
  timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
  isTimerActive = true;
  timerBtnText.textContent = 'Stop';
  timerDisplay.classList.remove('danger');
  keyboardHintOverlay.classList.add('hidden');
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
  if (isCameraActive) {
    keyboardHintText.innerHTML = 'Press <kbd>Space</kbd> to Start Timer';
    keyboardHintOverlay.classList.remove('hidden');
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  timerValue.textContent = `${m}:${s}`;
}

timerBtn.addEventListener('click', () => {
  if (isTimerActive) {
    stopTimer();
    timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
    updateTimerDisplay();
  } else {
    startTimer();
  }
});

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  soundToggleBtn.title = soundEnabled ? 'Audio Enabled' : 'Audio Muted';
});

timerLengthSelect.addEventListener('change', () => {
  if (!isTimerActive) {
    timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
    updateTimerDisplay();
  }
});

exerciseSelect.addEventListener('change', () => {
  currentExercise = exerciseSelect.value;
  
  if (currentExercise === 'claps') {
    meterOneLabel.textContent = 'Wrist Proximity (Clap)';
    meterOneSubtext.textContent = 'Clap when distance < 0.15';
    meterTwoLabel.textContent = 'Elevation (Y-Axis)';
    meterTwoSubtext.textContent = 'Both wrists must rise above nose (Y < Nose Y)';
    scoreHint.textContent = 'Clap both hands high above your head to score +1';
    
    instructionsClaps.classList.remove('hidden');
    instructionsCircles.classList.add('hidden');
  } else if (currentExercise === 'circles') {
    meterOneLabel.textContent = 'Arm Extension';
    meterOneSubtext.textContent = 'Keep both arms fully extended straight out';
    meterTwoLabel.textContent = 'Circle Progress';
    meterTwoSubtext.textContent = 'Complete a full 360° rotation';
    scoreHint.textContent = 'Extend your arms and make full circles to score +1';
    
    instructionsClaps.classList.add('hidden');
    instructionsCircles.classList.remove('hidden');
  }
  
  // Reset tracking states
  leftAccumulatedAngle = 0;
  rightAccumulatedAngle = 0;
  leftPrevAngle = null;
  rightPrevAngle = null;
  isHandsClappedAboveHead = false;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Prevent spacebar from scrolling the page
  if (e.code === 'Space') {
    e.preventDefault();
    if (isCameraActive) {
      if (isTimerActive) {
        stopTimer();
        timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
        updateTimerDisplay();
      } else {
        startTimer();
      }
    }
  } else if (e.key === 'c' || e.key === 'C') {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }
});

// Auto-initialize pose detector on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPoseDetector();
  updateProgressionUI();
  timeLeft = parseInt(timerLengthSelect.value, 10) || 60;
  updateTimerDisplay();
});
