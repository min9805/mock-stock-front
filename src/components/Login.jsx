import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login({ setAuthToken, setUserInfo }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '로그인에 실패했습니다.');
        }

        const data = await response.json();
        console.log('로그인 성공:', data);

        // 토큰 저장
        setAuthToken({
          accessToken: data.token.accessToken,
          refreshToken: data.token.refreshToken
        });

        // 사용자 정보 저장
        setUserInfo(data.user);

        // localStorage에 토큰 저장 (선택사항)
        localStorage.setItem('accessToken', data.token.accessToken);
        localStorage.setItem('refreshToken', data.token.refreshToken);

        // 입력 필드 초기화
        setEmail('');
        setPassword('');

        // 홈 화면으로 이동
        navigate('/');
      } catch (error) {
        console.error('로그인 에러:', error);
        alert(error.message);
      }
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name,
            password,
            passwordCheck: confirmPassword
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '회원가입에 실패했습니다.');
        }

        const data = await response.json();
        console.log('회원가입 성공:', data);

        // 회원가입 성공 후 로그인 모드로 전환
        setIsLogin(true);
        // 입력 필드 초기화
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');

        alert('회원가입이 완료되었습니다. 로그인해주세요.');
      } catch (error) {
        console.error('회원가입 에러:', error);
        alert(error.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>{isLogin ? "로그인" : "회원가입"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}
          <div style={styles.inputGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}
          <button type="submit" style={styles.button}>
            {isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={styles.toggleButton}
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </p>
      </div>
    </div>
  );
}

// PropTypes 정의
Login.propTypes = {
  setAuthToken: PropTypes.func.isRequired,
  setUserInfo: PropTypes.func.isRequired
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#f5f5f5",
  },
  loginBox: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#0056b3",
    },
  },
  toggleText: {
    textAlign: "center",
    marginTop: "1rem",
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
    textDecoration: "underline",
  },
};

export default Login;
