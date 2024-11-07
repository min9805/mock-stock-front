const { createChart } = LightweightCharts;

const chartOptions = {
  layout: {
    textColor: "black",
    background: { type: "solid", color: "white" },
  },
  height: 400,
  width: 800,
  grid: {
    vertLines: {
      color: "rgba(197, 203, 206, 0.5)",
    },
    horzLines: {
      color: "rgba(197, 203, 206, 0.5)",
    },
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
  },
};

class Datafeed {
  constructor() {
    this.data = [];
    this.lastLoadedTime = Date.now();
    console.log(
      "Datafeed initialized with lastLoadedTime:",
      this.lastLoadedTime
    );
  }

  async getBars(count) {
    try {
      console.log(
        "Fetching data with count:",
        count,
        "lastLoadedTime:",
        this.lastLoadedTime
      );

      const response = await fetch(
        `https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=1&end=${this.lastLoadedTime}&limit=${count}`
      );
      const result = await response.json();
      console.log("API Response:", result);

      if (!result?.result?.list) {
        console.error("Invalid API response format:", result);
        return this.data;
      }

      console.log("Raw data from API:", result.result.list);

      const newData = result.result.list
        .map((item) => {
          if (!item || item.length < 5) {
            console.error("Invalid item format:", item);
            return null;
          }

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
            console.error("Invalid number in item:", {
              time,
              open,
              high,
              low,
              close,
            });
            return null;
          }

          return {
            time: time / 1000,
            open,
            high,
            low,
            close,
          };
        })
        .filter((item) => item !== null)
        .reverse();

      console.log("Processed new data:", newData);

      if (newData.length > 0) {
        this.lastLoadedTime = newData[0].time * 1000;
        console.log("Updated lastLoadedTime:", this.lastLoadedTime);

        const uniqueData = new Map();

        console.log("Current data length:", this.data.length);
        this.data.forEach((item) => {
          uniqueData.set(item.time, item);
        });

        newData.forEach((item) => {
          uniqueData.set(item.time, item);
        });

        this.data = Array.from(uniqueData.values()).sort(
          (a, b) => a.time - b.time
        );

        console.log("Final merged data length:", this.data.length);
      }

      return this.data;
    } catch (error) {
      console.error("Error in getBars:", error);
      return this.data;
    }
  }
}

async function initChart() {
  const container = document.getElementById("container");
  const chart = createChart(container, chartOptions);

  const series = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderVisible: false,
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
  });

  const datafeed = new Datafeed();

  // Initial data load
  const initialData = await datafeed.getBars(200);
  console.log("Initial data sample:", initialData[0]); // 데이터 형식 확인

  if (initialData.length > 0) {
    // 데이터 유효성 검사
    const validData = initialData.filter(
      (item) =>
        item !== null &&
        typeof item.time === "number" &&
        typeof item.open === "number" &&
        typeof item.high === "number" &&
        typeof item.low === "number" &&
        typeof item.close === "number"
    );

    console.log(
      `Filtered ${initialData.length - validData.length} invalid items`
    );
    series.setData(validData);
  }

  chart.timeScale().subscribeVisibleLogicalRangeChange(async (logicalRange) => {
    if (!logicalRange) return;

    console.log("Logical Range:", {
      from: logicalRange.from,
      to: logicalRange.to,
      visibleDataPoints: Math.round(logicalRange.to - logicalRange.from),
    });

    if (logicalRange.from < 10) {
      const numberBarsToLoad = 50 - logicalRange.from;
      const newData = await datafeed.getBars(numberBarsToLoad);

      if (newData.length > 0) {
        // 데이터 유효성 검사
        const validData = newData.filter(
          (item) =>
            item !== null &&
            typeof item.time === "number" &&
            typeof item.open === "number" &&
            typeof item.high === "number" &&
            typeof item.low === "number" &&
            typeof item.close === "number"
        );

        console.log("New valid data count:", validData.length);
        console.log("Sample new data:", validData[0]); // 데이터 형식 확인

        setTimeout(() => {
          series.setData(validData);
          console.log(
            "Data update complete. Total data count:",
            validData.length
          );
          console.log("validData:", validData);
        }, 250);
      }
    }
  });

  chart.timeScale().fitContent();
}

// Start the initialization
console.log("Starting chart application");
initChart().catch((error) => {
  console.error("Error during chart initialization:", error);
});
