var express = require('express');
var app = express();

// Enable CORS for the backend
// Don't do this if frontend and backend are on the same server
var cors = require('cors-express');
app.use(cors({}));

// MongoDB variables
var MongoClient = require('mongodb').MongoClient;
var mongoURL = 'mongodb://localhost:27017/menuworld';
var db;

// MongoDB connect
MongoClient.connect(mongoURL, function(err, database) {
  db = database;
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
      db.collection('users').find({
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

// Create user
app.post('/users', function (req, res) {
  // Validation
  if (!req.body.email || !req.body.userName || !req.body.password)
    return res.sendStatus(400);
  // Query database: first, check if email or username already exists
  db.collection('users').count({
    $or: [{email: req.body.email}, {userName: req.body.userName}]
  }, function(err, count) {
    if (count > 0) {
      // Email or username already exists
      return res.sendStatus(403);
    }
    // Insert into database
    autoIncrement.getNextSequence(db, 'users', function (err, autoIndex) {
      db.collection('users').insertOne({
        _id: autoIndex,
        email: req.body.email,
        userName: req.body.userName,
        password: sha1(req.body.email + req.body.password),
        owner: Boolean(req.body.owner),
        admin: false
      }, function(err, result) {
        var token = generateToken(result.insertedId);
        res.json({
          userID: result.insertedId,
          token: token
        });
      });
    });
  });
});

// Get user's name, status and likes
app.get('/users/:uid', function (req, res) {
  // Find likes
  db.collection('foods').find({
    likeUserIDs: {$in: [parseInt(req.params.uid)]}
  }).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(docs[i]._id);
    }
    res.json({
      userName: req.userName,
      owner: req.owner,
      foods: foods
    });
  });
});

// Suspend user
app.delete('/users/:uid', function (req, res) {
  // Check if either admin or user ID matches that on token
  if (!req.admin && req.userID != parseInt(req.params.uid))
    return res.sendStatus(401);
  // Nullify user password
  db.collection('users').updateOne({
    _id: parseInt(req.params.uid)
  }, {
    $set: {password: null}
  }, function(err, result) {
    res.sendStatus(200);
  });
});

// Update user
app.put('/users/:uid', function (req, res, next) {
  // Check if either admin or user ID matches that on token
  if (!req.admin && req.userID != parseInt(req.params.uid))
    return res.sendStatus(401);
  // Validation
  if (!req.body.oldPassword || (!req.body.email && !req.body.password))
    return res.sendStatus(400);
  // Query database (check password)
  db.collection('users').find({
    _id: parseInt(req.params.uid),
    password: sha1(req.email + req.body.oldPassword)
  }).toArray(function(err, docs) {
    // If password not found
    if (docs.length == 0) {
      return res.sendStatus(403);
    } else {
      next();
    }
  });
});

app.put('/users/:uid', function (req, res, next) {
  // Change email, if specified
  if (req.body.email) {
    // Query database
    db.collection('users').count({
      email: req.body.email
    }, function(err, count) {
      if (count > 0) {
        // Email already exists
        return res.sendStatus(403);
      } else {
        db.collection('users').updateOne({
          _id: parseInt(req.params.uid)
        }, {
          $set: {email: req.body.email, password: sha1(req.body.email + req.body.oldPassword)}
        }, function(err, result) {
          next();
        });
      }
    });
  } else {
    next();
  }
});

app.put('/users/:uid', function (req, res) {
  // Change password, if specified
  if (req.body.password) {
    // Query database
    // Change email for salting if needed
    if (req.body.email) {
      req.email = req.body.email;
    }
    // Update password
    db.collection('users').updateOne({
      _id: parseInt(req.params.uid)
    }, {
      $set: {password: sha1(req.email + req.body.password)}
    }, function(err, result) {
      res.sendStatus(200);
    });
  } else {
    res.sendStatus(200);
  }
});

// Log in
app.post('/login', function (req, res) {
  // Validation
  if (!req.body.email || !req.body.password)
    return res.sendStatus(400);
  // Query database
  db.collection('users').find({
    email: req.body.email,
    password: sha1(req.body.email + req.body.password)
  }).toArray(function(err, docs) {
    if (docs.length == 0) {
      return res.sendStatus(403);
    }
    var token = generateToken(docs[0]._id);
    res.json({
      userID: docs[0]._id,
      token: token
    });
  });
});

// Create menu
app.post('/menus', function (req, res) {
  // Validation
  if (!req.body.restaurantName || !req.body.menuName || !req.body.address)
    return res.sendStatus(400);
  if (!req.owner)
    return res.sendStatus(401);
  // Insert into database
  autoIncrement.getNextSequence(db, 'menus', function (err, autoIndex) {
    db.collection('menus').insertOne({
      _id: autoIndex,
      restaurantName: req.body.restaurantName,
      ownerUserID: req.userID,
      menuName: req.body.menuName,
      address: req.body.address
    }, function(err, result) {
      res.json({
        menuID: result.insertedId
      });
    });
  });
});

// Get menu
app.get('/menus/:mid', function (req, res, next) {
  db.collection('menus').find({
    _id: parseInt(req.params.mid)
  }).toArray(function(err, docs) {
    if (docs.length == 0)
      return res.sendStatus(403);
    req.restaurantName = docs[0].restaurantName;
    req.menuName = docs[0].menuName;
    req.address = docs[0].address;
    next();
  });
});

app.get('/menus/:mid', function (req, res) {
  db.collection('foods').find({
    menuID: parseInt(req.params.mid)
  }).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(docs[i]._id);
    }
    res.json({
      restaurantName: req.restaurantName,
      menuName: req.menuName,
      address: req.address,
      foods: foods
    });
  });
});

