import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';

const COLORS = {
    '日本株': '#3B82F6',   // Blue
    '米国株': '#10B981',   // Green
    '投資信託': '#F59E0B', // Amber
    '預金': '#6B7280',     // Gray
    '不動産': '#8B5CF6',   // Purple
    '貴金属': '#FCD34D',   // Gold
    '暗号資産': '#EF4444', // Red
    '小規模企業共済': '#F472B6',
    'その他': '#CBD5E1'    // Slate
};
const FALLBACK_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#64748B'];

export default function Dashboard() {
    const { currentUser } = useAuth();

    const [chartData, setChartData] = useState([]);
    const [totalAssets, setTotalAssets] = useState(0);
    const [totalLiabilities, setTotalLiabilities] = useState(0);
    const [netWorth, setNetWorth] = useState(0);
    const [nisaTotalCost, setNisaTotalCost] = useState(0);
    const [nisaFallback, setNisaFallback] = useState(false);

    const MAX_NISA_QUOTA = 18000000;

    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;

            try {
                // 1. 資産 (Assets)
                const assetQ = query(collection(db, 'users', currentUser.uid, 'portfolios'));
                const assetSnap = await getDocs(assetQ);

                let assetsSum = 0;
                let nisaCostSum = 0;
                let fallbackUsed = false;
                const categoryMap = {};

                assetSnap.forEach((doc) => {
                    const pf = doc.data();
                    if (pf.assets && Array.isArray(pf.assets)) {
                        pf.assets.forEach((asset) => {
                            const amount = Number(asset.amount) || 0;
                            const type = asset.type || 'その他';
                            const acType = (asset.accountType || '').toLowerCase();
                            const isNisa = acType.includes('nisa');

                            assetsSum += amount;

                            if (isNisa) {
                                if (asset.acquisitionCost && Number(asset.acquisitionCost) > 0) {
                                    nisaCostSum += Number(asset.acquisitionCost);
                                } else {
                                    nisaCostSum += amount;
                                    fallbackUsed = true;
                                }
                            }

                            if (categoryMap[type]) {
                                categoryMap[type] += amount;
                            } else {
                                categoryMap[type] = amount;
                            }
                        });
                    }
                });

                const formattedData = Object.keys(categoryMap).map((type, index) => ({
                    name: type,
                    value: categoryMap[type],
                    color: COLORS[type] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                })).sort((a, b) => b.value - a.value);

                // 2. 負債 (Loans)
                const loanQ = query(collection(db, 'users', currentUser.uid, 'loans'));
                const loanSnap = await getDocs(loanQ);

                let liabilitiesSum = 0;
                loanSnap.forEach((doc) => {
                    const data = doc.data();
                    const amount = Number(data.balance) || 0;
                    liabilitiesSum += amount;
                });

                // 3. 結果保存
                setChartData(formattedData);
                setTotalAssets(assetsSum);
                setTotalLiabilities(liabilitiesSum);
                setNetWorth(assetsSum - liabilitiesSum);
                setNisaTotalCost(nisaCostSum);
                setNisaFallback(fallbackUsed);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData();
    }, [currentUser]);

    const formatYen = (num) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(num);
    };

    const formatShortYen = (num) => {
        if (num >= 100000000) return (num / 100000000).toFixed(1) + '億円';
        if (num >= 10000) return (num / 10000).toFixed(0) + '万円';
        return num.toLocaleString();
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <header className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
                <p className="text-gray-500 text-sm">資産状況のサマリー</p>
            </header>

            {/* 1. 資産サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">総資産</p>
                        <p className="text-2xl font-bold text-blue-600">{formatYen(totalAssets)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">総負債</p>
                        <p className="text-2xl font-bold text-red-500">{formatYen(-totalLiabilities)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">純資産</p>
                        <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                            {formatYen(netWorth)}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-full text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                </div>
            </div>

            {/* 2カラムエリア */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* メインメニュー & NISAウィジェット */}
                <div className="lg:col-span-2 space-y-6">
                    {/* NISA Progress Widget */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 uppercase tracking-tight">New NISA</span>
                                    新NISA 生涯投資枠
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    総枠 ¥1,800万 に対する現在の利用状況
                                    {nisaFallback && <span className="ml-2 text-orange-400 italic">※一部、時価値で計算</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-blue-600 font-mono tracking-tight">{formatYen(nisaTotalCost)}</span>
                                <span className="text-xs text-gray-400 ml-1">/ {formatShortYen(MAX_NISA_QUOTA)}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div
                                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                style={{ width: `${Math.min(100, (nisaTotalCost / MAX_NISA_QUOTA) * 100)}%` }}
                            >
                                {(nisaTotalCost / MAX_NISA_QUOTA) > 0.1 && (
                                    <span className="text-[10px] font-bold text-white leading-none">
                                        {((nisaTotalCost / MAX_NISA_QUOTA) * 100).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <div className="text-gray-500 font-medium">
                                進捗率: <span className="text-blue-600 font-bold">{((nisaTotalCost / MAX_NISA_QUOTA) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="text-gray-500">
                                残り枠: <span className="text-gray-800 font-bold">{formatYen(Math.max(0, MAX_NISA_QUOTA - nisaTotalCost))}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">メインメニュー</h2>
                        <div className="grid grid-cols-2 gap-4">

                            <Link to="/assets" className="group flex flex-col md:flex-row items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 md:mb-0 md:mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">資産管理</h3>
                                    <p className="text-sm text-gray-500 mt-1">資産の内訳を確認・編集</p>
                                </div>
                            </Link>

                            <Link to="/loans" className="group flex flex-col md:flex-row items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 md:mb-0 md:mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">ローン管理</h3>
                                    <p className="text-sm text-gray-500 mt-1">返済シミュレーション</p>
                                </div>
                            </Link>

                            <Link to="/cashflow" className="group flex flex-col md:flex-row items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 md:mb-0 md:mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">収支管理</h3>
                                    <p className="text-sm text-gray-500 mt-1">家計簿・CFグラフ</p>
                                </div>
                            </Link>

                            <Link to="/investments" className="group flex flex-col md:flex-row items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-yellow-300 hover:shadow-md transition-all duration-200">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-3 md:mb-0 md:mr-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">積立設定</h3>
                                    <p className="text-sm text-gray-500 mt-1">NISA/iDeCo/課税口座</p>
                                </div>
                            </Link>

                        </div>
                    </div>
                </div>

                {/* 右側: ポートフォリオ */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-gray-800">ポートフォリオ</h2>
                        <Link to="/assets" className="text-xs text-blue-600 hover:underline">詳細 &rarr;</Link>
                    </div>

                    <div className="flex-grow min-h-[300px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                        <Label
                                            value={formatShortYen(totalAssets)}
                                            position="center"
                                            className="text-xl font-bold fill-gray-700"
                                            style={{ fontSize: '18px', fontWeight: 'bold' }}
                                        />
                                    </Pie>
                                    <Tooltip formatter={(value) => formatYen(value)} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={80}
                                        iconType="circle"
                                        iconSize={12}
                                        wrapperStyle={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>データがありません</p>
                                <Link to="/assets" className="mt-2 text-blue-500 text-sm hover:underline">資産を登録する</Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}