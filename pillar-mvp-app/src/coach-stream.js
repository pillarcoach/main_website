import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import { getIceServers } from './iceServers.js';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

let servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
let pc = null;
let remoteStream = null;
let callDoc = null;
let repCount = 0;
let isSetActive = false;
let sessionDoc = null; // Session document in 'sessions' collection
let exerciseSetsCollection = null; // Subcollection for exercise sets
let setStartTime = null; // Timestamp when current set started
let isJoiningExistingSession = false; // Flag to track if coach is joining existing session
let coachId = null; // Unique ID for this coach instance
let coachesCollection = null; // Subcollection to track active coaches
let currentSignalingVersion = 1; // Tracks active WebRTC signaling generation
let lastReconnectRequestMs = 0; // Prevents duplicate reconnect handling
let isRefreshingConnection = false;
let unsubscribeAnswerCandidates = null;

const EXERCISE_DISPLAY_NAMES = {
  'bench-press':      'Bench Press',
  'incline-dumbbell': 'Incline Dumbbell',
  'shoulder-press':   'Shoulder Press',
  'lat-pulldown':     'Lat Pulldown',
  'deadlift':         'Deadlift',
  'barbell-rows':     'Barbell Rows',
  'squats':           'Squats',
};

function renderClientFlow(order) {
  const container = document.getElementById('clientFlowContent');
  if (!container) return;
  if (!order || order.length === 0) {
    container.innerHTML = '<p class="no-summary-message">No flow received yet</p>';
    return;
  }
  container.innerHTML = '';
  order.forEach((id, idx) => {
    const name = EXERCISE_DISPLAY_NAMES[id] || id;
    const btn = document.createElement('button');
    btn.className = 'coach-flow-item';
    btn.dataset.id = id;
    btn.innerHTML = `<span class="coach-flow-rank">${idx + 1}</span><span class="coach-flow-name">${name}</span><span class="coach-flow-switch">Switch →</span>`;
    btn.addEventListener('click', () => {
      if (!callDoc) return;
      callDoc.set({ currentExercise: name, exerciseUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      if (exerciseSelect) exerciseSelect.value = id;
      // Highlight active
      container.querySelectorAll('.coach-flow-item').forEach(b => b.classList.remove('coach-flow-item--active'));
      btn.classList.add('coach-flow-item--active');
    });
    container.appendChild(btn);
  });
}

// HTML elements
const coachModeSelection = document.getElementById('coachModeSelection');
const createSessionCard = document.getElementById('createSessionCard');
const joinSessionCard = document.getElementById('joinSessionCard');
const createSessionButton = document.getElementById('createSessionButton');
const joinSessionButton = document.getElementById('joinSessionButton');
const coachJoinKeyInput = document.getElementById('coachJoinKeyInput');
const hangupButton = document.getElementById('hangupButtonHeader');
const remoteVideo = document.getElementById('remoteVideo');
const sessionHeader = document.getElementById('sessionHeader');
const sessionCodeDisplay = document.getElementById('sessionCodeDisplay');
const connectionStatus = document.getElementById('connectionStatus');
const coachDashboard = document.getElementById('coachDashboard');
const exerciseSelect = document.getElementById('exerciseSelect');
const repCountDisplay = document.getElementById('repCount');
const incrementRep = document.getElementById('incrementRep');
const decrementRep = document.getElementById('decrementRep');
const startSetButton = document.getElementById('startSetButton');
const endSetButton = document.getElementById('endSetButton');
const closeCoachSummaryButton = document.getElementById('closeCoachSummaryButton');
const scoreModalOverlay = document.getElementById('scoreModalOverlay');
const scoreInput = document.getElementById('scoreInput');
const notesInput = document.getElementById('notesInput');
const saveScoreButton = document.getElementById('saveScoreButton');
const skipScoreButton = document.getElementById('skipScoreButton');
const sessionHistoryContent = document.getElementById('sessionHistoryContent');
const coachCamOkBtn      = document.getElementById('coachCamOkBtn');
const coachCamNotSetBtn  = document.getElementById('coachCamNotSetBtn');
const coachCamStatusDot  = document.getElementById('coachCamStatusDot');
const coachCamStatusText = document.getElementById('coachCamStatusText');
const coachCamBar        = document.getElementById('coachCamBar');

let lastCamRequestMs = 0;

function updateCoachCamBar(status) {
  if (!coachCamStatusDot || !coachCamStatusText) return;
  if (status === 'set') {
    coachCamStatusDot.style.background = '#3ecf6e';
    coachCamStatusText.textContent = 'Camera confirmed';
    if (coachCamBar) coachCamBar.classList.remove('coach-cam-bar--alert');
  } else if (status === 'pending') {
    coachCamStatusDot.style.background = '#f5a623';
    coachCamStatusText.textContent = 'Client requesting camera check';
    if (coachCamBar) coachCamBar.classList.add('coach-cam-bar--alert');
  } else {
    coachCamStatusDot.style.background = '#ff4444';
    coachCamStatusText.textContent = 'Camera not confirmed';
    if (coachCamBar) coachCamBar.classList.remove('coach-cam-bar--alert');
  }
}

if (coachCamOkBtn) {
  coachCamOkBtn.addEventListener('click', () => {
    if (!callDoc) return;
    callDoc.set({ camStatus: 'set' }, { merge: true });
    updateCoachCamBar('set');
  });
}

if (coachCamNotSetBtn) {
  coachCamNotSetBtn.addEventListener('click', () => {
    if (!callDoc) return;
    callDoc.set({ camStatus: 'not-set' }, { merge: true });
    updateCoachCamBar('not-set');
  });
}

// Ensure modal is hidden on page load
if (scoreModalOverlay) {
  scoreModalOverlay.classList.add('hidden');
}

// Initialize rep buttons as disabled
if (incrementRep) incrementRep.disabled = true;
if (decrementRep) decrementRep.disabled = true;

// Initialize peer connection
async function initPeerConnection() {
  servers = await getIceServers();
  pc = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();

  // Add transceiver for receiving video (coach doesn't send, only receives)
  pc.addTransceiver('video', { direction: 'recvonly' });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    console.log('[RECONNECT] ontrack fired, streams=', event.streams.length, 'tracks=', event.streams[0]?.getTracks().length);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    if (remoteVideo) {
      remoteVideo.srcObject = remoteStream;
    }
    console.log('[RECONNECT] remoteVideo.srcObject set, tracks=', remoteStream.getTracks().length);
    showStatus('Client connected', 'success');
    updateConnectionStatus(true);
  };

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      showStatus('Connection lost', 'error');
      updateConnectionStatus(false);
    } else if (pc.iceConnectionState === 'connected') {
      updateConnectionStatus(true);
    }
  };
}

