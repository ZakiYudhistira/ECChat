export type MessageHandler = (data: any) => void;

export default class SocketConnection {
  private socket: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectDelay = 1000;         // 1 Second
  private maxReconnectDelay = 10000;     // 10 seconds
  private isManualClose = false;
  private messageHandlers: MessageHandler[] = [];
  private sendQueue: any[] = [];

  constructor(url: string, token: string) {
    this.url = `${url}?token=${token}`;
    this.token = token;
    this.connect();
  }

  // Main Connect Function
  private connect() {
    this.isManualClose = false;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("[WS] Connected");

      // Flush send queue
      this.sendQueue.forEach(msg => this.socket?.send(JSON.stringify(msg)));
      this.sendQueue = [];

      // Reset reconnect delay
      this.reconnectDelay = 1000;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      } catch (err) {
        console.error("[WS] Error parsing message", err);
      }
    };

    this.socket.onclose = () => {
      console.warn("[WS] Connection closed");

      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (err) => {
      console.error("[WS] WebSocket error", err);
    };
  }

  // Websocket Reconnection
  private scheduleReconnect() {
    console.log(`[WS] Reconnecting in ${this.reconnectDelay / 1000}s...`);

    setTimeout(() => {
      if (!this.isManualClose) {
        console.log("[WS] Attempting reconnect...");
        this.connect();

        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.maxReconnectDelay
        );
      }
    }, this.reconnectDelay);
  }

  // Send message
  send(data: any) {
    const json = JSON.stringify(data);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(json);
    } else {
      console.warn("[WS] Socket not open, queueing message");
      this.sendQueue.push(data);
    }
  }

  // Message Listener
  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  // Close connection gracefully
  close() {
    this.isManualClose = true;
    this.socket?.close();
  }
}
