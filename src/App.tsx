import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";

// VehiclesPage のみを遅延ロード対象とする
const VehiclesPage = lazy(() => import("./pages/VehiclesPage"));

export default function App() {
  return (
    <BrowserRouter>
      {/* flex-col: 列方向（縦方向）へ子要素を並べよ  */}
      <div className="flex flex-col h-screen">
        <NavBar />
        {/* flex-1: NavBar以外の残り全高さを占有。overflow-y-auto: エリア内だけでスクロール */}
        <div className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* 上記以外はすべて / へ
                  ※ 変なURLを履歴に残さないように /foo を / へ書き換え */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
