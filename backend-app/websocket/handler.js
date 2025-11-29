const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

/**
 * Clients mapping (keeping track of connected users)
 */
const clients = new Map();

/**
 * Broadcast message to specific user
 */
function sendToUser(username, message) {
  const ws = clients.get(username);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

/**
 * Handle new message - save to DB and forward to recipient
 */
async function handleNewMessage(senderUsername, messageData) {
  try {
    // Validate message structure
    if (!messageData.sender || !messageData.receiver || !messageData.encrypted_message) {
      throw new Error('Invalid message structure');
    }
    
    // Verify sender matches authenticated user
    if (messageData.sender !== senderUsername) {
      throw new Error('Sender mismatch');
    }
    
    // Save message to database
    const savedMessage = await Message.createFromClient(messageData);
    console.log(`[WS] Message saved to DB:`, savedMessage._id);
    
    // Prepare message for forwarding
    const forwardMessage = {
      type: 'new_message',
      data: savedMessage.toJSON()
    };
    
    // Send to receiver if online
    const sentToReceiver = sendToUser(messageData.receiver, forwardMessage);
    if (sentToReceiver) {
      console.log(`[WS] Message forwarded to ${messageData.receiver}`);
    } else {
      console.log(`[WS] Receiver ${messageData.receiver} is offline - message queued in DB`);
    }
    
    // Send confirmation back to sender
    sendToUser(senderUsername, {
      type: 'message_sent',
      data: {
        messageId: savedMessage._id,
        timestamp: savedMessage.timestamp,
        status: sentToReceiver ? 'delivered' : 'queued'
      }
    });
    
  } catch (error) {
    console.error('[WS] Error handling new message:', error);
    sendToUser(senderUsername, {
      type: 'error',
      message: error.message || 'Failed to send message'
    });
  }
}

/**
 * Handle typing indicator
 */
function handleTypingIndicator(username, data) {
  const { receiver, isTyping } = data;
  
  sendToUser(receiver, {
    type: 'typing',
    data: {
      username,
      isTyping
    }
  });
}

/**
 * Handle read receipt
 */
function handleReadReceipt(username, data) {
  const { sender, messageId } = data;
  
  sendToUser(sender, {
    type: 'read_receipt',
    data: {
      reader: username,
      messageId
    }
  });
}

/**
 * Handle incoming WebSocket messages
 */
async function handleMessage(ws, username, data) {
  try {
    const message = JSON.parse(data);
    
    console.log(`[WS] Message from ${username}:`, message.type);
    
    switch (message.type) {
      case 'new_message':
        await handleNewMessage(username, message.data);
        break;
        
      case 'typing':
        handleTypingIndicator(username, message.data);
        break;
        
      case 'read_receipt':
        handleReadReceipt(username, message.data);
        break;
        
      default:
        console.log(`[WS] Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error('[WS] Error handling message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process message'
    }));
  }
}

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const token = params.get("token");

    if (!token) {
      ws.close();
      return;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const username = payload.username;

      clients.set(username, ws);
      console.log(`[WS] ${username} connected (Total clients: ${clients.size})`);
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { username }
      }));

      // Handle incoming messages
      ws.on('message', (data) => {
        handleMessage(ws, username, data);
      });

      ws.on('close', () => {
        clients.delete(username);
        console.log(`[WS] ${username} disconnected (Total clients: ${clients.size})`);
      });
      
      ws.on('error', (error) => {
        console.error(`[WS] Error for ${username}:`, error);
      });
      
    } catch (err){
      console.error('[WS] Authentication failed:', err);
      ws.close();
    }
  });

  console.log('[WS] WebSocket server initialized');
  return wss;
}

module.exports = {
  initializeWebSocket,
  clients,
  sendToUser
};
