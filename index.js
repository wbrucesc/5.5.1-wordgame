const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
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
app.use(expressValidator());

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


//if session has a random Word it will assign it to the session
//if not it will generate one
app.use((req, res, next) => {
  if (req.session.solve) {
    return next();
  }
  let randomWord = wordList[Math.floor(Math.random() * wordList.length)]; //generates random word
  req.session.solve = randomWord;                           //random word
  req.session.splitRandomWord = randomWord.split('');       //splits random word into own array
  console.log(req.session.splitRandomWord);
  req.session.letterSpaces = Array(req.session.solve.length).fill(' _ '); //creates blanks for random word
  req.session.totalGuesses = 8;                       //sets amount of guesses allowed
  req.session.guessedLettersArray = guessedLetters;   //letters guessed pushed into this array
  next();
});


app.get('/', (req, res) => {

  res.render('index', {
    letterSpaces: req.session.letterSpaces.join(''),
    // randomWord: req.session.solve,
    attempt: req.body.letter,
    guessedLetters: req.session.guessedLettersArray.join(' , '),
    guessesLeft: req.session.totalGuesses

  });
});

//defeat page displays if game is lost
app.get('/defeat', (req, res)=>{
  res.render('defeat', {randomWord: req.session.solve});
});

//success page displays if game is won
app.get('/success', (req, res)=>{
  res.render('success');
});

app.post('/guessed', (req, res) => {
  let attempt = req.body.letter;
  // console.log(attempt);
  req.checkBody('letter', "Guess must be 1 letter only!").notEmpty().isAlpha().isLength({
    min: 1,
    max: 1
  });

  let errors = req.validationErrors();

  if (req.session.splitRandomWord.includes(attempt)) { //if the split up random word includes letter you guess

    req.session.splitRandomWord.forEach((letter, index) => { //for each letter that matches split word letters display in place of blank space
      if (attempt === letter) {
        req.session.letterSpaces[index] = req.session.splitRandomWord[index];
      }
    });

//else if the letters you've already guessed doesn't contain the
//guessed letter then push to guessed letters array and lose a turn
//every new wrong letter deducts one turn
  } else {
    if (!req.session.guessedLettersArray.includes(attempt) && !errors) {
      req.session.guessedLettersArray.push(attempt);
      req.session.totalGuesses--;
    }
  }

  if (req.session.totalGuesses <= 0) {
    res.redirect('defeat');
  } else if (req.session.letterSpaces.join('') === req.session.solve && req.session.totalGuesses > 0){
    res.redirect('success');
  }

  if (errors) {
    res.render('index', {
      // randomWord: req.session.solve,
      letterSpaces: req.session.letterSpaces.join(''),
      guessedLetters: req.session.guessedLettersArray.join(' , '),
      guessesLeft: req.session.totalGuesses,
      errors: errors
    });


  } else {
    res.redirect('/');
  }
});


app.get('/newGame', (req, res) => {           //destroys session
  req.session.destroy(() => {
    res.redirect('/');
  });
});



app.listen(3000);
