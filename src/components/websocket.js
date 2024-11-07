class UpbitWebSocket {
  constructor(onMessage) {
    this.ws = null;
    this.onMessage = onMessage;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    try {
      console.log("Connecting to Bybit WebSocket...");
      this.ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.handleReconnect();
    }
  }

  setupWebSocketHandlers() {
    this.ws.onopen = () => {
      console.log("WebSocket Connected");
      this.reconnectAttempts = 0;

      const message = {
        op: "subscribe",
        args: ["kline.1.BTCUSDT"],
      };

      this.ws.send(JSON.stringify(message));
      console.log("Subscription sent");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket data: ", data);

        if (data.data && data.topic && data.topic.startsWith("kline")) {
          const klineData = data.data[0];
          const transformedData = {
            time: Math.floor(klineData.start / 1000),
            open: parseFloat(klineData.open),
            high: parseFloat(klineData.high),
            low: parseFloat(klineData.low),
            close: parseFloat(klineData.close),
          };
          this.onMessage(transformedData);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket Closed");
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default UpbitWebSocket;
