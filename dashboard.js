/* ============================================================
   TYPE MASTER — dashboard.js
   Particles · Rotating subtitle · Count-up · Sparkline ·
   Session history · Streak · localStorage persistence
   ============================================================ */

// ── localStorage keys ────────────────────────────────────────
const KEYS = {
  sessions:  'tm_sessions',   // array of {wpm, net, accuracy, date}
  streak:    'tm_streak',     // {count, lastDate}
  bestWpm:   'tm_bestWpm',
  bestAcc:   'tm_bestAcc',
  bestNet:   'tm_bestNet',
};

// ── Load data ────────────────────────────────────────────────
function getSessions() {
  try { return JSON.parse(localStorage.getItem(KEYS.sessions)) || []; }
  catch { return []; }
}
function getStreak() {
  try { return JSON.parse(localStorage.getItem(KEYS.streak)) || { count: 0, lastDate: null }; }
  catch { return { count: 0, lastDate: null }; }
}

// ── Save a new session (called from timer page via postMessage or directly) ─
// Other pages call: localStorage.setItem + dispatch storage event.
// We also expose window.recordSession for easy cross-page calling.
window.recordSession = function(wpm, accuracy, net) {
  const sessions = getSessions();
  const now = new Date();
  sessions.push({ wpm, accuracy, net, date: now.toISOString() });
  // Keep last 20
  if (sessions.length > 20) sessions.splice(0, sessions.length - 20);
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));

  // Update bests
  const bestWpm = parseInt(localStorage.getItem(KEYS.bestWpm)) || 0;
  const bestAcc = parseInt(localStorage.getItem(KEYS.bestAcc)) || 0;
  const bestNet = parseInt(localStorage.getItem(KEYS.bestNet)) || 0;
  if (wpm > bestWpm) localStorage.setItem(KEYS.bestWpm, wpm);
  if (accuracy > bestAcc) localStorage.setItem(KEYS.bestAcc, accuracy);
  if (net > bestNet) localStorage.setItem(KEYS.bestNet, net);

  // Streak
  updateStreak(now);
};

function updateStreak(now) {
  const streak = getStreak();
  const today = now.toDateString();
  const last  = streak.lastDate;
  if (last === today) return; // already counted today
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const newCount = last === yesterday.toDateString() ? streak.count + 1 : 1;
  localStorage.setItem(KEYS.streak, JSON.stringify({ count: newCount, lastDate: today }));
}

// ── Count-up animation ────────────────────────────────────────
function countUp(el, target, suffix = '', duration = 900) {
  if (target === 0 || isNaN(target)) return;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(ease * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Rotating subtitle ─────────────────────────────────────────
const subtitles = [
  'Track your speed. Build your accuracy. Master the keyboard.',
  'Every keystroke counts. Keep pushing your limits.',
  'Consistency beats talent. Type every day.',
  'The fastest fingers started exactly where you are.',
  'Speed is a habit. Build it one session at a time.',
];
let subIndex = 0;
const subEl = document.getElementById('rotating-sub');
function rotateSubtitle() {
  subEl.style.opacity = '0';
  setTimeout(() => {
    subIndex = (subIndex + 1) % subtitles.length;
    subEl.textContent = subtitles[subIndex];
    subEl.style.opacity = '1';
  }, 400);
}
setInterval(rotateSubtitle, 4000);

// ── Streak pill ───────────────────────────────────────────────
function renderStreak() {
  const { count } = getStreak();
  document.getElementById('streak-count').textContent = count;
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const bestWpm = parseInt(localStorage.getItem(KEYS.bestWpm)) || 0;
  const bestAcc = parseInt(localStorage.getItem(KEYS.bestAcc)) || 0;
  const bestNet = parseInt(localStorage.getItem(KEYS.bestNet)) || 0;
  const sessions = getSessions();

  if (bestWpm) countUp(document.getElementById('best-wpm'), bestWpm, ' wpm', 1000);
  else document.getElementById('best-wpm').textContent = '—';

  if (bestAcc) countUp(document.getElementById('best-acc'), bestAcc, '%', 1000);
  else document.getElementById('best-acc').textContent = '—';

  if (bestNet) countUp(document.getElementById('best-net'), bestNet, ' wpm', 1000);
  else document.getElementById('best-net').textContent = '—';

  countUp(document.getElementById('sessions'), sessions.length, '', 800);
}

// ── Sparkline chart ───────────────────────────────────────────
function renderChart() {
  const sessions = getSessions();
  const canvas   = document.getElementById('wpm-chart');
  const emptyEl  = document.getElementById('graph-empty');
  const ctx      = canvas.getContext('2d');

  if (sessions.length < 2) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  // Size canvas properly
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width - 32; // account for padding
  canvas.height = 90;

  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 8, bottom: 18, left: 4, right: 4 };

  const last10 = sessions.slice(-10);
  const wpms   = last10.map(s => s.wpm);
  const nets   = last10.map(s => s.net || 0);
  const allVals = [...wpms, ...nets];
  const maxV = Math.max(...allVals, 1);
  const minV = 0;

  function xPos(i) {
    return pad.left + (i / (last10.length - 1)) * (W - pad.left - pad.right);
  }
  function yPos(v) {
    return pad.top + (1 - (v - minV) / (maxV - minV)) * (H - pad.top - pad.bottom);
  }

  // Grid lines
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y = pad.top + f * (H - pad.top - pad.bottom);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '8px Space Mono, monospace';
    ctx.fillText(Math.round(maxV * (1 - f)), 0, y + 3);
  });

  // Draw filled area helper
  function drawArea(vals, color, fillColor) {
    if (vals.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(vals[0]));
    vals.forEach((v, i) => { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });

    // Fill
    ctx.lineTo(xPos(vals.length - 1), H - pad.bottom);
    ctx.lineTo(xPos(0), H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(vals[0]));
    vals.forEach((v, i) => { if (i > 0) ctx.lineTo(xPos(i), yPos(v)); });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    vals.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  drawArea(nets, '#60a5fa', 'rgba(96,165,250,0.06)');
  drawArea(wpms, '#4ade80', 'rgba(74,222,128,0.09)');

  // X-axis labels (session numbers)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '8px Space Mono, monospace';
  ctx.textAlign = 'center';
  last10.forEach((_, i) => {
    ctx.fillText(i + 1, xPos(i), H);
  });
}

