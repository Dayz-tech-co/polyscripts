import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import { ToastProvider } from "./context/ToastContext";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SearchPage from "./pages/SearchPage";
import DashboardPage from "./pages/DashboardPage";
import ToolsPage from "./pages/ToolsPage";
import AccountCheckerPage from "./pages/AccountCheckerPage";
import ComparePage from "./pages/ComparePage";
import EcosystemPage from "./pages/EcosystemPage";
import NotFoundPage from "./pages/NotFoundPage";

function AppContent() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile/:identifier" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/checker" element={<AccountCheckerPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/ecosystem" element={<EcosystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
