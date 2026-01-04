import React from 'react';
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AssetChart = ({ data, onPointClick }) => {
    const formatYen = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

    const handleClick = (payload) => {
        if (onPointClick && payload) {
            onPointClick(payload);
        }
    };

    // カラーパレットの定義
    const colors = {
        cash: '#10b981',      // Emerald 500
        nisa: '#4f46e5',      // Indigo 600
        taxable: '#3b82f6',   // Blue 500
        ideco: '#8b5cf6',     // Violet 500
        realEstate: '#f59e0b',// Amber 500
        metals: '#94a3b8',    // Slate 400
        crypto: '#f97316',    // Orange 500
        fx: '#06b6d4',        // Cyan 500
        total: '#1e293b',     // Slate 800
        income: '#10b981',    // Emerald 500 (Bar)
        expense: '#f43f5e'    // Rose 500 (Bar)
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    onClick={(state) => {
                        if (state && state.activePayload && state.activePayload.length > 0 && onPointClick) {
                            onPointClick(state.activePayload[0].payload);
                        }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="age"
                        unit="歳"
                        tick={{ fontSize: 11, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />

                    {/* 左軸: 資産用 */}
                    <YAxis
                        yAxisId="left"
                        tickFormatter={v => `${v / 10000}万`}
                        width={80}
                        tick={{ fontSize: 11, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />

                    {/* 右軸: 収支用 */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={v => `${v / 10000}万`}
                        width={80}
                        tick={{ fontSize: 11, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />

                    <Tooltip
                        formatter={(v, name) => [formatYen(v), name]}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.96)',
                            padding: '12px'
                        }}
                        itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                    />
                    <Legend verticalAlign="top" height={48} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />

                    {/* 資産データ (左軸 - Stacked Area) */}
                    <Area yAxisId="left" type="monotone" dataKey="cash" stackId="1" stroke={colors.cash} fill={colors.cash} fillOpacity={0.6} name="現預金" />
                    <Area yAxisId="left" type="monotone" dataKey="nisa" stackId="1" stroke={colors.nisa} fill={colors.nisa} fillOpacity={0.6} name="非課税口座" />
                    <Area yAxisId="left" type="monotone" dataKey="taxable" stackId="1" stroke={colors.taxable} fill={colors.taxable} fillOpacity={0.6} name="課税口座" />
                    <Area yAxisId="left" type="monotone" dataKey="ideco" stackId="1" stroke={colors.ideco} fill={colors.ideco} fillOpacity={0.6} name="iDeCo/共済" />
                    <Area yAxisId="left" type="monotone" dataKey="fx" stackId="1" stroke={colors.fx} fill={colors.fx} fillOpacity={0.6} name="外貨資産" />
                    <Area yAxisId="left" type="monotone" dataKey="metals" stackId="1" stroke={colors.metals} fill={colors.metals} fillOpacity={0.6} name="貴金属" />
                    <Area yAxisId="left" type="monotone" dataKey="crypto" stackId="1" stroke={colors.crypto} fill={colors.crypto} fillOpacity={0.6} name="暗号資産" />
                    <Area yAxisId="left" type="monotone" dataKey="realEstate" stackId="1" stroke={colors.realEstate} fill={colors.realEstate} fillOpacity={0.6} name="不動産" />

                    {/* 合計資産ライン */}
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="total"
                        stroke={colors.total}
                        strokeWidth={3}
                        dot={false}
                        name="合計資産"
                        activeDot={{ r: 6 }}
                    />

                    {/* 収支データ (右軸 - Bar) */}
                    <Bar
                        yAxisId="right"
                        dataKey="income"
                        fill={colors.income}
                        name="年間収入"
                        barSize={12}
                        opacity={0.3}
                        cursor="pointer"
                        onClick={(barData) => handleClick(barData)}
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="expense"
                        fill={colors.expense}
                        name="年間支出"
                        barSize={12}
                        opacity={0.3}
                        cursor="pointer"
                        onClick={(barData) => handleClick(barData)}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AssetChart;
