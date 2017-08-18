const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const validator = require('express-validator');
const morgan = require('morgan');
const parseurl = require('parseurl');
const fs = require('fs');


const app = express();

app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(session({
  secret: 'letsgetwordy',
  resave: false,
  saveUnitialized: true
}));




//this is an array of strings
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
// console.log(words);
let wordList = words.filter(word => word.length > 4 && word.length <= 8);
let guessedLetters = [];

app.use((req, res, next) => {
  if (req.session.solve) { //if session has a random Word it will assign it to the session.
    return next(); //if not it  will generate one
  }
  let randomWord = wordList[Math.floor(Math.random() * wordList.length)]; //generates random word from list
  req.session.solve = randomWord;
  req.session.splitRandomWord = randomWord.split('');
  console.log(req.session.splitRandomWord);
  req.session.letterSpaces = Array(req.session.solve.length).fill(' _ ');
  req.session.totalGuesses = 8;
  next();
});



app.get('/', (req, res) => {
  let letterSpaces = Array(req.session.solve.length).fill(' _ ').join(''); //creates spaces for letters in random & joins them

  console.log(letterSpaces);
  res.render('index', {
    letterSpaces: req.session.letterSpaces.join(''),
    randomWord: req.session.solve,
    attempt: req.body.letter,
    guessedLetters: guessedLetters,
    guessesLeft: req.session.totalGuesses
  }); //displays spaces/guesses for random word
});

app.post('/guessed', (req, res) => {
  let attempt = req.body.letter;
  console.log(attempt);
  if(req.session.splitRandomWord.includes(attempt)){

    req.session.splitRandomWord.forEach(function(letter, index){
      if(attempt === letter){
        req.session.letterSpaces[index] = req.session.splitRandomWord[index];
      }
    });
  } else {
    req.session.totalGuesses --;
  }
  res.redirect('/');
});



app.listen(3000);
