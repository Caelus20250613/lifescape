import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    }

    if (!currentUser) return null;

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
                            LifeScape
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                ダッシュボード
                            </Link>
                            <Link to="/assets" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                資産管理
                            </Link>
                            <Link to="/loans" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                ローン管理
                            </Link>
                            <Link to="/cashflow" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                収支管理
                            </Link>
                            <Link to="/investments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                積立管理
                            </Link>
                            <Link to="/life-plan" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                ライフプラン
                            </Link>
                            <Link to="/chat" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                AIアドバイザー
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/help" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                            ヘルプ
                        </Link>
                        <Link to="/settings" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                            設定
                        </Link>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
