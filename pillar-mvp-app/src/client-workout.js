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
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// ── Block definitions ──────────────────────────────────────────────────────
const ALL_BLOCKS = [
  // Push
  { id: 'bench-press',      category: 'push', title: 'Bench Press',      detail: 'Push · Chest',          iconPath: 'M4 12h16M8 7l4-4 4 4M12 3v13' },
  { id: 'incline-dumbbell', category: 'push', title: 'Incline Dumbbell',  detail: 'Push · Upper chest',    iconPath: 'M5 14l7-7 7 7M12 7v10' },
  { id: 'shoulder-press',   category: 'push', title: 'Shoulder Press',    detail: 'Push · Shoulders',      iconPath: 'M12 3v4M8 7h8M7 11l5 9 5-9' },
  // Pull
  { id: 'lat-pulldown',     category: 'pull', title: 'Lat Pulldown',      detail: 'Pull · Back',           iconPath: 'M4 6h16M4 12h10M4 18h7' },
  { id: 'deadlift',         category: 'pull', title: 'Deadlift',          detail: 'Pull · Full body',      iconPath: 'M12 3v4M8 7h8M7 11l5 9 5-9' },
  { id: 'barbell-rows',     category: 'pull', title: 'Barbell Rows',      detail: 'Pull · Mid back',       iconPath: 'M4 12h16M4 8l8 4 8-4' },
  // Legs
  { id: 'squats',           category: 'legs', title: 'Squats',            detail: 'Legs · Full lower body', iconPath: 'M6 4l6 8 6-8M12 12v8' },
];

// Active block list — filtered by category once we load from Firestore
let BLOCKS = ALL_BLOCKS;

// ── State ──────────────────────────────────────────────────────────────────
let order = BLOCKS.map(b => b.id);

// ── DOM refs ───────────────────────────────────────────────────────────────
const listEl        = document.getElementById('flowList');
const countEl       = document.getElementById('flowBlockCount');
const startsEl      = document.getElementById('flowStartsWith');
const startBtn      = document.getElementById('startWorkoutButton');
const statusMessage = document.getElementById('statusMessage');
const backBtn       = document.getElementById('flowBackBtn');

// ── URL / storage ──────────────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const joinKey = urlParams.get('joinKey') || localStorage.getItem('clientJoinKey');

if (!joinKey) replace('client.html');
if (backBtn) backBtn.href = 'client.html';

// ── Helpers ────────────────────────────────────────────────────────────────
function blockById(id) {
  return BLOCKS.find(b => b.id === id);
}

function showStatus(message, type = 'info') {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  if (type === 'success' || type === 'error') {
    setTimeout(() => statusMessage.classList.add('hidden'), 5000);
  }
}

function updateStats() {
  if (countEl) countEl.textContent = order.length;
  if (startsEl) startsEl.textContent = blockById(order[0])?.title ?? '—';
}

function bump(id, dir) {
  const i = order.indexOf(id);
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  order = next;
  render();
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  if (!listEl) return;
  listEl.innerHTML = '';

  order.forEach((id, idx) => {
    const block = blockById(id);
    if (!block) return;

    const item = document.createElement('div');
    item.className = 'flow-item';
    item.dataset.id = id;

    item.innerHTML = `
      <div class="flow-rank ${idx === 0 ? 'flow-rank--first' : ''}">${idx + 1}</div>
      <div class="flow-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="${block.iconPath}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="flow-item-text">
        <div class="flow-item-title">${block.title}</div>
        <div class="flow-item-detail">${block.detail}</div>
      </div>
      <div class="flow-updown">
        <button class="flow-arrow ${idx === 0 ? 'flow-arrow--disabled' : ''}"
          data-id="${id}" data-dir="-1" aria-label="Move up" ${idx === 0 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="flow-arrow ${idx === order.length - 1 ? 'flow-arrow--disabled' : ''}"
          data-id="${id}" data-dir="1" aria-label="Move down" ${idx === order.length - 1 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="flow-handle" aria-hidden="true">
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
      </div>
    `;

    // Up/down arrow buttons
    item.querySelectorAll('.flow-arrow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        bump(btn.dataset.id, Number(btn.dataset.dir));
      });
    });

    // Touch drag via the handle
    const handle = item.querySelector('.flow-handle');
    handle.addEventListener('touchstart', onTouchStart, { passive: false });

    listEl.appendChild(item);
  });

  updateStats();
}

