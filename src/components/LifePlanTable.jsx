import React from 'react';

const LifePlanTable = ({ data, startAge, onRowClick }) => {
    if (!data || data.length === 0) return null;

    // Filter data to show every 5 years
    // We base the 5-year step on the age relative to the start age, or just the index.
    // Usually "every 5 years" means age 35, 40, 45...
    // Depending on startAge, the first row might be startAge.
    const filteredData = data.filter((row) => (row.age % 5 === 0) || row.age === startAge);

    // Sort by age just in case
    filteredData.sort((a, b) => a.age - b.age);

    // Remove duplicates if startAge is a multiple of 5
    const uniqueData = filteredData.filter((item, index, self) =>
        index === self.findIndex((t) => t.age === item.age)
    );

    const formatMoney = (amount) => {
        return Math.round(amount).toLocaleString();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mt-6 overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">生涯収支一覧 (5年ごと)</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-center">年齢</th>
                            <th className="px-6 py-3 font-medium text-right text-blue-600">収入</th>
                            <th className="px-6 py-3 font-medium text-right text-red-600">支出</th>
                            <th className="px-6 py-3 font-medium text-right">年間収支</th>
                            <th className="px-6 py-3 font-medium text-right text-indigo-600">金融資産</th>
                            <th className="px-6 py-3 font-medium text-right text-emerald-600">実物資産</th>
                            <th className="px-6 py-3 font-medium text-right font-bold text-gray-900">総資産</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueData.map((row, index) => {
                            const financialAssets = (row.total || 0) - (row.realEstate || 0);
                            const annualBalance = (row.details?.cashBreakdown?.annualSavings || (row.income - row.expense));

                            return (
                                <tr
                                    key={row.age}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                >
                                    <td className="px-6 py-4 text-center font-medium text-gray-900">
                                        <button
                                            onClick={() => onRowClick && onRowClick(row)}
                                            className="text-blue-600 hover:text-blue-800 underline decoration-dotted hover:decoration-solid underline-offset-4 focus:outline-none"
                                        >
                                            {row.age}歳
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatMoney(row.income)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatMoney(row.expense)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-medium ${annualBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                        {annualBalance >= 0 ? '+' : ''}{formatMoney(annualBalance)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatMoney(financialAssets)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatMoney(row.realEstate)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatMoney(row.total)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LifePlanTable;
