import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GamePage from "@/pages/GamePage";

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
