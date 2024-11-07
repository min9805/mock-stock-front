import React, { useEffect, useRef } from "react";
import { createChart, IChartApi } from "lightweight-charts";
import { useQuery } from "react-query";
import axios from "axios";

interface ChartProps {
  interval: string;
  limit: number;
}

const TradingChart: React.FC<ChartProps> = ({ interval, limit }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const fetchCandleData = async () => {
    const end = Date.now(); // 현재 시간을 밀리초로
    const response = await axios.get(
      `https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=${interval}&end=${end}&limit=${limit}`
    );
    return response.data;
  };

  const { data, isLoading } = useQuery(
    ["candles", interval, limit],
    fetchCandleData,
    {
      refetchInterval: 5000, // 5초마다 데이터 갱신
    }
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: 800,
      height: 400,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
    });

    const candlestickSeries = chartRef.current.addCandlestickSeries();

    // 데이터가 있을 때만 차트에 표시
    if (data?.result?.list) {
      const formattedData = data.result.list.map((item: any) => ({
        time: item[0] / 1000, // 타임스탬프를 초 단위로 변환
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }));

      candlestickSeries.setData(formattedData);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data]);

  return (
    <div>
      {isLoading ? <div>로딩 중...</div> : <div ref={chartContainerRef} />}
    </div>
  );
};

export default TradingChart;
