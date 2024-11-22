import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BybitWebSocket from './websocket';

function StockExplorer({ userInfo }) {
    const [stocks, setStocks] = useState([]);
    const [favoriteStocks, setFavoriteStocks] = useState(new Set());
    const [activeTab, setActiveTab] = useState('상승세');
    const [selectedBaseCoin, setSelectedBaseCoin] = useState('USDT');
    const [realTimeData, setRealTimeData] = useState({});
    const [ws, setWs] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize] = useState(10);

    const baseCoinList = ['All', 'USDT', 'USDC', 'USDE', 'EUR', 'BRL', 'PLN', 'TRY', 'BTC', 'ETH', 'DAI', 'BRZ'];

    useEffect(() => {
        console.log(userInfo);
        // WebSocket 연결 설정
        const webSocket = new BybitWebSocket((data) => {
            if (data.type === 'ticker') {
                setRealTimeData(prev => ({
                    ...prev,
                    [data.symbol]: {
                        lastPrice: data.lastPrice,
                        price24hPcnt: data.price24hPcnt,
                        volume24h: data.volume24h,
                        turnover24h: data.turnover24h
                    }
                }));
            }
        });
        setWs(webSocket);
        webSocket.connect();

        return () => {
            if (webSocket) {
                webSocket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        const fetchFavoriteStocks = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                setFavoriteStocks(new Set());
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/api/v1/watch/', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (response.status === 401) {
                    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                    return;
                }

                const data = await response.json();
                setFavoriteStocks(new Set(data.map(stock => stock.symbol)));
            } catch (error) {
                console.error('관심 종목 조회 실패:', error);
                setFavoriteStocks(new Set());
            }
        };

        fetchFavoriteStocks();
    }, [userInfo]);

    useEffect(() => {
        const fetchSymbols = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/v1/stock/list/${selectedBaseCoin}?page=${currentPage}&size=${pageSize}`
                );
                const data = await response.json();
                let filteredContent = data.content;

                // '관심목록' 탭일 때는 관심 종목만 필터링
                if (activeTab === '관심목록') {
                    filteredContent = data.content.filter(stock =>
                        favoriteStocks.has(stock.symbol)
                    );
                }

                setStocks(filteredContent);
                setTotalPages(Math.ceil(filteredContent.length / pageSize));
                setTotalElements(filteredContent.length);

                // WebSocket 구독 설정
                if (ws) {
                    stocks.forEach(stock => {
                        ws.unsubscribe('ticker', stock.symbol);
                    });

                    data.content.forEach(stock => {
                        ws.subscribe('ticker', stock.symbol);
                    });
                }
            } catch (error) {
                console.error('심볼 목록 조회 실패:', error);
            }
        };

        fetchSymbols();
    }, [selectedBaseCoin, ws, currentPage, pageSize, activeTab, favoriteStocks]);

    const handleFavorite = async (symbol) => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }

        try {
            const method = favoriteStocks.has(symbol) ? 'DELETE' : 'POST';
            const response = await fetch('http://localhost:8080/api/v1/watch/', {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    symbol: symbol
                })
            });

            if (response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                return;
            }

            if (response.ok) {
                setFavoriteStocks(prev => {
                    const newSet = new Set(prev);
                    if (method === 'POST') {
                        newSet.add(symbol);
                    } else {
                        newSet.delete(symbol);
                    }
                    return newSet;
                });
            } else {
                throw new Error('API 요청 실패');
            }
        } catch (error) {
            console.error('관심 종목 처리 실패:', error);
            alert('관심 종목 처리 중 오류가 발생했습니다.');
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Base Coin 탭 */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '1px solid #ddd',
                paddingBottom: '10px'
            }}>
                {baseCoinList.map(coin => (
                    <button
                        key={coin}
                        onClick={() => setSelectedBaseCoin(coin)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selectedBaseCoin === coin ? '#ffa500' : '#f8f9fa',
                            color: selectedBaseCoin === coin ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {coin}
                    </button>
                ))}
            </div>

            {/* 기존 탭 버튼들 */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setActiveTab('상승세')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === '상승세' ? '#007bff' : '#f8f9fa',
                        color: activeTab === '상승세' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    상승세
                </button>
                <button
                    onClick={() => setActiveTab('인기')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === '인기' ? '#007bff' : '#f8f9fa',
                        color: activeTab === '인기' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    인기
                </button>
                <button
                    onClick={() => setActiveTab('관심목록')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === '관심목록' ? '#007bff' : '#f8f9fa',
                        color: activeTab === '관심목록' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    관심목록
                </button>
            </div>

            {/* 테이블 */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>심볼</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>현재가</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>등락률</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>거래량</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>거래대금</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>관심</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map(stock => {
                        const tickerData = realTimeData[stock.symbol] || {};
                        return (
                            <tr key={stock.symbol} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{stock.symbol}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    {tickerData.lastPrice || '-'}
                                </td>
                                <td style={{
                                    padding: '10px',
                                    textAlign: 'right',
                                    color: tickerData.price24hPcnt > 0 ? 'red' : tickerData.price24hPcnt < 0 ? 'blue' : 'black'
                                }}>
                                    {tickerData.price24hPcnt ?
                                        `${tickerData.price24hPcnt > 0 ? '+' : ''}${(tickerData.price24hPcnt * 100).toFixed(2)}%`
                                        : '-'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    {tickerData.volume24h ?
                                        Number(tickerData.volume24h).toLocaleString('ko-KR', {
                                            maximumFractionDigits: 3
                                        })
                                        : '-'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    {tickerData.turnover24h ?
                                        Number(tickerData.turnover24h).toLocaleString('ko-KR', {
                                            maximumFractionDigits: 0
                                        }) + ' USDT'
                                        : '-'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleFavorite(stock.symbol)}
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            cursor: localStorage.getItem('accessToken') ? 'pointer' : 'not-allowed',
                                            fontSize: '20px',
                                            color: favoriteStocks.has(stock.symbol) ? 'red' : 'gray',
                                            opacity: localStorage.getItem('accessToken') ? 1 : 0.5
                                        }}
                                        title={localStorage.getItem('accessToken') ? '' : '로그인이 필요한 서비스입니다'}
                                    >
                                        ♥
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* 테이블 아래에 페이지네이션 추가 */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px',
                alignItems: 'center'
            }}>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: currentPage === 0 ? '#ddd' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    이전
                </button>
                <span>
                    {currentPage + 1} / {totalPages} 페이지
                    (총 {totalElements}개)
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: currentPage === totalPages - 1 ? '#ddd' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'
                    }}
                >
                    다음
                </button>
            </div>
        </div>
    );
}

export default StockExplorer; 