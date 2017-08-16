//imports//
var Twit = require('twit');
var config = require('./config');
//imports//

//global variables//
var T = new Twit(config["twit"]);
var stream = T.stream('statuses/filter', {follow: 25073877});
var wordCount;
var GetParams = {
  user_id: 25073877,
  count: 200,
  trim_user: 1,
  include_rts: 0,
}
//global variables//

 //main functions//
function markovit(source_array, return_len) { // TODO: redesign to work with char limits, like twitter is supposed to
  var word_freq = wordlistgen(source_array);
  var currentWord = randFromArray(source_array).split(" ")[0]; // initializes the current word as a random starting word
  var result = strip(currentWord);
  var nextWord;

  for (var i = 1; i < return_len; i++) {
    var possibilities = word_freq[currentWord];
    if (possibilities.length > 0) {
      nextWord = randFromArray(possibilities);
    } else { // if there are no following words available, end the sentence and start another.
      if (!/[!.?]/.test(result.slice(-1))) result += ".";
      nextWord = randFromArray(source_array).split(" ")[0];
    }
    result += " " + strip(nextWord);
    currentWord = nextWord;
  }
  if (/[.,!?&;:@]/.test(result.slice(-1))) {
    if (/[.!?]/.test(result.slice(-1))) return result;
    else result = result.substring(0, result.length - 1);
  }
  return result + ".";
}

function wordlistgen(array) {
  var word_freq = {};
  array.forEach(function(item) {
    var words = item.split(" "); //splits string into words
    words.forEach(function(word) { // if the word is not in word_freq, add it
      if (Object.keys(word_freq).indexOf(word) == -1) word_freq[word] = [];
    });
    for (var i = 0; i < words.length; i++) { // populate word_freq
      currentWord = words[i];
      if (i < (words.length - 1)) { //exclude the last word
        nextWord = words[i + 1];
        word_freq[currentWord].push(nextWord);
      }
    }
  });
  return word_freq;
}

function receivedData(err, data, response) {
  var tweets = [];
  data.forEach(function(item) {
    tweets.push(item['text']);
  });
  setCount(6, 20);
  var tweet = checkTweet(markovit(tweets, wordCount), tweets);
  T.post('statuses/update', { status: tweet }, function(err, data, response) {
  });
}

function setCount(min, max) {
  wordCount = Math.random() * (max - min) + min;
}

function markovTweet() {
  T.get('statuses/user_timeline', GetParams, receivedData);
}
//main functions//

//helper functions//
function randFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function stringToArray(string) {
  return string.split(".");
}

function strip(string) { // generator messes up parentheses/quotes easily
  output = string.replace("\[\(\)\]", "");
  output = string.replace("\"", "");
  output = string.replace("\&amp", "");
  return output;
}

function checkTweet(tweet, input) {
  if (tweet.length <= 140 && tweet != undefined) return tweet;
  else checkTweet(markovit(input, wordCount));
}
//helper functions//

stream.on('tweet', function(tweet) {
  if (tweet["user"]["screen_name"] == "realDonaldTrump") {
      markovTweet();
  }
});
