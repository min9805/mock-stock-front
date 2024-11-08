import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function OrderForm({ userInfo }) {
    const [orderType, setOrderType] = useState('buy');
    const [orderMethod, setOrderMethod] = useState('market');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [orderInfo, setOrderInfo] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);

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

                // 응답 데이터 구조 확인
                console.log('Account Response:', response.data);

                // 응답 데이터가 accounts 배열 안에 있는 경우
                if (response.data.accounts && response.data.accounts.length > 0) {
                    setAccountInfo(response.data.accounts[0]);
                } else if (response.data.account) {
                    // 또는 account 객체로 바로 오는 경우
                    setAccountInfo(response.data.account);
                } else {
                    // 직접 response.data가 계좌 정보인 경우
                    setAccountInfo(response.data);
                }
            } catch (error) {
                console.error('계좌 정보 조회 실패:', error);
                console.error('Error response:', error.response); // 에러 응답 상세 확인
            }
        };

        if (userInfo) {
            fetchAccountInfo();
        }
    }, [userInfo]);

    // 현재 가격 가져오기 (실제 API로 대체 필요)
    useEffect(() => {
        const fetchCurrentPrice = async () => {
            try {
                // 임시로 Bybit API 사용
                const response = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT');
                const price = parseFloat(response.data.result.list[0].lastPrice);
                setCurrentPrice(price);
            } catch (error) {
                console.error('현재 가격 조회 실패:', error);
            }
        };

        fetchCurrentPrice();
        const interval = setInterval(fetchCurrentPrice, 5000); // 5초마다 갱신

        return () => clearInterval(interval);
    }, []);

    const calculateOrder = (percentage) => {
        if (!accountInfo || !currentPrice) return;

        const availableUSD = accountInfo.usdBalance;
        const maxBtcAmount = (availableUSD * 0.9) / currentPrice;
        const btcAmount = maxBtcAmount * (percentage / 100);

        setAmount(btcAmount.toFixed(8));
        setOrderInfo({
            btcAmount: btcAmount,
            totalPrice: btcAmount * currentPrice,
            currentPrice: currentPrice
        });
    };

    const percentButtonStyle = {
        flex: 1,
        padding: '5px 10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    };

    const handleOrder = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            alert('유효한 금액을 입력해주세요.');
            return;
        }

        try {
            const accessToken = localStorage.getItem('accessToken');
            await axios.post(`${API_BASE_URL}/api/v1/order`, {
                type: orderType,
                amount: parseFloat(amount)
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            // 주문 성공 후 계좌 정보 갱신
            const accountResponse = await axios.get(`${API_BASE_URL}/api/v1/account/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            setAccountInfo(accountResponse.data);
            setAmount('');
            setOrderInfo(null);
            alert(`${orderType === 'buy' ? '매수' : '매도'} 주문이 완료되었습니다.`);
        } catch (error) {
            console.error('주문 실패:', error);
            alert('주문에 실패했습니다.');
        }
    };

    return (
        <div style={{ minWidth: '300px', padding: '20px' }}>
            {/* 매수/매도 버튼 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setOrderType('buy')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: orderType === 'buy' ? '#dc3545' : '#f8f9fa',
                        color: orderType === 'buy' ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                >
                    구매
                </button>
                <button
                    onClick={() => setOrderType('sell')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: orderType === 'sell' ? '#dc3545' : '#f8f9fa',
                        color: orderType === 'sell' ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                >
                    판매
                </button>
            </div>

            {/* 주문 유형 선택 */}
            <div style={{ marginBottom: '15px' }}>
                <label>주문 유형</label>
                <select
                    value={orderMethod}
                    onChange={(e) => setOrderMethod(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                >
                    <option value="market">시장가</option>
                    <option value="limit">지정가</option>
                </select>
            </div>

            {/* 가격 입력 (지정가 주문일 때만) */}
            {orderMethod === 'limit' && (
                <div style={{ marginBottom: '15px' }}>
                    <label>주문 가격</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="가격을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
            )}

            {/* 수량 입력 */}
            <div style={{ marginBottom: '15px' }}>
                <label>주문 수량 (BTC)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="수량을 입력하세요"
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
            </div>

            {/* 퍼센트 버튼 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {[10, 25, 50, 90].map((percent) => (
                    <button
                        key={percent}
                        onClick={() => calculateOrder(percent)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#f8f9fa'
                        }}
                    >
                        {percent === 90 ? '최대' : `${percent}%`}
                    </button>
                ))}
            </div>

            {/* 주문 정보 표시 */}
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>주문 가능:</span>
                    <span>${accountInfo?.usdBalance?.toLocaleString()}</span>
                </div>
                {orderInfo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>예상 주문금액:</span>
                        <span>${orderInfo.totalPrice?.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <button
                onClick={handleOrder}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                {orderType === 'buy' ? '구매하기' : '판매하기'}
            </button>
        </div>
    );
}

export default OrderForm; 