module.exports = function (app, mongo, autoIncrement) {
  
  // Create menu
  app.post('/menus', function (req, res) {
    // Validation
    if (!req.body.restaurantName || !req.body.menuName || !req.body.address)
      return res.sendStatus(400);
    if (!req.owner)
      return res.sendStatus(401);
    // Insert into database
    autoIncrement.getNextSequence(mongo.getDB(), 'menus', function (err, autoIndex) {
      mongo.getDB().collection('menus').insertOne({
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
    mongo.getDB().collection('menus').find({
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
    mongo.getDB().collection('foods').find({
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
    mongo.getDB().collection('menus').deleteOne({
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
    mongo.getDB().collection('menus').deleteMany({
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
    mongo.getDB().collection('menus').updateOne({
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
  
}