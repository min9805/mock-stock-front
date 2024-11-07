import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Account({ userInfo }) {
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                console.log(accessToken);
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

    const handleCreateAccount = async () => {
        setIsCreating(true);
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await axios.get(`${API_BASE_URL}/api/v1/account/create`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            setAccountInfo(response.data);
        } catch (error) {
            console.error('계좌 생성 실패:', error);
            alert('계좌 생성에 실패했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    if (!userInfo) {
        return <div>로그인이 필요합니다.</div>;
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
                        cursor: 'pointer',
                        opacity: isCreating ? 0.7 : 1
                    }}
                >
                    {isCreating ? '계좌 생성 중...' : '계좌 생성하기'}
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>내 계좌 정보</h2>
            <div>
                <p>이름: {userInfo.name || '미설정'}</p>
                <p>이메일: {userInfo.email || '미설정'}</p>
                <div style={{
                    border: '1px solid #ddd',
                    padding: '15px',
                    borderRadius: '8px',
                    marginTop: '20px'
                }}>
                    <h3>계좌 현황</h3>
                    <p>계좌번호: {accountInfo.accountNumber}</p>
                    <p>KRW 잔액: {accountInfo.krwBalance?.toLocaleString()}원</p>
                    <p>USD 잔액: ${accountInfo.usdBalance?.toLocaleString()}</p>
                    <p>Bitcoin 잔액: {accountInfo.bitcoinBalance} BTC</p>
                </div>
            </div>
        </div>
    );
}

export default Account; 