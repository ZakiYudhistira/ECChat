const express = require('express');
const router = express.Router();
const Chatroom = require('../models/Chatroom');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// GET /chatroom/:username - Get all chatrooms for a user
router.get('/:username', verifyToken, async function(req, res, next) {
  try {
    const { username } = req.params;
    
    // Username verification
    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot access chatrooms for other users'
      });
    }
    
    // Find all chatrooms where the user is a participant
    const chatrooms = await Chatroom.find({
      participants: username
    }).sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      chatrooms,
      totalChatrooms: chatrooms.length
    });
  } catch (error) {
    console.error('Get chatrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chatrooms',
      error: error.message
    });
  }
});

// POST /chatroom/create - Create or get existing chatroom between two users
router.post('/create', verifyToken, async function(req, res, next) {
  try {
    const { userA, userB } = req.body;
    
    // Validate input
    if (!userA || !userB) {
      return res.status(400).json({
        success: false,
        message: 'Both userA and userB are required'
      });
    }
    
    // Verify the authenticated user is one of the participants
    if (req.user.username !== userA && req.user.username !== userB) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You must be one of the participants'
      });
    }
    
    // Check if trying to create chatroom with themselves
    if (userA === userB) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a chatroom with yourself'
      });
    }
    
    // Verify both users exist
    const [userAExists, userBExists] = await Promise.all([
      User.findOne({ username: userA }),
      User.findOne({ username: userB })
    ]);
    
    if (!userAExists) {
      return res.status(404).json({
        success: false,
        message: `User ${userA} not found`
      });
    }
    
    if (!userBExists) {
      return res.status(404).json({
        success: false,
        message: `User ${userB} not found`
      });
    }
    
    // Find or create chatroom
    const chatroom = await Chatroom.findOrCreate(userA, userB);
    
    console.log(`Chatroom created/found: ${chatroom._id}`);
    
    res.json({
      success: true,
      message: 'Chatroom ready',
      chatroom
    });
    
  } catch (error) {
    console.error('Create chatroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chatroom',
      error: error.message
    });
  }
});

// GET /chatroom/between/:userA/:userB - Get specific chatroom between two users
router.get('/between/:userA/:userB', verifyToken, async function(req, res, next) {
  try {
    const { userA, userB } = req.params;
    
    // Verify the authenticated user is one of the participants
    if (req.user.username !== userA && req.user.username !== userB) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You must be one of the participants'
      });
    }
    
    const chatroomId = Chatroom.generateChatroomId(userA, userB);
    const chatroom = await Chatroom.findById(chatroomId);
    
    if (!chatroom) {
      return res.status(404).json({
        success: false,
        message: 'Chatroom not found'
      });
    }
    
    res.json({
      success: true,
      chatroom
    });
    
  } catch (error) {
    console.error('Get chatroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chatroom',
      error: error.message
    });
  }
});

// PUT /chatroom/:chatroomId/read - Mark chatroom as read for the authenticated user
router.put('/:chatroomId/read', verifyToken, async function(req, res, next) {
  try {
    const { chatroomId } = req.params;
    const username = req.user.username;
    
    const chatroom = await Chatroom.findById(chatroomId);
    
    if (!chatroom) {
      return res.status(404).json({
        success: false,
        message: 'Chatroom not found'
      });
    }
    
    // Verify the user is a participant
    if (!chatroom.participants.includes(username)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this chatroom'
      });
    }
    
    // Mark as read
    await chatroom.markAsRead(username);
    
    console.log(`Chatroom ${chatroomId} marked as read by ${username}`);
    
    res.json({
      success: true,
      message: 'Chatroom marked as read',
      lastRead: chatroom.participantsRead.get(username)
    });
    
  } catch (error) {
    console.error('Mark chatroom as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark chatroom as read',
      error: error.message
    });
  }
});

module.exports = router;
