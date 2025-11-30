const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
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
    trim: true
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
    default: Date.now
  }
}, {
  timestamps: true
});

// Room ID index
messageSchema.index({ room_id: 1, timestamp: -1 });

// Index for sender/receiver 
messageSchema.index({ sender: 1, receiver: 1 });

messageSchema.statics.createFromClient = function(messageData) {
  return new this({
    sender: messageData.sender,
    receiver: messageData.receiver,
    room_id: messageData.room_id,
    encrypted_message: messageData.encrypted_message,
    message_hash: messageData.message_hash,
    signature: messageData.signature,
    timestamp: messageData.timestamp ? new Date(messageData.timestamp) : new Date()
  });
};

messageSchema.statics.getMessagesByRoom = async function(roomId, skip = 0, limit = 50) {
  return this.find({ room_id: roomId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj._id = obj._id.toString();
  return obj;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
