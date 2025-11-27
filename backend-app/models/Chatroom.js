const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: function(participants) {
        return participants.length === 2;
      },
      message: 'A chatroom is only allowed to have exactly 2 participants'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  participantsRead: {
    type: Map,
    of: Date,
    default: () => new Map()
  }
}, {
  _id: false
});

// Indexing for efficient querying
chatroomSchema.index({ participants: 1 });

// Chatroom ID generation from two usernames
chatroomSchema.statics.generateChatroomId = function(userA, userB) {
  // Sort usernames to ensure consistent ID
  const sorted = [userA, userB].sort();
  return `${sorted[0]}-${sorted[1]}`;
};

// Static method to find or create a chatroom
chatroomSchema.statics.findOrCreate = async function(userA, userB) {
  const chatroomId = this.generateChatroomId(userA, userB);
  
  let chatroom = await this.findById(chatroomId);
  
    if (!chatroom) {
    const participantsRead = new Map();
    participantsRead.set(userA, new Date());
    participantsRead.set(userB, new Date());
    
    chatroom = await this.create({
      _id: chatroomId,
      participants: [userA, userB].sort(),
      participantsRead: participantsRead
    });
  }
  
  return chatroom;
};

// Instance method to update last read timestamp for a user
chatroomSchema.methods.markAsRead = function(username) {
  if (!this.participants.includes(username)) {
    throw new Error('User is not a participant in this chatroom');
  }
  
  this.participantsRead.set(username, new Date());
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to check if user has unread messages
chatroomSchema.methods.hasUnreadMessages = function(username, lastMessageTime) {
  if (!lastMessageTime) return false;
  
  const lastRead = this.participantsRead.get(username);
  
  // If user has never read, and there are messages, it's unread
  if (!lastRead) return true;
  
  // If last message is after last read time, it's unread
  return new Date(lastMessageTime) > new Date(lastRead);
};

const Chatroom = mongoose.model('Chatroom', chatroomSchema);

module.exports = Chatroom;
