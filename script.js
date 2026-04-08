//elements
const textDisplay = document.getElementById('text-display');
const input = document.getElementById('hidden-input');
const restartButton = document.getElementById('restart');

//variables
let time = 60; //timer
let interval;
let started = false;
const timeDisplay = document.getElementById('time');
let totalTyped = 0; //wpm and accuracy
let totalCorrect = 0;
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
//state
let currentText = '';
//load random text
function loadsentence(){
    currentText = texts[Math.floor(Math.random() * texts.length)];
    textDisplay.innerHTML = '';
    currentText.split('').forEach((char,index) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (index === 0) span.classList.add('current');
        textDisplay.appendChild(span);
    });

input.value = "";
}
//input logic
input.addEventListener('input', () => {
    //timer
    if (!started) {
        started = true;

        interval = setInterval(() => {
            time--;
            timeDisplay.innerText = time;
            if (time <= 0) {
                clearInterval(interval);
                input.disabled = true;

}
        }, 1000);
    }

    const inputText = input.value;

    const spans = textDisplay.querySelectorAll('span');
    //wpm and accuracy
    totalTyped = inputText.length;
    totalCorrect = 0;
    spans.forEach((span,index) => {
        const char = inputText[index];
        span.classList.remove('current');
        if (char == null) {
            span.classList.remove('correct', 'wrong');
        } else if (char === span.innerText) {
            span.classList.add('correct');
            totalCorrect++;
        } else {
            span.classList.add('wrong');
        }
    });//move curdor
    if(inputText.length<spans.length){
        spans[inputText.length].classList.add('current');
    }
    //update wpm and accuracy
    let accuracy = totalTyped === 0 ? 0 : Math.round((totalCorrect / totalTyped) * 100);
    accuracyDisplay.innerText = accuracy;
    let wpm = Math.round((totalCorrect / 5) / ((60 - time) / 60));
    wpmDisplay.innerText = wpm;

    // move to next sentence
    if (inputText === currentText) {
        loadsentence();
    }
});
//restart
restartButton.addEventListener('click', () => {
    clearInterval(interval);
    time = 60;
    timeDisplay.innerText = time;
    totalTyped=0;
    totalCorrect=0;
    wpmDisplay.innerText=0;
    accuracyDisplay.innerText=100;
    started=false;
    input.value= "";
    input.disabled = false;
    loadsentence();
    input.focus();
});
loadsentence();

