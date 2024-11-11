import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import BybitWebSocket from './websocket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Account({ userInfo }) {
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [ws, setWs] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [totalEvaluation, setTotalEvaluation] = useState(0);

    // WebSocket 설정
    useEffect(() => {
        const websocket = new BybitWebSocket((data) => {
            if (data.type === 'ticker') {
                setCurrentPrice(parseFloat(data.lastPrice));
            }
        });

        websocket.connect();
        setWs(websocket);

        // 연결 후 구독 시작
        setTimeout(() => {
            websocket.subscribe('ticker', 'BTCUSDT');
        }, 1000);

        return () => {
            if (websocket) {
                websocket.disconnect();
            }
        };
    }, []);

    // 계좌 정보 가져오기
    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await axios.get(`${API_BASE_URL}/api/v1/account/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                setAccountInfo(response.data);
            } catch (error) {
                console.error('계좌 정보 조회 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userInfo) {
            fetchAccountInfo();
        }
    }, [userInfo]);

    // 보유 주식 정보 가져오기
    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const response = await axios.post(`${API_BASE_URL}/api/v1/account/holding`,
                    {
                        accountNumber: accountInfo.accountNumber
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                setHoldings(response.data);
            } catch (error) {
                console.error('보유 주식 조회 실패:', error);
            }
        };

        if (userInfo && accountInfo) {
            fetchHoldings();
        }
    }, [userInfo, accountInfo]);

    // 총 평가금액 계산을 위한 useEffect 추가
    useEffect(() => {
        if (holdings.length > 0 && currentPrice) {
            const total = holdings.reduce((sum, holding) => {
                return sum + (currentPrice * holding.quantity);
            }, 0);
            setTotalEvaluation(total);
        }
    }, [holdings, currentPrice]);

    // 새로고침 버튼 핸들러 추가
    const handleRefresh = async () => {
        setLoading(true);
        const accessToken = localStorage.getItem('accessToken');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/account/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            setAccountInfo(response.data);
        } catch (error) {
            console.error('계좌 정보 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!accountInfo) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>계좌가 없습니다</h2>
                <button
                    onClick={handleCreateAccount}
                    disabled={isCreating}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    계좌 생성하기
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
                        {accountInfo.accountNumber}
                    </h2>
                    <div style={{
                        color: '#ff5252',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                    </div>
                </div>

                <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    margin: '16px 0'
                }}>
                    ${(accountInfo.usdBalance + totalEvaluation).toLocaleString()}
                </div>

                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                    }}>
                        <span style={{ color: '#666' }}>보유 자산</span>
                        <div>
                            <button
                                onClick={handleRefresh}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#f0f0f0',
                                    marginLeft: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                새로고침
                            </button>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid #eee'
                    }}>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 0'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>USD</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>현금</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>
                                ${accountInfo.usdBalance?.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 보유 주식 정보 테이블 */}
            <div style={{ marginTop: '24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom: '1px solid #eee',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    <div>종목명</div>
                    <div style={{ textAlign: 'right' }}>평균단가</div>
                    <div style={{ textAlign: 'right' }}>현재가</div>
                    <div style={{ textAlign: 'right' }}>보유 수량</div>
                    <div style={{ textAlign: 'right' }}>평가금</div>
                </div>

                {holdings.map((holding, index) => {
                    const evaluationPrice = currentPrice * holding.quantity;
                    const profitRate = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

                    return (
                        <div key={index} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                            gap: '16px',
                            padding: '16px 0',
                            borderBottom: '1px solid #eee',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ marginLeft: '8px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{holding.symbol}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                ${Number(holding.avgPrice).toFixed(2)}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                ${currentPrice?.toFixed(2)}
                                <div style={{
                                    fontSize: '12px',
                                    color: profitRate > 0 ? '#ff5252' : '#2196f3'
                                }}>
                                    {profitRate > 0 ? '+' : ''}{profitRate.toFixed(2)}%
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {Number(holding.quantity).toFixed(2)}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                ${evaluationPrice.toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Account;