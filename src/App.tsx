import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import LandingPage from "./pages/LandingPage";
import VehiclesPage from "./pages/VehiclesPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <NavBar />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
