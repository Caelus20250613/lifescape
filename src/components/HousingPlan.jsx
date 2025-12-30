import React from 'react';

const HousingPlan = ({ settings, setSettings }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">購入予定年齢 (0=なし)</label>
                <input
                    type="number"
                    name="buyHomeAge"
                    value={settings.buyHomeAge}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2"
                />
            </div>
            {settings.buyHomeAge > 0 && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">物件価格</label>
                            <input
                                type="number"
                                name="homePrice"
                                value={settings.homePrice || 40000000}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">頭金</label>
                            <input
                                type="number"
                                name="downPayment"
                                value={settings.downPayment || 5000000}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
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
                                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">返済期間(年)</label>
                            <input
                                type="number"
                                name="loanDuration"
                                value={settings.loanDuration || 35}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default HousingPlan;
