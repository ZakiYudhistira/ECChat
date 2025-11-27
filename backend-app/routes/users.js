var express = require('express');
var router = express.Router();
const User = require('../models/User');
const Contact = require('../models/Contact');
const NonceChallenge = require('../models/NonceChallenge');
const elliptic = require('elliptic');
const EC = elliptic.ec;
const ec = new EC('secp256k1');
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// GET /login - send a random nonce as challenge
router.get('/login', async function(req, res, next) {
  try {
    let nonce;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      nonce = [...Array(32)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique nonce after multiple attempts');
      }
      
      const existingNonce = await NonceChallenge.findOne({ nonce });
      if (!existingNonce) {
        break;
      }
    } while (true);
    
    await NonceChallenge.create({ nonce });
    
    console.log('Nonce challenge generated:', nonce);
    res.json({ success: true, nonce });
  } catch (error) {
    console.error('Login Challenge Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate challenge', error: error.message });
  }
});

router.post('/challenge', async function(req, res, next) {
  const { username, nonce, signature } = req.body;
  
  try {
    // Validate input
    if (!username || !nonce || !signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, nonce, and signature are required'
      });
    }
    
    // Find and verify nonce exists and hasn't been used
    const nonceRecord = await NonceChallenge.findOne({ nonce, used: false });
    if (!nonceRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired nonce'
      });
    }
    
    // Find user and get public key
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found'
      });
    }
    
    // Verify signature
    
    
    try {
      const messageBytes = new TextEncoder().encode(nonce);
      const key = ec.keyFromPublic(user.publicKey, 'hex');
      
      // Parse r and s from hex signature
      const r = signature.slice(0, 64);
      const s = signature.slice(64, 128);
      const parsedSignature = { r: r, s: s };
      
      const isValid = key.verify(messageBytes, parsedSignature);
      
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid signature'
        });
      }

      // JWT Generation
      const token = jwt.sign({ 
          userId: user._id,
          username: user.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('JWT Token', token);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Delete the nonce from database after successful challenge
      await NonceChallenge.deleteOne({ nonce });
      
      console.log('Login successful for user:', username);
      res.json({ 
        success: true, 
        message: 'Login successful',
        username: user.username,
        token // Token on response
      });
      
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return res.status(400).json({ 
        success: false, 
        message: 'Signature verification failed'
      });
    }
    
  } catch (error) {
    console.error('Challenge verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Challenge verification failed',
      error: error.message
    });
  }
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

    // Create empty contact list for new user
    await Contact.create({
      username: username,
      contactList: [] // Start with empty contact list
    });

    console.log('New User Registered:');
    console.log('Username:', newUser.username);
    console.log('Public Key:', newUser.publicKey);
    console.log('Contact list created for user:', username);
    
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

router.post('/addcontact', async function(req, res, next) {

});

module.exports = router;