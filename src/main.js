import { Pose } from '@mediapipe/pose';

/**
 * Cosmic Fit - Real-time Gamified AI Fitness Tracker
 * Uses MediaPipe Pose for high-precision real-time joint landmark tracking.
 */

// Global State
let score = 0;
let totalScore = parseInt(localStorage.getItem('cosmicfit_total_score') || '0', 10);

let level = 1;
let xp = 0;
const xpPerLevel = 1000;
const xpPerClap = 200; // Fast progression for demo

const milestonesData = [
  { id: 'aries', target: 25, name: 'ARIES', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,20 Q20,10 25,20 T35,20 M10,25 L15,20 M40,25 L35,20 M25,20 L25,40"/><circle cx="10" cy="25" r="1.5"/><circle cx="15" cy="20" r="1.5"/><circle cx="25" cy="20" r="2"/><circle cx="35" cy="20" r="1.5"/><circle cx="40" cy="25" r="1.5"/><circle cx="25" cy="40" r="1.5"/></svg>' },
  { id: 'taurus', target: 55, name: 'TAURUS', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,15 Q25,30 35,15 M25,22 L25,35 M15,35 L25,35 L35,35"/><circle cx="15" cy="15" r="1.5"/><circle cx="35" cy="15" r="1.5"/><circle cx="25" cy="22" r="2"/><circle cx="25" cy="35" r="1.5"/><circle cx="15" cy="35" r="1.5"/><circle cx="35" cy="35" r="1.5"/></svg>' },
  { id: 'gemini', target: 95, name: 'GEMINI', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,15 L35,15 M15,35 L35,35 M20,15 L20,35 M30,15 L30,35"/><circle cx="15" cy="15" r="1.5"/><circle cx="35" cy="15" r="1.5"/><circle cx="15" cy="35" r="1.5"/><circle cx="35" cy="35" r="1.5"/><circle cx="20" cy="15" r="1.5"/><circle cx="20" cy="35" r="1.5"/><circle cx="30" cy="15" r="1.5"/><circle cx="30" cy="35" r="1.5"/></svg>' },
  { id: 'cancer', target: 135, name: 'CANCER', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,20 Q25,10 35,20 M15,30 Q25,40 35,30 M20,25 L30,25"/><circle cx="15" cy="20" r="1.5"/><circle cx="35" cy="20" r="1.5"/><circle cx="15" cy="30" r="1.5"/><circle cx="35" cy="30" r="1.5"/><circle cx="20" cy="25" r="1.5"/><circle cx="30" cy="25" r="1.5"/></svg>' },
  { id: 'leo', target: 170, name: 'LEO', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,25 Q20,15 30,15 Q40,25 30,35 Q20,25 15,25 M30,15 L35,20"/><circle cx="15" cy="25" r="2"/><circle cx="30" cy="15" r="1.5"/><circle cx="30" cy="35" r="1.5"/><circle cx="40" cy="25" r="1.5"/><circle cx="35" cy="20" r="1.5"/></svg>' },
  { id: 'virgo', target: 205, name: 'VIRGO', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,20 L20,35 L25,20 L30,35 M30,35 Q35,15 40,25"/><circle cx="15" cy="20" r="1.5"/><circle cx="20" cy="35" r="1.5"/><circle cx="25" cy="20" r="1.5"/><circle cx="30" cy="35" r="2"/><circle cx="40" cy="25" r="1.5"/></svg>' },
  { id: 'libra', target: 255, name: 'LIBRA', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M10,25 L40,25 M15,20 Q25,10 35,20 L40,25 M25,14 L25,35 M15,35 L35,35"/><circle cx="10" cy="25" r="1.5"/><circle cx="40" cy="25" r="1.5"/><circle cx="15" cy="20" r="1.5"/><circle cx="35" cy="20" r="1.5"/><circle cx="25" cy="14" r="2"/><circle cx="25" cy="35" r="1.5"/><circle cx="15" cy="35" r="1.5"/><circle cx="35" cy="35" r="1.5"/></svg>' },
  { id: 'scorpius', target: 305, name: 'SCORPIUS', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M10,15 L20,15 Q30,15 30,25 Q30,35 20,35 L15,30 M30,25 L40,30 L40,20"/><circle cx="10" cy="15" r="1.5"/><circle cx="20" cy="15" r="1.5"/><circle cx="30" cy="25" r="2"/><circle cx="20" cy="35" r="1.5"/><circle cx="15" cy="30" r="1.5"/><circle cx="40" cy="30" r="1.5"/><circle cx="40" cy="20" r="1.5"/></svg>' },
  { id: 'sagittarius', target: 350, name: 'SAGITTARIUS', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,35 L35,15 M25,15 L35,15 L35,25 M20,30 L30,20"/><circle cx="15" cy="35" r="1.5"/><circle cx="35" cy="15" r="2"/><circle cx="25" cy="15" r="1.5"/><circle cx="35" cy="25" r="1.5"/><circle cx="20" cy="30" r="1.5"/><circle cx="30" cy="20" r="1.5"/></svg>' },
  { id: 'capricornus', target: 390, name: 'CAPRICORNUS', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,15 L25,35 L35,15 Q40,25 35,35"/><circle cx="15" cy="15" r="1.5"/><circle cx="25" cy="35" r="2"/><circle cx="35" cy="15" r="1.5"/><circle cx="35" cy="35" r="1.5"/></svg>' },
  { id: 'aquarius', target: 460, name: 'AQUARIUS', color: '#FA9D28', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M10,20 L15,15 L25,25 L35,15 L40,20 M10,30 L15,25 L25,35 L35,25 L40,30"/><circle cx="10" cy="20" r="1.5"/><circle cx="15" cy="15" r="1.5"/><circle cx="25" cy="25" r="1.5"/><circle cx="35" cy="15" r="1.5"/><circle cx="40" cy="20" r="1.5"/><circle cx="10" cy="30" r="1.5"/><circle cx="15" cy="25" r="1.5"/><circle cx="25" cy="35" r="2"/><circle cx="35" cy="25" r="1.5"/><circle cx="40" cy="30" r="1.5"/></svg>' },
  { id: 'pisces', target: 500, name: 'PISCES', color: '#00f2fe', iconSVG: '<svg class="sticker-svg" viewBox="0 0 50 50" width="100%" height="100%" fill="none" stroke-width="2"><path d="M15,15 L35,35 M15,35 L35,15 M15,15 Q10,25 15,35 M35,15 Q40,25 35,35"/><circle cx="15" cy="15" r="1.5"/><circle cx="35" cy="35" r="1.5"/><circle cx="15" cy="35" r="1.5"/><circle cx="35" cy="15" r="1.5"/><circle cx="25" cy="25" r="2"/></svg>' }
];

function updateProgressionUI() {
  const levelText = document.getElementById('levelText');
  const xpText = document.getElementById('xpText');
  const progressPath = document.getElementById('progressPath');
  const milestoneList = document.getElementById('milestoneList');
  const nextRewardContent = document.getElementById('nextRewardContent');
  
  // Get today's score
  let dailyScores = JSON.parse(localStorage.getItem('cosmicfit_daily_scores') || '{}');
  let todayStr = getTodayString();
  let todayScore = dailyScores[todayStr] || 0;
  
  let currentTargetIndex = milestonesData.findIndex(m => todayScore < m.target);
  let progressPercent = 1;
  let targetM = null;
  
  if (currentTargetIndex !== -1) {
    targetM = milestonesData[currentTargetIndex];
    const prevTarget = currentTargetIndex === 0 ? 0 : milestonesData[currentTargetIndex-1].target;
    const targetDiff = targetM.target - prevTarget;
    const scoreInCurrent = todayScore - prevTarget;
    progressPercent = scoreInCurrent / targetDiff;
  } else {
    currentTargetIndex = milestonesData.length - 1; // maxed out
    targetM = milestonesData[currentTargetIndex];
  }

  if(levelText) levelText.textContent = targetM.name;
  if(xpText) xpText.textContent = `${todayScore}/${targetM.target} Stars`;
  
  if(progressPath) {
    const dashOffset = 400 - (progressPercent * 400);
    progressPath.style.strokeDashoffset = dashOffset;
  }

  if (milestoneList) {
    const isFirstRender = milestoneList.children.length === 0;
    
    const rewardsScoreValue = document.getElementById('rewardsScoreValue');
    if (rewardsScoreValue) rewardsScoreValue.textContent = todayScore;

    milestonesData.forEach((m, index) => {
      const prevTarget = index === 0 ? 0 : milestonesData[index-1].target;
      const targetDifference = m.target - prevTarget;
      
      const isCompleted = todayScore >= m.target;
      const pointsInThisConstellation = Math.max(0, Math.min(todayScore - prevTarget, targetDifference));
      
      // Determine how many stars there are (circles)
      const starCount = (m.iconSVG.match(/<circle/g) || []).length;
      
      let starsLit = 0;
      if (isCompleted) {
        starsLit = starCount;
      } else if (pointsInThisConstellation > 0) {
        const percentComplete = pointsInThisConstellation / targetDifference;
        starsLit = Math.floor(percentComplete * starCount);
      }
      
      let stateClass = 'locked';
      if (isCompleted) {
        stateClass = 'completed';
      } else if (pointsInThisConstellation > 0) {
        stateClass = 'in-progress';
      }

      let item;
      if (isFirstRender) {
        // Convert hex to rgb for css variable
        const hex = m.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        item = document.createElement('div');
        item.style.setProperty('--card-accent', m.color);
        item.style.setProperty('--card-rgb', `${r}, ${g}, ${b}`);
        item.setAttribute('data-tooltip', `${m.name} (Requires ${m.target} Score)`);
        
        item.innerHTML = `
          <div class="sticker-icon">
            ${m.iconSVG}
          </div>
          <div class="sticker-name">${m.name}</div>
          <div class="sticker-progress">
            <span class="p-val">${starsLit}</span> / <span class="p-target">${starCount}</span>
          </div>
        `;
        milestoneList.appendChild(item);
      } else {
        item = milestoneList.children[index];
      }
      
      item.querySelector('.p-val').textContent = starsLit;
      item.querySelector('.p-target').textContent = starCount;
      
      // Light up the specific stars
      const circles = item.querySelectorAll('circle');
      circles.forEach((c, idx) => {
        if (idx < starsLit) {
          c.classList.add('star-lit');
        } else {
          c.classList.remove('star-lit');
        }
      });
      
      item.className = `sticker-slot ${stateClass}`;
    });

    // After updating grid, update the carousel
    if (carouselIndex === -1 || (window.lastTargetIndex !== undefined && window.lastTargetIndex !== currentTargetIndex)) {
      carouselIndex = currentTargetIndex;
    }
    window.lastTargetIndex = currentTargetIndex;
    updateCarouselUI();
  }
}
let isHandsClappedAboveHead = false;
let currentExercise = 'claps'; // 'claps' or 'circles'

// Circle State
let leftWristHistory = [];
let rightWristHistory = [];
let leftQuadrantSeq = [];
let rightQuadrantSeq = [];

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
const mobileScoreValue = document.getElementById('mobileScoreValue');
const scoreCard = document.getElementById('scoreCard');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const cameraToggleBtn = document.getElementById('cameraToggleBtn');
const cameraBtnText = document.getElementById('cameraBtnText');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundBtnText = document.getElementById('soundBtnText');

const timerBtn = document.getElementById('timerBtn');
const timerBtnText = document.getElementById('timerBtnText');
const overlayTimer = document.getElementById('overlayTimer');
const overlayTimerValue = document.getElementById('overlayTimerValue');
let timerInterval = null;
let timeLeft = 60;
let isTimerActive = false;

// Segmented controls
const segmentBtns = document.querySelectorAll('.segment-btn');
const pillBtns = document.querySelectorAll('.pill-btn');

const keyboardHintOverlay = document.getElementById('keyboardHintOverlay');
const keyboardHintText = document.getElementById('keyboardHintText');

// Sidebar Tabs
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

const rewardsScoreValue = document.getElementById('rewardsScoreValue');
const appContainer = document.getElementById('app');

const poseStatusBadge = document.getElementById('poseStatusBadge');
const statusText = document.getElementById('statusText');
const targetBanner = document.getElementById('targetBanner');
const loadingOverlay = document.getElementById('loadingOverlay');

const carouselPrevBtn = document.getElementById('carouselPrevBtn');
const carouselNextBtn = document.getElementById('carouselNextBtn');
let carouselIndex = -1; // -1 means auto-track next reward

function updateCarouselUI() {
  const nextRewardContent = document.getElementById('nextRewardContent');
  const milestoneList = document.getElementById('milestoneList');
  if (!nextRewardContent || !milestoneList || milestoneList.children.length === 0) return;
  
  if (carouselIndex < 0) carouselIndex = milestonesData.length - 1;
  if (carouselIndex >= milestonesData.length) carouselIndex = 0;
  
  const item = milestoneList.children[carouselIndex];
  nextRewardContent.innerHTML = '';
  if (item) {
    nextRewardContent.appendChild(item.cloneNode(true));
  }
}

if (carouselPrevBtn) {
  carouselPrevBtn.addEventListener('click', () => {
    carouselIndex--;
    updateCarouselUI();
  });
}
if (carouselNextBtn) {
  carouselNextBtn.addEventListener('click', () => {
    carouselIndex++;
    updateCarouselUI();
  });
}
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
const quickInstructionText = document.getElementById('quickInstructionText');

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
  // Optional: prevent scoring when timer hasn't started
  if (!isTimerActive && overlayTimerValue.textContent === "TIME'S UP!") return;
  console.log("Scoring! Current score:", score + 1);

  score += 1;
  totalScore += 1;
  localStorage.setItem('cosmicfit_total_score', totalScore.toString());
  
  scoreValue.textContent = score;
  if (mobileScoreValue) mobileScoreValue.textContent = score;
  
  updateDailyScore();
  
  if (rewardsScoreValue) {
    let dailyScores = JSON.parse(localStorage.getItem('cosmicfit_daily_scores') || '{}');
    let todayStr = getTodayString();
    rewardsScoreValue.textContent = dailyScores[todayStr] || 0;
  }
  
  // Progression
  xp += xpPerClap;
  if (xp >= xpPerLevel) {
    level += 1;
    xp -= xpPerLevel;
  }
  updateProgressionUI();
  
  // UI Animations
  scoreCard.classList.add('bounce', 'scored');
  
  setTimeout(() => {
    scoreCard.classList.remove('bounce', 'scored');
  }, 300);

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
    targetBanner.innerHTML = '<span>🙌 HALF JUMPING JACK DETECTED</span>';
  } else {
    if (!isOverhead || !isClapped) {
      isHandsClappedAboveHead = false;
    }
    targetBanner.classList.add('hidden');
    poseStatusBadge.className = 'status-badge status-tracking';

    if (isOverhead && !isClapped) {
      statusText.textContent = 'Hands Above Head! Bring wrists closer together!';
    } else if (!isOverhead && isClapped) {
      statusText.textContent = 'Wrists close, but raise hands ABOVE NOSE level!';
    } else {
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

  // Draw target height line (Visual Cue)
  const targetY = Math.min(leftShoulder.y, rightShoulder.y) * canvas.height;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, targetY);
  ctx.lineTo(canvas.width, targetY);
  ctx.strokeStyle = 'rgba(250, 157, 40, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.stroke();
  ctx.fillStyle = 'rgba(250, 157, 40, 0.8)';
  ctx.font = '16px Outfit, sans-serif';
  ctx.fillText('TARGET HEIGHT', 20, targetY - 10);
  ctx.restore();

  leftWristHistory.push({x: leftWrist.x, y: leftWrist.y});
  if (leftWristHistory.length > 30) leftWristHistory.shift();
  
  rightWristHistory.push({x: rightWrist.x, y: rightWrist.y});
  if (rightWristHistory.length > 30) rightWristHistory.shift();

  const processCircle = (history, seq, isRight) => {
    if (history.length < 15) return { progress: 0, valid: false, reason: 'Tracking...' };

    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (let p of history) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width < 0.1 || height < 0.1) {
      seq.length = 0;
      return { progress: 0, valid: false, reason: 'Make larger circles' };
    }

    const shoulderY = isRight ? rightShoulder.y : leftShoulder.y;
    if (minY > shoulderY) {
      return { progress: seq.length / 4, valid: false, reason: 'Reach above the target line!' };
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const current = history[history.length - 1];
    
    const dx = current.x - cx;
    const dy = current.y - cy;
    let quad = 0; // 0:Top, 1:Right, 2:Bottom, 3:Left
    if (Math.abs(dx) > Math.abs(dy)) {
      quad = dx > 0 ? 1 : 3;
    } else {
      quad = dy > 0 ? 2 : 0;
    }

    let complete = false;
    if (seq.length === 0) {
      seq.push(quad);
    } else {
      const lastQuad = seq[seq.length - 1];
      if (quad !== lastQuad) {
        const diff = (quad - lastQuad + 4) % 4;
        if (diff === 1 || diff === 3) {
          if (seq.length === 4 && quad === seq[0]) {
             complete = true;
             seq.length = 0;
             seq.push(quad);
          } else if (seq.includes(quad)) {
             seq.length = 0;
             seq.push(quad);
          } else {
             seq.push(quad);
          }
        } else {
           seq.length = 0;
           seq.push(quad);
        }
      }
    }
    return { progress: seq.length / 4, valid: true, complete: complete, reason: 'Circling...' };
  };

  const leftState = processCircle(leftWristHistory, leftQuadrantSeq, false);
  const rightState = processCircle(rightWristHistory, rightQuadrantSeq, true);

  const drawArc = (wrist, progress) => {
    ctx.save();
    const cx = wrist.x * canvas.width;
    const cy = wrist.y * canvas.height;
    const radius = 40;
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI/2, -Math.PI/2 + (progress * 2 * Math.PI), false);
      ctx.strokeStyle = 'rgba(250, 157, 40, 0.9)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  };

  drawArc(leftWrist, leftState.progress);
  drawArc(rightWrist, rightState.progress);

  meterOneValue.textContent = `${Math.round(leftState.progress * 100)}%`;
  meterOneFill.style.width = `${leftState.progress * 100}%`;
  meterOneFill.className = leftState.valid ? 'meter-bar-fill meter-purple' : 'meter-bar-fill meter-blue';

  meterTwoValue.textContent = `${Math.round(rightState.progress * 100)}%`;
  meterTwoFill.style.width = `${rightState.progress * 100}%`;
  meterTwoFill.className = rightState.valid ? 'meter-bar-fill meter-purple' : 'meter-bar-fill meter-blue';

  distValue.textContent = leftQuadrantSeq.length;
  overheadValue.textContent = rightQuadrantSeq.length;

  if (leftState.complete || rightState.complete) {
    leftQuadrantSeq.length = 0;
    rightQuadrantSeq.length = 0;
    
    const midPxX = ((leftWrist.x + rightWrist.x) / 2) * canvas.width;
    const midPxY = ((leftWrist.y + rightWrist.y) / 2) * canvas.height;
    incrementScore(midPxX, midPxY);
    
    poseStatusBadge.className = 'status-badge status-active';
    statusText.textContent = 'SCORED! 🙌 Keep spinning!';
    targetBanner.classList.remove('hidden');
    targetBanner.innerHTML = '<span>🙌 FULL CIRCLE COMPLETED</span>';
  } else {
    poseStatusBadge.className = leftState.valid || rightState.valid ? 'status-badge status-tracking' : 'status-badge status-idle';
    statusText.textContent = (!leftState.valid && !rightState.valid) ? leftState.reason : 'Circling...';
    targetBanner.classList.add('hidden');
  }
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
    cameraToggleBtn.classList.remove('hidden');
    
    const centerOverlay = document.getElementById('centerCameraBtnOverlay');
    if (centerOverlay) centerOverlay.classList.add('hidden');

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
  cameraBtnText.textContent = 'Stop Camera';
  cameraToggleBtn.classList.add('hidden');
    
  const centerOverlay = document.getElementById('centerCameraBtnOverlay');
  if (centerOverlay) centerOverlay.classList.remove('hidden');

  poseStatusBadge.className = 'status-badge status-idle';
  statusText.textContent = 'Camera Inactive - Click "Start Camera"';
  
  keyboardHintText.innerHTML = 'Press <kbd>C</kbd> to Start Camera';
  keyboardHintOverlay.classList.remove('hidden');
  
  updateUIForNoPose();
}

// Event Listeners
const toggleFn = () => {
  if (isCameraActive) {
    stopCamera();
  } else {
    startCamera();
  }
};
cameraToggleBtn.addEventListener('click', toggleFn);

const centerCameraBtn = document.getElementById('centerCameraBtn');
if (centerCameraBtn) {
  centerCameraBtn.addEventListener('click', toggleFn);
}

resetScoreBtn.addEventListener('click', () => {
  score = 0;
  scoreValue.textContent = '0';
  if (mobileScoreValue) mobileScoreValue.textContent = '0';
  
  if (overlayTimerValue.textContent === "TIME'S UP!") {
    const activePill = document.querySelector('.pill-btn.active');
    timeLeft = activePill ? parseInt(activePill.dataset.value, 10) : 60;
    updateTimerDisplay();
  }
});

const resetDailyBtn = document.getElementById('resetDailyBtn');
if (resetDailyBtn) {
  resetDailyBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to reset all your daily progress and constellations?')) {
      totalScore = 0;
      localStorage.setItem('cosmicfit_total_score', '0');
      localStorage.removeItem('cosmicfit_daily_scores');
      
      const rewardsScoreValue = document.getElementById('rewardsScoreValue');
      if (rewardsScoreValue) rewardsScoreValue.textContent = '0';
      
      xp = 0;
      level = 1;
      
      updateProgressionUI();
      renderCalendar();
    }
  });
}

// Tab Switching Logic
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    sidebarTabs.forEach(t => t.classList.remove('active', 'aria-selected'));
    tab.setAttribute('aria-selected', 'true');
    tab.classList.add('active');
    
    // Hide all panels
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      panel.classList.add('hidden');
    });
    
    // Show target panel
    const targetId = tab.dataset.target;
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
      targetPanel.classList.add('active');
    }
  });
});

