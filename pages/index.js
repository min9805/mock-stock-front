import { useEffect, useState } from "react";
import UpbitWebSocket from "../websocket";

export default function Home() {
  const [socketData, setSocketData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 웹소켓 인스턴스 생성
    const upbitWS = new UpbitWebSocket((data) => {
      setSocketData(data);
      setIsConnected(true);
      console.log("Received real-time data:", data);
    });

    // 웹소켓 연결
    upbitWS.connect();

    // 연결 상태 확인을 위한 인터벌 설정
    const intervalId = setInterval(() => {
      setIsConnected(upbitWS.isConnected());
    }, 1000);

    // 컴포넌트 언마운트 시 웹소켓 연결 해제
    return () => {
      upbitWS.disconnect();
      clearInterval(intervalId);
    };
  }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

  return (
    <div>
      <h1>Upbit Real-time Data</h1>
      <div
        style={{
          color: isConnected ? "green" : "red",
          marginBottom: "1rem",
        }}
      >
        Status: {isConnected ? "Connected" : "Disconnected"}
      </div>
      {socketData && (
        <div>
          <p>Market: {socketData.market}</p>
          <p>Price: {socketData.trade_price}</p>
          <p>Time: {new Date(socketData.trade_timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
