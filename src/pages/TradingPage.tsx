import React, { useState } from "react";
import TradingChart from "../components/TradingChart";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

const TradingPage: React.FC = () => {
  const [interval, setInterval] = useState("1");
  const [limit, setLimit] = useState(100);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="trading-page">
        <div className="chart-controls">
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="1">1분</option>
            <option value="5">5분</option>
            <option value="15">15분</option>
            <option value="60">1시간</option>
          </select>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            min="1"
            max="1000"
          />
        </div>
        <TradingChart interval={interval} limit={limit} />
      </div>
    </QueryClientProvider>
  );
};

export default TradingPage;
