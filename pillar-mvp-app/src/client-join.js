import './style.css';
import { navigate } from './basePath.js';

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

const joinButton = document.getElementById('joinButton');
const joinStatusOverlay = document.getElementById('joinStatusOverlay');
const joinStatusLabel  = document.getElementById('joinStatusLabel');
const joinStatusTitle  = document.getElementById('joinStatusTitle');
const joinStatusBody   = document.getElementById('joinStatusBody');
const joinStatusDismiss = document.getElementById('joinStatusDismiss');

// 6-slot key pad
const slots = Array.from({ length: 6 }, (_, i) => document.getElementById(`slot${i}`));

function getJoinKey() {
  return slots.map(s => s ? s.value : '').join('');
}

function syncJoinButtonState() {
  if (!joinButton) return;
  const complete = slots.every(s => s && s.value.length === 1);
  joinButton.disabled = !complete;
  joinButton.querySelector('.join-submit-arrow')?.classList.toggle('visible', complete);
}

function showStatus(message, type = 'info') {
  if (!joinStatusOverlay) return;
  const isError = type === 'error';
  joinStatusLabel.textContent  = isError ? 'ERROR' : 'PLEASE WAIT';
  joinStatusTitle.textContent  = message;
  joinStatusBody.textContent   = '';
  joinStatusDismiss.classList.toggle('hidden', !isError);
  joinStatusOverlay.classList.remove('hidden');
  if (isError && joinStatusDismiss) {
    joinStatusDismiss.onclick = () => joinStatusOverlay.classList.add('hidden');
  }
}

function hideStatus() {
  if (joinStatusOverlay) joinStatusOverlay.classList.add('hidden');
}

async function joinSession() {
  const callId = getJoinKey();
  if (callId.length < 6) {
    showStatus('Please enter all 6 characters', 'error');
    return;
  }

  try {
    showStatus('Joining session...', 'info');

    const callData = (await firestore.collection('calls').doc(callId).get()).data();
    if (!callData || !callData.offer) {
      showStatus('Invalid join key. Please check and try again.', 'error');
      return;
    }

    localStorage.setItem('clientJoinKey', callId);
    localStorage.removeItem('clientSelectedExercise');
    hideStatus();
    navigate(`client-workout.html?joinKey=${encodeURIComponent(callId)}`);
  } catch (error) {
    console.error('Error validating session:', error);
    showStatus('Unable to join session right now. Please try again.', 'error');
  }
}

// Wire up slot inputs
slots.forEach((slot, i) => {
  if (!slot) return;

  slot.addEventListener('input', () => {
    const char = slot.value.replace(/[^A-Za-z0-9]/g, '').slice(-1).toUpperCase();
    slot.value = char;
    slot.classList.toggle('filled', !!char);
    if (char && i < 5) slots[i + 1]?.focus();
    syncJoinButtonState();
  });

  slot.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !slot.value && i > 0) {
      slots[i - 1]?.focus();
    }
    if (e.key === 'Enter' && !joinButton.disabled) {
      joinSession();
    }
    if (e.key === 'ArrowLeft' && i > 0) slots[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) slots[i + 1]?.focus();
  });

  // Handle paste across all slots
  slot.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text')
      .replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    text.split('').forEach((char, j) => {
      if (slots[i + j]) {
        slots[i + j].value = char;
        slots[i + j].classList.add('filled');
      }
    });
    const next = Math.min(i + text.length, 5);
    slots[next]?.focus();
    syncJoinButtonState();
  });
});

// Pre-fill from URL or localStorage
const urlParams = new URLSearchParams(window.location.search);
const urlJoinKey = urlParams.get('joinKey') || localStorage.getItem('clientJoinKey');
if (urlJoinKey) {
  urlJoinKey.toUpperCase().slice(0, 6).split('').forEach((char, i) => {
    if (slots[i]) {
      slots[i].value = char;
      slots[i].classList.add('filled');
    }
  });
}

if (joinButton) {
  joinButton.onclick = joinSession;
}

syncJoinButtonState();

// Focus first empty slot on load
const firstEmpty = slots.find(s => s && !s.value);
(firstEmpty || slots[0])?.focus();
