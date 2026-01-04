import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    updateDoc,
    getDoc,
    setDoc
} from 'firebase/firestore';

// アイコン
const Icons = {
    Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Bank: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10v8M11 10v8M15 10v8M3 21h18M7 3l4-2 4 2M3 7h18" /></svg>,
    Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
    Spot: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Wallet: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
};

// iDeCo月額上限 (2024-2025年基準)
const IDECO_LIMITS = {
    '自営業 (第一号)': 68000,
    '会社員 (企業型DC・DBなし)': 23000,
    '会社員 (企業型DCあり)': 20000,
    '会社員 (DBあり)': 12000,
    '公務員': 12000,
    '専業主婦/夫 (第三号)': 23000,
};

// 口座種別定義
const ACCOUNT_TYPES = {
    nisa_tsumitate: { label: '新NISA (つみたて)', color: 'bg-indigo-600', textColor: 'text-indigo-600', limit: 1200000 },
    nisa_growth: { label: '新NISA (成長)', color: 'bg-indigo-400', textColor: 'text-indigo-400', limit: 2400000 },
    ideco: { label: 'iDeCo', color: 'bg-emerald-600', textColor: 'text-emerald-600', limit: null }, // limitは動的計算
    taxable: { label: '特定口座 (課税)', color: 'bg-slate-600', textColor: 'text-slate-600', limit: null }, // 上限なし
};

