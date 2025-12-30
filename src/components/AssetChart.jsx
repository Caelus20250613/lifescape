import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AssetChart = ({ data, onPointClick }) => {
    const formatYen = (v) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(v);

    const handleClick = (payload) => {
        if (onPointClick && payload) {
            onPointClick(payload);
        }
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
                    <defs>
                        <linearGradient id="colorNisa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="age"
                        unit="歳"
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />

                    {/* 左軸: 資産用 */}
                    <YAxis
                        yAxisId="left"
                        tickFormatter={v => `${v / 10000}万`}
                        width={80}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        label={{ value: '資産残高 (円)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                    />

                    {/* 右軸: 収支用 */}
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={v => `${v / 10000}万`}
                        width={80}
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        label={{ value: '年間収支 (円)', angle: 90, position: 'insideRight', fontSize: 12 }}
                    />

                    <Tooltip
                        formatter={(v, name) => [formatYen(v), name]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />

                    {/* 資産データ (左軸) */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="cash"
                        stackId="1"
                        stroke="#10b981"
                        fill="url(#colorCash)"
                        name="現預金"
                        activeDot={{ r: 6, cursor: 'pointer', onClick: (e, payload) => handleClick(payload.payload) }}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="nisa"
                        stackId="1"
                        stroke="#4f46e5"
                        fill="url(#colorNisa)"
                        name="非課税口座"
                        activeDot={{ r: 6, cursor: 'pointer', onClick: (e, payload) => handleClick(payload.payload) }}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="taxable"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="url(#colorTaxable)"
                        name="課税口座"
                        activeDot={{ r: 6, cursor: 'pointer', onClick: (e, payload) => handleClick(payload.payload) }}
                    />

                    {/* 収支データ (右軸) */}
                    <Bar
                        yAxisId="right"
                        dataKey="income"
                        fill="#10b981"
                        name="年間収入"
                        barSize={20}
                        opacity={0.4}
                        cursor="pointer"
                        onClick={(barData) => handleClick(barData)}
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="expense"
                        fill="#f43f5e"
                        name="年間支出"
                        barSize={20}
                        opacity={0.4}
                        cursor="pointer"
                        onClick={(barData) => handleClick(barData)}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AssetChart;
