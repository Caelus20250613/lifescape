import React from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-4 py-10">
            <main className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
                <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_16px_50px_rgba(15,23,42,0.10)]">
                    <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-sm font-black text-teal-800">
                        LS
                    </div>
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-teal-700">資産管理</p>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                        LifeScape
                    </h1>
                    <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-600">
                        資産、負債、収支、将来計画をひとつの運用画面で確認します。
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold text-slate-500">対象</div>
                            <div className="mt-1 font-black text-slate-900">個人資産</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold text-slate-500">用途</div>
                            <div className="mt-1 font-black text-slate-900">管理</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold text-slate-500">保存</div>
                            <div className="mt-1 font-black text-slate-900">クラウド</div>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">認証</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">Googleでログイン</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                        ログイン後、資産管理ダッシュボードを表示します。
                    </p>
                    <button
                        onClick={handleLogin}
                        className="mt-6 flex w-full justify-center rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2"
                    >
                        Googleでログイン
                    </button>
                </section>
            </main>
        </div>
    );
}
