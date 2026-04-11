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

// Standard net WPM: (correct chars / 5) / elapsed minutes
function calcWPM() {
  const elapsed = (TOTAL_TIME - time) / 60; // minutes
  if (elapsed <= 0) return 0;
  return Math.round((totalCorrectChars / 5) / elapsed);
}

// Blended accuracy across all sentences + current in-progress chars
function calcAccuracy(correctNow, typedNow) {
  const totalC = totalCorrectChars + correctNow;
  const totalT = totalTypedChars   + typedNow;
  return totalT === 0 ? 100 : Math.round((totalC / totalT) * 100);
}

// ── Load a random sentence ────────────────────────────────────
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

  // Start timer on first keystroke
  if (!started) {
    started = true;
    interval = setInterval(() => {
      time--;
      timeDisplay.innerText = time;
      wpmDisplay.innerText  = calcWPM(); // refresh WPM every second

      if (time <= 0) {
        clearInterval(interval);
        input.disabled = true;
        endTest();
      }
    }, 1000);
  }

  const typed = input.value;
  const spans = textDisplay.querySelectorAll('span');

  // Mark each character correct / wrong / untouched
  let correctNow = 0;
  spans.forEach((span, i) => {
    span.classList.remove('current', 'correct', 'wrong');
    const ch = typed[i];
    if (ch == null) return;
    if (ch === span.innerText) { span.classList.add('correct'); correctNow++; }
    else                         span.classList.add('wrong');
  });

  // Advance cursor caret
  if (typed.length < spans.length) {
    spans[typed.length].classList.add('current');
  }

  // Live stats update
  const accuracy = calcAccuracy(correctNow, typed.length);
  accuracyDisplay.innerText = accuracy;
  wpmDisplay.innerText      = calcWPM();

  // Sentence completed — bank stats, load next
  if (typed === currentText) {
    totalTypedChars   += typed.length;
    totalCorrectChars += correctNow;
    loadSentence();
  }
});

// ── End of test ───────────────────────────────────────────────
function endTest() {
  // Bank any partially typed chars from the current sentence
  const typed = input.value;
  const spans = textDisplay.querySelectorAll('span');
  let correctNow = 0;
  spans.forEach((span, i) => {
    if (typed[i] != null && typed[i] === span.innerText) correctNow++;
  });
  // Don't double-bank if sentence was completed exactly
  if (typed !== currentText) {
    totalTypedChars   += typed.length;
    totalCorrectChars += correctNow;
  }

  const finalWPM      = calcWPM();
  const finalAccuracy = totalTypedChars === 0
    ? 100
    : Math.round((totalCorrectChars / totalTypedChars) * 100);

  if (typeof window.showResults === 'function') {
    window.showResults(finalWPM, finalAccuracy, totalCorrectChars);
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