import './style.css';
import { navigate, replace } from './basePath.js';

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCuAI4m5FNuytnr1EDnOBWGNnhmHwl11fk",
  authDomain: "videostreamingapp-762d0.firebaseapp.com",
  projectId: "videostreamingapp-762d0",
  storageBucket: "videostreamingapp-762d0.firebasestorage.app",
  messagingSenderId: "714396818673",
  appId: "1:714396818673:web:eec312ae942b20d0d45d50",
  measurementId: "G-BXW33D4E3W"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let pc = null;
let pc2 = null;
let localStream = null;
let callDoc = null;
let sessionDoc = null;
let activeSignalingVersion = 1;
let currentExerciseValue = '';

const hangupButton = document.getElementById('hangupButton');
const hangupButtonAlt = document.getElementById('hangupButtonAlt');
const localVideo = document.getElementById('localVideo');
const sessionSection = document.getElementById('sessionSection');
const clientRepCount = document.getElementById('clientRepCount');
const clientRepCounter = clientRepCount; // live feed uses the big number directly
const clientSummaryPanel = document.getElementById('clientSummaryPanel');
const summaryContent = document.getElementById('summaryContent');
const closeSummaryButton = document.getElementById('closeSummaryButton');
const clientSetNotification = document.getElementById('clientSetNotification');
const notificationText = document.getElementById('notificationText');
const notificationIcon = document.getElementById('notificationIcon');
const setStatusIndicator = document.getElementById('setStatusIndicator');
const seeSummaryButton = document.getElementById('seeSummaryButton');
const summaryModalOverlay = document.getElementById('summaryModalOverlay');
const allSummariesContent = document.getElementById('allSummariesContent');
const closeSummaryModalButton = document.getElementById('closeSummaryModalButton');
const utilityMenuButton = document.getElementById('utilityMenuButton');
const utilityMenuPopup = document.getElementById('utilityMenuPopup');
const lfExerciseName = document.getElementById('lfExerciseName');
const lfBlockLabel = document.getElementById('lfBlockLabel');
const lfElapsed = document.getElementById('lfElapsed');
const lfSparkline = document.getElementById('lfSparkline');

// ── Elapsed timer ──────────────────────────────────────────────────────────
let elapsedSeconds = 0;
let elapsedInterval = null;

function startElapsedTimer() {
  if (elapsedInterval) return;
  elapsedInterval = setInterval(() => {
    elapsedSeconds += 1;
    if (lfElapsed) {
      const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const ss = String(elapsedSeconds % 60).padStart(2, '0');
      lfElapsed.textContent = `${mm}:${ss}`;
    }
  }, 1000);
}

function stopElapsedTimer() {
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
}

function resetElapsedTimer() {
  stopElapsedTimer();
  elapsedSeconds = 0;
  if (lfElapsed) lfElapsed.textContent = '00:00';
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function updateSparkline(repCount) {
  if (!lfSparkline) return;
  lfSparkline.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const bar = document.createElement('div');
    bar.className = 'lf-spark-bar' + (i < Math.min(repCount, 14) ? ' lf-spark-bar--lit' : '');
    const heightPct = 30 + ((i * 37 + repCount * 11) % 60);
    bar.style.height = heightPct + '%';
    lfSparkline.appendChild(bar);
  }
}

// ── Exercise display ───────────────────────────────────────────────────────
function updateExerciseDisplay(name) {
  if (lfExerciseName) lfExerciseName.textContent = name || '—';
  if (lfBlockLabel) lfBlockLabel.textContent = (name || 'EXERCISE').toUpperCase();
}

updateSparkline(0);

const exerciseNames = {
  'bench-press':      'Bench Press',
  'incline-dumbbell': 'Incline Dumbbell',
  'shoulder-press':   'Shoulder Press',
  'lat-pulldown':     'Lat Pulldown',
  'deadlift':         'Deadlift',
  'barbell-rows':     'Barbell Rows',
  'squats':           'Squats',
};

function getExerciseNameFromValue(value) {
  return exerciseNames[value] || 'Unknown Exercise';
}

