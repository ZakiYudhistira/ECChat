const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

// GET /messages/:roomId - Get all messages for a specific chatroom
router.get('/:roomId', verifyToken, async function(req, res, next) {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Get messages for the room
    const messages = await Message.getMessagesByRoom(
      roomId, 
      parseInt(limit), 
      parseInt(skip)
    );
    
    // Convert to plain objects with proper format
    const formattedMessages = messages.map(msg => msg.toJSON());
    
    res.json({
      success: true,
      messages: formattedMessages,
      totalMessages: messages.length,
      roomId
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message
    });
  }
});

// POST /messages - Save a new message
router.post('/', verifyToken, async function(req, res, next) {
  try {
    const messageData = req.body;
    
    // Verify the authenticated user is the sender
    if (req.user.username !== messageData.sender) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot send messages as another user'
      });
    }
    
    // Create message in database
    const message = await Message.createFromClient(messageData);
    
    console.log(`Message saved: ${message._id}`);
    
    res.json({
      success: true,
      message: 'Message saved',
      data: message.toJSON()
    });
    
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message',
      error: error.message
    });
  }
});

module.exports = router;
