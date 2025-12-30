import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, setDoc } from 'firebase/firestore';

export default function LoansPage() {
    const { currentUser } = useAuth();
    const [loans, setLoans] = useState([]);
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
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().members && docSnap.data().members.length > 0) {
                    const fetchedMembers = docSnap.data().members;
                    setMembers(fetchedMembers);
                    setOwner(fetchedMembers[0]);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };

        const fetchLoans = async () => {
            if (!currentUser) return;
            try {
                const loansRef = collection(db, 'users', currentUser.uid, 'loans');
                const q = query(loansRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const fetchedLoans = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setLoans(fetchedLoans);
            } catch (error) {
                console.error("Error fetching loans:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
        fetchLoans();
    }, [currentUser]);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setBalance('');
        setInterestRate('');
        setMonthlyPayment('');
        setStartDate(new Date().toISOString().split('T')[0]);
        if (members.length > 0) setOwner(members[0]);
    };

    const handleEditClick = (loan) => {
        setEditingId(loan.id);
        setName(loan.name);
        setBalance(loan.balance);
        setInterestRate(loan.interestRate);
        setMonthlyPayment(loan.monthlyPayment);
        setStartDate(loan.startDate || new Date().toISOString().split('T')[0]);
        setOwner(loan.owner || '自分');
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        // Simple validation
        if (!name || !balance || !monthlyPayment) {
            alert("必須項目を入力してください");
            return;
        }

        setSubmitting(true);
        try {
            const loanData = {
                name,
                balance: Number(balance),
                interestRate: interestRate ? Number(interestRate) : 0,
                monthlyPayment: Number(monthlyPayment),
                startDate: startDate || new Date().toISOString().split('T')[0],
                owner: owner || '自分',
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await setDoc(doc(db, 'users', currentUser.uid, 'loans', editingId), loanData, { merge: true });
                alert("ローン情報を更新しました");
            } else {
                loanData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'users', currentUser.uid, 'loans'), loanData);
                alert("ローンを登録しました");
            }

            resetForm();

            // Refresh list
            const snapshot = await getDocs(query(collection(db, 'users', currentUser.uid, 'loans'), orderBy('createdAt', 'desc')));
            setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Error saving loan:", error);
            alert("保存に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("このローン情報を削除してもよろしいですか？")) return;
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'loans', id));
            // Refresh list
            setLoans(loans.filter(l => l.id !== id));
            alert("削除しました");
            if (editingId === id) resetForm();
        } catch (error) {
            console.error("Delete failed", error);
            alert("削除に失敗しました");
        }
    };

    const getCompletionDate = (loan) => {
        const { balance, monthlyPayment, interestRate, startDate } = loan;
        if (!balance || !monthlyPayment || monthlyPayment <= 0) return '計算不可';

        const baseDate = startDate ? new Date(startDate) : new Date();
        const monthlyRate = (interestRate || 0) / 100 / 12;
        let months = 0;

        if (monthlyRate <= 0) {
            months = Math.ceil(balance / monthlyPayment);
        } else {
            // NPER formula
            const num = monthlyPayment / (monthlyPayment - balance * monthlyRate);
            if (num <= 0) return '返済不能 (金利過多)';
            months = Math.ceil(Math.log(num) / Math.log(1 + monthlyRate));
        }

        const completionDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + months, 1);
        return `${completionDate.getFullYear()}年${completionDate.getMonth() + 1}月`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dateStr.replace(/-/g, '/');
    };

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">ローン管理</h1>

            {/* Input Form */}
            <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100 ring-2 ring-transparent transition-all duration-300" style={{ borderTop: editingId ? '4px solid #4f46e5' : '1px solid #f3f4f6' }}>
                <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-2 flex items-center justify-between">
                    <span>{editingId ? 'ローンの編集' : '新規ローンの登録'}</span>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600 font-normal">
                            新規登録に戻る
                        </button>
                    )}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">借入人 (名義)</label>
                            <select
                                value={owner}
                                onChange={(e) => setOwner(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white sm:text-sm"
                            >
                                {members.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ローン名称</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="例: 住宅ローン, 自動車ローン"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">借入残高 (円)</label>
                            <input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="例: 35000000"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">毎月の返済額 (円)</label>
                            <input
                                type="number"
                                value={monthlyPayment}
                                onChange={(e) => setMonthlyPayment(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="例: 100000"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">金利 (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="例: 0.8"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">登録日 (基準日)</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-white border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                キャンセル
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                        >
                            {submitting ? '保存中...' : (editingId ? '更新する' : 'ローンを登録する')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Loans List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 text-center md:text-left">登録済みローン一覧</h2>
                {loading ? (
                    <div className="py-10 text-center text-gray-400">読み込み中...</div>
                ) : loans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loans.map(loan => (
                            <div key={loan.id} className={`bg-white shadow rounded-xl p-6 border-t-4 ${editingId === loan.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-red-500'} relative hover:shadow-lg transition-all`}>
                                <div className="absolute top-3 right-3 flex gap-1">
                                    <button
                                        onClick={() => handleEditClick(loan)}
                                        className="text-gray-300 hover:text-indigo-600 transition-colors p-1"
                                        title="編集"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loan.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        title="削除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mb-3 flex flex-col gap-1 pr-16">
                                    <span className="inline-block text-[10px] font-bold bg-gray-100 text-gray-600 py-1 px-2 rounded-full uppercase tracking-wider w-fit">
                                        名義: {loan.owner || '自分'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold">
                                        登録日: {formatDate(loan.startDate)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">{loan.name}</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span className="text-xs text-gray-500">借入残高</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(loan.balance)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs text-gray-500">金利</span>
                                        <span className="text-sm text-gray-700">{loan.interestRate}%</span>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs text-gray-500">毎月の返済</span>
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.monthlyPayment)}</span>
                                    </div>
                                    <div className="pt-4 border-t mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">完済予定</span>
                                            <span className="text-indigo-600 font-extrabold text-xl">
                                                {getCompletionDate(loan)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-400">登録されたローン情報はありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
}