async function deleteCollection(colRef) {
  const snap = await colRef.get();
  const deletes = snap.docs.map(d => d.ref.delete());
  await Promise.all(deletes);
}

async function publishOffer(version) {
  if (!pc || !callDoc) return;

  currentSignalingVersion = version;

  // Clear stale candidates from previous sessions so they don't interfere with ICE
  await deleteCollection(callDoc.collection('offerCandidates'));
  await deleteCollection(callDoc.collection('answerCandidates'));

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      callDoc.collection('offerCandidates').add({
        ...event.candidate.toJSON(),
        version: currentSignalingVersion,
      });
    }
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await callDoc.set({
    offer: {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    },
    signalingVersion: currentSignalingVersion,
    answer: firebase.firestore.FieldValue.delete(),
    answerVersion: firebase.firestore.FieldValue.delete(),
    reconnectRequestedAt: firebase.firestore.FieldValue.delete(),
  }, { merge: true });
}

function subscribeAnswerCandidates(answerCandidates) {
  if (unsubscribeAnswerCandidates) {
    unsubscribeAnswerCandidates();
  }
  unsubscribeAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidateData = change.doc.data();
        if ((candidateData.version || 1) !== currentSignalingVersion || !pc) return;
        pc.addIceCandidate(new RTCIceCandidate(candidateData));
      }
    });
  });
}

