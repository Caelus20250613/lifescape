import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthHelpers';

const navItems = [
    { to: '/', label: 'ダッシュボード' },
    { to: '/assets', label: '資産' },
    { to: '/properties', label: '不動産' },
    { to: '/loans', label: 'ローン' },
    { to: '/cashflow', label: '収支' },
    { to: '/investments', label: '積立' },
    { to: '/life-plan', label: '将来計画' },
    { to: '/chat', label: 'AI相談' },
];

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error('Failed to log out');
        }
    }

    if (!currentUser) return null;

    const navClass = ({ isActive }) =>
        `inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold transition-colors whitespace-nowrap ${isActive
            ? 'border-teal-300 bg-teal-50 text-teal-800'
            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        }`;

    return (
        <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-[0_1px_8px_rgba(15,23,42,0.05)] backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link to="/" className="flex min-w-0 items-center gap-3 no-underline">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-sm font-black text-teal-800">
                            LS
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-lg font-black tracking-tight text-slate-950">LifeScape</div>
                            <div className="text-xs font-semibold text-slate-500">資産・収支・将来計画</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 items-center rounded-full border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-800">
                            ● 資産管理
                        </span>
                        <Link to="/help" className="hidden h-8 items-center rounded-md px-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:inline-flex">
                            ヘルプ
                        </Link>
                        <Link to="/settings" className="hidden h-8 items-center rounded-md px-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:inline-flex">
                            設定
                        </Link>
                        <button onClick={handleLogout} className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                            ログアウト
                        </button>
                    </div>
                </div>
                <div className="hidden gap-1 overflow-x-auto pb-1 md:flex">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}
