import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { LoadingSkeleton } from "./components/LoadingSkeleton";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AnalyzerPage = lazy(() => import("./pages/AnalyzerPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ModerationChatPage = lazy(() => import("./pages/ModerationChatPage"));

const PageFallback = () => (
  <div className="min-h-screen noise px-4 py-8">
    <div className="mx-auto max-w-3xl">
      <LoadingSkeleton rows={5} />
    </div>
  </div>
);

const App = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/analyzer" element={<AnalyzerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/moderation-chat" element={<ModerationChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  </Suspense>
);

export default App;