function getExerciseValueFromName(exerciseName) {
  if (!exerciseName) return '';
  // Direct name lookup
  const direct = Object.keys(exerciseNames).find(k => exerciseNames[k] === exerciseName);
  if (direct) return direct;
  // Already a value key
  if (exerciseNames[exerciseName]) return exerciseName;
  // Partial match fallback
  const n = exerciseName.toLowerCase();
  if (n.includes('bench'))     return 'bench-press';
  if (n.includes('incline'))   return 'incline-dumbbell';
  if (n.includes('shoulder'))  return 'shoulder-press';
  if (n.includes('lat') || n.includes('pulldown')) return 'lat-pulldown';
  if (n.includes('deadlift'))  return 'deadlift';
  if (n.includes('barbell') || n.includes('row')) return 'barbell-rows';
  if (n.includes('squat'))     return 'squats';
  return '';
}

const sessionStatusOverlay = document.getElementById('sessionStatusOverlay');
const sessionStatusLabel   = document.getElementById('sessionStatusLabel');
const sessionStatusTitle   = document.getElementById('sessionStatusTitle');
const sessionStatusDismiss = document.getElementById('sessionStatusDismiss');

// Transient loading messages shown as sheet; errors require dismissal
const SILENT_STATUSES = new Set(['Starting workout...', 'Connecting...', 'Connected to coach', 'Client connected']);

function showStatus(message, type = 'info') {
  if (SILENT_STATUSES.has(message)) return;

  if (!sessionStatusOverlay) return;
  const isError = type === 'error';
  const isReconnect = message.toLowerCase().includes('reconnect');

  sessionStatusLabel.textContent = isError ? 'ERROR' : isReconnect ? 'PLEASE WAIT' : 'INFO';
  sessionStatusTitle.textContent = message;
  sessionStatusDismiss.classList.toggle('hidden', !isError);
  sessionStatusOverlay.classList.remove('hidden');

  if (isError) {
    sessionStatusDismiss.onclick = () => sessionStatusOverlay.classList.add('hidden');
  } else {
    // Auto-dismiss non-error sheets after 4s
    setTimeout(() => sessionStatusOverlay.classList.add('hidden'), 4000);
  }
}

function initPeerConnection() {
  pc = new RTCPeerConnection(servers);

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'connected') {
      showStatus('Connected to coach', 'success');
    } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      showStatus('Connection lost', 'error');
    }
  };
}

async function waitForFreshOffer(previousVersion) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('Timed out waiting for the coach to refresh the session.'));
    }, 15000);

    const unsubscribe = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!data || !data.offer) return;

      const nextVersion = data.signalingVersion || 1;
      if (nextVersion > previousVersion) {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(data);
      }
    }, (error) => {
      window.clearTimeout(timeout);
      unsubscribe();
      reject(error);
    });
  });
}

function updateClientRepCount(count) {
  if (clientRepCount) {
    clientRepCount.textContent = count;
  }
  updateSparkline(count);
}

function updateClientExercise(exerciseName) {
  const nextValue = getExerciseValueFromName(exerciseName);
  if (nextValue) {
    currentExerciseValue = nextValue;
    localStorage.setItem('clientSelectedExercise', nextValue);
  }
  updateExerciseDisplay(exerciseName || getExerciseNameFromValue(nextValue));
}

