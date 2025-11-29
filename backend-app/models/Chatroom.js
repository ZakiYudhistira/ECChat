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

chatroomSchema.index({ participants: 1 });

chatroomSchema.statics.generateChatroomId = function(userA, userB) {
  const sorted = [userA, userB].sort();
  return `${sorted[0]}-${sorted[1]}`;
};

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

chatroomSchema.methods.markAsRead = function(username) {
  if (!this.participants.includes(username)) {
    throw new Error('User is not a participant in this chatroom');
  }
  
  this.participantsRead.set(username, new Date());
  this.updatedAt = new Date();
  return this.save();
};

chatroomSchema.methods.hasUnreadMessages = function(username, lastMessageTime) {
  if (!lastMessageTime) return false;
  
  const lastRead = this.participantsRead.get(username);
  
  if (!lastRead) return true;
  
  return new Date(lastMessageTime) > new Date(lastRead);
};

const Chatroom = mongoose.model('Chatroom', chatroomSchema);

module.exports = Chatroom;
