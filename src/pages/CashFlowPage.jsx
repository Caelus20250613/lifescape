import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';


const Icons = {
    Scan: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Empty: () => <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    Income: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Expense: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
    Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
    Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
};

export default function CashFlowPage() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('income');
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loans, setLoans] = useState([]);
    const [investments, setInvestments] = useState([]);

    const [members, setMembers] = useState(['自分', '家族共通']);
    const [incOwner, setIncOwner] = useState('自分');
    const [expOwner, setExpOwner] = useState('自分');
    const [loading, setLoading] = useState(true);
    const [scannedItems, setScannedItems] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [incName, setIncName] = useState('');
    const [incType, setIncType] = useState('給与');
    const [incAmount, setIncAmount] = useState('');
    const [incFreq, setIncFreq] = useState('monthly');
    const [incMonth, setIncMonth] = useState('6');
    const [expName, setExpName] = useState('');
    const [expCategory, setExpCategory] = useState('住居費');
    const [expAmount, setExpAmount] = useState('');
    const [expFreq, setExpFreq] = useState('monthly');
    const [expMonth, setExpMonth] = useState('4');
    const [editingId, setEditingId] = useState(null);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const loadColl = async (name) => {
                const q = query(collection(db, 'users', currentUser.uid, name), orderBy('createdAt', 'desc'));
                return (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
            };
            const [i, e, l, inv] = await Promise.all([
                loadColl('incomes'),
                loadColl('expenses'),
                loadColl('loans'),
                loadColl('investments')
            ]);
            setIncomes(i); setExpenses(e); setLoans(l || []); setInvestments(inv || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => {
        const init = async () => {
            if (!currentUser) return;
            try {
                const s = await getDoc(doc(db, 'users', currentUser.uid, 'settings', 'general'));
                if (s.exists() && s.data().members) {
                    setMembers(s.data().members);
                    setIncOwner(s.data().members[0]); setExpOwner(s.data().members[0]);
                }
            } catch (e) { }
            fetchData();
        };
        init();
    }, [currentUser, fetchData]);

    const formatCurrency = (val) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);

    // File Logic
    const processFile = async (file) => {
        if (!file) return;
        setIsScanning(true);
        try {
            let res = [];
            if (file.type.includes('csv') || file.name.endsWith('.csv')) res = await geminiService.analyzeCsvText(await file.text());
            else if (file.type.startsWith('image/')) res = await geminiService.analyzeReceiptImage(file);
            setScannedItems(res);
        } catch (e) { alert(`解析エラー: ${e.message}`); } finally { setIsScanning(false); }
    };
    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
    const handleDrop = (e) => { handleDrag(e); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };

    // CRUD
    const handleBulkSave = async () => {
        if (!currentUser || scannedItems.length === 0) return;
        setSubmitting(true);
        try {
            await Promise.all(scannedItems.map(async (item) => {
                let d = new Date(item.date); if (isNaN(d)) d = new Date();
                const base = {
                    date: Timestamp.fromDate(d), name: item.name || '不明', amount: Number(item.amount) || 0,
                    owner: incOwner, frequency: 'temporary', createdAt: serverTimestamp()
                };
                const col = item.type === 'income' ? 'incomes' : 'expenses';
                const data = item.type === 'income' ? { ...base, type: item.category || 'その他' }
                    : { ...base, category: item.category || 'その他', isInvestment: false };
                return addDoc(collection(db, 'users', currentUser.uid, col), data);
            }));
            setScannedItems([]); fetchData();
        } catch (e) { alert("保存失敗"); } finally { setSubmitting(false); }
    };

    const resetForm = () => {
        setEditingId(null);
        setIncName(''); setIncAmount('');
        setExpName(''); setExpAmount('');
    };

    const handleEditClick = (item, type) => {
        setEditingId(item.id);
        setActiveTab(type);
        if (type === 'income') {
            setIncName(item.name);
            setIncAmount(item.amount);
            setIncType(item.type || '給与');
            setIncFreq(item.frequency || 'monthly');
            setIncOwner(item.owner || '自分');
            if (item.paymentMonth) setIncMonth(item.paymentMonth.toString());
        } else {
            setExpName(item.name);
            setExpAmount(item.amount);
            setExpCategory(item.category || '住居費');
            setExpFreq(item.frequency || 'monthly');
            setExpOwner(item.owner || '自分');
            if (item.paymentMonth) setExpMonth(item.paymentMonth.toString());
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const processSubmission = async (collName, data) => {
        if (!data.name || !data.amount) return alert("入力エラー");
        setSubmitting(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, 'users', currentUser.uid, collName, editingId), { ...data, updatedAt: serverTimestamp() });
                alert("更新しました");
            } else {
                await addDoc(collection(db, 'users', currentUser.uid, collName), { ...data, createdAt: serverTimestamp() });
                alert("登録しました");
            }
            fetchData();
            resetForm();
        } catch (e) {
            console.error(e);
            alert(editingId ? "更新失敗" : "登録失敗");
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (coll, id) => { if (window.confirm("削除しますか？")) { await deleteDoc(doc(db, 'users', currentUser.uid, coll, id)); fetchData(); } };

    // Calculations
    const sum = (arr) => arr.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const monthlyIncomes = incomes.filter(i => i.frequency === 'monthly');
    const monthlyCons = expenses.filter(e => e.frequency === 'monthly');
    const monthlyInvFromData = investments.reduce((sum, inv) => sum + (Number(inv.monthlyAmount) || 0), 0);

    // ローン返済額の集計
    const totalLoanPayments = loans.reduce((acc, l) => acc + Number(l.monthlyPayment || 0), 0);

    const totalMonthlyInc = sum(monthlyIncomes);
    const totalMonthlyCons = sum(monthlyCons) + totalLoanPayments;
    const totalMonthlyInv = monthlyInvFromData;
    const cashFlow = totalMonthlyInc - (totalMonthlyCons + totalMonthlyInv);

    // 表示用：手動支出 + ローン支出の統合
    const integratedExpenses = [
        ...monthlyCons.map(e => ({ ...e, source: 'manual' })),
        ...investments.map(inv => ({
            id: `inv-${inv.id}`,
            name: `${inv.name} (積立投資)`,
            amount: inv.monthlyAmount,
            owner: '自分',
            category: '投資',
            source: 'investment',
            isInvestment: true,
            investmentType: inv.accountType
        })),
        ...loans.map(l => ({
            id: `loan-${l.id}`,
            name: `${l.name} (ローン返済)`,
            amount: l.monthlyPayment,
            owner: l.owner,
            category: 'ローン',
            source: 'loan',
            isInvestment: false
        }))
    ];

    const EmptyState = ({ text }) => (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Icons.Empty /><p className="text-gray-400 font-medium">{text}</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">収支管理</h1>
                <p className="text-sm text-gray-500 mt-1">日々のキャッシュフローと資産形成状況を可視化します</p>
            </header>

            {/* AI Upload Section */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 transition-all duration-300 ${dragActive ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">AI自動入力 <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Beta</span></h2>
                        <p className="text-xs text-gray-500 mt-1">レシート画像やCSVをここにドロップ</p>
                    </div>
                    <div className="flex gap-3">
                        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 shadow-sm ${isScanning && 'opacity-50'}`}>
                            <Icons.Scan /> <span>画像</span><input type="file" className="hidden" accept="image/*" onChange={e => processFile(e.target.files[0])} disabled={isScanning} />
                        </label>
                        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 shadow-sm ${isScanning && 'opacity-50'}`}>
                            <Icons.Upload /> <span>CSV</span><input type="file" className="hidden" accept=".csv" onChange={e => processFile(e.target.files[0])} disabled={isScanning} />
                        </label>
                    </div>
                </div>
                {isScanning && <div className="text-center py-4 text-indigo-600 font-bold animate-pulse">AIが解析中...</div>}
                {scannedItems.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100"><tr>{['日付', '区分', '名称', 'カテゴリ', '金額', ''].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr></thead>
                            <tbody className="bg-white divide-y divide-gray-100">{scannedItems.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2"><input type="date" className="text-sm bg-transparent border-none" value={item.date} onChange={e => { const n = [...scannedItems]; n[i].date = e.target.value; setScannedItems(n) }} /></td>
                                    <td className="px-4 py-2"><select className="text-xs font-bold bg-transparent border-none" value={item.type} onChange={e => { const n = [...scannedItems]; n[i].type = e.target.value; setScannedItems(n) }}><option value="income">収入</option><option value="expense">支出</option></select></td>
                                    <td className="px-4 py-2"><input className="text-sm w-full bg-transparent border-none" value={item.name} onChange={e => { const n = [...scannedItems]; n[i].name = e.target.value; setScannedItems(n) }} /></td>
                                    <td className="px-4 py-2"><input className="text-xs w-full bg-transparent border-none" value={item.category} onChange={e => { const n = [...scannedItems]; n[i].category = e.target.value; setScannedItems(n) }} /></td>
                                    <td className="px-4 py-2"><input type="number" className="text-sm w-20 text-right bg-transparent border-none font-bold" value={item.amount} onChange={e => { const n = [...scannedItems]; n[i].amount = e.target.value; setScannedItems(n) }} /></td>
                                    <td className="px-4 py-2 text-center"><button onClick={() => setScannedItems(scannedItems.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Icons.Trash /></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setScannedItems([])} className="text-xs font-bold text-gray-500">破棄</button>
                            <button onClick={handleBulkSave} disabled={submitting} className="bg-gray-900 text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-black">{submitting ? '保存中...' : '登録実行'}</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex border-b border-gray-200 mb-6 space-x-8">
                {[{ id: 'income', l: '収入' }, { id: 'expense', l: '支出' }, { id: 'analysis', l: '分析' }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-4 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{t.l}</button>
                ))}
            </div>

            {loading ? <div className="text-center py-20">Loading...</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Forms & Lists) - Hide on Analysis */}
                    {activeTab !== 'analysis' && (
                        <div className="lg:col-span-2 space-y-8">
                            <div className={`bg-white p-6 rounded-xl border-2 ${editingId ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-gray-100'} shadow-sm transition-all shadow-sm`}>
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        {activeTab === 'income' ? <Icons.Income /> : <Icons.Expense />}
                                        {editingId ? 'データを編集' : (activeTab === 'income' ? '収入を追加' : '支出を追加')}
                                    </span>
                                    {editingId && (
                                        <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600 font-normal">
                                            新規登録に戻る
                                        </button>
                                    )}
                                </h3>
                                <form onSubmit={e => {
                                    e.preventDefault();
                                    const isInc = activeTab === 'income';
                                    const d = isInc ? { name: incName, type: incType, amount: Number(incAmount), frequency: incFreq, owner: incOwner }
                                        : { name: expName, category: expCategory, amount: Number(expAmount), frequency: expFreq, owner: expOwner };
                                    if ((isInc ? incFreq : expFreq) === 'temporary' || (!isInc && expFreq === 'yearly')) d.paymentMonth = Number(isInc ? incMonth : expMonth);
                                    processSubmission(isInc ? 'incomes' : 'expenses', d);
                                }} className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="col-span-2 md:col-span-1"><label className="label-xs">所有者</label><select className="input-sm" value={activeTab === 'income' ? incOwner : expOwner} onChange={e => activeTab === 'income' ? setIncOwner(e.target.value) : setExpOwner(e.target.value)}>{members.map(m => <option key={m}>{m}</option>)}</select></div>
                                        <div className="col-span-2 md:col-span-3"><label className="label-xs">名称</label><input className="input-sm" placeholder="例: 給与" value={activeTab === 'income' ? incName : expName} onChange={e => activeTab === 'income' ? setIncName(e.target.value) : setExpName(e.target.value)} /></div>
                                        <div className="col-span-1 md:col-span-2"><label className="label-xs">カテゴリ</label><select className="input-sm" value={activeTab === 'income' ? incType : expCategory} onChange={e => { if (activeTab === 'income') setIncType(e.target.value); else { setExpCategory(e.target.value); } }}>{(activeTab === 'income' ? ['給与', '賞与', '副業', 'その他'] : ['住居費', '食費', 'その他']).map(o => <option key={o}>{o}</option>)}</select></div>
                                        <div className="col-span-1 md:col-span-2"><label className="label-xs">金額</label><input type="number" className="input-sm font-mono" placeholder="0" value={activeTab === 'income' ? incAmount : expAmount} onChange={e => activeTab === 'income' ? setIncAmount(e.target.value) : setExpAmount(e.target.value)} /></div>
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        {editingId && (
                                            <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 shadow-sm">キャンセル</button>
                                        )}
                                        <button disabled={submitting} className={`${editingId ? 'flex-[2]' : 'w-full'} py-2.5 rounded-lg text-sm font-bold text-white shadow-sm ${activeTab === 'income' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900'}`}>{submitting ? '処理中...' : (editingId ? '更新する' : '追加する')}</button>
                                    </div>
                                </form>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-3">登録済みアイテム (月次)</h3>
                                {(activeTab === 'income' ? monthlyIncomes : integratedExpenses).length === 0 ? <EmptyState text="データがありません" /> : (
                                    <div className="space-y-3">
                                        {(activeTab === 'income' ? monthlyIncomes : integratedExpenses).map(item => (
                                            <div key={item.id} className={`group bg-white p-4 rounded-xl shadow-sm border ${item.source === 'loan' ? 'bg-gray-50/50 border-dashed border-gray-200' : 'border-gray-100'} flex justify-between items-center ${activeTab !== 'income' && item.isInvestment ? 'border-l-4 border-l-green-500' : ''}`}>
                                                <div className="flex gap-4 items-center">
                                                    {item.source === 'loan' && <div className="text-indigo-400 bg-indigo-50 p-1.5 rounded-lg"><Icons.Lock /></div>}
                                                    <div>
                                                        <div className="font-bold text-gray-800">{item.name} <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.owner}</span></div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                                            {activeTab === 'income' ? item.type : item.category}
                                                            {item.investmentType && (
                                                                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase">
                                                                    {item.investmentType === 'taxable' ? '課税' :
                                                                        item.investmentType === 'nisa_tsumitate' ? '新NISA(つみたて)' :
                                                                            item.investmentType === 'nisa_growth' ? '新NISA(成長)' :
                                                                                item.investmentType === 'ideco' ? 'iDeCo' :
                                                                                    item.investmentType === 'investment' ? '積立管理連携' : item.investmentType}
                                                                </span>
                                                            )}
                                                            {item.source === 'loan' && <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">ローン管理連携</span>}
                                                            {item.source === 'investment' && <span className="text-[10px] text-green-500 font-bold bg-green-50 px-1.5 py-0.5 rounded">積立管理連携</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className={`font-bold font-mono text-lg ${activeTab === 'income' ? 'text-indigo-600' : (item.isInvestment || item.category === '投資・貯蓄') ? 'text-green-600' : 'text-gray-900'}`}>{formatCurrency(item.amount)}</div>
                                                    <div className="flex gap-2">
                                                        {item.source === 'manual' ? (
                                                            <>
                                                                <button onClick={() => handleEditClick(item, activeTab)} className="text-xs text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Edit /></button>
                                                                <button onClick={() => handleDelete(activeTab === 'income' ? 'incomes' : 'expenses', item.id)} className="text-xs text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash /></button>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-300 italic">連携中（編集不可）</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analysis Column (Full Width when active) */}
                    <div className={activeTab === 'analysis' ? 'col-span-3' : 'lg:col-span-1'}>
                        <div className={`space-y-6 ${activeTab === 'analysis' && 'grid md:grid-cols-2 gap-6 space-y-0'}`}>
                            {/* Monthly Summary */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">月次の収支</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">収入</span><span className="text-base font-bold text-indigo-600">{formatCurrency(totalMonthlyInc)}</span></div>
                                    <div className="flex justify-between"><span className="text-sm font-medium text-gray-500">支出(消費)</span><span className="text-base font-bold text-gray-800">- {formatCurrency(totalMonthlyCons)}</span></div>
                                    <div className="flex justify-between border-b border-gray-100 pb-4"><span className="text-sm font-medium text-green-600">投資(貯蓄)</span><span className="text-base font-bold text-green-600">- {formatCurrency(totalMonthlyInv)}</span></div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">現金余力 (Cash Flow)</p>
                                    <p className={`text-4xl font-extrabold tracking-tight ${cashFlow >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{formatCurrency(cashFlow)}</p>
                                </div>
                            </div>

                            {/* Simulation & Projection removed as it is now a separate page */}
                        </div>
                    </div>
                </div>
            )}
            <style>{`.label-xs { display:block; font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; margin-bottom:4px; } .input-sm { width:100%; background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:0.5rem; font-size:0.875rem; padding:0.5rem 0.75rem; } .input-sm:focus { outline:none; border-color:#6366f1; ring:2px; ring-color:#e0e7ff; }`}</style>
        </div>
    );
}