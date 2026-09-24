import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandPalette from "./components/CommandPalette";
import TickerTape from "./components/TickerTape";
import { useMotion } from "./hooks/useMotion";
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
import RewardsPage from "./pages/RewardsPage";
import RewardCardPage from "./pages/RewardCardPage";
import MarketsPage from "./pages/MarketsPage";
import MarketPage from "./pages/MarketPage";
import WhalesPage from "./pages/WhalesPage";
import WatchlistPage from "./pages/WatchlistPage";
import LegalPage from "./pages/LegalPage";
import ArbitragePage from "./pages/ArbitragePage";

function AppContent() {
  const location = useLocation();
  useMotion(location.pathname);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Header />
      <TickerTape />

      <ErrorBoundary resetKey={location.pathname}>
      <div className="page-transition" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile/:identifier" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/checker" element={<AccountCheckerPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/ecosystem" element={<EcosystemPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/card/:stream/:identifier" element={<RewardCardPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/market/:slug" element={<MarketPage />} />
        <Route path="/whales" element={<WhalesPage />} />
        <Route path="/arbitrage" element={<ArbitragePage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </div>
      </ErrorBoundary>

      <Footer />
      <Toast />
      <CommandPalette />
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
