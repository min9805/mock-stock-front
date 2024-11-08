import { Link, useNavigate } from "react-router-dom";

function Navigation({ userInfo, setUserInfo }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // 유저 정보 초기화
    setUserInfo(null);

    // 홈으로 이동
    navigate('/');
  };

  return (
    <nav style={{
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #ddd'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>
          <h1 style={{ margin: 0 }}>거래소</h1>
        </Link>
        <div>
          {userInfo ? (
            <>
              <span style={{ marginRight: '1rem' }}>{userInfo.email}</span>
              <Link to="/account" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>
                계좌
              </Link>
              <Link to="/chart" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>
                차트
              </Link>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: '1rem', textDecoration: 'none', color: '#333' }}>
                로그인
              </Link>
              <Link to="/register" style={{ textDecoration: 'none', color: '#333' }}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
