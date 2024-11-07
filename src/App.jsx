import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chart from "./components/Chart";
import "./App.css";

const router = {
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
  },
};

function App() {
  return (
    <BrowserRouter {...router}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<Chart />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <a href="/chart">Go to Chart</a>
    </div>
  );
}

export default App;
