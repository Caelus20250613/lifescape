import React from 'react';

const SummaryCards = ({ totalAsset, retirementAge }) => {
    const formatYen = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">シミュレーション終了時 資産</p>
                <p className="text-2xl font-extrabold text-blue-600">{formatYen(totalAsset)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">資産寿命の目安</p>
                <p className={`text-2xl font-extrabold ${totalAsset > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalAsset > 0 ? '安定圏' : '見直しが必要'}
                </p>
            </div>
        </div>
    );
};

export default SummaryCards;
