import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import BybitWebSocket from "./websocket";
import { useParams } from "react-router-dom";
import OrderForm from './OrderForm';

class Datafeed {
  constructor(symbol) {
    this.data = [];
    this.lastLoadedTime = Date.now();
    this.symbol = symbol;
  }

  async getBars(count) {
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=${this.symbol}&interval=1&end=${this.lastLoadedTime}&limit=${count}`
      );
      const result = await response.json();

      if (!result?.result?.list) {
        console.error("Invalid API response format:", result);
        return this.data;
      }

      const newData = result.result.list
        .map((item) => {
          if (!item || item.length < 5) return null;

          const time = parseInt(item[0]);
          const open = parseFloat(item[1]);
          const high = parseFloat(item[2]);
          const low = parseFloat(item[3]);
          const close = parseFloat(item[4]);

          if (
            isNaN(time) ||
            isNaN(open) ||
            isNaN(high) ||
            isNaN(low) ||
            isNaN(close)
          ) {
            return null;
          }

          return { time: time / 1000, open, high, low, close };
        })
        .filter((item) => item !== null)
        .reverse();

      if (newData.length > 0) {
        this.lastLoadedTime = newData[0].time * 1000;
        const uniqueData = new Map();

        this.data.forEach((item) => uniqueData.set(item.time, item));
        newData.forEach((item) => uniqueData.set(item.time, item));

        this.data = Array.from(uniqueData.values()).sort(
          (a, b) => a.time - b.time
        );
      }

      return this.data;
    } catch (error) {
      console.error("Error in getBars:", error);
      return this.data;
    }
  }
}

function Chart({ userInfo }) {
  const seriesRef = useRef(null);
  const { symbol } = useParams();

  useEffect(() => {
    console.log("Chart useEffect called");
    let websocket = null;

    const chartOptions = {
      layout: {
        textColor: "black",
        background: { type: "solid", color: "white" },
      },
      height: 400,
      width: 800,
      grid: {
        vertLines: { color: "rgba(197, 203, 206, 0.5)" },
        horzLines: { color: "rgba(197, 203, 206, 0.5)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    };

    const initChart = async () => {
      console.log("initChart function called");
      const container = document.getElementById("chart-container");
      const chart = createChart(container, chartOptions);

      const series = chart.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });

      seriesRef.current = series;

      // 웹소켓 연결 및 메시지 핸들러 설정
      websocket = new BybitWebSocket((data) => {
        if (data && data.type === "kline") {
          const candleData = {
            time: data.time,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
          };

          // 유효한 데이터인지 확인
          if (!Object.values(candleData).some(isNaN)) {
            if (seriesRef.current) {
              seriesRef.current.update(candleData);
            }
          }
        }
      });

      websocket.connect();

      // 1분봉 구독
      setTimeout(() => {
        websocket.subscribe("kline", symbol, "1");
      }, 1000);

      const datafeed = new Datafeed(symbol);
      const initialData = await datafeed.getBars(200);

      if (initialData.length > 0) {
        const validData = initialData.filter(
          (item) =>
            item !== null &&
            typeof item.time === "number" &&
            typeof item.open === "number" &&
            typeof item.high === "number" &&
            typeof item.low === "number" &&
            typeof item.close === "number"
        );

        series.setData(validData);
      }

      chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(async (logicalRange) => {
          if (!logicalRange) return;

          if (logicalRange.from < 10) {
            const numberBarsToLoad = 50 - logicalRange.from;
            const newData = await datafeed.getBars(numberBarsToLoad);

            if (newData.length > 0) {
              const validData = newData.filter(
                (item) =>
                  item !== null &&
                  typeof item.time === "number" &&
                  typeof item.open === "number" &&
                  typeof item.high === "number" &&
                  typeof item.low === "number" &&
                  typeof item.close === "number"
              );

              setTimeout(() => {
                series.setData(validData);
              }, 250);
            }
          }
        });

      chart.timeScale().fitContent();

      return () => {
        chart.remove();
        if (websocket) {
          websocket.unsubscribe("kline", "BTCUSDT", "1");
          websocket.disconnect();
        }
      };
    };

    initChart().catch((error) => {
      console.error("Error during chart initialization:", error);
    });
  }, []);

  return (
    <div className="chart-page" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div id="chart-container" style={{ flex: 2 }}></div>
      <OrderForm userInfo={userInfo} />
    </div>
  );
}

export default Chart;
