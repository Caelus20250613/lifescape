import React from 'react';

const YearlyDetailModal = ({ data, onClose }) => {
    if (!data) return null;

    const formatYen = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

    const { incomeBreakdown, expenseBreakdown } = data.details;

    const BreakdownItem = ({ label, amount, colorClass }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`font-mono font-bold ${colorClass || 'text-gray-900'}`}>{formatYen(amount)}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                {/* 固定ヘッダー */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-blue-600 text-white rounded-t-xl flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black">{data.age}歳の収支内訳</h3>
                        <p className="text-blue-100 text-[10px] mt-0.5">シミュレーション詳細データ</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* スクロールコンテンツエリア */}
                <div className="p-5 overflow-y-auto flex-1 space-y-8">
                    {/* Income Section */}
                    <div>
                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-4 bg-emerald-500 rounded-full"></span>
                            年間収入 (Total: {formatYen(data.income)})
                        </h4>
                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                            {incomeBreakdown.salary > 0 && <BreakdownItem label="給与・事業収入" amount={incomeBreakdown.salary} colorClass="text-emerald-700" />}
                            {incomeBreakdown.pension > 0 && <BreakdownItem label="公的年金等" amount={incomeBreakdown.pension} colorClass="text-emerald-700" />}
                            {incomeBreakdown.retirementBonus > 0 && <BreakdownItem label="退職金・一時金" amount={incomeBreakdown.retirementBonus} colorClass="text-emerald-700" />}
                        </div>
                    </div>

                    {/* Expense Section */}
                    <div>
                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-4 bg-rose-500 rounded-full"></span>
                            年間支出 (Total: {formatYen(data.expense)})
                        </h4>
                        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                            <BreakdownItem label="基本生活費" amount={expenseBreakdown.livingCost} colorClass="text-rose-700" />
                            {expenseBreakdown.education > 0 && <BreakdownItem label="教育費 (学費)" amount={expenseBreakdown.education} colorClass="text-rose-700" />}

                            {/* ローン内訳の表示 */}
                            {data.details.loanBreakdown && data.details.loanBreakdown.length > 0 ? (
                                data.details.loanBreakdown.map((loan, idx) => (
                                    <BreakdownItem
                                        key={idx}
                                        label={loan.name}
                                        amount={loan.amount}
                                        colorClass="text-rose-700"
                                    />
                                ))
                            ) : (
                                // フォールバック（既存データ用）
                                expenseBreakdown.housingLoan > 0 && (
                                    <BreakdownItem label="ローン返済合計" amount={expenseBreakdown.housingLoan} colorClass="text-rose-700" />
                                )
                            )}

                            {expenseBreakdown.eventCost > 0 && <BreakdownItem label="ライフイベント支出" amount={expenseBreakdown.eventCost} colorClass="text-rose-700" />}
                        </div>
                    </div>

                    {/* Cash Flow Section */}
                    {(() => {
                        const cashFlow = data.income - data.expense;
                        return (
                            <div className={`p-4 rounded-2xl border ${cashFlow >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} flex justify-between items-center`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${cashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        年間収支 (Cash Flow)
                                    </span>
                                    <span className={`text-xs ${cashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {cashFlow >= 0 ? '黒字' : '赤字'}
                                    </span>
                                </div>
                                <div className={`text-xl font-black font-mono ${cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {cashFlow >= 0 ? '+' : ''}{formatYen(cashFlow)}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Summary Footer */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        {/* 現預金残高 */}
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">現預金残高</span>
                                <span className="text-lg font-black text-emerald-600">{formatYen(data.cash || 0)}</span>
                            </div>
                            {data.details.cashBreakdown && (
                                <div className="space-y-1 pt-2 border-t border-emerald-100/50">
                                    <div className="flex justify-between items-center bg-white/60 px-2 py-1 rounded">
                                        <span className="text-xs font-bold text-emerald-700">今年の収支余剰・退職金</span>
                                        <span className="text-sm font-black text-emerald-700">
                                            {data.details.cashBreakdown.annualSavings >= 0 ? '+' : ''}{formatYen(data.details.cashBreakdown.annualSavings)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-2 pt-1">
                                        <span className="text-[10px] text-emerald-400">初期残高</span>
                                        <span className="text-xs font-semibold text-emerald-500">{formatYen(data.details.cashBreakdown.fromInitial)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-emerald-400">累積余剰</span>
                                        <span className="text-xs font-semibold text-emerald-500">{formatYen(data.details.cashBreakdown.fromSurplus)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 非課税残高 */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">非課税投資残高</span>
                                <span className="text-lg font-black text-indigo-600">{formatYen(data.nisa)}</span>
                            </div>
                            {data.details.nisaBreakdown && (
                                <div className="space-y-1 pt-2 border-t border-indigo-100">
                                    <div className="flex justify-between items-center bg-white/40 px-2 py-1 rounded">
                                        <span className="text-xs font-bold text-indigo-700">今年の投資設定額</span>
                                        <span className="text-sm font-black text-indigo-700">+{formatYen(data.details.nisaBreakdown.annualContribution)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-indigo-400">初期残高 + 運用益</span>
                                        <span className="text-xs font-semibold text-indigo-500">{formatYen(data.details.nisaBreakdown.fromInitial)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-indigo-400">積立累積 + 運用益</span>
                                        <span className="text-xs font-semibold text-indigo-500">{formatYen(data.details.nisaBreakdown.fromContrib)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 課税残高 */}
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">課税投資残高</span>
                                <span className="text-lg font-black text-blue-600">{formatYen(data.taxable)}</span>
                            </div>
                            {data.details.taxableBreakdown && (
                                <div className="space-y-1 pt-2 border-t border-blue-100">
                                    <div className="flex justify-between items-center bg-white/40 px-2 py-1 rounded">
                                        <span className="text-xs font-bold text-blue-700">今年の投資設定額</span>
                                        <span className="text-sm font-black text-blue-700">+{formatYen(data.details.taxableBreakdown.annualContribution)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-blue-400">初期残高 + 運用益</span>
                                        <span className="text-xs font-semibold text-blue-500">{formatYen(data.details.taxableBreakdown.fromInitial)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] text-blue-400">積立・退職金 + 運用益</span>
                                        <span className="text-xs font-semibold text-blue-500">{formatYen(data.details.taxableBreakdown.fromContrib)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 固定フッター */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YearlyDetailModal;
