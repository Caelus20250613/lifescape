import React from 'react';

const HousingPlan = ({ settings, setSettings, incomes = [] }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-4">
            {/* 現在所有の不動産内訳 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-wider">現在所有している不動産の内訳</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-gray-500">自宅の比率 (%)</label>
                            <span className="text-xs font-bold text-blue-600">{settings.residenceRatio || 100}%</span>
                        </div>
                        <input
                            type="range"
                            name="residenceRatio"
                            min="0"
                            max="100"
                            step="5"
                            value={settings.residenceRatio || 100}
                            onChange={handleChange}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold">
                            <span>事業用 100%</span>
                            <span>自宅 100%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">連動するテナント・事業収入</label>
                        <select
                            name="linkedIncomeId"
                            value={settings.linkedIncomeId || ''}
                            onChange={handleTextChange}
                            className="w-full bg-white border border-blue-200 rounded p-1.5 text-xs font-bold"
                        >
                            <option value="">選択なし (売却による影響なし)</option>
                            {incomes.map(inc => (
                                <option key={inc.id} value={inc.id}>{inc.name} (¥{Math.round(inc.amount).toLocaleString()}/月)</option>
                            ))}
                        </select>
                        <p className="text-[9px] text-gray-400 mt-1 font-medium">※事業用の部分を売却した際、この収入を停止させます</p>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">新規購入予定年齢 (0=なし)</label>
                <input
                    type="number"
                    name="buyHomeAge"
                    value={settings.buyHomeAge}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold"
                />
            </div>
            {settings.buyHomeAge > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">物件価格</label>
                            <input
                                type="number"
                                name="homePrice"
                                value={settings.homePrice || 40000000}
                                onChange={handleChange}
                                className="w-full bg-white border border-yellow-200 rounded p-2 text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">頭金</label>
                            <input
                                type="number"
                                name="downPayment"
                                value={settings.downPayment || 5000000}
                                onChange={handleChange}
                                className="w-full bg-white border border-yellow-200 rounded p-2 text-sm font-bold"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">ローン金利(%)</label>
                            <input
                                type="number"
                                name="loanRate"
                                value={settings.loanRate || 1.0}
                                onChange={handleChange}
                                step="0.1"
                                className="w-full bg-white border border-yellow-200 rounded p-2 text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">返済期間(年)</label>
                            <input
                                type="number"
                                name="loanDuration"
                                value={settings.loanDuration || 35}
                                onChange={handleChange}
                                className="w-full bg-white border border-yellow-200 rounded p-2 text-sm font-bold"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">売却予定年齢 (0=なし)</label>
                <input
                    type="number"
                    name="sellHomeAge"
                    value={settings.sellHomeAge || 0}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 mb-4 text-sm font-bold"
                />

                {settings.sellHomeAge > 0 && (
                    <div className="space-y-4 p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">売却予定価格(全体)</label>
                                <input
                                    type="number"
                                    name="sellHomePrice"
                                    value={settings.sellHomePrice || 30000000}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-red-200 rounded p-2 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">売却対象</label>
                                <select
                                    name="saleTarget"
                                    value={settings.saleTarget || 'all'}
                                    onChange={handleTextChange}
                                    className="w-full bg-white border border-red-200 rounded p-2 text-sm font-bold"
                                >
                                    <option value="all">全体 (自宅 & 事業用)</option>
                                    <option value="residence">自宅部分のみ</option>
                                    <option value="business">事業用部分のみ</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded">
                            <input
                                type="checkbox"
                                id="repayLoanOnSale"
                                checked={settings.repayLoanOnSale}
                                onChange={(e) => setSettings(prev => ({ ...prev, repayLoanOnSale: e.target.checked }))}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label htmlFor="repayLoanOnSale" className="text-xs font-bold text-gray-600 cursor-pointer">
                                売却時に住宅ローンを完済する
                            </label>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium">※自宅部分を含む売却の場合のみ有効です</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HousingPlan;
