import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [rawAssets, setRawAssets] = useState([]);
    const [rawLoans, setRawLoans] = useState([]);
    const [rawIncomes, setRawIncomes] = useState([]);
    const [rawExpenses, setRawExpenses] = useState([]);
    const [members, setMembers] = useState(['自分']);
    const [selectedOwner, setSelectedOwner] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;

            try {
                // Fetch Members
                const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists() && settingsSnap.data().members) {
                    setMembers(settingsSnap.data().members);
                }

                // Fetch Assets (Portfolios)
                const portfoliosRef = collection(db, 'users', currentUser.uid, 'portfolios');
                const portfolioSnapshot = await getDocs(portfoliosRef);
                let aggregatedAssets = [];
                portfolioSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const docOwner = data.owner || '自分';
                    if (data.assets && Array.isArray(data.assets)) {
                        data.assets.forEach(a => {
                            aggregatedAssets.push({
                                ...a,
                                owner: docOwner
                            });
                        });
                    } else if (data.amount) {
                        aggregatedAssets.push({
                            ...data,
                            owner: docOwner
                        });
                    }
                });
                setRawAssets(aggregatedAssets);

                // Fetch Loans
                const loansRef = collection(db, 'users', currentUser.uid, 'loans');
                const loansSnapshot = await getDocs(loansRef);
                const fetchedLoans = loansSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    owner: doc.data().owner || '自分'
                }));
                setRawLoans(fetchedLoans);

                // Fetch Incomes
                const incomesRef = collection(db, 'users', currentUser.uid, 'incomes');
                const incomesSnapshot = await getDocs(incomesRef);
                const fetchedIncomes = incomesSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    owner: doc.data().owner || '自分'
                }));
                setRawIncomes(fetchedIncomes);

                // Fetch Expenses
                const expensesRef = collection(db, 'users', currentUser.uid, 'expenses');
                const expensesSnapshot = await getDocs(expensesRef);
                const fetchedExpenses = expensesSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    owner: doc.data().owner || '自分'
                }));
                setRawExpenses(fetchedExpenses);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [currentUser]);

    // Helper to safely parse amount
    const parseAmount = (val) => {
        if (!val) return 0;
        const num = Number(String(val).replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Filter Data based on selectedOwner
    const filteredAssets = selectedOwner === 'ALL'
        ? rawAssets
        : rawAssets.filter(item => item.owner === selectedOwner);

    const filteredLoans = selectedOwner === 'ALL'
        ? rawLoans
        : rawLoans.filter(item => item.owner === selectedOwner);

    const filteredIncomes = selectedOwner === 'ALL'
        ? rawIncomes
        : rawIncomes.filter(item => item.owner === selectedOwner);

    const filteredExpenses = selectedOwner === 'ALL'
        ? rawExpenses
        : rawExpenses.filter(item => item.owner === selectedOwner);

    // Calculate Totals using filtered data
    const totalAssets = filteredAssets.reduce((sum, asset) => sum + parseAmount(asset.amount), 0);
    const totalLiabilities = filteredLoans.reduce((sum, loan) => sum + parseAmount(loan.balance), 0);
    const netWorth = totalAssets - totalLiabilities;

    // Cashflow Totals - FIXED: Filter by 'monthly' frequency
    const monthlyIncomeItems = filteredIncomes.filter(i => i.frequency === 'monthly');
    const monthlyExpenseItems = filteredExpenses.filter(e => e.frequency === 'monthly' && !e.isInvestment && e.category !== '投資・貯蓄');

    const totalMonthlyIncome = monthlyIncomeItems.reduce((sum, item) => sum + parseAmount(item.amount), 0);
    const totalMonthlyExpense = monthlyExpenseItems.reduce((sum, item) => sum + parseAmount(item.amount), 0);
    const totalMonthlyRepayment = filteredLoans.reduce((sum, loan) => sum + parseAmount(loan.monthlyPayment), 0);
    const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpense - totalMonthlyRepayment;

    // Aggregate data for the chart from filtered assets
    const aggregation = filteredAssets.reduce((acc, asset) => {
        const type = asset.type || "その他";
        acc[type] = (acc[type] || 0) + parseAmount(asset.amount);
        return acc;
    }, {});

    const chartData = Object.keys(aggregation).map(key => ({
        name: key,
        value: aggregation[key],
    })).sort((a, b) => b.value - a.value);

    // Filter out 0 values for cleaner chart
    const filteredChartData = chartData.filter(d => d.value > 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center text-gray-500">
                <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                データを読み込んでいます...
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 md:mb-0">ダッシュボード</h1>

                {/* Owner Filter UI */}
                <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
                    <button
                        onClick={() => setSelectedOwner('ALL')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedOwner === 'ALL'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        家族全体
                    </button>
                    {members.map(m => (
                        <button
                            key={m}
                            onClick={() => setSelectedOwner(m)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${selectedOwner === m
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Net Worth Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Assets */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">総資産</h3>
                    <p className="text-2xl font-black text-blue-600">{formatCurrency(totalAssets)}</p>
                </div>

                {/* Total Liabilities */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">総負債</h3>
                    <p className="text-2xl font-black text-red-500">-{formatCurrency(totalLiabilities).replace('￥', '¥')}</p>
                </div>

                {/* Net Worth */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">純資産 (Net Worth)</h3>
                    <p className={`text-3xl font-black ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrency(netWorth)}
                    </p>
                </div>
            </div>

            {/* Monthly Cashflow Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    収支シミュレーション (月次)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">月次収入</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(totalMonthlyIncome)}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">生活費(消費)</span>
                        <span className="text-xl font-bold text-gray-700">-{formatCurrency(totalMonthlyExpense)}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 font-bold uppercase block mb-1">ローン返済</span>
                        <span className="text-xl font-bold text-red-500">-{formatCurrency(totalMonthlyRepayment)}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <span className="text-xs text-blue-500 font-bold uppercase block mb-1">現金余力 (Free CF)</span>
                        <span className={`text-2xl font-black ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyCashFlow)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart Card */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">資産ポートフォリオ構成</h3>
                    {filteredChartData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={filteredChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {filteredChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm">表示する資産データがありません</p>
                        </div>
                    )}
                </div>

                {/* Summary / Stats Card */}
                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">登録状況サマリー</h3>
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <span className="text-gray-500 text-sm font-medium">資産カテゴリ数:</span>
                            <span className="font-bold text-gray-900">{filteredChartData.length} 種</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <span className="text-gray-500 text-sm font-medium">負債 (ローン) 件数:</span>
                            <span className="font-bold text-gray-900">{filteredLoans.length} 件</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                            <span className="text-gray-500 text-sm font-medium">収入源 件数:</span>
                            <span className="font-bold text-gray-900">{filteredIncomes.length} 件</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t font-medium">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-3">クイックリンク</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                            <a href="/portfolio" className="bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition-colors">資産管理</a>
                            <a href="/loans" className="bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition-colors">ローン管理</a>
                            <a href="/cashflow" className="bg-green-50 text-green-600 py-2 rounded hover:bg-green-100 transition-colors">収支管理</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
