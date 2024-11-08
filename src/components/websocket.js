class BybitWebSocket {
  constructor(onMessage) {
    this.ws = null;
    this.onMessage = onMessage;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.subscriptions = new Set();
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

  subscribe(type, symbol, interval = "1") {
    if (!this.isConnected()) {
      console.error("WebSocket is not connected");
      return;
    }

    let channel;
    if (type === "kline") {
      channel = `kline.${interval}.${symbol}`;
    } else if (type === "ticker") {
      channel = `tickers.${symbol}`;
    } else {
      console.error("Invalid subscription type");
      return;
    }

    if (this.subscriptions.has(channel)) {
      console.log(`Already subscribed to ${channel}`);
      return;
    }

    const message = {
      op: "subscribe",
      args: [channel],
    };

    this.ws.send(JSON.stringify(message));
    this.subscriptions.add(channel);
    console.log(`Subscribed to ${channel}`);
  }

  unsubscribe(type, symbol, interval = "1") {
    if (!this.isConnected()) {
      console.error("WebSocket is not connected");
      return;
    }

    let channel;
    if (type === "kline") {
      channel = `kline.${interval}.${symbol}`;
    } else if (type === "ticker") {
      channel = `tickers.${symbol}`;
    } else {
      console.error("Invalid subscription type");
      return;
    }

    if (!this.subscriptions.has(channel)) {
      console.log(`Not subscribed to ${channel}`);
      return;
    }

    const message = {
      op: "unsubscribe",
      args: [channel],
    };

    this.ws.send(JSON.stringify(message));
    this.subscriptions.delete(channel);
    console.log(`Unsubscribed from ${channel}`);
  }

  setupWebSocketHandlers() {
    this.ws.onopen = () => {
      console.log("WebSocket Connected");
      this.reconnectAttempts = 0;

      if (this.subscriptions.size > 0) {
        const message = {
          op: "subscribe",
          args: Array.from(this.subscriptions),
        };
        console.log("Restoring subscriptions:", message);
        this.ws.send(JSON.stringify(message));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 응답이 구독 성공 메시지인 경우 처리
        if (data.success !== undefined) {
          console.log("Subscription message:", data);
          return;
        }

        // 실제 데이터 처리
        if (data.data && data.topic) {
          // kline 데이터 처리
          if (data.topic.startsWith("kline")) {
            const klineData = data.data[0];
            if (klineData) {
              const transformedData = {
                type: "kline",
                time: Math.floor(klineData.start / 1000),
                open: parseFloat(klineData.open),
                high: parseFloat(klineData.high),
                low: parseFloat(klineData.low),
                close: parseFloat(klineData.close),
                volume: parseFloat(klineData.volume),
                timestamp: klineData.start,
              };
              this.onMessage(transformedData);
            }
          }
          // tickers 데이터 처리
          else if (data.topic.startsWith("tickers")) {
            const tickerData = data.data;
            if (tickerData && tickerData.lastPrice) {
              const transformedData = {
                type: "ticker",
                symbol: tickerData.symbol,
                lastPrice: tickerData.lastPrice,
                price24hPcnt: tickerData.price24hPcnt,
              };
              this.onMessage(transformedData);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        console.error("Raw message:", event.data);
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

export default BybitWebSocket;
