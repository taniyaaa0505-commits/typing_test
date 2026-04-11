// ── Elements ─────────────────────────────────────────────────
const textDisplay     = document.getElementById('text-display');
const input           = document.getElementById('hidden-input');
const restartButton   = document.getElementById('restart');
const timeDisplay     = document.getElementById('time');
const wpmDisplay      = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');

// ── Constants ─────────────────────────────────────────────────
const TOTAL_TIME = 60;

// ── State ─────────────────────────────────────────────────────
let time        = TOTAL_TIME;
let interval    = null;
let started     = false;
let currentText = '';

// Cumulative counters — banked after every completed sentence
let totalCorrectChars = 0;
let totalTypedChars   = 0;

// ── Helpers ───────────────────────────────────────────────────
function calcWPM() {
  const elapsed = (TOTAL_TIME - time) / 60;
  if (elapsed <= 0) return 0;
  return Math.round((totalCorrectChars / 5) / elapsed);
}

function calcAccuracy(correctNow, typedNow) {
  const totalC = totalCorrectChars + correctNow;
  const totalT = totalTypedChars   + typedNow;
  return totalT === 0 ? 100 : Math.round((totalC / totalT) * 100);
}

// ── Load sentence ─────────────────────────────────────────────
function loadSentence() {
  currentText = texts[Math.floor(Math.random() * texts.length)];
  textDisplay.innerHTML = '';
  currentText.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.innerText = char;
    if (i === 0) span.classList.add('current');
    textDisplay.appendChild(span);
  });
  input.value = '';
}

// ── Input handler ─────────────────────────────────────────────
input.addEventListener('input', () => {

  if (!started) {
    started = true;
    interval = setInterval(() => {
      time--;
      timeDisplay.innerText = time;
      wpmDisplay.innerText  = calcWPM();
      if (time <= 0) {
        clearInterval(interval);
        input.disabled = true;
        endTest();
      }
    }, 1000);
  }

  const typed = input.value;
  const spans = textDisplay.querySelectorAll('span');

  let correctNow = 0;
  spans.forEach((span, i) => {
    span.classList.remove('current', 'correct', 'wrong');
    const ch = typed[i];
    if (ch == null) return;
    if (ch === span.innerText) { span.classList.add('correct'); correctNow++; }
    else                         span.classList.add('wrong');
  });

  if (typed.length < spans.length) {
    spans[typed.length].classList.add('current');
  }

  const accuracy = calcAccuracy(correctNow, typed.length);
  accuracyDisplay.innerText = accuracy;
  wpmDisplay.innerText      = calcWPM();

  if (typed === currentText) {
    totalTypedChars   += typed.length;
    totalCorrectChars += correctNow;
    loadSentence();
  }
});

// ── End of test ───────────────────────────────────────────────
function endTest() {
  // Bank partial sentence
  const typed = input.value;
  const spans = textDisplay.querySelectorAll('span');
  let correctNow = 0;
  spans.forEach((span, i) => {
    if (typed[i] != null && typed[i] === span.innerText) correctNow++;
  });
  if (typed !== currentText) {
    totalTypedChars   += typed.length;
    totalCorrectChars += correctNow;
  }

  const finalWPM      = calcWPM();
  const finalAccuracy = totalTypedChars === 0
    ? 100
    : Math.round((totalCorrectChars / totalTypedChars) * 100);
  const finalNet = Math.round(finalWPM * (finalAccuracy / 100));

  // ── Persist to localStorage for dashboard ────────────────
  saveSession(finalWPM, finalAccuracy, finalNet);

  if (typeof window.showResults === 'function') {
    window.showResults(finalWPM, finalAccuracy, totalCorrectChars);
  }
}

// ── Save session to localStorage ──────────────────────────────
function saveSession(wpm, accuracy, net) {
  try {
    // Sessions array
    const raw = localStorage.getItem('tm_sessions');
    const sessions = raw ? JSON.parse(raw) : [];
    sessions.push({ wpm, accuracy, net, date: new Date().toISOString() });
    if (sessions.length > 20) sessions.splice(0, sessions.length - 20);
    localStorage.setItem('tm_sessions', JSON.stringify(sessions));

    // Personal bests
    if (wpm > (parseInt(localStorage.getItem('tm_bestWpm')) || 0))
      localStorage.setItem('tm_bestWpm', wpm);
    if (accuracy > (parseInt(localStorage.getItem('tm_bestAcc')) || 0))
      localStorage.setItem('tm_bestAcc', accuracy);
    if (net > (parseInt(localStorage.getItem('tm_bestNet')) || 0))
      localStorage.setItem('tm_bestNet', net);

    // Streak
    const today = new Date().toDateString();
    const rawStreak = localStorage.getItem('tm_streak');
    const streak = rawStreak ? JSON.parse(rawStreak) : { count: 0, lastDate: null };
    if (streak.lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newCount = streak.lastDate === yesterday.toDateString()
        ? streak.count + 1 : 1;
      localStorage.setItem('tm_streak', JSON.stringify({ count: newCount, lastDate: today }));
    }
  } catch(e) {
    console.warn('Could not save session:', e);
  }
}

// ── Restart ───────────────────────────────────────────────────
restartButton.addEventListener('click', () => {
  clearInterval(interval);
  time              = TOTAL_TIME;
  started           = false;
  totalCorrectChars = 0;
  totalTypedChars   = 0;
  interval          = null;
  timeDisplay.innerText     = time;
  wpmDisplay.innerText      = 0;
  accuracyDisplay.innerText = 100;
  input.disabled            = false;
  loadSentence();
  input.focus();
});

// ── Init ──────────────────────────────────────────────────────
loadSentence();
input.focus();