// ── Recent sessions list ──────────────────────────────────────
function renderSessions() {
  const sessions  = getSessions();
  const listEl    = document.getElementById('sessions-list');
  listEl.innerHTML = '';

  if (!sessions.length) {
    listEl.innerHTML = '<div class="sessions-empty">No sessions yet — start a speed test!</div>';
    return;
  }

  // Show last 5, newest first
  [...sessions].reverse().slice(0, 5).forEach(s => {
    const d    = new Date(s.date);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const row  = document.createElement('div');
    row.className = 'session-row';
    row.innerHTML = `
      <div class="session-wpm">${s.wpm} <span style="font-size:9px;color:rgba(255,255,255,.3)">wpm</span></div>
      <div style="display:flex;gap:14px;align-items:center">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:rgba(96,165,250,.7)">${s.net || '—'} net</div>
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:rgba(74,222,128,.6)">${s.accuracy}%</div>
        <div class="session-meta">
          <span>${time}</span>
          <span>${date}</span>
        </div>
      </div>
    `;
    listEl.appendChild(row);
  });
}

// ── Clear history ─────────────────────────────────────────────
document.getElementById('clear-btn').addEventListener('click', () => {
  if (!confirm('Clear all session history?')) return;
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  renderStats();
  renderChart();
  renderSessions();
  renderStreak();
});

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key.toLowerCase() === 't') window.location.href = 'timer.html';
  if (e.key.toLowerCase() === 'p') window.location.href = 'practice.html';
});

// ── Particle system ───────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H;
  const COLORS = ['rgba(74,222,128,', 'rgba(96,165,250,', 'rgba(251,146,60,'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 38;
  const particles = Array.from({ length: COUNT }, () => ({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    r:  Math.random() * 1.4 + 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.35 + 0.08,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    });

    // Draw faint connecting lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(74,222,128,${0.04 * (1 - dist/110)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Hook: update dashboard when timer.html saves a session ────
// script.js should call this after saving to localStorage:
//   localStorage.setItem('tm_sessions', ...); window.dispatchEvent(new Event('storage'));
window.addEventListener('storage', () => {
  renderStats();
  renderChart();
  renderSessions();
  renderStreak();
});

// ── Also hook into script.js showResults ─────────────────────
// When the results overlay fires in timer.html (same tab), it calls
// window.showResults(wpm, accuracy, chars) — we augment it here too
// by wiring recordSession into that same call from timer.html's inline script.
// timer.html's showResults already receives the values; we set a flag here
// so dashboard.js can be loaded on timer.html too as an optional future step.

// ── Init ──────────────────────────────────────────────────────
renderStreak();
renderStats();
renderSessions();
// Defer chart render until layout is settled
requestAnimationFrame(() => setTimeout(renderChart, 100));