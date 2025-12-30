import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export default function IncomePage() {
    const { currentUser } = useAuth();
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [type, setType] = useState('給与/役員報酬');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        fetchIncomes();
    }, [currentUser]);

    const fetchIncomes = async () => {
        if (!currentUser) return;
        try {
            const incomesRef = collection(db, 'users', currentUser.uid, 'incomes');
            const q = query(incomesRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetchedIncomes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setIncomes(fetchedIncomes);
        } catch (error) {
            console.error("Error fetching incomes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddIncome = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!name || !amount) {
            alert("名称と金額を入力してください");
            return;
        }

        setSubmitting(true);
        try {
            const incomeData = {
                name,
                type,
                amount: Number(amount),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'users', currentUser.uid, 'incomes'), incomeData);

            // Reset form
            setName('');
            setAmount('');
            setType('給与/役員報酬');

            fetchIncomes(); // Refresh list
        } catch (error) {
            console.error("Error adding income:", error);
            alert("登録に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("この収入情報を削除してもよろしいですか？")) return;
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'incomes', id));
            fetchIncomes();
        } catch (error) {
            console.error("Delete failed", error);
            alert("削除に失敗しました");
        }
    };

    const calculateTotalIncome = () => {
        return incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);
    };

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">収入管理</h1>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                <h2 className="text-lg font-medium opacity-90">月次収入合計 (手取り)</h2>
                <p className="text-4xl font-bold mt-2">{formatCurrency(calculateTotalIncome())}</p>
            </div>

            {/* Input Form */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">収入の登録</h2>
                <form onSubmit={handleAddIncome} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="給与/役員報酬">給与/役員報酬</option>
                            <option value="事業収入">事業収入</option>
                            <option value="不動産収入">不動産収入</option>
                            <option value="配当金">配当金</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="例: A社役員報酬"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円/月)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="300000"
                            min="0"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md disabled:opacity-50 transition-colors"
                        >
                            {submitting ? '登録中...' : '登録する'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">登録済み収入一覧</h2>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-gray-500">読み込み中...</div>
                ) : incomes.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {incomes.map((item) => (
                            <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${item.type === '給与/役員報酬' ? 'bg-blue-400' :
                                                item.type === '不動産収入' ? 'bg-green-500' :
                                                    item.type === '配当金' ? 'bg-yellow-500' : 'bg-gray-400'
                                            }`}>
                                            <span className="text-lg font-bold">¥</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <span className="text-lg font-bold text-gray-900">{formatCurrency(item.amount)} / 月</span>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        データがありません
                    </div>
                )}
            </div>
        </div>
    );
}
