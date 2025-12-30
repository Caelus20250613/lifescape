import React from 'react';

const AssetSettings = ({ settings, setSettings, readOnlyInvestment }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">現在の年齢</label>
                <input
                    type="number"
                    name="currentAge"
                    value={settings.currentAge}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                    シミュレーション終了年齢
                    <span className="text-indigo-600 text-base">{settings.targetAge}歳</span>
                </label>
                <input
                    type="range"
                    name="targetAge"
                    min={settings.currentAge + 5}
                    max={120}
                    value={settings.targetAge}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
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
            <div className="grid grid-cols-2 gap-4">
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
                    <span className="text-blue-600">{settings.returnRate}%</span>
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
