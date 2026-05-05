import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { geminiService } from '../services/geminiService';
import { fetchStockPrice } from '../services/stockService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, deleteDoc, doc, where, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthHelpers';
import { useExchangeRates, convertToJPY, SUPPORTED_CURRENCIES } from '../hooks/useExchangeRates';

const ASSET_TYPES = [
    '投資信託',
    '日本株',
    '米国株',
    '外国株',
    'ETF',
    '円預金',
    '外貨預金',
    '外貨建てMMF',
    '債券',
    '不動産',
    '貴金属',
    '暗号資産',
    '小規模企業共済',
    '貯蓄型保険',
    'その他'
];

export default function PortfolioPage() {
    const { currentUser } = useAuth();
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(null);
    const [brokerName, setBrokerName] = useState('SBI証券');
    const [history, setHistory] = useState([]);
    const [expandedDocId, setExpandedDocId] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Members settings
    const [members, setMembers] = useState(['自分', '家族共通']);
    const [owner, setOwner] = useState('自分');
    const { rates } = useExchangeRates();

    // Manual Input State
    const [inputMode, setInputMode] = useState('scan'); // 'scan' | 'manual'
    const [manualAssets, setManualAssets] = useState([
        { type: '日本株', name: '', code: '', amount: '', acquisitionCost: '', currency: 'JPY', foreignAmount: '', accountType: '特定口座' }
    ]);

    // Editing State (Portfolio level)
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ brokerName: '', owner: '', assets: [] });

    // Help State
    const [showHelp, setShowHelp] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!currentUser) return;
        try {
            const portfoliosRef = collection(db, 'users', currentUser.uid, 'portfolios');
            const q = query(portfoliosRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const fetchedHistory = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    isSummary: !!(docData.assets && Array.isArray(docData.assets)),
                    ...docData
                };
            });

            setHistory(fetchedHistory);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }, [currentUser]);

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

        fetchSettings();
        fetchHistory();
    }, [currentUser, fetchHistory]);

    const fetchRealTimePrices = async (tickers) => {
        if (!tickers || tickers.length === 0) return;
        const newPrices = { ...livePrices };

        const MAX_CALLS = 5;
        const targetTickers = tickers.slice(0, MAX_CALLS);

        for (const code of targetTickers) {
            if (!newPrices[code]) {
                const price = await fetchStockPrice(code);
                if (price !== null) {
                    newPrices[code] = price;
                }
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        setLivePrices(newPrices);
    };

    import { toast } from 'sonner';

    // ... imports ...

    export default function PortfolioPage() {
        // ... code ...

        const handleFetchPricesForDoc = (assets) => {
            const docTickers = assets.filter(a => a.code).map(a => a.code);
            if (docTickers.length > 0) {
                fetchRealTimePrices(docTickers);
            } else {
                toast.warning("株価を取得できる銘柄コードが見つかりません。");
            }
        };

        const processFile = async (file) => {
            if (!file || !file.type.startsWith('image/')) return;

            setAnalyzing(true);
            toast.info("画像を解析中...");
            try {
                const result = await geminiService.analyzeAssetImage(file);
                if (result && result.assets) {
                    result.assets = result.assets.map(a => ({
                        ...a,
                        accountType: (a.type === '不動産' || a.type === '預金' || a.type === '貴金属') ? '一般口座' : '特定口座'
                    }));
                }
                setData(result);
                toast.success("解析完了");
            } catch (error) {
                console.error("Analysis failed", error);
                toast.error("画像解析に失敗しました");
            } finally {
                setAnalyzing(false);
            }
        };

        // ...

        const handleSaveData = async () => {
            if (!currentUser) return;
            if (!brokerName.trim()) {
                toast.error("証券会社名を入力してください");
                return;
            }

            let assetsToSave = [];
            let totalValuation = 0;

            if (inputMode === 'scan') {
                if (!data || !data.assets) return;
                assetsToSave = data.assets;
                totalValuation = data.total_valuation || data.assets.reduce((sum, a) => sum + (a.amount || 0), 0);
            } else {
                const validAssets = manualAssets.filter(a => a.name.trim() !== '' && Number(a.amount) > 0);
                if (validAssets.length === 0) {
                    toast.error("少なくとも1つの有効な資産を入力してください（銘柄名と金額は必須です）");
                    return;
                }
                assetsToSave = validAssets.map(a => {
                    const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(a.type);
                    // 外貨建ての場合は量(amount)として外貨額を保存する。LifePlanPageでの一括換算ロジックと合わせるため。
                    const finalAmount = isForeign ? Number(a.foreignAmount || 0) : Number(a.amount);
                    return {
                        ...a,
                        amount: finalAmount,
                        foreignAmount: isForeign ? Number(a.foreignAmount || 0) : 0,
                        acquisitionCost: a.acquisitionCost !== '' ? Number(a.acquisitionCost) : finalAmount
                    };
                });
                totalValuation = assetsToSave.reduce((sum, a) => {
                    const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(a.type);
                    const yenVal = isForeign ? convertToJPY(a.amount, a.currency, rates) : a.amount;
                    return sum + yenVal;
                }, 0);
            }

            setSaving(true);
            try {
                const portfoliosRef = collection(db, 'users', currentUser.uid, 'portfolios');
                const q = query(portfoliosRef, where('brokerName', '==', brokerName), where('owner', '==', owner));
                const querySnapshot = await getDocs(q);

                const portfolioData = {
                    brokerName: brokerName,
                    owner: owner,
                    accountType: accountType, // Portfolio level default
                    assets: assetsToSave,
                    total_valuation: totalValuation,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                };

                if (!querySnapshot.empty) {
                    const docId = querySnapshot.docs[0].id;
                    const docRef = doc(db, 'users', currentUser.uid, 'portfolios', docId);
                    const { createdAt: _createdAt, ...updateData } = portfolioData;
                    await setDoc(docRef, { ...updateData, updatedAt: serverTimestamp() }, { merge: true });
                    toast.success(`「${brokerName} (${owner})」のデータを更新しました。`);
                } else {
                    await addDoc(portfoliosRef, portfolioData);
                    toast.success(`「${brokerName} (${owner})」を新規登録しました。`);
                }

                setData(null);
                setManualAssets([{ type: '日本株', name: '', code: '', amount: '', acquisitionCost: '', currency: 'JPY', foreignAmount: '', accountType: '特定口座' }]);
                setAccountType('特定口座');
                fetchHistory();
            } catch (error) {
                console.error("Save failed", error);
                toast.error("保存に失敗しました");
            } finally {
                setSaving(false);
            }
        };

        const handleDelete = async (e, id) => {
            e.stopPropagation();
            if (!window.confirm("このデータを削除してもよろしいですか？")) return;
            try {
                await deleteDoc(doc(db, 'users', currentUser.uid, 'portfolios', id));
                fetchHistory();
                toast.success("削除しました");
            } catch (error) {
                console.error("Delete failed", error);
                toast.error("削除に失敗しました");
            }
        };

        // --- Editing Logic for History Items ---
        const startEditing = (e, item) => {
            e.stopPropagation();
            setEditingId(item.id);
            const clonedAssets = item.assets ? JSON.parse(JSON.stringify(item.assets)) : [];
            // Ensure each asset has accountType
            const preparedAssets = clonedAssets.map(a => ({
                ...a,
                accountType: a.accountType || '特定口座',
                acquisitionCost: a.acquisitionCost ?? (a.amount || 0)
            }));
            setEditForm({
                brokerName: item.brokerName || '',
                owner: item.owner || (members.length > 0 ? members[0] : '自分'),
                assets: preparedAssets
            });
            setExpandedDocId(null);
        };

        const cancelEditing = () => {
            setEditingId(null);
            setEditForm({ brokerName: '', owner: '', assets: [] });
        };

        const updateEditAsset = (index, field, value) => {
            const newAssets = [...editForm.assets];
            newAssets[index][field] = value;
            setEditForm({ ...editForm, assets: newAssets });
        };

        const removeEditAsset = (index) => {
            const newAssets = editForm.assets.filter((_, i) => i !== index);
            setEditForm({ ...editForm, assets: newAssets });
        };

        const addEditAsset = () => {
            setEditForm({
                ...editForm,
                assets: [...editForm.assets, { type: '日本株', name: '', code: '', amount: 0, acquisitionCost: 0, currency: 'JPY', foreignAmount: '', accountType: '特定口座' }]
            });
        };

        const handleUpdatePortfolio = async () => {
            if (!currentUser || !editingId) return;
            if (!editForm.brokerName.trim()) {
                alert("証券会社名を入力してください");
                return;
            }

            const validAssets = editForm.assets.filter(a => a.name.trim() !== '');
            const totalValuation = validAssets.reduce((sum, a) => {
                const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(a.type);
                const yenVal = isForeign ? convertToJPY(a.amount, a.currency, rates) : Number(a.amount || 0);
                return sum + yenVal;
            }, 0);

            try {
                const docRef = doc(db, 'users', currentUser.uid, 'portfolios', editingId);
                await updateDoc(docRef, {
                    brokerName: editForm.brokerName,
                    owner: editForm.owner || '自分',
                    assets: validAssets.map(a => ({
                        ...a,
                        amount: Number(a.amount || 0),
                        acquisitionCost: Number(a.acquisitionCost || a.amount || 0)
                    })),
                    total_valuation: totalValuation,
                    updatedAt: serverTimestamp()
                });
                alert("更新しました");
                setEditingId(null);
                fetchHistory();
            } catch (error) {
                console.error("Update failed", error);
                alert("更新に失敗しました");
            }
        };

        const toggleAccordion = (id) => {
            if (editingId) return;
            const isOpening = expandedDocId !== id;
            setExpandedDocId(isOpening ? id : null);
        };

        const formatCurrency = (amount, currency = 'JPY') => {
            if (amount === '' || amount === null || amount === undefined) return '0';
            try {
                const num = Number(String(amount).replace(/,/g, ''));
                if (isNaN(num)) return amount;
                return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: currency || 'JPY' }).format(num);
            } catch (err) {
                console.error(err);
                return amount;
            }
        };

        const formatDate = (timestamp) => {
            if (!timestamp) return '---';
            if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
            return new Date(timestamp).toLocaleDateString();
        };

        const getAccountTypeBadge = (acType) => {
            if (!acType) return null;
            const isNisa = acType.includes('NISA') || acType === 'iDeCo';
            const colorClass = isNisa ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-200';
            return (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${colorClass} mr-1`}>
                    {acType.replace(' (つみたて)', '').replace(' (成長枠)', '').replace('口座', '')}
                </span>
            );
        };

        return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">資産一覧</h1>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors bg-white px-3 py-1.5 rounded-full border shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold">使い方</span>
                    </button>
                </div>

                {/* Input Mode Tabs */}
                <div className="mb-4 flex space-x-2">
                    <button onClick={() => setInputMode('scan')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${inputMode === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>📷 画像で解析</button>
                    <button onClick={() => setInputMode('manual')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${inputMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>✏️ 手入力で登録</button>
                </div>

                <div className={`bg-white shadow rounded-b-lg rounded-tr-lg p-6 mb-8 border-2 transition-colors ${dragActive && inputMode === 'scan' ? 'border-blue-500 bg-blue-50 border-dashed' : 'border-gray-200'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                    {inputMode === 'scan' && (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">資産画像のアップロード</h2>
                                <div>
                                    <label className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer ${analyzing || saving ? 'opacity-50 pointer-events-none' : ''}`}>
                                        {analyzing ? '解析中...' : 'ファイルを選択'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={analyzing || saving} />
                                    </label>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-gray-500 text-sm">{analyzing ? '画像を解析しています...' : 'ここに資産画面のスクリーンショットをドラッグ＆ドロップしてください'}</p>
                            {data && data.assets && (
                                <div className="mt-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200">
                                            <label className="font-medium text-gray-700 text-xs">所有者</label>
                                            <select value={owner} onChange={(e) => setOwner(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border">
                                                {members.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200">
                                            <label className="font-medium text-gray-700 text-xs">基本口座区分</label>
                                            <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border">
                                                {['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '一般口座'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200">
                                            <label className="font-medium text-gray-700 text-xs">証券会社</label>
                                            <input type="text" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border" placeholder="例: SBI証券" />
                                        </div>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">資産タイプ</th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">口座区分</th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">銘柄名</th><th className="px-6 py-3 text-right text-xs text-gray-500 uppercase">取得元本</th><th className="px-6 py-3 text-right text-xs text-gray-500 uppercase">評価額</th></tr></thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {data.assets.map((asset, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 text-sm text-gray-500 uppercase">{asset.type}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {(asset.type === '不動産' || asset.type === '貴金属') ? (
                                                                <span className="text-gray-400 text-xs font-medium">一般口座</span>
                                                            ) : (
                                                                <select
                                                                    value={asset.accountType}
                                                                    onChange={(e) => {
                                                                        const newData = { ...data };
                                                                        newData.assets[index].accountType = e.target.value;
                                                                        setData(newData);
                                                                    }}
                                                                    className="text-xs border-gray-300 rounded-md p-1"
                                                                >
                                                                    {['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '一般口座'].map(t => <option key={t} value={t}>{t}</option>)}
                                                                </select>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{asset.name} {asset.code && <span className="text-gray-400 text-xs">({asset.code})</span>}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 text-right font-mono">
                                                            <input
                                                                type="number"
                                                                value={asset.acquisitionCost || ''}
                                                                onChange={(e) => {
                                                                    const newData = { ...data };
                                                                    newData.assets[index].acquisitionCost = Number(e.target.value);
                                                                    setData(newData);
                                                                }}
                                                                placeholder="元本"
                                                                className="w-24 text-right border-gray-200 rounded text-xs p-1"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">{formatCurrency(asset.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot><tr className="bg-gray-50"><td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-900">合計</td><td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(data.total_valuation || data.assets.reduce((sum, a) => sum + (a.amount || 0), 0))}</td></tr></tfoot>
                                        </table>
                                    </div>
                                    <div className="flex justify-end"><button onClick={handleSaveData} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow-lg disabled:opacity-50">{saving ? '保存中...' : 'この内容で登録する'}</button></div>
                                </div>
                            )}
                        </>
                    )}

                    {inputMode === 'manual' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200"><label className="font-medium text-gray-700 text-xs">所有者</label><select value={owner} onChange={(e) => setOwner(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border">{members.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                                <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200"><label className="font-medium text-gray-700 text-xs">基本口座区分</label><select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border">{['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '一般口座'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-4 border border-gray-200"><label className="font-medium text-gray-700 text-xs">証券会社</label><input type="text" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md p-2 border" placeholder="例: SBI証券" /></div>
                            </div>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">資産タイプ</th><th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">口座区分</th><th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">銘柄名</th><th className="px-4 py-3 text-left text-xs text-gray-500 uppercase w-24">コード</th><th className="px-4 py-3 text-right text-xs text-gray-500 uppercase w-32">取得元本</th><th className="px-4 py-3 text-right text-xs text-gray-500 uppercase w-32">評価額</th><th className="px-4 py-3 text-center text-xs text-gray-500 uppercase w-12">削除</th></tr></thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {manualAssets.map((asset, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2"><select value={asset.type} onChange={(e) => updateManualRow(index, 'type', e.target.value)} className="w-full text-sm border-gray-300 rounded-md">{ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                                                <td className="px-4 py-2">
                                                    {(asset.type === '不動産' || asset.type === '貴金属') ? (
                                                        <span className="text-gray-400 text-xs font-medium p-2 block">一般口座</span>
                                                    ) : (
                                                        <select
                                                            value={asset.accountType}
                                                            onChange={(e) => updateManualRow(index, 'accountType', e.target.value)}
                                                            className="w-full text-sm border-gray-300 rounded-md"
                                                        >
                                                            {['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '一般口座'].map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2"><input type="text" value={asset.name} onChange={(e) => updateManualRow(index, 'name', e.target.value)} className="w-full text-sm border-gray-300 rounded-md" placeholder="トヨタ..." /></td>
                                                <td className="px-4 py-2"><input type="text" value={asset.code} onChange={(e) => updateManualRow(index, 'code', e.target.value)} className="w-full text-sm border-gray-300 rounded-md" placeholder="7203" /></td>
                                                <td className="px-4 py-2"><input type="number" value={asset.acquisitionCost} onChange={(e) => updateManualRow(index, 'acquisitionCost', e.target.value)} className="w-full text-sm text-right border-gray-300 rounded-md bg-orange-50/30" placeholder="元本" /></td>
                                                <td className="px-4 py-2">
                                                    {['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type) ? (
                                                        <div className="flex gap-1 items-center">
                                                            <select
                                                                value={asset.currency || 'USD'}
                                                                onChange={(e) => updateManualRow(index, 'currency', e.target.value)}
                                                                className="text-[10px] border border-gray-300 rounded p-1 outline-none font-bold text-indigo-700 w-16"
                                                            >
                                                                {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={asset.foreignAmount || ''}
                                                                onChange={(e) => updateManualRow(index, 'foreignAmount', e.target.value)}
                                                                className="w-20 text-xs text-right border border-gray-300 rounded p-1 outline-none font-bold font-mono"
                                                                placeholder="外貨"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 px-1">---</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2"><input type="number" value={asset.amount} onChange={(e) => updateManualRow(index, 'amount', e.target.value)} className="w-full text-sm text-right border-gray-300 rounded-md" readOnly={['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type)} /></td>
                                                <td className="px-4 py-2 text-center text-red-500 cursor-pointer" onClick={() => removeManualRow(index)}>✖</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot><tr className="bg-gray-50"><td colSpan="6" className="px-4 py-2"><button onClick={addManualRow} className="text-blue-600 text-sm font-bold">+ 行を追加</button></td></tr></tfoot>
                                </table>
                            </div>
                            <div className="flex justify-end"><button onClick={handleSaveData} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-lg">手入力で登録する</button></div>
                        </div>
                    )}
                </div>

                {/* History List */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">登録済みポートフォリオ (証券口座)</h2>
                    {history.length > 0 ? (
                        <div className="flex flex-col space-y-4">
                            {history.map((item) => {
                                const isExpanded = expandedDocId === item.id;
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className={`border rounded-lg overflow-hidden transition-shadow ${isEditing ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm'}`}>
                                        {/* --- Header / Normal View --- */}
                                        {!isEditing ? (
                                            <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 cursor-pointer" onClick={() => toggleAccordion(item.id)}>
                                                <div className="flex items-center space-x-6 flex-1">
                                                    <span className="text-[11px] text-gray-400 w-24 font-mono">{formatDate(item.createdAt)}</span>
                                                    <span className="text-xs font-bold text-gray-700 px-2 py-1 bg-white border rounded shadow-xs">{item.owner}</span>
                                                    <div className="flex items-center space-x-3 w-48">
                                                        {getAccountTypeBadge(item.accountType)}
                                                        <span className="text-sm font-bold text-gray-900 truncate">{item.brokerName}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 hidden lg:inline italic">{item.assets ? `${item.assets.length}銘柄` : '詳細なし'}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-lg font-black text-gray-900">{formatCurrency(item.total_valuation)}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={(e) => startEditing(e, item)} className="text-gray-300 hover:text-blue-600 p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- Edit Mode UI --- */
                                            <div className="p-6 bg-blue-50 space-y-4">
                                                <div className="flex flex-wrap gap-4 items-end border-b border-blue-100 pb-4">
                                                    <div><label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">所有者</label><select value={editForm.owner} onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })} className="p-2 border rounded text-sm bg-white">{members.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                                                    <div className="flex-1"><label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase">証券会社 / 銀行名</label><input type="text" value={editForm.brokerName} onChange={(e) => setEditForm({ ...editForm, brokerName: e.target.value })} className="w-full p-2 border rounded text-sm bg-white" /></div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleUpdatePortfolio} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm shadow-sm hover:bg-blue-700">更新保存</button>
                                                        <button onClick={cancelEditing} className="bg-white text-gray-600 px-4 py-2 rounded text-sm border hover:bg-gray-50">キャンセル</button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-blue-800 mb-2 uppercase tracking-wide">銘柄リストの編集</h4>
                                                    <div className="bg-white rounded border border-blue-100 overflow-hidden">
                                                        <table className="min-w-full divide-y divide-gray-100">
                                                            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black"><tr><th className="px-4 py-2 text-left w-32">銘柄名</th><th className="px-4 py-2 text-left">口座区分</th><th className="px-4 py-2 text-left">外貨</th><th className="px-4 py-2 text-right">取得元本</th><th className="px-4 py-2 text-right">評価額</th><th className="px-2 py-2"></th></tr></thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {editForm.assets.map((asset, idx) => (
                                                                    <tr key={idx} className="hover:bg-blue-50/20 text-sm">
                                                                        <td className="px-4 py-2"><input type="text" value={asset.name} onChange={(e) => updateEditAsset(idx, 'name', e.target.value)} className="w-full border-none p-1 focus:ring-0 font-bold text-gray-900" placeholder="銘柄名..." /></td>
                                                                        <td className="px-4 py-2">
                                                                            {(asset.type === '不動産' || asset.type === '貴金属') ? (
                                                                                <span className="text-gray-400 text-[10px] font-bold">一般口座</span>
                                                                            ) : (
                                                                                <select value={asset.accountType} onChange={(e) => updateEditAsset(idx, 'accountType', e.target.value)} className="text-[11px] border border-gray-200 rounded p-1">
                                                                                    {['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '一般口座'].map(t => <option key={t} value={t}>{t}</option>)}
                                                                                </select>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            {['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type) ? (
                                                                                <div className="flex gap-1 items-center">
                                                                                    <select value={asset.currency || 'USD'} onChange={(e) => updateEditAsset(idx, 'currency', e.target.value)} className="text-[10px] border border-gray-200 rounded p-1 text-indigo-700 font-bold">
                                                                                        {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                                    </select>
                                                                                    <input type="number" value={asset.foreignAmount || ''} onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        const newAssets = [...editForm.assets];
                                                                                        newAssets[idx].foreignAmount = val;
                                                                                        newAssets[idx].amount = convertToJPY(val, asset.currency || 'USD', rates);
                                                                                        setEditForm({ ...editForm, assets: newAssets });
                                                                                    }} className="w-16 border-none p-1 focus:ring-0 font-mono text-[10px] bg-indigo-50/30 rounded" placeholder="外貨" />
                                                                                </div>
                                                                            ) : <span className="text-[10px] text-gray-300">---</span>}
                                                                        </td>
                                                                        <td className="px-4 py-2"><input type="number" value={asset.acquisitionCost} onChange={(e) => updateEditAsset(idx, 'acquisitionCost', e.target.value)} className="w-full text-right border-none p-1 focus:ring-0 font-mono text-gray-500" /></td>
                                                                        <td className="px-4 py-2"><input type="number" value={asset.amount} onChange={(e) => updateEditAsset(idx, 'amount', e.target.value)} className="w-full text-right border-none p-1 focus:ring-0 font-mono font-bold text-blue-600" readOnly={['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type)} /></td>
                                                                        <td className="px-2 py-2 text-center text-red-300 hover:text-red-500 cursor-pointer" onClick={() => removeEditAsset(idx)}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <button onClick={addEditAsset} className="w-full py-2 bg-gray-50 text-blue-600 text-xs font-bold hover:bg-blue-50">+ 行を追加</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* --- Expanded Details view --- */}
                                        {isExpanded && !isEditing && (
                                            <div className="px-6 py-4 bg-white border-t border-gray-100">
                                                {item.assets && item.assets.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-100 mb-4">
                                                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="px-6 py-3 text-left">タイプ</th><th className="px-6 py-3 text-left">銘柄名</th><th className="px-6 py-3 text-right">取得元本</th><th className="px-6 py-3 text-right">評価額</th><th className="px-6 py-3 text-right">評価損益</th></tr></thead>
                                                            <tbody className="bg-white divide-y divide-gray-50">
                                                                {item.assets.map((asset, idx) => {
                                                                    const profit = Number(asset.amount || 0) - Number(asset.acquisitionCost || asset.amount || 0);
                                                                    const isPositive = profit > 0;
                                                                    const isNegative = profit < 0;

                                                                    return (
                                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                                            <td className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase">{asset.type}</td>
                                                                            <td className="px-6 py-3 text-sm text-gray-900 font-bold flex items-center">
                                                                                {getAccountTypeBadge(asset.accountType)}
                                                                                {asset.name}
                                                                                {asset.code && <span className="text-gray-300 ml-1 text-[10px] font-mono">({asset.code})</span>}
                                                                            </td>
                                                                            <td className="px-6 py-3 text-sm font-mono text-gray-400 text-right">{formatCurrency(asset.acquisitionCost || asset.amount)}</td>
                                                                            <td className="px-6 py-3 text-sm font-mono font-bold text-right">{formatCurrency(asset.amount)}</td>
                                                                            <td className={`px-6 py-3 text-sm font-mono font-black text-right ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                                                                                {isPositive ? '+' : ''}{formatCurrency(isForeign ? convertToJPY(profit, asset.currency, rates) : profit)}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded">銘柄データがありません</p>}
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                                    {item.assets && item.assets.some(a => a.code) && (
                                                        <button onClick={() => handleFetchPricesForDoc(item.assets)} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                            最新株価に更新 (Live)
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => handleDelete(e, item.id)} className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        削除
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-gray-500 text-center py-4">登録されたデータはありません。</p>}
                </div>

                {/* --- Help Modal --- */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="text-xl font-bold text-gray-800">資産管理ガイド</h3>
                                <button onClick={() => setShowHelp(false)} className="text-gray-400 font-bold text-xl">×</button>
                            </div>
                            <div className="p-8 space-y-6 text-sm text-gray-600">
                                <section><h4 className="font-bold text-gray-900 mb-2">1. 銘柄単位の口座管理</h4>銘柄ごとに「新NISA」や「特定口座」を設定できます。これがライフプランの税金計算に反映されます。</section>
                                <section><h4 className="font-bold text-gray-900 mb-2">2. 履歴の編集</h4>登録済みのポートフォリオの青い枠内から、銘柄名や金額、口座区分を直接編集でき、追加や削除も可能です。</section>
                                <section><h4 className="font-bold text-gray-900 mb-2">3. 株価更新</h4>銘柄コードがある場合、最新の市場価格を取得して評価額を更新できます（日本株対応）。</section>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
