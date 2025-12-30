import React from 'react';

const RetirementSettings = ({ settings, setSettings }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">引退年齢</label>
                <input
                    type="number"
                    name="retirementAge"
                    value={settings.retirementAge}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">退職金 (一時金)</label>
                <input
                    type="number"
                    name="retirementBonus"
                    value={settings.retirementBonus}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 font-bold text-indigo-700"
                    placeholder="退職時に加算される金額"
                />
                <p className="text-[10px] text-gray-400 mt-1">※設定した引退年齢の年に課税資産に加算されます</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">老後生活費(月)</label>
                    <input
                        type="number"
                        name="monthlySpendingPostRetire"
                        value={settings.monthlySpendingPostRetire}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">年金受取額(月)</label>
                    <input
                        type="number"
                        name="pensionAmount"
                        value={settings.pensionAmount}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

export default RetirementSettings;
