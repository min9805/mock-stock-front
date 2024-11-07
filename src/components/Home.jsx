import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [popularStocks, setPopularStocks] = useState([]);

  useEffect(() => {
    // 임시 데이터 - 실제로는 API에서 받아와야 함
    const mockPopularStocks = [
      { symbol: "BTCUSDT", name: "비트코인", price: "65000", change: "+2.5%" },
      { symbol: "ETHUSDT", name: "이더리움", price: "3200", change: "+1.8%" },
      {
        symbol: "BNBUSDT",
        name: "바이낸스코인",
        price: "420",
        change: "-0.5%",
      },
      { symbol: "SOLUSDT", name: "솔라나", price: "180", change: "+3.2%" },
      { symbol: "ADAUSDT", name: "에이다", price: "1.2", change: "-1.0%" },
    ];

    setPopularStocks(mockPopularStocks);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>실시간 인기 종목</h1>
        <div style={styles.stockGrid}>
          {popularStocks.map((stock) => (
            <Link
              to={`/chart/${stock.symbol}`}
              key={stock.symbol}
              style={styles.stockCard}
            >
              <div style={styles.stockInfo}>
                <h3 style={styles.stockName}>{stock.name}</h3>
                <p style={styles.stockSymbol}>{stock.symbol}</p>
              </div>
              <div style={styles.priceInfo}>
                <p style={styles.price}>${stock.price}</p>
                <p
                  style={{
                    ...styles.change,
                    color: stock.change.startsWith("+") ? "#26a69a" : "#ef5350",
                  }}
                >
                  {stock.change}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    paddingTop: "80px", // 네비게이션 바 높이만큼 여백
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "2rem",
    color: "#333",
  },
  stockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  stockCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textDecoration: "none",
    color: "inherit",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },
  stockInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  stockName: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
  },
  stockSymbol: {
    margin: 0,
    color: "#666",
    fontSize: "1rem",
  },
  priceInfo: {
    textAlign: "right",
  },
  price: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
  },
  change: {
    margin: "0.5rem 0 0 0",
    fontWeight: "500",
    fontSize: "1rem",
  },
};

export default Home;
