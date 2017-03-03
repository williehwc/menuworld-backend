module.exports = function (app, mongo, autoIncrement, sha1, generateToken) {
  
  // Create user
  app.post('/users', function (req, res) {
    // Validation
    if (!req.body.email || !req.body.userName || !req.body.password)
      return res.sendStatus(400);
    // Query database: first, check if email or username already exists
    mongo.getDB().collection('users').count({
      $or: [{email: req.body.email}, {userName: req.body.userName}]
    }, function(err, count) {
      if (count > 0) {
        // Email or username already exists
        return res.sendStatus(403);
      }
      // Insert into database
      autoIncrement.getNextSequence(mongo.getDB(), 'users', function (err, autoIndex) {
        mongo.getDB().collection('users').insertOne({
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
    mongo.getDB().collection('foods').find({
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
  
  // Get user's private info (email, menus, recently-viewed foods)
  app.get('/users/:uid/private', function (req, res, next) {
    // Check if either admin or user ID matches that on token
    if (!req.admin && req.userID != parseInt(req.params.uid))
      return res.sendStatus(401);
    // Get recently-viewed foods
    req.viewed = [];
    mongo.getDB().collection('views').find({
      userID: parseInt(req.params.uid)
    }).sort({_id:-1}).limit(5).toArray(function(err, docs) {
      for (var i = 0; i < docs.length; i++) {
        req.viewed.push(docs[i].foodID);
      }
      next();
    });
  });
  
  app.get('/users/:uid/private', function (req, res) {
    // Get menus if owner
    if (req.owner) {
      var menus = [];
      mongo.getDB().collection('menus').find({
        ownerUserID: parseInt(req.params.uid)
      }).toArray(function(err, docs) {
        for (var i = 0; i < docs.length; i++) {
          menus.push(docs[i]._id);
        }
        res.json({
          email: req.email,
          foods: req.viewed,
          menus: menus
        });
      });
    } else {
      res.json({
        email: req.email,
        foods: req.viewed
      });
    }
  });
  
  // Suspend user
  app.delete('/users/:uid', function (req, res) {
    // Check if either admin or user ID matches that on token
    if (!req.admin && req.userID != parseInt(req.params.uid))
      return res.sendStatus(401);
    // Nullify user password
    mongo.getDB().collection('users').updateOne({
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
    mongo.getDB().collection('users').find({
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
      mongo.getDB().collection('users').count({
        email: req.body.email
      }, function(err, count) {
        if (count > 0) {
          // Email already exists
          return res.sendStatus(403);
        } else {
          mongo.getDB().collection('users').updateOne({
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
      mongo.getDB().collection('users').updateOne({
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
    mongo.getDB().collection('users').find({
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
  
}