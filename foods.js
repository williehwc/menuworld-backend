module.exports = function (app, mongo, autoIncrement) {

  // Add food to menu
  app.post('/foods', function (req, res) {
    // Validation
    if (!req.body.menuID || !req.body.foodName || !req.body.mealType || !req.body.cuisine || !req.body.allergens || !Array.isArray(req.body.allergens))
      return res.sendStatus(400);
    var photo = null;
    if (req.body.photo)
      photo = req.body.photo
    // Query database (check if menuID is valid first)
    mongo.getDB().collection('menus').count({
      _id: req.body.menuID,
      ownerUserID: req.userID
    }, function(err, count) {
      if (count == 0) {
        return res.sendStatus(403);
      }
      // Insert into database
      autoIncrement.getNextSequence(mongo.getDB(), 'foods', function (err, autoIndex) {
        mongo.getDB().collection('foods').insertOne({
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
    // Endpoint for recording view
    // Check if food is valid first
    mongo.getDB().collection('foods').count({
      _id: parseInt(req.params.fid)
    }, function(err, count) {
      if (count == 0) {
        return res.sendStatus(403);
      }
      // Add view
      autoIncrement.getNextSequence(mongo.getDB(), 'views', function (err, autoIndex) {
        mongo.getDB().collection('views').insertOne({
          _id: autoIndex,
          foodID: parseInt(req.params.fid),
          userID: req.userID
        }, function(err, result) {
          next();
        });
      });
    });
  });
  
  app.get(['/foods/:fid', '/foods/:fid/view'], function (req, res) {
    mongo.getDB().collection('foods').find({
      _id: parseInt(req.params.fid)
    }).toArray(function(err, docs) {
      var food = docs[0];
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
      // Send JSON
      res.json({
        foodName: food.foodName,
        menuID: food.menuID,
        photo: food.photo,
        likes: food.likeUserIDs,
        mealType: food.mealType,
        cuisine: food.cuisine,
        allergens: ar
      });
    });
  });
  
  // Modify or delete food
  app.use('/foods/:fid', function (req, res, next) {
    // Check if menuID is valid
    // First, use foodID to get menuID
    mongo.getDB().collection('foods').find({
      _id: parseInt(req.params.fid)
    }).toArray(function(err, docs) {
      if (docs.length == 0)
        return res.sendStatus(403);
      // Got the menuID
      var menuID = docs[0].menuID;
      mongo.getDB().collection('menus').count({
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
    mongo.getDB().collection('foods').updateOne({
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
    mongo.getDB().collection('foods').deleteOne({
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
    mongo.getDB().collection('foods').updateOne({
      _id: parseInt(req.params.fid)
    }, {
      $pull: {allergenReports: {
        allergen: req.body.allergen,
        userID: req.userID
      }}
    }, function(err, result) {
      if (req.method == 'DELETE') {
        if (result.modifiedCount == 1) {
          res.sendStatus(200);
        } else {
          res.sendStatus(403);
        }
      } else {
        next();
      }
    });
  });
  
  // Report allergen
  app.post('/foods/:fid/allergen', function (req, res) {
    // First, make sure this allergen is valid
    mongo.getDB().collection('foods').count({
      _id: parseInt(req.params.fid),
      allergens: {$in: [req.body.allergen]}
    }, function(err, count) {
      if (count == 0) {
        return res.sendStatus(403);
      }
      // Add allergen report
      mongo.getDB().collection('foods').updateOne({
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
    mongo.getDB().collection('foods').updateOne({
      _id: parseInt(req.params.fid),
      likeUserIDs: {$nin: [req.userID]}
    }, {
      $push: {likeUserIDs: req.userID}
    }, function(err, result) {
      if (result.modifiedCount == 1) {
        // Increment numLikes by 1
        mongo.getDB().collection('foods').updateOne({
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
    mongo.getDB().collection('foods').updateOne({
      _id: parseInt(req.params.fid),
      likeUserIDs: {$in: [req.userID]}
    }, {
      $pull: {likeUserIDs: req.userID}
    }, function(err, result) {
      if (result.modifiedCount == 1) {
        // Decrement numLikes by 1
        mongo.getDB().collection('foods').updateOne({
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

}