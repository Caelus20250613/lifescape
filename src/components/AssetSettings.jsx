import React from 'react';

const AssetSettings = ({ settings, setSettings, readOnlyInvestment }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const formatYen = (val) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('ja-JP').format(num);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">現在の年齢</label>
                    <input
                        type="number"
                        name="currentAge"
                        value={settings.currentAge}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                        終了年齢
                        <span className="text-indigo-600 text-[10px]">{settings.targetAge}歳</span>
                    </label>
                    <input
                        type="number"
                        name="targetAge"
                        value={settings.targetAge}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">非課税資産</label>
                    <input
                        type="number"
                        name="initialNisa"
                        value={settings.initialNisa}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-[11px] font-bold"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">課税資産</label>
                    <input
                        type="number"
                        name="initialTaxable"
                        value={settings.initialTaxable}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-[11px] font-bold"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">現預金</label>
                    <input
                        type="number"
                        name="initialCash"
                        value={settings.initialCash || 0}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-[11px] font-bold"
                    />
                </div>
            </div>

            {/* 外貨預金 (読み取り専用 - ポートフォリオ同期分のみ表示) */}
            {(settings.initialFx || 0) > 0 && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-indigo-600 uppercase">外貨預金 (円換算)</label>
                        <span className="text-sm font-black text-indigo-700">¥{formatYen(settings.initialFx)}</span>
                    </div>
                    <div className="text-[9px] text-indigo-400 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>
                            資産管理画面から登録された外貨預金を表示
                            <a href="/assets" className="text-indigo-600 underline ml-1 font-bold hover:text-indigo-800">登録・変更はこちら</a>
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                        NISA生涯投資枠 上限設定
                        <span className="text-blue-600 font-bold">¥{formatYen(settings.nisaLifetimeLimit)}</span>
                    </label>
                    <input
                        type="number"
                        name="nisaLifetimeLimit"
                        value={settings.nisaLifetimeLimit}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold text-right"
                        step="100000"
                    />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="nisaOverflowToTaxable"
                        checked={settings.nisaOverflowToTaxable}
                        onChange={(e) => setSettings(prev => ({ ...prev, nisaOverflowToTaxable: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="nisaOverflowToTaxable" className="text-xs font-bold text-gray-600 cursor-pointer">
                        NISA枠の上限を超えたら特定口座へ積み立てる
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">毎月積立(非課税)</label>
                    <input
                        type="number"
                        name="monthlyNisa"
                        value={settings.monthlyNisa}
                        onChange={handleChange}
                        readOnly={readOnlyInvestment}
                        className={`w-full border rounded p-2 text-sm ${readOnlyInvestment ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100' : 'bg-gray-50 border-gray-200'}`}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">毎月積立(iDeCo)</label>
                    <input
                        type="number"
                        name="monthlyIdeco"
                        value={settings.monthlyIdeco}
                        onChange={handleChange}
                        readOnly={readOnlyInvestment}
                        className={`w-full border rounded p-2 text-sm ${readOnlyInvestment ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100' : 'bg-gray-50 border-gray-200'}`}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">毎月積立(課税)</label>
                    <input
                        type="number"
                        name="monthlyTaxable"
                        value={settings.monthlyTaxable}
                        onChange={handleChange}
                        readOnly={readOnlyInvestment}
                        className={`w-full border rounded p-2 text-sm ${readOnlyInvestment ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100' : 'bg-gray-50 border-gray-200'}`}
                    />
                </div>
                {readOnlyInvestment && (
                    <div className="col-span-2 text-[10px] text-gray-400 bg-blue-50 p-2 rounded border border-blue-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>
                            ※積立マネージャーの設定値を自動適用中
                            <a href="/investments" className="text-blue-600 underline ml-1 font-bold hover:text-blue-800">変更はこちら</a>
                        </span>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                    想定利回り (年率)
                    <span className="text-blue-600 font-bold">{settings.returnRate}%</span>
                </label>
                <input
                    type="range"
                    name="returnRate"
                    min="0"
                    max="15"
                    step="0.1"
                    value={settings.returnRate}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
        </div>
    );
};

export default AssetSettings;
