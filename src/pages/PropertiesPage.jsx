import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';

export default function PropertiesPage() {
    const { currentUser } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form States
    const [name, setName] = useState('');
    const [type, setType] = useState('residence');
    const [value, setValue] = useState('');
    const [purchaseAge, setPurchaseAge] = useState('');
    const [saleAge, setSaleAge] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [repayLoanOnSale, setRepayLoanOnSale] = useState(true);

    const fetchProperties = useCallback(async () => {
        if (!currentUser) return;
        try {
            const propsRef = collection(db, 'users', currentUser.uid, 'properties');
            const q = query(propsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProperties(fetched);
        } catch (error) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setType('residence');
        setValue('');
        setPurchaseAge('');
        setSaleAge('');
        setSalePrice('');
        setRepayLoanOnSale(true);
    };

    const handleEditClick = (prop) => {
        setEditingId(prop.id);
        setName(prop.name);
        setType(prop.type || 'residence');
        setValue(prop.value || '');
        setPurchaseAge(prop.purchaseAge || '');
        setSaleAge(prop.saleAge || '');
        setSalePrice(prop.salePrice || '');
        setRepayLoanOnSale(prop.repayLinkedLoanOnSale !== false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!name || !value) {
            alert("名称と評価額を入力してください");
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                name,
                type,
                value: Number(value),
                purchaseAge: purchaseAge ? Number(purchaseAge) : null,
                saleAge: saleAge ? Number(saleAge) : null,
                salePrice: salePrice ? Number(salePrice) : null,
                repayLinkedLoanOnSale: repayLoanOnSale,
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await setDoc(doc(db, 'users', currentUser.uid, 'properties', editingId), data, { merge: true });
                alert("物件情報を更新しました");
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'users', currentUser.uid, 'properties'), data);
                alert("物件を登録しました");
            }

            resetForm();
            fetchProperties();
        } catch (error) {
            console.error("Error saving property:", error);
            alert("保存に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("この物件情報を削除してもよろしいですか？紐付いているローンや収入の設定は解除されます。")) return;
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'properties', id));
            fetchProperties();
        } catch (error) {
            console.error("Delete failed", error);
            alert("削除に失敗しました");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);
    };

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">不動産管理</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-8 border-t-4 border-blue-500">
                <h2 className="text-xl font-semibold mb-6 flex justify-between items-center">
                    <span>{editingId ? '物件情報の編集' : '新規物件の登録'}</span>
                    {editingId && <button onClick={resetForm} className="text-xs text-gray-400 hover:text-gray-600">新規登録に戻る</button>}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">物件名称</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500"
                                placeholder="例: 自宅マンション, テナントビルA"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">物件種別</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 bg-white"
                            >
                                <option value="residence">自宅</option>
                                <option value="business">事業用 (テナント等)</option>
                                <option value="other">その他</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">現在の評価額 (円)</label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500"
                                placeholder="30000000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">購入/評価開始 年齢 (任意)</label>
                            <input
                                type="number"
                                value={purchaseAge}
                                onChange={(e) => setPurchaseAge(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500"
                                placeholder="35"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">売却予定 年齢 (任意)</label>
                            <input
                                type="number"
                                value={saleAge}
                                onChange={(e) => setSaleAge(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500"
                                placeholder="60"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">売却予想価格 (円)</label>
                            <input
                                type="number"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500"
                                placeholder="25000000"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                        <input
                            type="checkbox"
                            id="repayLoanOnSaleForm"
                            checked={repayLoanOnSale}
                            onChange={(e) => setRepayLoanOnSale(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="repayLoanOnSaleForm" className="text-sm font-bold text-blue-800 cursor-pointer">
                            売却時に紐付いているローンを自動完済する (シミュレーション用)
                        </label>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 text-white font-bold py-3 px-10 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {submitting ? '保存中...' : (editingId ? '更新する' : '物件を登録する')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-10 text-center text-gray-400">読み込み中...</div>
                ) : properties.length > 0 ? (
                    properties.map(prop => (
                        <div key={prop.id} className={`bg-white shadow rounded-xl p-5 border-l-8 ${prop.type === 'residence' ? 'border-green-500' : 'border-blue-500'} hover:shadow-lg transition-all relative`}>
                            <div className="absolute top-3 right-3 flex gap-1">
                                <button onClick={() => handleEditClick(prop)} className="text-gray-300 hover:text-blue-600 p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(prop.id)} className="text-gray-300 hover:text-red-500 p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${prop.type === 'residence' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {prop.type === 'residence' ? '自宅' : prop.type === 'business' ? '事業用' : 'その他'}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mt-2 mb-4">{prop.name}</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">現在評価額</span>
                                    <span className="font-bold">{formatCurrency(prop.value)}</span>
                                </div>
                                {prop.saleAge && (
                                    <div className="flex justify-between items-center text-sm border-t pt-2">
                                        <span className="text-gray-500">売却予定</span>
                                        <span className="font-bold text-red-600">{prop.saleAge}歳時 / {formatCurrency(prop.salePrice)}</span>
                                    </div>
                                )}
                                {prop.repayLinkedLoanOnSale && (
                                    <div className="text-[10px] text-gray-400 font-bold bg-gray-50 p-1 rounded">
                                        ※売却時に紐付けローン完済
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-400">登録された物件情報はありません。</p>
                    </div>
                )}
            </div>
        </div>
    );
}
