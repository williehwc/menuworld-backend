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
    exp: date.setHours(date.getHours() + 24)
  };
  return jwt.encode(payload, secret);
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
require('./users.js')(app, mongo, autoIncrement, sha1, generateToken);

// Menus endpoints
require('./menus.js')(app, mongo, autoIncrement);

// Menus endpoints
require('./foods.js')(app, mongo, autoIncrement);

// Popular (most-liked) foods
app.get('/popular', function (req, res) {
  mongo.getDB().collection('foods').find().sort({numLikes:-1}).limit(5).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(docs[i]._id);
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
      foods.push(docs[i]._id);
    }
    res.json({
      foods: foods
    });
  });
});