// Delete menu
app.delete('/menus/:mid', function (req, res, next) {
  // Delete menu
  db.collection('menus').deleteOne({
    _id: parseInt(req.params.mid),
    ownerUserID: req.userID
  }, function(err, result) {
    if (result.deletedCount == 1) {
      // A menu was deleted
      next();
    } else {
      return res.sendStatus(403);
    }
  });
});

app.delete('/menus/:mid', function (req, res, next) {
  // Delete foods
  db.collection('menus').deleteMany({
    menuID: parseInt(req.params.mid)
  }, function(err, result) {
    res.sendStatus(200);
  });
});

// Update menu
app.put('/menus/:mid', function (req, res) {
  // Validation
  if (!req.body.restaurantName && !req.body.menuName && !req.body.address)
    return res.sendStatus(400);
  // Set update JSON
  var updateJSON = {};
  if (req.body.restaurantName)
    updateJSON.restaurantName = req.body.restaurantName;
  if (req.body.menuName)
    updateJSON.menuName = req.body.menuName;
  if (req.body.address)
    updateJSON.address = req.body.address;
  // Update
  db.collection('menus').updateOne({
    _id: parseInt(req.params.mid)
  }, {
    $set: updateJSON
  }, function(err, result) {
    if (result.matchedCount == 1) {
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  });
});

// Add food to menu
app.post('/foods', function (req, res) {
  // Validation
  if (!req.body.menuID || !req.body.foodName || !req.body.mealType || !req.body.cuisine || !req.body.allergens || !Array.isArray(req.body.allergens))
    return res.sendStatus(400);
  var photo = null;
  if (req.body.photo)
    photo = req.body.photo
  // Query database (check if menuID is valid first)
  db.collection('menus').count({
    _id: req.body.menuID,
    ownerUserID: req.userID
  }, function(err, count) {
    if (count == 0) {
      return res.sendStatus(403);
    }
    // Insert into database
    autoIncrement.getNextSequence(db, 'foods', function (err, autoIndex) {
      db.collection('foods').insertOne({
        _id: autoIndex,
        menuID: req.body.menuID,
        foodName: req.body.foodName,
        photo: photo,
        mealType: req.body.mealType,
        cuisine: req.body.cuisine,
        allergens: req.body.allergens,
        likeUserIDs: [],
        numLikes: 0,
        allergenReports: []
      }, function(err, result) {
        res.json({
          foodID: result.insertedId
        });
      });
    });
  });
});

// Get food details
app.get('/foods/:fid/view', function (req, res, next) {
  // Record view
  // Check if food is valid first
  db.collection('foods').count({
    _id: parseInt(req.params.fid)
  }, function(err, count) {
    if (count == 0) {
      return res.sendStatus(403);
    }
    autoIncrement.getNextSequence(db, 'views', function (err, autoIndex) {
      db.collection('views').insertOne({
        _id: autoIndex,
        foodID: req.params.fid,
        userID: req.userID
      }, function(err, result) {
        next();
      });
    });
  });
});

app.get(['/foods/:fid', '/foods/:fid/view'], function (req, res) {
  db.collection('foods').find({
    _id: parseInt(req.params.fid)
  }).toArray(function(err, docs) {
    res.sendStatus(200);
  });
});

// Modify or delete food
app.use('/foods/:fid', function (req, res, next) {
  // Check if menuID is valid
  // First, use foodID to get menuID
  db.collection('foods').find({
    _id: parseInt(req.params.fid)
  }).toArray(function(err, docs) {
    if (docs.length == 0)
      return res.sendStatus(403);
    // Got the menuID
    var menuID = docs[0].menuID;
    db.collection('menus').count({
      _id: menuID,
      ownerUserID: req.userID
    }, function(err, count) {
      if (count == 0)
        return res.sendStatus(403);
      next();
    });
  });
});

// Modify food
app.put('/foods/:fid', function (req, res) {
  // Validation
  if ((!req.body.foodName && !req.body.photo && !req.body.mealType && !req.body.cuisine && !req.body.allergens) || (req.body.allergens && !Array.isArray(req.body.allergens)))
    return res.sendStatus(400);
  // Set update JSON
  var updateJSON = {};
  if (req.body.foodName)
    updateJSON.foodName = req.body.foodName;
  if (req.body.photo)
    updateJSON.photo = req.body.photo;
  if (req.body.mealType)
    updateJSON.mealType = req.body.mealType;
  if (req.body.cuisine)
    updateJSON.cuisine = req.body.cuisine;
  if (req.body.allergens)
    updateJSON.allergens = req.body.allergens;
  // Query database (modify food)
  db.collection('foods').updateOne({
    _id: parseInt(req.params.fid)
  }, {
    $set: updateJSON
  }, function(err, result) {
    res.sendStatus(200);
  });
});

// Delete food
app.delete('/foods/:fid', function (req, res, next) {
  // Delete menu
  db.collection('foods').deleteOne({
    _id: parseInt(req.params.fid)
  }, function(err, result) {
    res.sendStatus(200);
  });
});

// Un-report allergen (also done before reporting allergen)
app.use('/foods/:fid/allergen', function (req, res, next) {
  // Validation
  if (!req.body.allergen)
    return res.sendStatus(400);
  db.collection('foods').updateOne({
    _id: parseInt(req.params.fid)
  }, {
    $pull: {allergenReports: {
      allergen: req.body.allergen,
      userID: req.userID
    }}
  }, function(err, result) {
    if (result.modifiedCount == 1) {
      if (req.method == 'DELETE')
        res.sendStatus(200);
      else
        next();
    } else {
      res.sendStatus(403);
    }
  });
});

// Report allergen
app.post('/foods/:fid/allergen', function (req, res) {
  // First, make sure this allergen is valid
  db.collection('foods').count({
    _id: parseInt(req.params.fid),
    allergens: {$in: [req.body.allergen]}
  }, function(err, count) {
    if (count == 0) {
      return res.sendStatus(403);
    }
    // Add allergen report
    db.collection('foods').updateOne({
      _id: parseInt(req.params.fid)
    }, {
      $addToSet: {allergenReports: {
        allergen: req.body.allergen,
        userID: req.userID,
        confirm: Boolean(req.body.confirm)
      }}
    }, function(err, result) {
      if (result.modifiedCount == 1) {
        res.sendStatus(200);
      } else {
        res.sendStatus(403);
      }
    });
  });
});

// Like food
app.post('/foods/:fid/like', function (req, res) {
  db.collection('foods').updateOne({
    _id: parseInt(req.params.fid),
    likeUserIDs: {$nin: [req.userID]}
  }, {
    $push: {likeUserIDs: req.userID}
  }, function(err, result) {
    if (result.modifiedCount == 1) {
      // Increment numLikes by 1
      db.collection('foods').updateOne({
        _id: parseInt(req.params.fid)
      }, {
        $inc: {numLikes: 1}
      }, function(err, result) {
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(403);
    }
  });
});

// Un-like food
app.delete('/foods/:fid/like', function (req, res) {
  db.collection('foods').updateOne({
    _id: parseInt(req.params.fid),
    likeUserIDs: {$in: [req.userID]}
  }, {
    $pull: {likeUserIDs: req.userID}
  }, function(err, result) {
    if (result.modifiedCount == 1) {
      // Decrement numLikes by 1
      db.collection('foods').updateOne({
        _id: parseInt(req.params.fid)
      }, {
        $inc: {numLikes: -1}
      }, function(err, result) {
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(403);
    }
  });
});

// Popular (most-liked) foods
app.get('/popular', function (req, res) {
  db.collection('foods').find().sort({numLikes:-1}).limit(5).toArray(function(err, docs) {
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
  db.collection('foods').find().sort({_id:-1}).limit(5).toArray(function(err, docs) {
    var foods = [];
    for (var i = 0; i < docs.length; i++) {
      foods.push(docs[i]._id);
    }
    res.json({
      foods: foods
    });
  });
});