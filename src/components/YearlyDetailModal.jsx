import React from 'react';
import { createPortal } from 'react-dom';

// Helper: currency formatter
const formatYen = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

// Components declared at module scope to avoid creating components during render
const BreakdownItem = ({ label, amount, colorClass }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`font-mono font-bold ${colorClass || 'text-gray-900'}`}>{formatYen(amount)}</span>
    </div>
);

const AssetDetailRow = ({ label, total, basis, annualContribution, colorBase }) => {
    const gain = total - basis;
    const gainPercent = basis > 0 ? (gain / basis) * 100 : 0;

    return (
        <div className="py-2 border-t first:border-0 border-gray-100">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold text-${colorBase}-700`}>{label}</span>
                <span className={`text-sm font-black text-${colorBase}-700`}>{formatYen(total)}</span>
            </div>
            {annualContribution > 0 && (
                <div className="flex justify-between items-center px-2 mb-0.5">
                    <span className={`text-[10px] text-${colorBase}-500 font-bold`}>＋ その年の投資額</span>
                    <span className={`text-xs text-${colorBase}-600 font-bold`}>{formatYen(annualContribution)}</span>
                </div>
            )}
            <div className="flex justify-between items-center px-2">
                <span className={`text-[10px] text-${colorBase}-400`}>元本 (累計)</span>
                <span className={`text-xs text-${colorBase}-500`}>{formatYen(basis)}</span>
            </div>
            <div className="flex justify-between items-center px-2">
                <span className={`text-[10px] text-${colorBase}-400`}>運用益 (累計)</span>
                <span className={`text-xs font-bold ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {gain >= 0 ? '+' : ''}{formatYen(gain)} ({gainPercent.toFixed(1)}%)
                </span>
            </div>
        </div>
    );
};

const YearlyDetailModal = ({ data, onClose }) => {
    if (!data) return null;

    const details = data.details || {};
    const incomeBreakdown = details.incomeBreakdown || {};
    const expenseBreakdown = details.expenseBreakdown || {};
    const loanBreakdown = details.loanBreakdown || [];
    const nisaBreakdown = details.nisaBreakdown || {};
    const idecoBreakdown = details.idecoBreakdown || {};
    const taxableBreakdown = details.taxableBreakdown || {};
    const cashBreakdown = details.cashBreakdown || {};
    const realEstate = details.realEstate || 0;
    const metals = details.metals || 0;
    const crypto = details.crypto || 0;
    const fx = details.fx || 0; // FX受け取り

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300 relative z-10">

                {/* ヘッダー */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-blue-600 text-white rounded-t-xl flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black">{data.age}歳の収支内訳</h3>
                        <p className="text-blue-100 text-[10px] mt-0.5">総資産: {formatYen(data.total)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-8">
                    {/* 収入・支出 */}
                    <div>
                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-4 bg-emerald-500 rounded-full"></span>
                            年間収入 (Total: {formatYen(data.income)})
                        </h4>
                        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                            {incomeBreakdown.salary > 0 && <BreakdownItem label="給与・手取り事業収入" amount={incomeBreakdown.salary} colorClass="text-emerald-700" />}
                            {incomeBreakdown.pension > 0 && <BreakdownItem label="公的年金等" amount={incomeBreakdown.pension} colorClass="text-emerald-700" />}
                            {incomeBreakdown.retirementBonus > 0 && <BreakdownItem label="退職金・一時金" amount={incomeBreakdown.retirementBonus} colorClass="text-emerald-700" />}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-4 bg-rose-500 rounded-full"></span>
                            年間支出 (Total: {formatYen(data.expense)})
                        </h4>
                        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                            <BreakdownItem label="基本生活費" amount={expenseBreakdown.livingCost || 0} colorClass="text-rose-700" />
                            {expenseBreakdown.education > 0 && <BreakdownItem label="教育費 (学費)" amount={expenseBreakdown.education} colorClass="text-rose-700" />}
                            {loanBreakdown.length > 0 ? loanBreakdown.map((l, i) => <BreakdownItem key={i} label={l.name} amount={l.amount} colorClass="text-rose-700" />) : null}
                            {expenseBreakdown.housingLoan > 0 && loanBreakdown.length === 0 && <BreakdownItem label="住宅ローン" amount={expenseBreakdown.housingLoan} colorClass="text-rose-700" />}
                            {expenseBreakdown.eventCost > 0 && <BreakdownItem label="ライフイベント" amount={expenseBreakdown.eventCost} colorClass="text-rose-700" />}
                        </div>
                    </div>

                    {/* 資産詳細 */}
                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">資産ポートフォリオ詳細</h3>

                        {/* 成長しない資産群 */}
                        {(realEstate > 0 || metals > 0 || crypto > 0) && (
                            <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">非成長資産</p>
                                {realEstate > 0 && <div className="flex justify-between text-sm mb-1"><span>不動産</span><span className="font-black">{formatYen(realEstate)}</span></div>}
                                {metals > 0 && <div className="flex justify-between text-sm mb-1"><span>貴金属</span><span className="font-black">{formatYen(metals)}</span></div>}
                                {crypto > 0 && <div className="flex justify-between text-sm"><span>暗号資産</span><span className="font-black">{formatYen(crypto)}</span></div>}
                            </div>
                        )}

                        {/* 現預金 */}
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">現預金残高</span>
                                <span className="text-lg font-black text-emerald-600">{formatYen(data.cash || 0)}</span>
                            </div>
                            <div className="text-xs text-emerald-500 flex justify-between">
                                <span>年間収支 (余剰金)</span>
                                <span>{cashBreakdown.annualSavings >= 0 ? '+' : ''}{formatYen(cashBreakdown.annualSavings || 0)}</span>
                            </div>
                        </div>

                        {/* 外貨預金 (New) */}
                        {fx > 0 && (
                            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">外貨預金 (FX)</span>
                                    <span className="text-lg font-black text-orange-600">{formatYen(fx)}</span>
                                </div>
                                <div className="text-[10px] text-orange-400">※為替レートは初期時点固定・複利運用</div>
                            </div>
                        )}

                        {/* 成長資産 (非課税: NISA + iDeCo) */}
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">非課税投資 (合計)</span>
                                <span className="text-lg font-black text-indigo-600">{formatYen((data.nisa || 0) + (data.ideco || 0))}</span>
                            </div>

                            <AssetDetailRow
                                label="NISA (生涯枠対象)"
                                total={nisaBreakdown.total || 0}
                                basis={nisaBreakdown.basis || 0}
                                annualContribution={nisaBreakdown.annualContribution || 0}
                                colorBase="indigo"
                            />

                            <div className="my-2 border-t border-indigo-100 border-dashed"></div>

                            <AssetDetailRow
                                label="iDeCo (60歳まで積立)"
                                total={idecoBreakdown.total || 0}
                                basis={idecoBreakdown.basis || 0}
                                annualContribution={idecoBreakdown.annualContribution || 0}
                                colorBase="indigo"
                            />
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">課税投資 (株・投信)</span>
                                <span className="text-lg font-black text-blue-600">{formatYen(data.taxable || 0)}</span>
                            </div>
                            <AssetDetailRow
                                label="残高内訳"
                                total={taxableBreakdown.total || 0}
                                basis={taxableBreakdown.basis || 0}
                                annualContribution={taxableBreakdown.annualContribution || 0}
                                colorBase="blue"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0 rounded-b-xl">
                    <button onClick={onClose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95">閉じる</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default YearlyDetailModal;