var express = require('express');
var app = express();

// Enable CORS for the backend
// Don't do this if frontend and backend are on the same server
var cors = require('cors-express');
app.use(cors({}));

// MongoDB
var mongo = require('./mongo.js');
mongo.connectToServer(function(err) {
  // Database is ready; listen on port 3000
  app.listen(3000, function () {
    console.log('App listening on port 3000');
  });
});

// MongoDB auto-increment
var autoIncrement = require("mongodb-autoincrement");

// Array intersect
var intersect = require('intersect');

// SHA1
var sha1 = require('sha1');

// Reads bearer authorization token
var bearerToken = require('express-bearer-token');
app.use(bearerToken());

// JSON web token
var jwt = require('jwt-simple');
var secret = 'QbSqjf3v1V2sMHyeo27W';

// Function for generating token
var generateToken = function (userID) {
  var date = new Date();
  var payload = {
    userID: userID,
    exp: date.setHours(date.getHours() + 17532)
  };
  return jwt.encode(payload, secret);
};

// Function for parsing food JSON
var parseFood = function (food) {
  // PUT TOGETHER AR
  var ar = [];
  // Go through declared allergens
  for (var i = 0; i < food.allergens.length; i++) {
    ar.push({
      allergen: food.allergens[i],
      confirms: [],
      denys: []
    });
  }
  // Go through allergen reports
  for (var i = 0; i < food.allergenReports.length; i++) {
    for (var j = 0; j < ar.length; j++) {
      if (food.allergenReports[i].allergen == ar[i].allergen) {
        if (food.allergenReports[i].confirm) {
          ar[i].confirms.push(food.allergenReports[i].userID);
        } else {
          ar[i].denys.push(food.allergenReports[i].userID);
        }
      }
    }
  }
  return {
    foodID: food._id,
    foodName: food.foodName,
    menuID: food.menuID,
    photo: food.photo,
    likes: food.likeUserIDs,
    mealType: food.mealType,
    cuisine: food.cuisine,
    allergens: ar
  };
};

// Parse JSON and make sure that it's not empty
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
app.post('*', jsonParser, function (req, res, next) {
  if (!req.body) return res.sendStatus(400);
  next();
});

// Authentication
app.all('*', jsonParser, function (req, res, next) {
  if (req.token) {
    var decodedToken = jwt.decode(req.token, secret);
    if (decodedToken && new Date(decodedToken.exp) > new Date()) {
      // Check if user exists and is admin
      mongo.getDB().collection('users').find({
        _id: decodedToken.userID
      }).toArray(function(err, docs) {
        if (docs.length > 0) {
          req.userID = docs[0]._id;
          req.email = docs[0].email;
          req.owner = docs[0].owner;
          req.userName = docs[0].userName;
          req.admin = docs[0].admin;
        }
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Users endpoints
require('./users.js')(app, mongo, autoIncrement, sha1, generateToken, parseFood);

// Menus endpoints
require('./menus.js')(app, mongo, autoIncrement, parseFood);

// Foods endpoints
require('./foods.js')(app, mongo, autoIncrement, parseFood);

// Top searches
app.get('/top', function (req, res) {
  mongo.getDB().collection('searches').find().sort({count:-1}).limit(5).toArray(function(err, docs) {
    var searches = [];
    for (var i = 0; i < docs.length; i++) {
      searches.push(docs[i].keyword);
    }
    res.json({
      searches: searches
    });
  });
});

// Search
app.get(['/search/:keyword/:allergies', '/search/:keyword'], function (req, res, next) {
  var keyword = req.params.keyword.replace('+', ' ');
  // Create index (see https://code.tutsplus.com/tutorials/full-text-search-in-mongodb--cms-24835)
  mongo.getDB().collection('foods').createIndex({'foodName': 'text'}, null, function(err, indexName) {
    // Add to list of searches
    mongo.getDB().collection('searches').count({
      keyword: keyword
    }, function(err, count) {
      if (count > 0) {
        // Increment count
        mongo.getDB().collection('searches').updateOne({
          keyword: keyword
        }, {
          $inc: {count: 1}
        }, function(err, result) {
          next();
        });
      } else {
        // Insert count
        autoIncrement.getNextSequence(mongo.getDB(), 'searches', function (err, autoIndex) {
          mongo.getDB().collection('searches').insertOne({
            _id: autoIndex,
            keyword: keyword,
            count: 1
          }, function(err, result) {
            next();
          });
        });
      }
    });
  });
});

app.get(['/search/:keyword/:allergies', '/search/:keyword'], function (req, res) {
  var keyword = req.params.keyword.replace('+', ' ');
  // Assume each word is an allergy
  var allergies = null;
  if (req.params.allergies) {
    allergies = req.params.allergies.split('+');
  }
  // Perform search
  mongo.getDB().collection('foods').find({$text: {$search: keyword}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}}).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      if (!allergies || intersect(docs[i].allergens, allergies).length > 0) {
        foods.push(parseFood(docs[i]));
      }
    }
    res.json({
      foods: foods
    });
  });
});

// Popular (most-liked) foods
app.get('/popular', function (req, res) {
  mongo.getDB().collection('foods').find().sort({numLikes:-1}).limit(5).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(parseFood(docs[i]));
    }
    res.json({
      foods: foods
    });
  });
});

// Five last added foods
app.get('/latest', function (req, res) {
  mongo.getDB().collection('foods').find().sort({_id:-1}).limit(5).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(parseFood(docs[i]));
    }
    res.json({
      foods: foods
    });
  });
});