async function refreshClientConnection() {
  if (isRefreshingConnection || !callDoc) return;

  console.log('[RECONNECT] refreshClientConnection called, version will become', currentSignalingVersion + 1);
  isRefreshingConnection = true;

  try {
    if (pc) {
      console.log('[RECONNECT] closing old pc, signalingState=', pc.signalingState);
      pc.close();
    }

    remoteStream = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    await initPeerConnection();
    if (remoteVideo) remoteVideo.srcObject = remoteStream;

    await publishOffer(currentSignalingVersion + 1);
    console.log('[RECONNECT] offer published, currentSignalingVersion=', currentSignalingVersion);

    subscribeAnswerCandidates(callDoc.collection('answerCandidates'));

    showStatus('Client reconnecting...', 'info');
    updateConnectionStatus(false);
  } catch (error) {
    console.error('[RECONNECT] error:', error);
    showStatus('Failed to refresh connection', 'error');
  } finally {
    isRefreshingConnection = false;
  }
}

// Create new session
async function startNewSession() {
  try {
    showStatus('Starting session...', 'info');
    isJoiningExistingSession = false;

    // Read pre-selected category before creating session
    const preSessionCategorySelect = document.getElementById('preSessionCategorySelect');
    const preSelectedCategory = preSessionCategorySelect?.value || '';

    // Generate unique coach ID
    coachId = `coach_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize peer connection
    await initPeerConnection();

    // Create Firestore document for this call (WebRTC signaling)
    const joinKey = Math.random().toString(36).substr(2, 6).toUpperCase();
    callDoc = firestore.collection('calls').doc(joinKey);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');
    coachesCollection = callDoc.collection('coaches');

    // Create session document for data storage
    sessionDoc = firestore.collection('sessions').doc(callDoc.id);
    exerciseSetsCollection = sessionDoc.collection('exerciseSets');
    
    // Initialize session document (include pre-selected category if coach chose one)
    const sessionData = {
      coachId: 'coach',
      status: 'LIVE',
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      endedAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (preSelectedCategory) {
      sessionData.exerciseCategory = preSelectedCategory;
    }
    await sessionDoc.set(sessionData);

    // Write pre-selected category to the call doc so client reads it on join
    if (preSelectedCategory) {
      await callDoc.set({ exerciseCategory: preSelectedCategory }, { merge: true });
    }

    // Display join key
    const sessionId = callDoc.id;
    if (sessionCodeDisplay) sessionCodeDisplay.textContent = sessionId;
    if (sessionHeader) sessionHeader.classList.remove('hidden');
    
    // Add this coach to the coaches collection
    await coachesCollection.doc(coachId).set({
      coachId: coachId,
      role: 'stream',
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    // Listen for other coaches joining/leaving
    setupCoachesListener();
    
    // Show end button
    if (hangupButton) {
      hangupButton.classList.remove('hidden');
    }

    currentSignalingVersion = 1;
    await publishOffer(currentSignalingVersion);
    
    // Hide mode selection, show dashboard
    if (coachModeSelection) coachModeSelection.classList.add('hidden');
    if (coachDashboard) coachDashboard.classList.remove('hidden');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.style.display = 'none';
    
    showStatus('Waiting for client to join...', 'info');

    // Listen for remote answer and session data updates
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!data) return;
      
      // Handle client answer for WebRTC connection
      console.log('[RECONNECT] snapshot: answerVersion=', data.answerVersion, 'currentSignalingVersion=', currentSignalingVersion, 'signalingState=', pc?.signalingState, 'hasAnswer=', !!data.answer);
      if (data?.answer && (data.answerVersion || 1) === currentSignalingVersion && pc && pc.signalingState === 'have-local-offer') {
        console.log('[RECONNECT] applying answer');
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription).catch(err => console.error('[RECONNECT] setRemoteDescription failed:', err));
        showStatus('Client joined successfully', 'success');
        updateConnectionStatus(true);
      }

      // Handle reconnect requests from client reloads
      if (data.reconnectRequestedAt && data.reconnectRequestedAt.toMillis) {
        const reconnectRequestMs = data.reconnectRequestedAt.toMillis();
        if (reconnectRequestMs > lastReconnectRequestMs) {
          lastReconnectRequestMs = reconnectRequestMs;
          console.log('[RECONNECT] reconnect request detected at', reconnectRequestMs);
          refreshClientConnection();
        }
      }
      
      // Update rep count (sync from feedback coach if they somehow update it)
      if (data.repCount !== undefined && data.repCount !== repCount) {
        repCount = data.repCount;
        if (repCountDisplay) repCountDisplay.textContent = repCount;
      }
      
      // Update exercise (sync from client)
      if (data.currentExercise) {
        const exerciseValue = Object.keys(EXERCISE_DISPLAY_NAMES).find(k => EXERCISE_DISPLAY_NAMES[k] === data.currentExercise) || data.currentExercise;
        if (exerciseValue && exerciseSelect && exerciseSelect.value !== exerciseValue) {
          exerciseSelect.value = exerciseValue;
        }
        // Highlight the active item in client flow panel
        document.querySelectorAll('.coach-flow-item').forEach(b => {
          b.classList.toggle('coach-flow-item--active', b.dataset.id === exerciseValue);
        });
      }

      // Render client's exercise order when it arrives
      if (data.clientExerciseOrder) {
        renderClientFlow(data.clientExerciseOrder);
      }

      // Update camera bar when client requests or status changes
      if (data.camSetRequest && data.camSetRequest.toMillis) {
        const reqMs = data.camSetRequest.toMillis();
        if (reqMs > lastCamRequestMs) {
          lastCamRequestMs = reqMs;
          updateCoachCamBar('pending');
        }
      }

      // Update set status (sync from feedback coach)
      if (data.setStatus) {
        if (data.setStatus === 'started' && !isSetActive) {
          console.log('Set started by feedback coach, updating UI');
          isSetActive = true;
          setStartTime = new Date();
          if (startSetButton) startSetButton.classList.add('hidden');
          if (endSetButton) endSetButton.classList.remove('hidden');
          if (incrementRep) incrementRep.disabled = false;
          if (decrementRep) decrementRep.disabled = false;
          // Reset rep count to 0 when set starts
          repCount = 0;
          if (repCountDisplay) repCountDisplay.textContent = '0';
        } else if (data.setStatus === 'ended' && isSetActive) {
          console.log('Set ended by feedback coach, updating UI');
          isSetActive = false;
          if (startSetButton) startSetButton.classList.remove('hidden');
          if (endSetButton) endSetButton.classList.add('hidden');
          if (incrementRep) incrementRep.disabled = true;
          if (decrementRep) decrementRep.disabled = true;
        }
      }
    });

    subscribeAnswerCandidates(answerCandidates);

    // Load session history
    loadSessionHistory();
  } catch (error) {
    console.error('Error starting session:', error);
    showStatus('Error starting session: ' + error.message, 'error');
  }
}

// Join existing session
async function joinExistingSession(joinKey) {
  try {
    showStatus('Joining session...', 'info');
    isJoiningExistingSession = true;
    
    // Generate unique coach ID
    coachId = `coach_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Reference existing call document
    callDoc = firestore.collection('calls').doc(joinKey);
    
    // Check if session exists
    const callData = await callDoc.get();
    if (!callData.exists) {
      showStatus('Session not found. Please check the session code.', 'error');
      return;
    }
    
    // Initialize peer connection
    await initPeerConnection();
    currentSignalingVersion = callData.data()?.signalingVersion || 1;
    
    // Get collections
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');
    coachesCollection = callDoc.collection('coaches');
    
    // Add this coach to the coaches collection
    await coachesCollection.doc(coachId).set({
      coachId: coachId,
      role: 'stream',
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    // Listen for other coaches
    setupCoachesListener();
    
    // Reference session document
    sessionDoc = firestore.collection('sessions').doc(joinKey);
    exerciseSetsCollection = sessionDoc.collection('exerciseSets');
    
    // Display session code
    if (sessionCodeDisplay) sessionCodeDisplay.textContent = joinKey;
    if (sessionHeader) sessionHeader.classList.remove('hidden');
    
    // Hide mode selection, show dashboard
    if (coachModeSelection) coachModeSelection.classList.add('hidden');
    if (coachDashboard) coachDashboard.classList.remove('hidden');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.style.display = 'none';
    
    // Show end button
    if (hangupButton) {
      hangupButton.classList.remove('hidden');
    }
    
    // Listen for client connection
    callDoc.onSnapshot(async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;
      
      // If client answer arrived and we're in the right signaling state to accept it
      console.log('[RECONNECT] join snapshot: answerVersion=', data.answerVersion, 'currentSignalingVersion=', currentSignalingVersion, 'signalingState=', pc?.signalingState, 'hasAnswer=', !!data.answer);
      if (data.answer && (data.answerVersion || 1) === currentSignalingVersion && pc && pc.signalingState === 'have-local-offer') {
        console.log('[RECONNECT] applying answer (join path)');
        const answerDescription = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answerDescription).catch(err => console.error('[RECONNECT] setRemoteDescription failed:', err));
        showStatus('Connected to client', 'success');
        updateConnectionStatus(true);
      }

      if (data.reconnectRequestedAt && data.reconnectRequestedAt.toMillis) {
        const reconnectRequestMs = data.reconnectRequestedAt.toMillis();
        if (reconnectRequestMs > lastReconnectRequestMs) {
          lastReconnectRequestMs = reconnectRequestMs;
          refreshClientConnection();
        }
      }
      
      // Update rep count
      if (data.repCount !== undefined && data.repCount !== repCount) {
        repCount = data.repCount;
        if (repCountDisplay) repCountDisplay.textContent = repCount;
      }
      
      // Update exercise (sync from client)
      if (data.currentExercise) {
        const exerciseValue = Object.keys(EXERCISE_DISPLAY_NAMES).find(k => EXERCISE_DISPLAY_NAMES[k] === data.currentExercise) || data.currentExercise;
        if (exerciseValue && exerciseSelect && exerciseSelect.value !== exerciseValue) {
          exerciseSelect.value = exerciseValue;
        }
        document.querySelectorAll('.coach-flow-item').forEach(b => {
          b.classList.toggle('coach-flow-item--active', b.dataset.id === exerciseValue);
        });
      }

      // Render client's exercise order when it arrives
      if (data.clientExerciseOrder) {
        renderClientFlow(data.clientExerciseOrder);
      }

      // Update camera bar when client requests or status changes
      if (data.camSetRequest && data.camSetRequest.toMillis) {
        const reqMs = data.camSetRequest.toMillis();
        if (reqMs > lastCamRequestMs) {
          lastCamRequestMs = reqMs;
          updateCoachCamBar('pending');
        }
      }

      // Update set status
      if (data.setStatus) {
        if (data.setStatus === 'started' && !isSetActive) {
          console.log('Set started, updating UI');
          isSetActive = true;
          setStartTime = new Date();
          if (startSetButton) startSetButton.classList.add('hidden');
          if (endSetButton) endSetButton.classList.remove('hidden');
          if (incrementRep) incrementRep.disabled = false;
          if (decrementRep) decrementRep.disabled = false;
          repCount = 0;
          if (repCountDisplay) repCountDisplay.textContent = '0';
        } else if (data.setStatus === 'ended' && isSetActive) {
          console.log('Set ended, updating UI');
          isSetActive = false;
          if (startSetButton) startSetButton.classList.remove('hidden');
          if (endSetButton) endSetButton.classList.add('hidden');
          if (incrementRep) incrementRep.disabled = true;
          if (decrementRep) decrementRep.disabled = true;
        }
      }
    });
    
    // Listen for answer candidates from client
    subscribeAnswerCandidates(answerCandidates);

    // Listen for offer candidates
    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          if ((candidateData.version || 1) !== currentSignalingVersion || !pc) {
            return;
          }

          const candidate = new RTCIceCandidate(candidateData);
          pc.addIceCandidate(candidate);
        }
      });
    });
    
    // Load session history
    loadSessionHistory();
    
    showStatus('Connected to session', 'success');
    updateConnectionStatus(true);
    
  } catch (error) {
    console.error('Error joining session:', error);
    showStatus('Failed to join session', 'error');
  }
}

