const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Chatroom = require('../models/Chatroom')
const { verifyToken } = require('../middleware/auth');

router.get('/:chatroomId', verifyToken, async function(req, res, next) {
  try{
    const {chatroomId} = req.params;
    const username = req.user.username;

    const chatroom = await Chatroom.findById(chatroomId);

    if(!chatroom){
      return res.status(404).json({
        success: false,
        message: 'Chatroom not found'
      })
    }

    if(!chatroom.participants.includes(username)){
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chatroom'
      })
    }

    const { limit = 50, skip = 0 } = req.query;
    const messages = await Message.find({room_id: chatroomId})
      .sort({timestamp: -1})
      .limit(parseInt(limit))
      .skip(parseInt(skip))
    
    res.json({
      success: true,
      messages: messages.reverse(),
      count: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
})

module.exports = router;