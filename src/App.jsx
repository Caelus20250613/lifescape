import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthHelpers';
import Navbar from './components/layout/Navbar';
import MobileNavbar from './components/layout/MobileNavbar'; // スマホ用メニューのインポート

import Dashboard from './pages/Dashboard';
import PortfolioPage from './pages/PortfolioPage';
import AssetPage from './pages/AssetPage';
import LoansPage from './pages/LoansPage';
import CashFlowPage from './pages/CashFlowPage';
import LifePlanPage from './pages/LifePlanPage';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import HelpPage from './pages/HelpPage';
import InvestmentPage from './pages/InvestmentPage';

import PropertiesPage from './pages/PropertiesPage';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  // In a real app, you might want a loading state here
  return currentUser ? children : <Navigate to="/login" />;
}

function AppContent() {
  return (
    <>
      {/* PC/タブレット用の上部ナビゲーション */}
      <Navbar />

      {/* メインコンテンツエリア 
        pb-24 (padding-bottom: 6rem) : スマホで下部メニューに隠れないよう余白を確保
        md:pb-0 : PCサイズ(md以上)では下部メニューがないので余白をゼロにする
      */}
      <div className="pb-24 md:pb-0 min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* ダッシュボード */}
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* 既存のポートフォリオページ */}
          <Route path="/portfolio" element={
            <PrivateRoute>
              <PortfolioPage />
            </PrivateRoute>
          } />

          {/* 資産管理 */}
          <Route path="/assets" element={
            <PrivateRoute>
              <AssetPage />
            </PrivateRoute>
          } />

          {/* 不動産管理 [NEW] */}
          <Route path="/properties" element={
            <PrivateRoute>
              <PropertiesPage />
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
      </div>

      {/* スマホ用下部ナビゲーション (PCではCSSで非表示になります) */}
      <MobileNavbar />
    </>
  );
}

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;