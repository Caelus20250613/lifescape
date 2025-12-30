import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import PortfolioPage from './pages/PortfolioPage';
import AssetPage from './pages/AssetPage'; // 新規追加
import LoansPage from './pages/LoansPage';
import CashFlowPage from './pages/CashFlowPage';
import LifePlanPage from './pages/LifePlanPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import HelpPage from './pages/HelpPage';
import InvestmentPage from './pages/InvestmentPage';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  // In a real app, you might want a loading state here
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ダッシュボード */}
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* 既存のポートフォリオページ（もし不要なら削除可） */}
        <Route path="/portfolio" element={
          <PrivateRoute>
            <PortfolioPage />
          </PrivateRoute>
        } />

        {/* ▼ 新規追加: 資産管理(AssetPage)へのルート */}
        <Route path="/assets" element={
          <PrivateRoute>
            <AssetPage />
          </PrivateRoute>
        } />

        {/* ローン管理 */}
        <Route path="/loans" element={
          <PrivateRoute>
            <LoansPage />
          </PrivateRoute>
        } />

        {/* 収支管理 */}
        <Route path="/cashflow" element={
          <PrivateRoute>
            <CashFlowPage />
          </PrivateRoute>
        } />

        {/* 積立管理 */}
        <Route path="/investments" element={
          <PrivateRoute>
            <InvestmentPage />
          </PrivateRoute>
        } />

        {/* ライフプラン */}
        <Route path="/life-plan" element={
          <PrivateRoute>
            <LifePlanPage />
          </PrivateRoute>
        } />

        {/* チャット・AIアドバイザー */}
        <Route path="/chat" element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        } />

        {/* 設定 */}
        <Route path="/settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />

        {/* ヘルプ */}
        <Route path="/help" element={
          <PrivateRoute>
            <HelpPage />
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;