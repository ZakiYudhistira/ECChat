var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST user registration */
router.post('/register', function(req, res, next) {
  const { username, publicKey } = req.body;
  
  console.log('Registration Request:');
  console.log('Username:', username);
  console.log('Public Key:', publicKey);
  
  res.json({ 
    success: true, 
    message: 'Registration data received',
    username: username
  });
});

module.exports = router;
