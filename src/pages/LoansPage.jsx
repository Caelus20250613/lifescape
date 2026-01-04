import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function LoansPage() {
    const { currentUser } = useAuth();
    const [loans, setLoans] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form Input States
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [members, setMembers] = useState(['自分', '家族共通']);
    const [owner, setOwner] = useState('自分');
    const [editingId, setEditingId] = useState(null);
    const [propertyId, setPropertyId] = useState('');
    const [extraRepayments, setExtraRepayments] = useState([]); // [{ age, amount }]
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // Settings & Properties fetch (Non-blocking individually)
                const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
                const [settingsSnap, propsSnap] = await Promise.all([
                    getDoc(settingsRef).catch(e => { console.error("Settings fetch error:", e); return null; }),
                    getDocs(collection(db, 'users', currentUser.uid, 'properties')).catch(e => { console.error("Props fetch error:", e); return null; })
                ]);

                if (settingsSnap?.exists() && settingsSnap.data().members?.length > 0) {
                    const fetchedMembers = settingsSnap.data().members;
                    setMembers(fetchedMembers);
                    setOwner(fetchedMembers[0]);
                }
                if (propsSnap) {
                    setProperties(propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }

                // Loans fetch
                const loansRef = collection(db, 'users', currentUser.uid, 'loans');
                const q = query(loansRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);

                const now = new Date();
                const fetchedLoans = await Promise.all(snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const loanId = docSnap.id;

                    let lastUpdateDate = data.lastAutoUpdateDate ? new Date(data.lastAutoUpdateDate) : (data.startDate ? new Date(data.startDate) : (data.createdAt?.toDate() || new Date()));
                    const elapsedMonths = (now.getFullYear() - lastUpdateDate.getFullYear()) * 12 + (now.getMonth() - lastUpdateDate.getMonth());

                    if (elapsedMonths > 0 && data.balance > 0) {
                        let currentBalance = Number(data.balance);
                        const monthlyPayment = Number(data.monthlyPayment);
                        const monthlyRate = (Number(data.interestRate) || 0) / 100 / 12;

                        for (let m = 0; m < elapsedMonths; m++) {
                            if (currentBalance <= 0) break;
                            currentBalance = Math.max(0, currentBalance + (currentBalance * monthlyRate) - monthlyPayment);
                        }

                        const updateData = { balance: Math.round(currentBalance), lastAutoUpdateDate: now.toISOString().split('T')[0], updatedAt: serverTimestamp() };
                        await updateDoc(doc(db, 'users', currentUser.uid, 'loans', loanId), updateData);
                        return { id: loanId, ...data, ...updateData };
                    }
                    return { id: loanId, ...data };
                }));

                setLoans(fetchedLoans);
            } catch (error) {
                console.error("Error fetching all data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currentUser]);

    const resetForm = () => {
        setEditingId(null); setName(''); setBalance(''); setInterestRate(''); setMonthlyPayment('');
        setStartDate(new Date().toISOString().split('T')[0]); setExtraRepayments([]); setPropertyId('');
        if (members.length > 0) setOwner(members[0]);
    };

    const handleEditClick = (loan) => {
        setEditingId(loan.id); setName(loan.name); setBalance(loan.balance); setInterestRate(loan.interestRate);
        setMonthlyPayment(loan.monthlyPayment); setStartDate(loan.startDate || new Date().toISOString().split('T')[0]);
        setExtraRepayments(loan.extraRepayments || []); setPropertyId(loan.propertyId || ''); setOwner(loan.owner || '自分');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !name || !balance || !monthlyPayment) return;
        setSubmitting(true);
        try {
            const loanData = {
                name, balance: Number(balance), interestRate: interestRate ? Number(interestRate) : 0, monthlyPayment: Number(monthlyPayment),
                startDate: startDate || new Date().toISOString().split('T')[0], owner: owner || '自分', propertyId: propertyId || null,
                extraRepayments: extraRepayments.filter(r => r.age > 0).map(r => ({ age: Number(r.age), amount: r.isFullPayoff ? 0 : Number(r.amount), isFullPayoff: !!r.isFullPayoff })),
                updatedAt: serverTimestamp()
            };
            if (editingId) { await setDoc(doc(db, 'users', currentUser.uid, 'loans', editingId), loanData, { merge: true }); }
            else { loanData.createdAt = serverTimestamp(); await addDoc(collection(db, 'users', currentUser.uid, 'loans'), loanData); }
            resetForm();
            const snapshot = await getDocs(query(collection(db, 'users', currentUser.uid, 'loans'), orderBy('createdAt', 'desc')));
            setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) { console.error("Error saving loan:", error); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("このローン情報を削除してもよろしいですか？")) return;
        try { await deleteDoc(doc(db, 'users', currentUser.uid, 'loans', id)); setLoans(loans.filter(l => l.id !== id)); if (editingId === id) resetForm(); }
        catch (error) { console.error("Delete failed", error); }
    };

    const getCompletionDate = (loan) => {
        const { balance, monthlyPayment, interestRate, startDate } = loan;
        if (!balance || !monthlyPayment || monthlyPayment <= 0) return '計算不可';
        const baseDate = startDate ? new Date(startDate) : new Date();
        const monthlyRate = (interestRate || 0) / 100 / 12;
        let months = 0;
        if (monthlyRate <= 0) { months = Math.ceil(balance / monthlyPayment); }
        else { const num = monthlyPayment / (monthlyPayment - balance * monthlyRate); if (num <= 0) return '返済不能 (金利過多)'; months = Math.ceil(Math.log(num) / Math.log(1 + monthlyRate)); }
        const compDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + months, 1);
        return `${compDate.getFullYear()}年${compDate.getMonth() + 1}月${loan.extraRepayments?.length > 0 ? ' (繰上考慮前)' : ''}`;
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    const formatDate = (dateStr) => dateStr ? dateStr.replace(/-/g, '/') : '-';

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 font-sans">ローン管理</h1>
            <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100 ring-4 ring-transparent transition-all" style={{ borderTop: editingId ? '4px solid #4f46e5' : '1px solid #f3f4f6' }}>
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex justify-between items-center">
                    <span>{editingId ? 'ローンの編集' : '新規ローンの登録'}</span>
                    {editingId && <button onClick={resetForm} className="text-xs text-gray-400 font-normal">新規登録に戻る</button>}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">借入人 (名義)</label>
                            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold">
                                {members.map(m => (<option key={m} value={m}>{m}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">ローン名称</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" placeholder="住宅ローン等" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">借入残高 (円)</label>
                            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" placeholder="35000000" min="0" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">毎月の返済額 (円)</label>
                            <input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" placeholder="100000" min="1" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">金利 (%)</label>
                            <input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" placeholder="0.8" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">登録日 (基準日)</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase mb-1">紐付く物件 (任意)</label>
                            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full border border-gray-200 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold">
                                <option value="">紐付けなし</option>
                                {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black text-gray-500 uppercase">繰り上げ返済予定</h3>
                            <button type="button" onClick={() => setExtraRepayments([...extraRepayments, { age: 40, amount: 1000000, isFullPayoff: false }])} className="text-[10px] bg-white border border-blue-500 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">+ Add Plan</button>
                        </div>
                        {extraRepayments.length > 0 ? (
                            <div className="space-y-2">
                                {extraRepayments.map((rep, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-100 shadow-sm transition-all hover:border-blue-200">
                                        <input type="number" value={rep.age} onChange={(e) => { const n = [...extraRepayments]; n[idx].age = e.target.value; setExtraRepayments(n); }} className="w-16 border-none bg-gray-50 rounded p-1.5 text-xs font-bold" placeholder="年齢" />
                                        <span className="text-[10px] font-black text-gray-400">歳で</span>
                                        {rep.isFullPayoff ? (<div className="flex-1 bg-indigo-50 text-indigo-700 text-[10px] font-black p-2 rounded uppercase tracking-widest italic">Payoff Entire Balance</div>) : (<input type="number" value={rep.amount} onChange={(e) => { const n = [...extraRepayments]; n[idx].amount = e.target.value; setExtraRepayments(n); }} className="flex-1 border-none bg-gray-50 rounded p-1.5 text-xs font-bold" placeholder="返済額" />)}
                                        <div className="flex items-center gap-1.5 px-2 border-l border-gray-100">
                                            <input type="checkbox" id={`fp-${idx}`} checked={rep.isFullPayoff} onChange={(e) => { const n = [...extraRepayments]; n[idx].isFullPayoff = e.target.checked; setExtraRepayments(n); }} className="w-3 h-3 text-blue-600 rounded" />
                                            <label htmlFor={`fp-${idx}`} className="text-[9px] font-black text-gray-400 uppercase cursor-pointer">Full Payoff</label>
                                        </div>
                                        <button type="button" onClick={() => setExtraRepayments(extraRepayments.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center py-2">No plans registered</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        {editingId && <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-500 font-black text-xs py-3 px-8 rounded-lg uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>}
                        <button type="submit" disabled={submitting} className={`${editingId ? 'bg-indigo-600' : 'bg-blue-600'} text-white font-black text-xs py-3 px-12 rounded-lg shadow-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}>{submitting ? 'Saving...' : (editingId ? 'Update Loan' : 'Register Loan')}</button>
                    </div>
                </form>
            </div>
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-xl font-bold text-gray-800">登録済みローン一覧</h2>
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">{loans.length}件</span>
                </div>
                {loading ? <div className="py-20 text-center text-gray-400 font-bold italic tracking-widest animate-pulse">Loading financial data...</div> : loans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loans.map(loan => (
                            <div key={loan.id} className={`bg-white shadow-xl rounded-2xl p-6 border-t-[6px] ${editingId === loan.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-red-500'} relative transition-all hover:translate-y-[-4px]`}>
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <button onClick={() => handleEditClick(loan)} className="text-gray-200 hover:text-indigo-600 p-1.5 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                    <button onClick={() => handleDelete(loan.id)} className="text-gray-200 hover:text-red-500 p-1.5 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                                <div className="mb-5 flex flex-col gap-1.5">
                                    <span className="text-[9px] font-black bg-gray-50 text-gray-400 py-1 px-2 rounded-md uppercase tracking-widest w-fit border border-gray-100">Owner: {loan.owner}</span>
                                    {loan.propertyId && <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 w-fit uppercase tracking-widest">Linked: {properties.find(p => p.id === loan.propertyId)?.name || 'Property'}</span>}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight leading-tight">{loan.name}</h3>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(loan.balance)}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 px-1">
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Interest Rate</p><p className="text-sm font-black text-gray-700">{loan.interestRate}%</p></div>
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Monthly Pay</p><p className="text-sm font-black text-gray-900">{formatCurrency(loan.monthlyPayment)}</p></div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 mt-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Finish Projection</p>
                                        <p className="text-xl font-black text-indigo-600 tracking-tighter">{getCompletionDate(loan)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (<div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-100"> <p className="text-gray-300 font-black uppercase tracking-widest">No Active Loans Found</p> </div>)}
            </div>
        </div>
    );
}
