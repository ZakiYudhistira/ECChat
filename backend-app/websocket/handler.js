const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Chatroom = require('../models/Chatroom');

const clients = new Map();

function initializeWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    let username = null;

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      username = decoded.username;

      // Store connection
      clients.set(username, ws);
      console.log(`[WebSocket] User connected: ${username} (Total: ${clients.size})`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to chat server',
        username: username
      }));

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await handleMessage(ws, username, message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        clients.delete(username);
        console.log(`[WebSocket] User disconnected: ${username} (Total: ${clients.size})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for ${username}:`, error);
        clients.delete(username);
      });

    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  console.log('[WebSocket] Server initialized');
}

async function handleMessage(ws, senderUsername, message) {
  const { type } = message;

  switch (type) {
    case 'new_message':
      await handleNewMessage(ws, senderUsername, message);
      break;

    case 'typing':
      await handleTyping(senderUsername, message);
      break;

    case 'read_receipt':
      await handleReadReceipt(senderUsername, message);
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }));
  }
}

async function handleNewMessage(ws, senderUsername, data) {
  try {
    const { message: messageData } = data;
    const { sender, receiver, room_id, encrypted_message, message_hash, signature, timestamp } = messageData;

    // Validate sender matches authenticated user
    if (sender !== senderUsername) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Sender mismatch'
      }));
      return;
    }

    // Verify chatroom exists and user is participant
    const chatroom = await Chatroom.findById(room_id);
    if (!chatroom || !chatroom.participants.includes(senderUsername)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid chatroom or unauthorized'
      }));
      return;
    }

    // Save message to database
    const newMessage = new Message({
      sender,
      receiver,
      room_id,
      encrypted_message,
      message_hash,
      signature,
      timestamp: new Date(timestamp)
    });

    await newMessage.save();
    console.log(`[WebSocket] Message saved: ${sender} -> ${receiver}`);

    // Prepare message to send
    const savedMessageData = {
      _id: newMessage._id.toString(),
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      room_id: newMessage.room_id,
      encrypted_message: newMessage.encrypted_message,
      message_hash: newMessage.message_hash,
      signature: newMessage.signature,
      timestamp: newMessage.timestamp.toISOString(),
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString()
    };

    // Send confirmation to sender
    ws.send(JSON.stringify({
      type: 'message_sent',
      message: savedMessageData,
      status: 'delivered'
    }));

    // Forward to receiver if online
    const receiverWs = clients.get(receiver);
    if (receiverWs && receiverWs.readyState === receiverWs.OPEN) {
      receiverWs.send(JSON.stringify({
        type: 'new_message',
        message: savedMessageData
      }));
      console.log(`[WebSocket] Message forwarded to ${receiver} (online)`);
    } else {
      console.log(`[WebSocket] Message saved for ${receiver} (offline)`);
    }

    // Update chatroom's updatedAt timestamp
    chatroom.updatedAt = new Date();
    await chatroom.save();

  } catch (error) {
    console.error('[WebSocket] Error handling new message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process message'
    }));
  }
}

async function handleTyping(senderUsername, data) {
  try {
    const { receiver, room_id } = data;

    // Forward typing indicator to receiver if online
    const receiverWs = clients.get(receiver);
    if (receiverWs && receiverWs.readyState === receiverWs.OPEN) {
      receiverWs.send(JSON.stringify({
        type: 'typing',
        sender: senderUsername,
        room_id
      }));
    }
  } catch (error) {
    console.error('[WebSocket] Error handling typing indicator:', error);
  }
}

async function handleReadReceipt(senderUsername, data) {
  try {
    const { message_id, receiver } = data;

    // Forward read receipt to receiver if online
    const receiverWs = clients.get(receiver);
    if (receiverWs && receiverWs.readyState === receiverWs.OPEN) {
      receiverWs.send(JSON.stringify({
        type: 'read_receipt',
        message_id,
        reader: senderUsername
      }));
    }
  } catch (error) {
    console.error('[WebSocket] Error handling read receipt:', error);
  }
}

// Helper function to send message to specific user
function sendToUser(username, data) {
  const ws = clients.get(username);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}

module.exports = { initializeWebSocket, sendToUser };