function syncClientExercise(exercise) {
  if (!callDoc) return;

  currentExerciseValue = exercise;
  localStorage.setItem('clientSelectedExercise', exercise);

  callDoc.set({
    currentExercise: getExerciseNameFromValue(exercise),
    exerciseUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch((error) => {
    console.error('Error syncing exercise:', error);
  });
}

function updateClientSummary(summary) {
  if (!summaryContent) return;

  if (summary.length === 0) {
    summaryContent.innerHTML = '<p class="no-summary-message">No feedback yet</p>';
    clientSummaryPanel.classList.add('hidden');
    return;
  }

  clientSummaryPanel.classList.remove('hidden');
  summaryContent.innerHTML = '';

  const summaryList = document.createElement('ul');
  summaryList.className = 'summary-list';

  summary.forEach((feedback, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'summary-item';
    listItem.textContent = `${index + 1}. ${feedback}`;
    summaryList.appendChild(listItem);
  });

  summaryContent.appendChild(summaryList);
}

function showSetNotification(message, icon, type) {
  if (!clientSetNotification || !notificationText || !notificationIcon) return;

  notificationText.textContent = message;
  notificationIcon.textContent = icon;
  clientSetNotification.className = `client-set-notification ${type}`;
  clientSetNotification.classList.remove('hidden');

  setTimeout(() => {
    clientSetNotification.classList.add('hidden');
  }, 3000);
}

let lastSetStatusTimestamp = null;
function handleSetStatusChange(status, timestamp, summary) {
  if (lastSetStatusTimestamp && timestamp && timestamp.toMillis) {
    const timestampMs = timestamp.toMillis();
    if (lastSetStatusTimestamp === timestampMs) {
      return;
    }
    lastSetStatusTimestamp = timestampMs;
  } else if (timestamp && timestamp.toMillis) {
    lastSetStatusTimestamp = timestamp.toMillis();
  }

  if (status === 'started') {
    if (setStatusIndicator) {
      setStatusIndicator.classList.remove('hidden');
    }
    if (clientRepCounter) {
      clientRepCounter.classList.add('set-active');
    }
    resetElapsedTimer();
    startElapsedTimer();
    speakFeedback('Set started. Begin your exercise.');
  } else if (status === 'ended') {
    if (setStatusIndicator) {
      setStatusIndicator.classList.add('hidden');
    }
    if (clientRepCounter) {
      clientRepCounter.classList.remove('set-active');
    }
    resetElapsedTimer();
    speakFeedback('Set ended. Great work!');

    if (summary && Array.isArray(summary) && summary.length > 0) {
      const currentExercise = getExerciseNameFromValue(currentExerciseValue);
      const currentReps = clientRepCount ? parseInt(clientRepCount.textContent, 10) || 0 : 0;

      updateClientSummary(summary);
      window.sessionStorage.setItem('latestSetSummary', JSON.stringify(summary));

      const existing = JSON.parse(window.sessionStorage.getItem('allSessionSummaries') || '[]');
      existing.push({
        exercise: currentExercise,
        reps: currentReps,
        feedback: summary,
        timestamp: new Date().toISOString()
      });
      window.sessionStorage.setItem('allSessionSummaries', JSON.stringify(existing));
    }
  }
}

function handleSessionEnded() {
  showSetNotification('Session Ended', 'Coach has ended the session', 'end');
  speakFeedback('Session ended by coach. Thank you for your workout!');
  showStatus('Session ended by coach', 'info');

  if (hangupButton) {
    const btnText = hangupButton.querySelector('.btn-text');
    if (btnText) {
      btnText.textContent = 'Session Ended';
    }
    hangupButton.disabled = true;
  }

}

function leaveSession() {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (pc) {
    pc.close();
    pc = null;
  }
  if (pc2) {
    pc2.close();
    pc2 = null;
  }

  localStorage.removeItem('clientSelectedExercise');
  navigate('client.html');
}

// ── Audio (ElevenLabs via /api/tts) ───────────────────────────────────────
// iOS blocks audio playback outside user gestures entirely. We try to unlock
// playback on tap, then fall back to queueing the generated MP3 for the next tap.
let audioElement = null;
let audioUnlocked = false;
let pendingSpeech = null;
let pendingAudioUrl = null;
let isSpeaking = false;

// Non-iOS path still uses Web Audio API
let audioCtx = null;

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function ensureAudioElement() {
  if (audioElement) return audioElement;
  audioElement = new Audio();
  audioElement.preload = 'auto';
  audioElement.setAttribute('playsinline', '');
  audioElement.setAttribute('webkit-playsinline', '');
  return audioElement;
}

async function playPendingAudioFromGesture() {
  if (!pendingAudioUrl) return false;

  const url = pendingAudioUrl;
  pendingAudioUrl = null;

  try {
    const el = ensureAudioElement();
    el.pause();
    el.src = url;
    el.muted = false;
    el.volume = 1;
    await el.play();
    isSpeaking = true;
    audioUnlocked = true;
    console.log('[TTS] pending iOS audio started from user gesture');
    return true;
  } catch (err) {
    pendingAudioUrl = url;
    console.warn('[TTS] pending iOS audio still blocked:', err);
    return false;
  }
}

async function unlockAudio() {
  if (pendingAudioUrl) {
    await playPendingAudioFromGesture();
    return;
  }

  if (audioUnlocked) return;
  try {
    const el = ensureAudioElement();

    // Create and immediately play a silent audio element to unlock iOS.
    // Only mark unlocked if Safari actually accepts the play request.
    el.muted = true;
    el.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////8AAAA8AAAA/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/84TQAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADhgD///////////////////////////////////////////////////////////8AAAAA/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/84TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    await el.play();
    el.pause();
    el.muted = false;
    audioUnlocked = true;

    // Also unlock Web Audio for non-iOS
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume().catch(() => {});
    } catch (_) {}
    if (pendingSpeech) {
      const msg = pendingSpeech;
      pendingSpeech = null;
      speakFeedback(msg);
    }
  } catch (err) {
    audioUnlocked = false;
    console.warn('[TTS] audio unlock blocked:', err);
    if (pendingSpeech && isIOSDevice()) {
      const msg = pendingSpeech;
      pendingSpeech = null;
      audioUnlocked = true;
      speakFeedback(msg);
    }
  }
}

document.addEventListener('touchstart', unlockAudio, { passive: true });
document.addEventListener('click',      unlockAudio);

async function speakFeedback(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') return;

  console.log('[TTS] speakFeedback called, audioUnlocked=', audioUnlocked, 'isSpeaking=', isSpeaking, 'msg=', message.slice(0, 40));

  if (!audioUnlocked) {
    console.log('[TTS] not unlocked, queuing');
    pendingSpeech = message;
    return;
  }

  if (isSpeaking) {
    console.log('[TTS] already speaking, queuing');
    pendingSpeech = message;
    return;
  }

  try {
    isSpeaking = true;

    console.log('[TTS] fetching /api/tts');
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    console.log('[TTS] response status:', res.status);
    if (!res.ok) throw new Error(`TTS API ${res.status}`);

    const { audioContent } = await res.json();
    console.log('[TTS] got audioContent, length=', audioContent?.length);

    const binary = atob(audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const isIOS = isIOSDevice();
    console.log('[TTS] isIOS=', isIOS);

    if (isIOS) {
      // iOS: use a real media element and queue the MP3 if Safari requires a tap.
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const el = ensureAudioElement();
      el.pause();
      el.src = url;
      el.muted = false;
      el.volume = 1;
      el.onended = () => {
        console.log('[TTS] audio ended (iOS)');
        URL.revokeObjectURL(url);
        isSpeaking = false;
        if (pendingSpeech) {
          const next = pendingSpeech;
          pendingSpeech = null;
          speakFeedback(next);
        }
      };
      console.log('[TTS] calling audioElement.play()');
      try {
        await el.play();
        audioUnlocked = true;
        console.log('[TTS] audioElement.play() resolved');
      } catch (err) {
        console.warn('[TTS] iOS blocked async audio playback; waiting for tap:', err);
        if (pendingAudioUrl && pendingAudioUrl !== url) URL.revokeObjectURL(pendingAudioUrl);
        pendingAudioUrl = url;
        pendingSpeech = null;
        isSpeaking = false;
        showStatus('Tap the screen to hear coach feedback.', 'info');
        return;
      }
      setTimeout(() => { isSpeaking = false; }, 15000);
    } else {
      // Non-iOS: use Web Audio API
      let ctx = audioCtx;
      if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      console.log('[TTS] AudioContext state=', ctx.state);
      const decoded = await ctx.decodeAudioData(bytes.buffer);
      console.log('[TTS] decoded audio, duration=', decoded.duration);
      const source  = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.onended = () => {
        console.log('[TTS] audio ended');
        isSpeaking = false;
        if (pendingSpeech) {
          const next = pendingSpeech;
          pendingSpeech = null;
          speakFeedback(next);
        }
      };
      source.start(0);
      console.log('[TTS] source.start() called');
      setTimeout(() => { isSpeaking = false; }, 15000);
    }
  } catch (err) {
    console.error('[TTS] ElevenLabs TTS failed:', err);
    isSpeaking = false;
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(message);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }
}

async function showAllSummaries() {
  if (!allSummariesContent || !summaryModalOverlay || !sessionDoc) return;

  allSummariesContent.innerHTML = '<p class="no-summary-message">Loading summary...</p>';
  summaryModalOverlay.classList.remove('hidden');

  try {
    const snapshot = await firestore
      .collection('sessions')
      .doc(sessionDoc.id)
      .collection('exerciseSets')
      .orderBy('completedAt', 'asc')
      .get();

    if (snapshot.empty) {
      allSummariesContent.innerHTML = '<p class="no-summary-message">No sets completed yet</p>';
      return;
    }

    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'all-summaries-container';

    snapshot.docs.forEach((doc, index) => {
      const setData = doc.data();
      const setCard = document.createElement('div');
      setCard.className = 'set-summary-card';

      const duration = setData.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      const scoreText = setData.coachScore !== null && setData.coachScore !== undefined
        ? `${setData.coachScore}/10`
        : 'No score';

      setCard.innerHTML = `
        <div class="set-summary-header">
          <div class="set-number">Set ${index + 1}</div>
          <div class="set-exercise">${setData.exerciseName || 'Unknown Exercise'}</div>
          <div class="set-reps">${setData.actualReps || 0} reps</div>
        </div>
        <div class="set-summary-details">
          <div class="set-detail-item">
            <span class="detail-label">Score:</span>
            <span class="detail-value">${scoreText}</span>
          </div>
          <div class="set-detail-item">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${durationText}</span>
          </div>
        </div>
      `;

      const feedbackList = document.createElement('ul');
      feedbackList.className = 'set-feedback-list';

      if (setData.coachFeedback && Array.isArray(setData.coachFeedback) && setData.coachFeedback.length > 0) {
        setData.coachFeedback.forEach((feedback, feedbackIndex) => {
          const feedbackItem = document.createElement('li');
          feedbackItem.className = 'set-feedback-item';
          feedbackItem.textContent = `${feedbackIndex + 1}. ${feedback}`;
          feedbackList.appendChild(feedbackItem);
        });
      } else {
        const noFeedbackItem = document.createElement('li');
        noFeedbackItem.className = 'set-feedback-item no-feedback';
        noFeedbackItem.textContent = 'No feedback provided';
        feedbackList.appendChild(noFeedbackItem);
      }

      setCard.appendChild(feedbackList);

      if (setData.notes && setData.notes.trim()) {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'set-notes';
        notesDiv.innerHTML = `
          <div class="notes-label">Notes:</div>
          <div class="notes-text">${setData.notes}</div>
        `;
        setCard.appendChild(notesDiv);
      }

      summaryContainer.appendChild(setCard);
    });

    allSummariesContent.innerHTML = '';
    allSummariesContent.appendChild(summaryContainer);
  } catch (error) {
    console.error('Error loading summaries:', error);
    allSummariesContent.innerHTML = '<p class="no-summary-message">Error loading summary. Please try again.</p>';
  }
}

if (closeSummaryButton) {
  closeSummaryButton.addEventListener('click', () => {
    clientSummaryPanel.classList.add('hidden');
  });
}

// ── Three-dot bottom sheet ─────────────────────────────────────────────────
const switchExerciseButton = document.getElementById('switchExerciseButton');
const closeUtilitySheet    = document.getElementById('closeUtilitySheet');
const exercisePicker       = document.getElementById('exercisePicker');
const exercisePickerList   = document.getElementById('exercisePickerList');

function openUtilitySheet() {
  if (!utilityMenuPopup) return;
  // Reset to main options view
  if (exercisePicker) exercisePicker.classList.add('hidden');
  const optionsList = document.getElementById('utilityOptionsList');
  if (optionsList) optionsList.classList.remove('hidden');
  utilityMenuPopup.classList.remove('hidden');
}

function closeUtilitySheetFn() {
  if (utilityMenuPopup) utilityMenuPopup.classList.add('hidden');
}

if (utilityMenuButton) {
  utilityMenuButton.addEventListener('click', openUtilitySheet);
}

if (closeUtilitySheet) {
  closeUtilitySheet.addEventListener('click', closeUtilitySheetFn);
}

if (seeSummaryButton) {
  seeSummaryButton.addEventListener('click', () => {
    closeUtilitySheetFn();
    showAllSummaries();
  });
}

if (switchExerciseButton) {
  switchExerciseButton.addEventListener('click', () => {
    // Hide options list, show exercise picker
    const optionsList = document.getElementById('utilityOptionsList');
    if (optionsList) optionsList.classList.add('hidden');
    if (!exercisePicker || !exercisePickerList) return;

    // Build list from saved order
    const savedOrder = JSON.parse(localStorage.getItem('clientExerciseOrder') || '[]');
    exercisePickerList.innerHTML = '';

    savedOrder.forEach((id, idx) => {
      const name = exerciseNames[id] || id;
      const isCurrent = id === currentExerciseValue;
      const btn = document.createElement('button');
      btn.className = 'lf-picker-item' + (isCurrent ? ' lf-picker-item--active' : '');
      btn.innerHTML = `<span class="lf-picker-rank">${idx + 1}</span><span>${name}</span>${isCurrent ? '<span class="lf-picker-check">✓</span>' : ''}`;
      btn.addEventListener('click', () => {
        syncClientExercise(id);
        updateExerciseDisplay(name);
        closeUtilitySheetFn();
      });
      exercisePickerList.appendChild(btn);
    });

    exercisePicker.classList.remove('hidden');
  });
}

if (closeSummaryModalButton) {
  closeSummaryModalButton.addEventListener('click', () => {
    if (summaryModalOverlay) summaryModalOverlay.classList.add('hidden');
  });
}

if (summaryModalOverlay) {
  summaryModalOverlay.addEventListener('click', (e) => {
    if (e.target === summaryModalOverlay) summaryModalOverlay.classList.add('hidden');
  });
}

// ── End session confirmation modal ────────────────────────────────────────
const endSessionOverlay = document.getElementById('endSessionOverlay');
const keepGoingBtn      = document.getElementById('keepGoingBtn');
const confirmEndBtn     = document.getElementById('confirmEndBtn');

function openEndSheet() {
  if (endSessionOverlay) endSessionOverlay.classList.remove('hidden');
}

// "Next Exercise" button opens the utility sheet directly on the exercise picker
if (hangupButton) {
  hangupButton.onclick = () => {
    openUtilitySheet();
    // Immediately show the exercise picker, skip the options list
    const optionsList = document.getElementById('utilityOptionsList');
    if (optionsList) optionsList.classList.add('hidden');
    if (!exercisePicker || !exercisePickerList) return;
    const savedOrder = JSON.parse(localStorage.getItem('clientExerciseOrder') || '[]');
    exercisePickerList.innerHTML = '';
    savedOrder.forEach((id, idx) => {
      const name = exerciseNames[id] || id;
      const isCurrent = id === currentExerciseValue;
      const btn = document.createElement('button');
      btn.className = 'lf-picker-item' + (isCurrent ? ' lf-picker-item--active' : '');
      btn.innerHTML = `<span class="lf-picker-rank">${idx + 1}</span><span>${name}</span>${isCurrent ? '<span class="lf-picker-check">✓</span>' : ''}`;
      btn.addEventListener('click', () => {
        syncClientExercise(id);
        updateExerciseDisplay(name);
        closeUtilitySheetFn();
      });
      exercisePickerList.appendChild(btn);
    });
    exercisePicker.classList.remove('hidden');
  };
}

// "Leave session" inside the three-dot sheet opens the end confirmation
if (hangupButtonAlt) hangupButtonAlt.onclick = () => {
  closeUtilitySheetFn();
  openEndSheet();
};

if (keepGoingBtn) {
  keepGoingBtn.onclick = () => {
    if (endSessionOverlay) endSessionOverlay.classList.add('hidden');
  };
}

if (confirmEndBtn) {
  confirmEndBtn.onclick = () => {
    if (endSessionOverlay) endSessionOverlay.classList.add('hidden');
    leaveSession();
  };
}

// ── Camera setup + Set Cam button ─────────────────────────────────────────
const setCamBtn        = document.getElementById('setCamBtn');
const camStatusDot     = document.getElementById('camStatusDot');
const camSetupOverlay  = document.getElementById('camSetupOverlay');
const camSetupDoneBtn  = document.getElementById('camSetupDoneBtn');
const camNotifyOverlay  = document.getElementById('camNotifyOverlay');
const camNotifyLabel    = document.getElementById('camNotifyLabel');
const camNotifyTitle    = document.getElementById('camNotifyTitle');
const camNotifyBody     = document.getElementById('camNotifyBody');
const camNotifyDismiss  = document.getElementById('camNotifyDismiss');

let camNotifyTimer = null;
let lastSeenCamStatus = null; // tracks last processed camStatus to avoid re-triggering on unrelated snapshots

function showCamNotify(label, title, body, autoDismissMs = 0) {
  if (camNotifyLabel) camNotifyLabel.textContent = label;
  if (camNotifyTitle) camNotifyTitle.textContent = title;
  if (camNotifyBody)  camNotifyBody.textContent  = body;
  if (camNotifyOverlay) camNotifyOverlay.classList.remove('hidden');
  if (camNotifyTimer) clearTimeout(camNotifyTimer);
  if (autoDismissMs > 0) {
    camNotifyTimer = setTimeout(() => {
      if (camNotifyOverlay) camNotifyOverlay.classList.add('hidden');
    }, autoDismissMs);
  }
}

function sendCamRequest() {
  if (!callDoc) return;
  lastSeenCamStatus = 'pending';
  callDoc.set({
    camSetRequest: firebase.firestore.FieldValue.serverTimestamp(),
    camStatus: 'pending',
  }, { merge: true });
  showCamNotify('CAMERA', 'Notifying coach…', 'Your coach has been asked to check your camera angle.', 4000);
}

// Camera setup prompt on load — dismissed when user taps the button
if (camSetupDoneBtn) {
  camSetupDoneBtn.addEventListener('click', () => {
    if (camSetupOverlay) camSetupOverlay.classList.add('hidden');
    sendCamRequest();
  });
}

// "Set Cam" top button — re-request anytime during session
if (setCamBtn) {
  setCamBtn.addEventListener('click', sendCamRequest);
}

if (camNotifyDismiss) {
  camNotifyDismiss.addEventListener('click', () => {
    if (camNotifyOverlay) camNotifyOverlay.classList.add('hidden');
    if (camNotifyTimer) clearTimeout(camNotifyTimer);
  });
}

function updateCamDot(status) {
  if (!camStatusDot) return;
  camStatusDot.classList.toggle('lf-cam-dot--red',   status !== 'set');
  camStatusDot.classList.toggle('lf-cam-dot--green', status === 'set');
}

async function startSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const joinKey = urlParams.get('joinKey') || localStorage.getItem('clientJoinKey');
  const exercise = urlParams.get('exercise') || localStorage.getItem('clientSelectedExercise');

  if (!joinKey) {
    replace('client.html');
    return;
  }

  if (!exercise) {
    replace(`client-workout.html?joinKey=${encodeURIComponent(joinKey)}`);
    return;
  }

  currentExerciseValue = exercise;
  localStorage.setItem('clientJoinKey', joinKey);
  localStorage.setItem('clientSelectedExercise', exercise);

  // Show exercise name immediately from URL param
  updateExerciseDisplay(getExerciseNameFromValue(exercise));

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showStatus('Camera access requires HTTPS or localhost.', 'error');
    return;
  }

  try {
    showStatus('Starting workout...', 'info');

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    initPeerConnection();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    if (localVideo) {
      localVideo.srcObject = localStream;
    }

    callDoc = firestore.collection('calls').doc(joinKey);
    sessionDoc = firestore.collection('sessions').doc(joinKey);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');
    const feedbackCollection = callDoc.collection('feedback');

    syncClientExercise(currentExerciseValue);

    // Publish client's exercise order so coach can see and change it
    const savedOrder = JSON.parse(localStorage.getItem('clientExerciseOrder') || '[]');
    if (savedOrder.length > 0) {
      callDoc.set({ clientExerciseOrder: savedOrder }, { merge: true }).catch(() => {});
    }

    sessionDoc.onSnapshot((snapshot) => {
      if (!snapshot.exists()) return;
      const sessionData = snapshot.data();
      if (sessionData.status === 'ENDED') {
        handleSessionEnded();
      }
    });

    const processedMessages = new Set();
    feedbackCollection.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const messageId = change.doc.id;
          if (processedMessages.has(messageId)) return;
          processedMessages.add(messageId);

          const data = change.doc.data();
          if (data.message) {
            setTimeout(() => {
              speakFeedback(data.message);
            }, 200);
          }
        }
      });
    });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (typeof data.repCount === 'number') {
        updateClientRepCount(data.repCount);
      } else {
        updateClientRepCount(0);
      }

      if (data.currentExercise) {
        updateClientExercise(data.currentExercise);
      }

      if (data.setStatus && data.setStatusUpdated) {
        handleSetStatusChange(data.setStatus, data.setStatusUpdated, data.setSummary);
      }

      if (data.camStatus && data.camStatus !== lastSeenCamStatus) {
        lastSeenCamStatus = data.camStatus;
        updateCamDot(data.camStatus);
        if (data.camStatus === 'set') {
          showCamNotify('CAMERA ✓', 'Camera looks good!', 'Your coach has confirmed your camera angle.', 3500);
          speakFeedback('Camera confirmed. Your angle looks great!');
        } else if (data.camStatus === 'not-set') {
          showCamNotify('CAMERA ✗', 'Adjust your camera', 'Your coach says your camera angle needs adjustment.', 5000);
          speakFeedback('Please adjust your camera. Your coach needs a better angle.');
        }
      }
    });

    let callData = (await callDoc.get()).data();
    if (!callData || !callData.offer) {
      showStatus('Invalid join key. Please check and try again.', 'error');
      return;
    }

    activeSignalingVersion = callData.signalingVersion || 1;
    console.log('[RECONNECT] client: signalingVersion=', activeSignalingVersion, 'hasAnswer=', !!callData.answer);
    if (callData.answer) {
      showStatus('Reconnecting to session...', 'info');
      console.log('[RECONNECT] client: writing reconnectRequestedAt');
      await callDoc.set({
        reconnectRequestedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      callData = await waitForFreshOffer(activeSignalingVersion);
      activeSignalingVersion = callData.signalingVersion || activeSignalingVersion + 1;
      console.log('[RECONNECT] client: got fresh offer, new version=', activeSignalingVersion);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        answerCandidates.add({
          ...event.candidate.toJSON(),
          version: activeSignalingVersion,
        });
      }
    };

    console.log('[RECONNECT] client: setting remote description, pc.signalingState=', pc.signalingState);
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    console.log('[RECONNECT] client: answer created and set locally, writing to Firestore with answerVersion=', activeSignalingVersion);

    await callDoc.update({
      answer: {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      }
    });
    await callDoc.set({ answerVersion: activeSignalingVersion }, { merge: true });
    showStatus('Connecting...', 'info');

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if ((data.version || 1) !== activeSignalingVersion) return;
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    callDoc.onSnapshot(async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.offer2 && !pc2) {
        pc2 = new RTCPeerConnection(servers);

        localStream.getTracks().forEach((track) => {
          pc2.addTrack(track, localStream);
        });

        pc2.onicecandidate = (event) => {
          if (event.candidate) {
            answerCandidates.add({
              ...event.candidate.toJSON(),
              version: activeSignalingVersion,
            });
          }
        };

        await pc2.setRemoteDescription(new RTCSessionDescription(data.offer2));
        const answer2Description = await pc2.createAnswer();
        await pc2.setLocalDescription(answer2Description);

        await callDoc.update({
          answer2: {
            type: answer2Description.type,
            sdp: answer2Description.sdp,
          }
        });

        offerCandidates.onSnapshot((innerSnapshot) => {
          innerSnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidateData = change.doc.data();
              if ((candidateData.version || 1) !== activeSignalingVersion) return;
              const candidate = new RTCIceCandidate(candidateData);
              if (pc2 && pc2.remoteDescription) {
                pc2.addIceCandidate(candidate);
              }
            }
          });
        });
      }
    });
  } catch (error) {
    console.error('Error starting workout:', error);
    showStatus('Error starting workout: ' + error.message, 'error');
  }
}

startSession();