// ── Touch drag-to-reorder ──────────────────────────────────────────────────
let dragEl = null;       // the cloned floating element
let dragSrcId = null;
let dragSrcEl = null;    // the original item (dimmed)
let startY = 0;
let currentY = 0;
let itemHeight = 0;

function onTouchStart(e) {
  e.preventDefault();

  const handle = e.currentTarget;
  const item = handle.closest('.flow-item');
  dragSrcId = item.dataset.id;
  dragSrcEl = item;

  const rect = item.getBoundingClientRect();
  itemHeight = rect.height;
  startY = e.touches[0].clientY;
  currentY = startY;

  // Create a floating clone
  dragEl = item.cloneNode(true);
  dragEl.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    margin: 0;
    z-index: 100;
    pointer-events: none;
    box-shadow: 0 16px 40px rgba(13,13,13,0.22);
    opacity: 0.96;
    transform: scale(1.02);
    transition: none;
    border-radius: 16px;
    background: #fff;
  `;
  document.body.appendChild(dragEl);

  // Dim the original
  item.style.opacity = '0.35';

  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
}

function onTouchMove(e) {
  e.preventDefault();
  if (!dragEl) return;

  currentY = e.touches[0].clientY;
  const dy = currentY - startY;

  // Move the clone
  const rect = dragSrcEl.getBoundingClientRect();
  dragEl.style.top = (rect.top + dy) + 'px';

  // Find which item we're hovering over and highlight it
  document.querySelectorAll('.flow-item').forEach(el => {
    el.classList.remove('flow-item--over');
  });

  const hoveredEl = getItemAtY(currentY);
  if (hoveredEl && hoveredEl !== dragSrcEl) {
    hoveredEl.classList.add('flow-item--over');
  }
}

function onTouchEnd() {
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);

  if (!dragEl || !dragSrcEl) return;

  // Find drop target
  const hoveredEl = getItemAtY(currentY);
  if (hoveredEl && hoveredEl !== dragSrcEl) {
    const toId = hoveredEl.dataset.id;
    const from = order.indexOf(dragSrcId);
    const to = order.indexOf(toId);
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, dragSrcId);
    order = next;
  }

  // Clean up
  dragEl.remove();
  dragEl = null;
  dragSrcEl.style.opacity = '';
  document.querySelectorAll('.flow-item').forEach(el => {
    el.classList.remove('flow-item--over');
  });
  dragSrcId = null;
  dragSrcEl = null;

  render();
}

function getItemAtY(y) {
  const items = Array.from(document.querySelectorAll('.flow-item'));
  return items.find(el => {
    const r = el.getBoundingClientRect();
    return y >= r.top && y <= r.bottom;
  }) || null;
}

// ── Start session ──────────────────────────────────────────────────────────
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (!joinKey) {
      showStatus('No join key found. Go back and enter it again.', 'error');
      return;
    }
    const exercise = order[0];
    localStorage.setItem('clientJoinKey', joinKey);
    localStorage.setItem('clientSelectedExercise', exercise);
    localStorage.setItem('clientExerciseOrder', JSON.stringify(order));
    navigate(`client-session.html?joinKey=${encodeURIComponent(joinKey)}&exercise=${encodeURIComponent(exercise)}`);
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  // Fetch coach's pre-selected category from Firestore
  if (joinKey) {
    try {
      const callSnap = await firestore.collection('calls').doc(joinKey).get();
      if (callSnap.exists) {
        const category = callSnap.data()?.exerciseCategory;
        if (category) {
          BLOCKS = ALL_BLOCKS.filter(b => b.category === category);
          localStorage.setItem('clientExerciseCategory', category);
        }
      }
    } catch (_) {}
  }

  // Restore saved order, keeping only IDs still in the filtered BLOCKS
  const savedOrder = localStorage.getItem('clientExerciseOrder');
  if (savedOrder) {
    try {
      const parsed = JSON.parse(savedOrder);
      if (Array.isArray(parsed) && parsed.every(id => BLOCKS.some(b => b.id === id))) {
        order = parsed;
      } else {
        order = BLOCKS.map(b => b.id);
      }
    } catch (_) {
      order = BLOCKS.map(b => b.id);
    }
  } else {
    order = BLOCKS.map(b => b.id);
  }

  render();
}

init();
