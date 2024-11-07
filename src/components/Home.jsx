import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BybitWebSocket from "./websocket";

function Home() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({
    BTC: { price: "0", change: "0%" },
    ETH: { price: "0", change: "0%" },
  });

  useEffect(() => {
    console.log("Starting WebSocket connection...");

    const ws = new BybitWebSocket((data) => {
      if (data.type === "ticker" && data.lastPrice && data.price24hPcnt) {
        const price = parseFloat(data.lastPrice);
        const change = parseFloat(data.price24hPcnt);
        const symbol = data.symbol;

        if (!isNaN(price) && !isNaN(change)) {
          setPrices((prev) => ({
            ...prev,
            [symbol.replace("USDT", "")]: {
              price: price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              change: (change * 100).toFixed(2) + "%",
            },
          }));
        }
      }
    });

    ws.connect();

    setTimeout(() => {
      console.log("Subscribing to tickers...");
      ws.subscribe("ticker", "BTCUSDT");
      ws.subscribe("ticker", "ETHUSDT");
    }, 1000);

    return () => {
      console.log("Cleaning up WebSocket...");
      ws.disconnect();
    };
  }, []);

  const handleCardClick = (symbol) => {
    navigate(`/chart/${symbol}`);
  };

  const CryptoCard = ({ name, symbol, price, change }) => (
    <div style={styles.stockCard} onClick={() => handleCardClick(symbol)}>
      <div style={styles.stockInfo}>
        <h3 style={styles.stockName}>{name}</h3>
        <p style={styles.stockSymbol}>{symbol}</p>
      </div>
      <div style={styles.priceInfo}>
        <p style={styles.price}>${price}</p>
        <p
          style={{
            ...styles.change,
            color: change.startsWith("-") ? "#ef5350" : "#26a69a",
          }}
        >
          {change}
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>실시간 코인 가격</h1>
        <div style={styles.cardsContainer}>
          <CryptoCard
            name="비트코인"
            symbol="BTCUSDT"
            price={prices.BTC.price}
            change={prices.BTC.change}
          />
          <CryptoCard
            name="이더리움"
            symbol="ETHUSDT"
            price={prices.ETH.price}
            change={prices.ETH.change}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1e2026",
    paddingTop: "80px",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "bold",
    marginBottom: "3rem",
    color: "#ffffff",
    textAlign: "center",
  },
  cardsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  },
  stockCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3rem 4rem",
    backgroundColor: "#2b2f36",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "transform 0.2s ease-in-out",
    cursor: "pointer",
    minWidth: "700px",
    gap: "8rem",
    ":hover": {
      transform: "translateY(-5px)",
    },
  },
  stockInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: "1",
  },
  stockName: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#ffffff",
  },
  stockSymbol: {
    margin: 0,
    color: "#848e9c",
    fontSize: "1.2rem",
  },
  priceInfo: {
    textAlign: "right",
    minWidth: "200px",
  },
  price: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#ffffff",
  },
  change: {
    margin: "0.5rem 0 0 0",
    fontWeight: "500",
    fontSize: "1.4rem",
  },
};

export default Home;
