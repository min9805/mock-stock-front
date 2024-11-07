import { Link } from "react-router-dom";

function Navigation({ userInfo }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <ul style={styles.navList}>
          <li>
            <Link to="/" style={styles.link}>
              홈
            </Link>
          </li>
          <li>
            <Link to="/stocks" style={styles.link}>
              주식 골라보기
            </Link>
          </li>
          {userInfo.email ? (
            <li>
              <Link to="/account" style={styles.link}>
                내 계좌
              </Link>
            </li>
          ) : (
            <li>
              <Link to="/login" style={styles.link}>
                로그인
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e0e0e0",
    padding: "1rem 0",
    position: "fixed",
    width: "100%",
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  navList: {
    display: "flex",
    gap: "2rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontSize: "1rem",
    fontWeight: "500",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#f5f5f5",
    },
  },
};

export default Navigation;