function startTimer() {
  if (isTimerActive) return;
  
  // Reset score for the challenge
  score = 0;
  scoreValue.textContent = '0';
  if (mobileScoreValue) mobileScoreValue.textContent = '0';
  if (rewardsScoreValue) rewardsScoreValue.textContent = '0';
  isHandsClappedAboveHead = false;
  
  // Get time from active pill
  const activePill = document.querySelector('.pill-btn.active');
  timeLeft = activePill ? parseInt(activePill.dataset.value, 10) : 60;
  
  isTimerActive = true;
  timerBtnText.textContent = 'Stop Timer';
  overlayTimer.classList.remove('hidden');
  overlayTimer.classList.remove('danger');
  keyboardHintOverlay.classList.add('hidden');
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 10) {
      overlayTimer.classList.add('danger');
    }
    
    if (timeLeft <= 0) {
      stopTimer(true);
      overlayTimerValue.textContent = "TIME'S UP!";
    }
  }, 1000);
}

function stopTimer(isNaturalEnd = false) {
  isTimerActive = false;
  clearInterval(timerInterval);
  timerBtnText.textContent = 'Start Timer';
  overlayTimer.classList.add('hidden');
  overlayTimer.classList.remove('danger');
  
  if (isNaturalEnd) {
    const timerEndOverlay = document.getElementById('timerEndOverlay');
    const timerEndText = document.getElementById('timerEndText');
    if (timerEndOverlay && timerEndText) {
      timerEndText.textContent = score;
      timerEndOverlay.classList.remove('hidden');
      setTimeout(() => {
        timerEndOverlay.classList.add('hidden');
      }, 3000);
    }
  }
  
  if (isCameraActive && !isNaturalEnd) {
    keyboardHintText.innerHTML = 'Press <kbd>Space</kbd> to Start Timer';
    keyboardHintOverlay.classList.remove('hidden');
  } else if (isCameraActive && isNaturalEnd) {
    setTimeout(() => {
      keyboardHintText.innerHTML = 'Press <kbd>Space</kbd> to Start Timer';
      keyboardHintOverlay.classList.remove('hidden');
    }, 3000);
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  overlayTimerValue.textContent = `${m}:${s}`;
}

timerBtn.addEventListener('click', () => {
  if (isTimerActive) {
    stopTimer();
    const activePill = document.querySelector('.pill-btn.active');
    timeLeft = activePill ? parseInt(activePill.dataset.value, 10) : 60;
    updateTimerDisplay();
  } else {
    startTimer();
  }
});

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtnText.textContent = soundEnabled ? 'Audio On' : 'Audio Off';
  soundToggleBtn.title = soundEnabled ? 'Audio Enabled' : 'Audio Muted';
});

pillBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isTimerActive) return; // Prevent changing time while running
    
    pillBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    timeLeft = parseInt(btn.dataset.value, 10) || 60;
    updateTimerDisplay();
  });
});

segmentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    segmentBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentExercise = btn.dataset.value;
    
    if (currentExercise === 'claps') {
      meterOneLabel.textContent = 'Wrist Proximity (Jumping Jack)';
      meterOneSubtext.textContent = 'Hands together when distance < 0.15';
      meterTwoLabel.textContent = 'Elevation (Y-Axis)';
      meterTwoSubtext.textContent = 'Both wrists must rise above nose (Y < Nose Y)';
      scoreHint.textContent = 'Perform a half jumping jack to score +1';
      if (quickInstructionText) quickInstructionText.textContent = 'Start with hands at your sides, then bring both hands together high above your head to score.';
      
      instructionsClaps.classList.remove('hidden');
      instructionsCircles.classList.add('hidden');
    } else if (currentExercise === 'circles') {
      meterOneLabel.textContent = 'Arm Extension';
      meterOneSubtext.textContent = 'Keep both arms fully extended straight out';
      meterTwoLabel.textContent = 'Circle Progress';
      meterTwoSubtext.textContent = 'Complete a full 360° rotation';
      scoreHint.textContent = 'Extend your arms and make full circles to score +1';
      if (quickInstructionText) quickInstructionText.textContent = 'Extend arms straight out. Draw large circles in the air, ensuring your hands reach above the glowing target line.';
      
      instructionsClaps.classList.add('hidden');
      instructionsCircles.classList.remove('hidden');
    }
    
    // Reset tracking states
    leftWristHistory.length = 0;
    rightWristHistory.length = 0;
    leftQuadrantSeq.length = 0;
    rightQuadrantSeq.length = 0;
    isHandsClappedAboveHead = false;
  });
});
// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Prevent spacebar from scrolling the page
  if (e.code === 'Space') {
    e.preventDefault();
    if (isCameraActive) {
      if (isTimerActive) {
        stopTimer();
        const activePill = document.querySelector('.pill-btn.active');
        timeLeft = activePill ? parseInt(activePill.dataset.value, 10) : 60;
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
  const activePill = document.querySelector('.pill-btn.active');
  timeLeft = activePill ? parseInt(activePill.dataset.value, 10) : 60;
  updateTimerDisplay();
  
  // Render calendar on load
  let scores = JSON.parse(localStorage.getItem('cosmicfit_daily_scores') || '{}');
  renderCalendar(scores);
});

// Daily Scoring & Calendar
const DAILY_GOAL = 100;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function updateDailyScore() {
  const today = getTodayString();
  let scores = JSON.parse(localStorage.getItem('cosmicfit_daily_scores') || '{}');
  
  if (!scores[today]) {
    scores[today] = 0;
  }
  
  scores[today] += 1;
  localStorage.setItem('cosmicfit_daily_scores', JSON.stringify(scores));
  
  renderCalendar(scores);
}

function renderCalendar(scores) {
  const calendarGrid = document.getElementById('calendarGrid');
  const dailyGoalText = document.getElementById('dailyGoalText');
  if (!calendarGrid || !dailyGoalText) return;
  
  const todayStr = getTodayString();
  const todayScore = scores[todayStr] || 0;
  
  dailyGoalText.textContent = `Today: ${todayScore} / ${DAILY_GOAL} Points`;
  
  calendarGrid.innerHTML = '';
  
  const todayDate = new Date();
  const daysToRender = 35; // 5 weeks
  
  const startDate = new Date(todayDate);
  startDate.setDate(todayDate.getDate() - daysToRender + 1);
  
  for (let i = 0; i < daysToRender; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const s = scores[dateStr] || 0;
    
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.setAttribute('data-tooltip', `${d.toDateString()}: ${s} Points`);
    
    cell.textContent = d.getDate();
    
    if (s >= DAILY_GOAL) {
      cell.classList.add('completed');
    } else if (s > 0) {
      cell.classList.add('partial');
    }
    
    calendarGrid.appendChild(cell);
  }
}

// --- Mascot Personalization Logic ---
function initMascot() {
  const username = localStorage.getItem('cosmicfit_username');
  if (!username) {
    // Show Modal
    const modal = document.getElementById('namePromptModal');
    const input = document.getElementById('namePromptInput');
    const submit = document.getElementById('namePromptSubmit');
    
    if(modal) modal.classList.remove('hidden');
    
    if(submit) {
      submit.addEventListener('click', () => {
        const val = input.value.trim();
        if(val) {
          localStorage.setItem('cosmicfit_username', val);
          modal.classList.add('hidden');
          triggerMascotGreeting(val, true);
        }
      });
    }
    
    const presetBtns = document.querySelectorAll('.name-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.textContent.trim();
        localStorage.setItem('cosmicfit_username', val);
        modal.classList.add('hidden');
        triggerMascotGreeting(val, true);
      });
    });
  } else {
    // Wait a little bit on load before popping up
    setTimeout(() => {
      triggerMascotGreeting(username, false);
    }, 1000);
  }
}