// Setup listener for active coaches
function setupCoachesListener() {
  if (!coachesCollection) return;
  
  coachesCollection.onSnapshot((snapshot) => {
    const activeCoaches = snapshot.docs.length;
    console.log(`Active coaches in session: ${activeCoaches}`);
  });
}

// Hangup
if (hangupButton) {
  hangupButton.onclick = async () => {
    // Remove this coach from coaches collection
    if (coachesCollection && coachId) {
      await coachesCollection.doc(coachId).delete();
    }
    
    // Close peer connection
    if (pc) {
      pc.close();
      pc = null;
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      remoteStream = null;
    }
    
    if (remoteVideo) {
      remoteVideo.srcObject = null;
    }
    
    // Delete call document if we created it (not if we joined)
    if (callDoc && !isJoiningExistingSession) {
      await callDoc.delete();
    }
    
    // Update session status if we created it
    if (sessionDoc && !isJoiningExistingSession) {
      await sessionDoc.update({
        status: 'ENDED',
        endedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Reset state
    callDoc = null;
    sessionDoc = null;
    exerciseSetsCollection = null;
    coachesCollection = null;
    coachId = null;
    repCount = 0;
    if (repCountDisplay) repCountDisplay.textContent = '0';
    isSetActive = false;
    setStartTime = null;
    isJoiningExistingSession = false;
    
    // Reset UI
    if (coachDashboard) coachDashboard.classList.add('hidden');
    if (sessionHeader) sessionHeader.classList.add('hidden');
    if (coachModeSelection) coachModeSelection.classList.remove('hidden');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.style.display = 'block';
    
    // Hide end button
    if (hangupButton) {
      hangupButton.classList.add('hidden');
    }
    
    // Reset exercise selector
    if (exerciseSelect) {
      exerciseSelect.value = '';
    }
    
    // Reset join key input
    if (coachJoinKeyInput) {
      coachJoinKeyInput.value = '';
    }
    
    showStatus('Session ended', 'info');
    updateConnectionStatus(false);
  };
}

// Show status message
function showStatus(message, type = 'info') {
  if (type === 'error') {
    console.error('Error:', message);
  } else {
    console.log(message);
  }

  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.classList.remove('hidden');

  if (type !== 'error') {
    setTimeout(() => statusEl.classList.add('hidden'), 4000);
  }
}

// Update connection status
function updateConnectionStatus(connected) {
  if (connectionStatus) {
    if (connected) {
      connectionStatus.textContent = '• Client Connected';
      connectionStatus.className = 'status-indicator connected';
    } else {
      connectionStatus.textContent = '• Waiting for client';
      connectionStatus.className = 'status-indicator';
    }
  }
}

// Sync rep count to Firestore
function syncRepCount() {
  if (!callDoc) return;
  
  callDoc.set({
    repCount: repCount,
    repCountUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch((error) => {
    console.error('Error syncing rep count:', error);
  });
}

// Sync exercise to Firestore - DEPRECATED: Client now controls exercise selection
// This function is kept for backward compatibility but should not be called
function syncExercise(exercise) {
  console.warn('syncExercise called but exercise is now controlled by client');
  // Do not sync - client controls exercise selection
  return;
}

// Exercise selection handler - DISABLED: Client now controls exercise selection
// Coach can change the exercise — writes to Firestore, client picks it up
if (exerciseSelect) {
  exerciseSelect.addEventListener('change', () => {
    if (!callDoc) return;
    const name = EXERCISE_DISPLAY_NAMES[exerciseSelect.value] || exerciseSelect.value;
    if (!name) return;
    callDoc.set({
      currentExercise: name,
      exerciseUpdated: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

// Rep counter handlers
if (incrementRep) {
  incrementRep.addEventListener('click', () => {
    if (!isSetActive) return;
    repCount++;
    if (repCountDisplay) repCountDisplay.textContent = repCount;
    syncRepCount();
  });
}

if (decrementRep) {
  decrementRep.addEventListener('click', () => {
    if (!isSetActive) return;
    if (repCount > 0) {
      repCount--;
      if (repCountDisplay) repCountDisplay.textContent = repCount;
      syncRepCount();
    }
  });
}

// Start set button
if (startSetButton) {
  startSetButton.addEventListener('click', () => {
    if (isSetActive) {
      console.log('Set already active, ignoring start request');
      return;
    }
    
    console.log('Starting set - updating Firestore');
    
    // Reset rep counter
    repCount = 0;
    if (repCountDisplay) repCountDisplay.textContent = '0';
    syncRepCount();
    
    isSetActive = true;
    setStartTime = new Date();
    
    // Notify set start
    if (callDoc) {
      callDoc.set({
        setSummary: [],
        summaryUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        setStatus: 'started',
        setStatusUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).then(() => {
        console.log('Set status updated to started in Firestore');
      }).catch((error) => {
        console.error('Error updating set status:', error);
      });
    }
    
    // Update button states
    if (startSetButton) startSetButton.classList.add('hidden');
    if (endSetButton) endSetButton.classList.remove('hidden');
    if (incrementRep) incrementRep.disabled = false;
    if (decrementRep) decrementRep.disabled = false;
  });
}

// End set button
if (endSetButton) {
  endSetButton.addEventListener('click', async () => {
    if (!isSetActive) return;
    
    const setEndTime = new Date();
    const duration = setStartTime ? Math.round((setEndTime - setStartTime) / 1000) : 0;
    
    const exerciseType = exerciseSelect ? exerciseSelect.value : '';
    const exerciseName = EXERCISE_DISPLAY_NAMES[exerciseType] || exerciseType || 'Unknown';
    
    // Notify set end
    if (callDoc) {
      callDoc.set({
        setStatus: 'ended',
        setStatusUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).then(() => {
        console.log('Set status updated to ended in Firestore');
      }).catch((error) => {
        console.error('Error updating set status:', error);
      });
    }
    
    // Reset set state
    isSetActive = false;
    const finalRepCount = repCount;
    
    // Reset rep count
    repCount = 0;
    if (repCountDisplay) repCountDisplay.textContent = '0';
    syncRepCount();
    
    // Update button states
    if (startSetButton) startSetButton.classList.remove('hidden');
    if (endSetButton) endSetButton.classList.add('hidden');
    if (incrementRep) incrementRep.disabled = true;
    if (decrementRep) decrementRep.disabled = true;
    
    // Show score input modal
    showScoreModal(exerciseType, exerciseName, finalRepCount, [], setStartTime, setEndTime, duration);
  });
}

// Score Modal Functions
let currentSetData = null;

function showScoreModal(exerciseType, exerciseName, actualReps, coachFeedback, startedAt, completedAt, duration) {
  if (!scoreModalOverlay || !scoreInput || !notesInput) {
    console.error('Score modal elements not found');
    return;
  }
  
  currentSetData = {
    exerciseType,
    exerciseName,
    actualReps,
    coachFeedback,
    startedAt,
    completedAt,
    duration
  };
  
  if (scoreInput) scoreInput.value = '';
  if (notesInput) notesInput.value = '';
  if (scoreModalOverlay) scoreModalOverlay.classList.remove('hidden');
  if (scoreInput) scoreInput.focus();
}

function hideScoreModal() {
  if (scoreModalOverlay) {
    scoreModalOverlay.classList.add('hidden');
  }
  currentSetData = null;
}

async function saveExerciseSet(score, notes) {
  if (!sessionDoc || !exerciseSetsCollection || !currentSetData) return;
  
  try {
    // Get feedback from Firestore (from feedback coach)
    const callData = await callDoc.get();
    const feedbackData = callData.data();
    const coachFeedback = feedbackData && feedbackData.setSummary ? feedbackData.setSummary : [];
    
    const exerciseSetData = {
      exerciseType: currentSetData.exerciseType,
      exerciseName: currentSetData.exerciseName,
      actualReps: currentSetData.actualReps,
      coachScore: score !== null && score !== '' ? parseFloat(score) : null,
      coachFeedback: coachFeedback,
      notes: notes && notes.trim() ? notes.trim() : null,
      startedAt: firebase.firestore.Timestamp.fromDate(currentSetData.startedAt),
      completedAt: firebase.firestore.Timestamp.fromDate(currentSetData.completedAt),
      duration: currentSetData.duration,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await exerciseSetsCollection.add(exerciseSetData);
    console.log('Exercise set saved successfully');
    
    loadSessionHistory();
  } catch (error) {
    console.error('Error saving exercise set:', error);
    showStatus('Error saving set data', 'error');
  }
}

// Score modal button handlers
if (saveScoreButton) {
  saveScoreButton.addEventListener('click', async () => {
    if (!scoreInput) return;
    const score = scoreInput.value;
    const notes = notesInput ? notesInput.value : '';
    
    if (score !== '' && (parseFloat(score) < 0 || parseFloat(score) > 10)) {
      showStatus('Score must be between 0 and 10', 'error');
      return;
    }
    
    await saveExerciseSet(score, notes);
    hideScoreModal();
    showStatus('Set saved successfully', 'success');
  });
}

if (skipScoreButton) {
  skipScoreButton.addEventListener('click', async () => {
    await saveExerciseSet(null, null);
    hideScoreModal();
    showStatus('Set saved (no score)', 'info');
  });
}

// Close coach summary button
if (closeCoachSummaryButton) {
  closeCoachSummaryButton.addEventListener('click', () => {
    const coachSummaryPanel = document.getElementById('coachSummaryPanel');
    if (coachSummaryPanel) {
      coachSummaryPanel.classList.add('hidden');
    }
  });
}

// Load and display session history
function loadSessionHistory() {
  if (!exerciseSetsCollection || !sessionHistoryContent) return;
  
  exerciseSetsCollection
    .orderBy('completedAt', 'desc')
    .onSnapshot((snapshot) => {
      const sets = [];
      snapshot.forEach((doc) => {
        sets.push({ id: doc.id, ...doc.data() });
      });
      
      displaySessionHistory(sets);
    }, (error) => {
      console.error('Error loading session history:', error);
    });
}

function displaySessionHistory(sets) {
  if (!sessionHistoryContent) return;
  
  if (sets.length === 0) {
    sessionHistoryContent.innerHTML = '<p class="no-summary-message">No sets completed yet</p>';
    return;
  }
  
  const historyList = document.createElement('div');
  historyList.className = 'history-list';
  
  sets.forEach((set, index) => {
    const setItem = document.createElement('div');
    setItem.className = 'history-item';
    
    const scoreDisplay = set.coachScore !== null ? `${set.coachScore}/10` : 'No score';
    const durationDisplay = set.duration ? `${set.duration}s` : 'N/A';
    const feedbackCount = set.coachFeedback ? set.coachFeedback.length : 0;
    
    setItem.innerHTML = `
      <div class="history-item-header">
        <span class="history-exercise">${set.exerciseName || 'Unknown'}</span>
        <span class="history-reps">${set.actualReps} reps</span>
      </div>
      <div class="history-item-details">
        <span class="history-score">Score: ${scoreDisplay}</span>
        <span class="history-duration">Duration: ${durationDisplay}</span>
        <span class="history-feedback">Feedback: ${feedbackCount} messages</span>
      </div>
    `;
    
    historyList.appendChild(setItem);
  });
  
  sessionHistoryContent.innerHTML = '';
  sessionHistoryContent.appendChild(historyList);
}

// Set up button click handlers
if (createSessionButton) {
  createSessionButton.onclick = async () => {
    await startNewSession();
  };
}

if (joinSessionButton) {
  joinSessionButton.onclick = async () => {
    const joinKey = coachJoinKeyInput ? coachJoinKeyInput.value.trim() : '';
    if (!joinKey) {
      showStatus('Please enter a session code', 'error');
      return;
    }
    await joinExistingSession(joinKey);
  };
}

// Allow Enter key to join session
if (coachJoinKeyInput) {
  coachJoinKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && joinSessionButton) {
      joinSessionButton.click();
    }
  });
}
