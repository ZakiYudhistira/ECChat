var express = require('express');
var router = express.Router();
const User = require('../models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST user registration */
router.post('/register', async function(req, res, next) {
  const { username, publicKey } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists'
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      publicKey
    });

    console.log('New User Registered:');
    console.log('Username:', newUser.username);
    console.log('Public Key:', newUser.publicKey);
    
    res.json({ 
      success: true, 
      message: 'User registered successfully',
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register user',
      error: error.message
    });
  }
});

module.exports = router;
