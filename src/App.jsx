import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from "./components/Navigation";
import Home from "./components/Home";
import Chart from "./components/Chart";
import Login from "./components/Login";
import Account from "./components/Account";
import "./App.css";

function App() {
  const [authToken, setAuthToken] = useState({
    accessToken: null,
    refreshToken: null
  });
  const [userInfo, setUserInfo] = useState({
    email: null,
    name: null,
    userRole: null
  });

  return (
    <Router>
      <Navigation userInfo={userInfo} />
      <Routes>
        <Route path="/" element={<Home authToken={authToken} />} />
        <Route path="/stocks" element={<Home />} />
        <Route path="/chart/:symbol" element={<Chart />} />
        <Route
          path="/login"
          element={
            <Login
              setAuthToken={setAuthToken}
              setUserInfo={setUserInfo}
            />
          }
        />
        <Route path="/account" element={<Account userInfo={userInfo} />} />
      </Routes>
    </Router>
  );
}

export default App;
