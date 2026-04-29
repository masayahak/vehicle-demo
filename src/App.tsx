import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import AuthGuard from "./components/AuthGuard";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";

// VehiclesPage は、遅延ロード対象とする
const VehiclesPage = lazy(() => import("./pages/VehiclesPage"));

// ログイン済みなら / へリダイレクト、未認証なら LoginPage を表示
function LoginRoute() {
  const { user, isPending } = useAuth();
  // 認証中のローディング表示
  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  // 認証判定
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
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
              <Route path="/login" element={<LoginRoute />} />
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <LandingPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <AuthGuard>
                    <VehiclesPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/about"
                element={
                  <AuthGuard>
                    <AboutPage />
                  </AuthGuard>
                }
              />
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
