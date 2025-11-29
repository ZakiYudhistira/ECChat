const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true
  },
  receiver: {
    type: String,
    required: true,
    trim: true
  },
  room_id: {
    type: String,
    required: true,
    index: true
  },
  encrypted_message: {
    type: String,
    required: true
  },
  message_hash: {
    type: String,
    required: true
  },
  signature: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

messageSchema.index({ room_id: 1, timestamp: 1 });

messageSchema.index({ sender: 1, receiver: 1 });

messageSchema.virtual('timestamp_iso').get(function() {
  return this.timestamp.toISOString();
});

messageSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  if (obj.timestamp instanceof Date) {
    obj.timestamp = obj.timestamp.toISOString();
  }
  
  return obj;
};

messageSchema.statics.getMessagesByRoom = function(roomId, limit = 50, skip = 0) {
  return this.find({ room_id: roomId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

messageSchema.statics.getMessagesBetweenUsers = function(user1, user2, limit = 50) {
  return this.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .exec();
};

messageSchema.statics.createFromClient = function(messageData) {
  return this.create({
    sender: messageData.sender,
    receiver: messageData.receiver,
    room_id: messageData.room_id,
    encrypted_message: messageData.encrypted_message,
    message_hash: messageData.message_hash,
    signature: messageData.signature,
    timestamp: new Date(messageData.timestamp)
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