function triggerMascotGreeting(name, isFirstTime) {
  const container = document.getElementById('mascotContainer');
  const speechBubble = document.getElementById('mascotSpeechBubble');
  const greetingText = document.getElementById('mascotGreetingText');
  
  if(!container || !speechBubble || !greetingText) return;
  
  if(isFirstTime) {
    greetingText.textContent = `Welcome, ${name}! Ready to map the stars?`;
  } else {
    greetingText.textContent = `Welcome back, ${name}!`;
  }
  
  // Start the swoosh in
  container.classList.add('swoosh-in');
  
  // Pop the bubble after it lands (animation is 1.5s)
  setTimeout(() => {
    speechBubble.classList.add('show');
  }, 1500);
  
  // Hide everything after 6 seconds
  setTimeout(() => {
    speechBubble.classList.remove('show');
    container.classList.remove('swoosh-in');
    container.classList.add('swoosh-out');
    
    // Clean up classes after swoop out
    setTimeout(() => {
      container.classList.remove('swoosh-out');
    }, 1000);
  }, 6000);
}

// --- Settings & Data Management Logic ---
function initSettings() {
  const settingsBtn = document.getElementById('settingsBtn');
  const modal = document.getElementById('settingsModal');
  const closeBtn = document.getElementById('settingsCloseBtn');
  const updateNameBtn = document.getElementById('settingsUpdateNameBtn');
  const nameInput = document.getElementById('settingsNameInput');
  const exportBtn = document.getElementById('settingsExportBtn');
  const importInput = document.getElementById('settingsImportInput');

  if(settingsBtn && modal) {
    settingsBtn.addEventListener('click', () => {
      nameInput.value = localStorage.getItem('cosmicfit_username') || '';
      modal.classList.remove('hidden');
    });
  }

  if(closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if(updateNameBtn) {
    updateNameBtn.addEventListener('click', () => {
      const val = nameInput.value.trim();
      if(val) {
        localStorage.setItem('cosmicfit_username', val);
        triggerMascotGreeting(val, false);
        modal.classList.add('hidden');
      }
    });
  }

  if(exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        username: localStorage.getItem('cosmicfit_username'),
        scores: localStorage.getItem('cosmicfit_daily_scores')
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cosmicfit_data.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if(importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if(data.username) localStorage.setItem('cosmicfit_username', data.username);
          if(data.scores) localStorage.setItem('cosmicfit_daily_scores', data.scores);
          alert('Data imported successfully! The page will now reload.');
          location.reload();
        } catch(err) {
          alert('Invalid file format. Please upload a valid Cosmic Fit data file.');
        }
      };
      reader.readAsText(file);
    });
  }
}

// Call initMascot on load
window.addEventListener('DOMContentLoaded', () => {
  initMascot();
  initSettings();
});
