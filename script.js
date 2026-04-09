// ── Elements ────────────────────────────────────────────────
const textDisplay   = document.getElementById('text-display');
const input         = document.getElementById('hidden-input');
const restartButton = document.getElementById('restart');
const timeDisplay   = document.getElementById('time');
const wpmDisplay    = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');

// ── Constants ────────────────────────────────────────────────
const TOTAL_TIME = 60;

// ── State ────────────────────────────────────────────────────
let time        = TOTAL_TIME;
let interval    = null;
let started     = false;
let currentText = '';

// Cumulative counters — never reset between sentences
let totalCorrectChars = 0; // correct chars across ALL sentences
let totalTypedChars   = 0; // every char typed (right or wrong)

// ── Load a random sentence ───────────────────────────────────
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

// ── WPM calculation ──────────────────────────────────────────
// Standard: (correct chars / 5) / elapsed minutes
function calcWPM() {
  const elapsed = (TOTAL_TIME - time) / 60; // in minutes
  if (elapsed <= 0) return 0;
  return Math.round((totalCorrectChars / 5) / elapsed);
}

// ── Input handler ────────────────────────────────────────────
input.addEventListener('input', () => {

  // Start timer on first keystroke
  if (!started) {
    started = true;
    interval = setInterval(() => {
      time--;
      timeDisplay.innerText = time;
      // Update WPM every second while typing
      wpmDisplay.innerText = calcWPM();

      if (time <= 0) {
        clearInterval(interval);
        input.disabled = true;
        showFinalResults();
      }
    }, 1000);
  }

  const typed = input.value;
  const spans = textDisplay.querySelectorAll('span');

  // ── Mark each character ──────────────────────────────────
  spans.forEach((span, i) => {
    span.classList.remove('current', 'correct', 'wrong');
    const ch = typed[i];
    if (ch == null) return;               // not yet reached
    if (ch === span.innerText) span.classList.add('correct');
    else                       span.classList.add('wrong');
  });

  // Advance cursor
  if (typed.length < spans.length) {
    spans[typed.length].classList.add('current');
  }

  // ── Accuracy: based on all chars typed so far ────────────
  // Count correct chars in current input
  let correctNow = 0;
  spans.forEach((span, i) => {
    if (typed[i] != null && typed[i] === span.innerText) correctNow++;
  });

  // How many chars were typed since the last sentence ended
  const charsThisSentence = typed.length;

  // Accuracy = (cumulative correct + correct-so-far) / (cumulative typed + typed-so-far)
  const totalC = totalCorrectChars + correctNow;
  const totalT = totalTypedChars   + charsThisSentence;
  const accuracy = totalT === 0 ? 100 : Math.round((totalC / totalT) * 100);
  accuracyDisplay.innerText = accuracy;

  // Update live WPM
  wpmDisplay.innerText = calcWPM();

  // ── Sentence completed ───────────────────────────────────
  if (typed === currentText) {
    // Bank the stats for this sentence before loading next
    totalTypedChars   += typed.length;
    totalCorrectChars += correctNow;
    loadSentence();
  }
});

// ── Show results when time runs out ─────────────────────────
function showFinalResults() {
  const finalWPM      = calcWPM();
  const totalT        = totalTypedChars;
  const accuracy      = totalT === 0 ? 100 : Math.round((totalCorrectChars / totalT) * 100);

  // If timer.html has the results overlay, use it
  if (typeof window.showResults === 'function') {
    window.showResults(finalWPM, accuracy, totalCorrectChars);
  }
}

// ── Restart ──────────────────────────────────────────────────
restartButton.addEventListener('click', () => {
  clearInterval(interval);

  // Reset all state
  time              = TOTAL_TIME;
  started           = false;
  totalCorrectChars = 0;
  totalTypedChars   = 0;

  // Reset displays
  timeDisplay.innerText     = time;
  wpmDisplay.innerText      = 0;
  accuracyDisplay.innerText = 100;
  input.disabled            = false;

  loadSentence();
  input.focus();
});

// ── Init ─────────────────────────────────────────────────────
loadSentence();
input.focus();