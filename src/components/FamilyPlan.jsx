import React, { useState } from 'react';
import { EDUCATION_COURSES } from '../utils/educationCosts';

const FamilyPlan = ({ settings, setSettings }) => {
    const [editingChildId, setEditingChildId] = useState(null);

    const addChild = () => {
        const newChild = {
            id: Date.now(),
            age: 0,
            name: `第${settings.children.length + 1}子`,
            educationCourse: 'ALL_PUBLIC',
            studyAbroad: false
        };
        setSettings(prev => ({ ...prev, children: [...prev.children, newChild] }));
    };

    const removeChild = (id) => {
        setSettings(prev => ({ ...prev, children: prev.children.filter(c => c.id !== id) }));
    };

    const updateChild = (id, field, val) => {
        setSettings(prev => ({
            ...prev,
            children: prev.children.map(c => c.id === id ? { ...c, [field]: val } : c)
        }));
    };

    const currentEditingChild = settings.children.find(c => c.id === editingChildId);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 uppercase">お子様リスト</label>
                <button onClick={addChild} className="text-xs text-blue-600 font-bold hover:underline">+ 追加</button>
            </div>

            <div className="space-y-3">
                {settings.children.map(child => (
                    <div key={child.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex gap-2 items-center">
                            <input
                                value={child.name}
                                onChange={e => updateChild(child.id, 'name', e.target.value)}
                                className="text-sm bg-transparent w-full font-bold focus:outline-none"
                            />
                            <button
                                onClick={() => removeChild(child.id)}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">現在</span>
                                <input
                                    type="number"
                                    value={child.age}
                                    onChange={e => updateChild(child.id, 'age', Number(e.target.value))}
                                    className="w-12 text-center text-sm border rounded p-1 bg-white"
                                />
                                <span className="text-xs text-gray-500">歳</span>
                            </div>

                            <button
                                onClick={() => setEditingChildId(child.id)}
                                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                詳細設定
                            </button>
                        </div>

                        <div className="text-[10px] text-gray-400 flex justify-between items-center">
                            <span>コース: {EDUCATION_COURSES[child.educationCourse || 'ALL_PUBLIC'].name}</span>
                            {child.studyAbroad && <span className="text-blue-500 font-bold">● 留学あり</span>}
                        </div>
                    </div>
                ))}
            </div>

            {settings.children.length === 0 && (
                <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">
                    <p className="text-xs text-gray-400">お子様を登録してください</p>
                </div>
            )}

            {/* 詳細設定モーダル */}
            {editingChildId && currentEditingChild && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* 固定ヘッダー */}
                        <div className="p-4 border-b border-gray-100 flex-shrink-0 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-lg text-gray-800 tracking-tight">教育プランの設定: {currentEditingChild.name}</h3>
                            <button onClick={() => setEditingChildId(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* スクロールコンテンツエリア */}
                        <div className="p-5 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">進路コースの選択</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.values(EDUCATION_COURSES).map(course => (
                                        <button
                                            key={course.id}
                                            onClick={() => updateChild(editingChildId, 'educationCourse', course.id)}
                                            className={`text-left p-3 rounded-xl border-2 transition-all ${currentEditingChild.educationCourse === course.id
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-100 hover:border-indigo-200 text-gray-600'
                                                }`}
                                        >
                                            <div className="font-bold text-sm">{course.name}</div>
                                            <div className="text-[10px] opacity-70 leading-relaxed">{course.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">教育詳細設定 (年額 / 円)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {[
                                        { key: 'kinder', label: '幼稚園', placeholder: '約300,000' },
                                        { key: 'elem', label: '小学校', placeholder: EDUCATION_COURSES[currentEditingChild.educationCourse].costs.elem.toLocaleString() },
                                        { key: 'middle', label: '中学校', placeholder: EDUCATION_COURSES[currentEditingChild.educationCourse].costs.middle.toLocaleString() },
                                        { key: 'high', label: '高校', placeholder: EDUCATION_COURSES[currentEditingChild.educationCourse].costs.high.toLocaleString() },
                                        { key: 'uni', label: '大学', placeholder: EDUCATION_COURSES[currentEditingChild.educationCourse].costs.uni.toLocaleString() }
                                    ].map(item => (
                                        <div key={item.key} className="flex flex-col gap-1">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={currentEditingChild.customCosts?.[item.key] || ''}
                                                    placeholder={item.placeholder}
                                                    onChange={e => {
                                                        const newVal = e.target.value === '' ? undefined : Number(e.target.value);
                                                        const newCustom = { ...currentEditingChild.customCosts, [item.key]: newVal };
                                                        updateChild(editingChildId, 'customCosts', newCustom);
                                                    }}
                                                    className="w-full text-right text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                />
                                                <span className="text-[10px] text-gray-400">円</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="sm:col-span-2">
                                        <p className="text-[10px] text-gray-400">※未入力の場合はコースの標準額が適用されます。</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-blue-800 text-sm">大学での留学オプション</div>
                                    <div className="text-[10px] text-blue-600">大学4年間に年間200万円を加算</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentEditingChild.studyAbroad || false}
                                        onChange={e => updateChild(editingChildId, 'studyAbroad', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* 固定フッター */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => setEditingChildId(null)}
                                className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-colors shadow-lg"
                            >
                                設定を反映する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyPlan;
