import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import UpbitWebSocket from "./websocket";

class Datafeed {
  constructor() {
    this.data = [];
    this.lastLoadedTime = Date.now();
  }

  async getBars(count) {
    try {
      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=1&end=${this.lastLoadedTime}&limit=${count}`
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

function Chart() {
  const seriesRef = useRef(null);

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
      websocket = new UpbitWebSocket((data) => {
        if (data) {
          console.log("candle Stick data:", data);

          if (data.isComplete) {
            // 완성된 봉은 setData로 추가
            const historicalData = series.data();
            series.setData([...historicalData, data]);
          } else {
            // 진행중인 봉은 update로 업데이트
            series.update(data);
          }
        }
      });

      websocket.connect();

      const datafeed = new Datafeed();
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

      // Cleanup 수정
      return () => {
        chart.remove();
        if (websocket) {
          websocket.disconnect();
        }
      };
    };

    initChart().catch((error) => {
      console.error("Error during chart initialization:", error);
    });
  }, []);

  return (
    <div className="chart-page">
      <div
        id="chart-container"
        style={{ width: "100%", height: "600px" }}
      ></div>
    </div>
  );
}

export default Chart;
