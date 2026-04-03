const textDisplay = document.getElementById("text-display");
const input = document.getElementById("hidden-input");
const currentLetterDisplay = document.getElementById("current-letter");
const popup = document.getElementById('completion-popup');
const restartBtn = document.getElementById('restart-btn');
const alphabets = {
a:["apple","ant","angle","animal","arrow",'admire','aromatic','abacus','anchor'],
b:["ball","bat","banana","book","butterfly",'bingo','benzene','blackberry','beauties'],
c:["capture","curtain","chair","cake","cloud",'camera','creative','costume','community','colorful','coffee'],
d:["discourage","dinner","develop","desperate","dolphin",'debate','decorate','discriminate','downward'],
e:["encouraging","enthusiatic","expensive","extraordinary","engine",'eccentric','electrifying','established'],
f:["fish","frog","flower","flag","fire"],
g:["goat","grape","guitar","garden","ghost"],
h:["hat","house","horse","heart","home"],
i:["ice","icecream","igloo","island","iron"],
j:["jacket","juice","jungle","jellyfish","jar"],
k:["kite","kangaroo","key","king","kitchen"],
l:["lion","lamp","leaf","lollipop","lake"],
m:["monkey","moon","mountain","mouse","milk"],
n:["nose","nest","night","nurse","net"],
o:["orange","octopus","ocean","owl","oven"],
p:["pig","pen","pizza","pencil","pumpkin"],
q:["queen","quilt","question","quokka","quiver"],
r:["rabbit","rainbow","river","rose","robot"],
s:["sun","star","snake","shoe","snow"],
t:["tiger","tree","table","train","turtle"],
u:["umbrella","unicorn","uniform","utensil","ukulele"],
v:["violin","vase","volcano","vulture","van"],
w:["wolf","window","watermelon","whale","wheel"],
x:["xylophone","xray","xerox","xenon","xenophobia"],
y:["yacht","yellow","yogurt","yard","yak"],
z:["zebra","zoo","zipper","zero","zucchini"]
};

const letters = "abcdefghijklmnopqrstuvwxyz".split("");

let currentLetterIndex = 0;
let wordIndex = 0;
let currentword = "";
let wordsCompleted = 0;

function loadWord(){

const currentLetter = letters[currentLetterIndex];
const words = alphabets[currentLetter];

currentword = words[wordIndex];

currentLetterDisplay.textContent = "Letter : " + currentLetter.toUpperCase();

renderWord("");

input.value = "";

}

function renderWord(typed){

let html="";

for(let i=0;i<currentword.length;i++){

if(i < typed.length){

if(typed[i] === currentword[i]){
html += `<span class="correct">${currentword[i]}</span>`;
}else{
html += `<span class="wrong">${currentword[i]}</span>`;
}

}
else if(i === typed.length){

html += `<span class="current">${currentword[i]}</span>`;

}
else{

html += currentword[i];

}

}

textDisplay.innerHTML = html;

}

input.addEventListener("input",()=>{

const typed = input.value;

renderWord(typed);

if(typed === currentword){

wordsCompleted++;
wordIndex++;

if(wordsCompleted === 5){
currentLetterIndex++;
wordIndex=0;
wordsCompleted=0;
if(currentLetterIndex === letters.length){
popup.classList.remove('hidden');
input.disabled = true;
return;
}
}

loadWord();

}

});

document.addEventListener("keydown",(e)=>{

document.querySelectorAll(".key").forEach(key=>{

if(key.textContent === e.key){
key.classList.add("pressed");
}

});

});

document.addEventListener("keyup",(e)=>{

document.querySelectorAll(".key").forEach(key=>{

if(key.textContent === e.key){
key.classList.remove("pressed");
}

});

});

loadWord();

restartBtn.addEventListener('click', () => {
currentLetterIndex = 0;
wordIndex = 0;
wordsCompleted = 0;
popup.classList.add('hidden');
input.disabled = false;
input.value = "";
loadWord();
input.focus();
});