export default function InvestmentPage() {
    const { currentUser } = useAuth();
    const [investments, setInvestments] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [occupation, setOccupation] = useState('会社員 (企業型DC・DBなし)');

    // フォーム用 State
    const [type, setType] = useState('recurring'); // 'recurring' (積立) | 'spot' (スポット)
    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [accountType, setAccountType] = useState('nisa_tsumitate');
    const [monthlyAmount, setMonthlyAmount] = useState('');
    const [bonusAmount, setBonusAmount] = useState('0');
    const [spotAmount, setSpotAmount] = useState('');
    const [spotDate, setSpotDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        try {
            const q = query(collection(db, 'users', currentUser.uid, 'investments'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() })));

            const docRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
            const s = await getDoc(docRef);
            if (s.exists() && s.data().occupation) {
                setOccupation(s.data().occupation);
            }
        } catch (e) {
            console.error("データ取得エラー:", e);
        }
    }, [currentUser]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            await fetchData();
        })();
        return () => { mounted = false; };
    }, [fetchData]);

    const handleOccupationChange = async (val) => {
        setOccupation(val);
        if (currentUser) {
            await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'general'), { occupation: val }, { merge: true });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setType('recurring');
        setName(''); setInstitution('');
        setAccountType('nisa_tsumitate');
        setMonthlyAmount(''); setBonusAmount('0');
        setSpotAmount('');
        setSpotDate(new Date().toISOString().split('T')[0]);
        setShowModal(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setType(item.type || 'recurring');
        setName(item.name);
        setInstitution(item.institution || '');
        setAccountType(item.accountType);
        if (item.type === 'spot') {
            setSpotAmount(item.amount);
            setSpotDate(item.date);
        } else {
            setMonthlyAmount(item.monthlyAmount);
            setBonusAmount(item.bonusAmount || '0');
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let data = {
            name,
            institution,
            accountType: accountType.toLowerCase(), // 保存時に小文字化して表記ゆれを防ぐ
            type,
            updatedAt: serverTimestamp()
        };

        if (type === 'spot') {
            if (!name || !spotAmount || !spotDate) return alert("必須項目を入力してください");
            data = { ...data, amount: Number(spotAmount), date: spotDate };
        } else {
            if (!name || !monthlyAmount) return alert("必須項目を入力してください");
            data = { ...data, monthlyAmount: Number(monthlyAmount), bonusAmount: Number(bonusAmount) };
        }

        try {
            if (editingId) {
                // 既存データの更新: accountTypeの上書き更新を確認
                await updateDoc(doc(db, 'users', currentUser.uid, 'investments', editingId), data);
            } else {
                await addDoc(collection(db, 'users', currentUser.uid, 'investments'), { ...data, createdAt: serverTimestamp() });
            }
            resetForm();
            fetchData();
        } catch (e) {
            console.error("保存エラー:", e);
            alert("保存に失敗しました");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("このデータを削除しますか？")) {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'investments', id));
            fetchData();
        }
    };

    const formatYen = (val) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(val);

    // 集計ロジック (現在の年の実績・予定を計算)
    const currentYear = new Date().getFullYear();
    const calculateAnnualTotal = (accountType) => {
        return investments.reduce((sum, item) => {
            if (item.accountType !== accountType) return sum;

            if (item.type === 'spot') {
                // スポット購入は、今年のデータのみ加算
                const itemYear = new Date(item.date).getFullYear();
                return itemYear === currentYear ? sum + (item.amount || 0) : sum;
            } else {
                // 積立設定は年額換算 (月額*12 + ボーナス*2)
                const monthly = item.monthlyAmount || 0;
                const bonus = item.bonusAmount || 0;
                return sum + (monthly * 12) + (bonus * 2);
            }
        }, 0);
    };

    const idecoMonthlyLimit = IDECO_LIMITS[occupation] || 23000;
    const idecoAnnualLimit = idecoMonthlyLimit * 12;

    const recurringItems = investments.filter(i => (i.type || 'recurring') === 'recurring');
    const spotItems = investments.filter(i => i.type === 'spot');

    // 全体の合計を計算
    const totalAnnualInvestment =
        calculateAnnualTotal('nisa_tsumitate') +
        calculateAnnualTotal('nisa_growth') +
        calculateAnnualTotal('ideco') +
        calculateAnnualTotal('taxable');

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">積立 & 投資管理</h1>
                    <p className="text-sm text-gray-500 mt-1">NISA・iDeCo・特定口座の積立を一元管理</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95"
                >
                    <Icons.Plus /> <span>投資を追加</span>
                </button>
            </header>

            {/* 投資全体サマリー (新規追加) */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 mb-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-1">年間投資予定額 (全体)</p>
                        <p className="text-4xl font-black">{formatYen(totalAnnualInvestment)}<span className="text-lg text-gray-400 font-bold ml-2">/ 年</span></p>
                    </div>
                    <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <p className="text-gray-300 font-bold text-xs uppercase tracking-widest mb-1">月平均</p>
                        <p className="text-2xl font-black">{formatYen(totalAnnualInvestment / 12)}</p>
                    </div>
                </div>
            </div>

            {/* 属性設定 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-50 p-3 rounded-2xl text-amber-600"><Icons.Bank /></div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800">iDeCo限度額設定 (職業属性)</h3>
                        <p className="text-xs text-gray-400">現在の属性: {occupation}</p>
                    </div>
                </div>
                <select
                    value={occupation}
                    onChange={(e) => handleOccupationChange(e.target.value)}
                    className="w-full md:w-72 bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                >
                    {Object.keys(IDECO_LIMITS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
            </div>

            {/* 口座別状況カード (4つに拡張) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'NISA (つみたて)', val: calculateAnnualTotal('nisa_tsumitate'), limit: ACCOUNT_TYPES.nisa_tsumitate.limit, color: 'indigo', icon: '✨' },
                    { label: 'NISA (成長)', val: calculateAnnualTotal('nisa_growth'), limit: ACCOUNT_TYPES.nisa_growth.limit, color: 'blue', icon: '🚀' },
                    { label: 'iDeCo (年間)', val: calculateAnnualTotal('ideco'), limit: idecoAnnualLimit, color: 'emerald', icon: '🛡️' },
                    { label: '特定口座 (課税)', val: calculateAnnualTotal('taxable'), limit: null, color: 'slate', icon: '💰' }, // 新規追加
                ].map(p => (
                    <div key={p.label} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 bg-${p.color}-50 rounded-full opacity-50 group-hover:scale-110 transition-transform`}></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="mb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{p.icon} {p.label}</span>
                                <span className="text-xl font-black text-gray-900">{formatYen(p.val)}</span>
                                <p className="text-[10px] text-gray-400 mt-1 font-bold">
                                    {p.limit ? `あと ${formatYen(Math.max(0, p.limit - p.val))}` : '上限なし (青天井)'}
                                </p>
                            </div>

                            {p.limit ? (
                                // 上限ありの場合: プログレスバー
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${p.val > p.limit ? 'bg-red-500' : `bg-${p.color}-500`}`}
                                        style={{ width: `${Math.min(100, (p.val / p.limit) * 100)}%` }}
                                    ></div>
                                </div>
                            ) : (
                                // 上限なしの場合: 単なるアクセントバー
                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-400 w-1/3 rounded-full"></div>
                                </div>
                            )}

                            {p.limit && p.val > p.limit && <p className="text-[9px] text-red-500 font-bold mt-2">⚠️ 年間上限を超過</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* 積立プランリスト */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                    <Icons.Chart /> 積立設定 (毎月の投資)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recurringItems.length === 0 ? (
                        <p className="text-gray-400 text-sm">積立設定はありません</p>
                    ) : recurringItems.map(i => {
                        const style = ACCOUNT_TYPES[i.accountType] || ACCOUNT_TYPES.taxable;
                        return (
                            <div key={i.id} className="relative group bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(i)} className="p-2 text-gray-400 hover:text-indigo-600"><Icons.Edit /></button>
                                    <button onClick={() => handleDelete(i.id)} className="p-2 text-gray-400 hover:text-red-600"><Icons.Trash /></button>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-2 h-10 rounded-full ${style.color}`}></div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{i.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500`}>{style.label}</span>
                                            {i.institution && <span className="text-[10px] text-gray-400 font-bold">@ {i.institution}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                    <div className="text-2xl font-black text-gray-900 font-mono">{formatYen(i.monthlyAmount)}<span className="text-xs text-gray-400 font-bold ml-1">/月</span></div>
                                    {i.bonusAmount > 0 && <div className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">ボーナス +{formatYen(i.bonusAmount)}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* スポット購入リスト */}
            <div>
                <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                    <Icons.Spot /> スポット購入履歴 (一括投資)
                </h2>
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    {spotItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">スポット購入履歴はありません</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">日付</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">名称</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">口座</th>
                                    <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">金額</th>
                                    <th className="p-4 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {spotItems.map(i => {
                                    const style = ACCOUNT_TYPES[i.accountType] || ACCOUNT_TYPES.taxable;
                                    return (
                                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm font-bold text-gray-500">{i.date}</td>
                                            <td className="p-4 text-sm font-bold text-gray-900">{i.name}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${style.color} text-white`}>{style.label}</span>
                                            </td>
                                            <td className="p-4 text-sm font-black text-gray-900 font-mono text-right">{formatYen(i.amount)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(i)} className="text-gray-400 hover:text-indigo-600"><Icons.Edit /></button>
                                                    <button onClick={() => handleDelete(i.id)} className="text-gray-400 hover:text-red-600"><Icons.Trash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* モーダル */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={resetForm}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-gray-900 mb-8">{editingId ? '投資データの編集' : '投資データの追加'}</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* 投資タイプ選択 */}
                                <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setType('recurring')}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all ${type === 'recurring' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        毎月の積立設定
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('spot')}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all ${type === 'spot' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        スポット購入 (一括)
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">名称</label>
                                        <input className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="例: オルカン, ボーナス一括投資" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">金融機関</label>
                                        <input className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="例: SBI証券" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">口座種別</label>
                                        <select className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold cursor-pointer" value={accountType} onChange={e => setAccountType(e.target.value)}>
                                            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </div>

                                    {/* 入力項目の切り替え */}
                                    {type === 'recurring' ? (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">毎月の積立額</label>
                                                <input type="number" className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold font-mono text-lg" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ボーナス月加算 (年2回)</label>
                                                <input type="number" className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold font-mono text-lg" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">購入日</label>
                                                <input type="date" className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold" value={spotDate} onChange={e => setSpotDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">購入金額</label>
                                                <input type="number" className="input-field w-full bg-gray-50 p-4 rounded-xl font-bold font-mono text-lg" value={spotAmount} onChange={e => setSpotAmount(e.target.value)} placeholder="0" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={resetForm} className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100">キャンセル</button>
                                    <button className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100">保存する</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}