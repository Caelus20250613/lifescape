import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import {
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
    serverTimestamp, query, orderBy, setDoc
} from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { geminiService } from '../services/geminiService';
import { useRef } from 'react';
import { useExchangeRates, convertToJPY, SUPPORTED_CURRENCIES } from '../hooks/useExchangeRates';

const ACCOUNT_TYPES = ['特定口座', '新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo', '小規模企業共済', '一般口座', '銀行口座', 'ウォレット(暗号資産)'];

// ★ここを拡張しました
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

const Icons = {
    Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    Sync: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    Bank: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10v8M11 10v8M15 10v8M3 21h18M7 3l4-2 4 2M3 7h18" /></svg>,
    ChevronDown: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Camera: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Loading: () => <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
};

export default function AssetPage() {
    const { currentUser } = useAuth();
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [members, setMembers] = useState(['自分', '家族共通']);

    // 編集モーダル用 State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        brokerName: '',
        owner: '自分',
        assets: []
    });
    const [analyzing, setAnalyzing] = useState(false);
    const fileInputRef = useRef(null);
    const { rates } = useExchangeRates();

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'users', currentUser.uid, 'portfolios'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPortfolios(data);
        } catch (e) {
            console.error("Fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // メンバー設定を取得
    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser) return;
            try {
                const { getDoc } = await import('firebase/firestore');
                const docRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().members?.length > 0) {
                    setMembers(docSnap.data().members);
                }
            } catch (e) { console.error(e); }
        };
        fetchSettings();
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (window.confirm("このポートフォリオを削除しますか？")) {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'portfolios', id));
            fetchData();
        }
    };

    // 編集モーダルを開く
    const openEditModal = (pf) => {
        setEditingId(pf.id);
        setEditForm({
            brokerName: pf.brokerName || '',
            owner: pf.owner || '自分',
            assets: pf.assets ? JSON.parse(JSON.stringify(pf.assets)) : []
        });
        setShowModal(true);
        setExpandedId(null);
    };

    // 新規追加モーダルを開く
    const openAddModal = () => {
        setEditingId(null);
        setEditForm({
            brokerName: '',
            owner: members[0] || '自分',
            assets: [{ type: '投資信託', name: '', code: '', amount: '', accountType: '特定口座', currency: 'JPY', foreignAmount: '' }]
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setEditForm({ brokerName: '', owner: '自分', assets: [] });
    };

    // 銘柄追加
    const addAssetRow = () => {
        setEditForm({
            ...editForm,
            assets: [...editForm.assets, { type: '投資信託', name: '', code: '', amount: '', accountType: '特定口座', currency: 'JPY', foreignAmount: '' }]
        });
    };

    // 銘柄削除
    const removeAssetRow = (idx) => {
        const newAssets = editForm.assets.filter((_, i) => i !== idx);
        setEditForm({ ...editForm, assets: newAssets });
    };

    // 銘柄更新
    const updateAssetRow = (idx, field, value) => {
        const newAssets = [...editForm.assets];
        newAssets[idx][field] = value;

        // 外貨タイプの場合、外貨金額から円換算を自動計算
        const isForeignType = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(newAssets[idx].type);
        if (isForeignType && (field === 'foreignAmount' || field === 'currency')) {
            const currency = field === 'currency' ? value : (newAssets[idx].currency || 'USD');
            const foreignAmount = field === 'foreignAmount' ? value : (newAssets[idx].foreignAmount || 0);
            newAssets[idx].amount = convertToJPY(foreignAmount, currency, rates);
        }

        // タイプ変更時に外貨フィールドを初期化
        if (field === 'type') {
            if (isForeignType) {
                newAssets[idx].currency = newAssets[idx].currency || 'USD';
                newAssets[idx].foreignAmount = newAssets[idx].foreignAmount || '';
            } else {
                newAssets[idx].currency = 'JPY';
                newAssets[idx].foreignAmount = '';
            }
        }

        setEditForm({ ...editForm, assets: newAssets });
    };

    // 保存
    const handleSavePortfolio = async () => {
        if (!editForm.brokerName.trim()) {
            return alert("証券会社名を入力してください");
        }

        const validAssets = editForm.assets.filter(a => a.name.trim() !== '');
        const totalVal = validAssets.reduce((sum, a) => sum + Number(a.amount || 0), 0);

        const portfolioData = {
            brokerName: editForm.brokerName,
            owner: editForm.owner,
            assets: validAssets.map(a => {
                const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(a.type);
                // amountに外貨額を保存する仕様に合わせる
                return {
                    ...a,
                    amount: isForeign ? Number(a.foreignAmount || 0) : Number(a.amount || 0),
                    foreignAmount: Number(a.foreignAmount || 0)
                };
            }),
            total_valuation: totalVal,
            updatedAt: serverTimestamp()
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, 'users', currentUser.uid, 'portfolios', editingId), portfolioData);
                alert("更新しました");
            } else {
                await addDoc(collection(db, 'users', currentUser.uid, 'portfolios'), {
                    ...portfolioData,
                    createdAt: serverTimestamp()
                });
                alert("新規登録しました");
            }
            closeModal();
            fetchData();
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
        }
    };

    const handleAnalyzeImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);
        try {
            const result = await geminiService.analyzeAssetImage(file);

            if (result.assets && Array.isArray(result.assets)) {
                const currentAssets = editForm.assets.filter(a => a.name !== '' || a.amount !== '');
                const newAssets = result.assets.map(a => ({
                    type: a.type || '投資信託',
                    accountType: a.accountType || '特定口座',
                    name: a.name || '',
                    code: a.code || '',
                    amount: a.amount || 0
                }));

                setEditForm(prev => ({
                    ...prev,
                    brokerName: prev.brokerName || result.brokerName || '',
                    assets: [...currentAssets, ...newAssets]
                }));
                alert(`${newAssets.length}件の銘柄を読み込みました。`);
            }
        } catch (error) {
            console.error(error);
            alert("画像の解析に失敗しました。");
        } finally {
            setAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ライフプランへ同期
    const handleSyncToLifePlan = async () => {
        if (!window.confirm("現在の資産合計を、ライフプランシミュレーションの「現在の資産額」として上書き保存しますか？")) return;
        setSyncing(true);
        try {
            // LifePlanPage側で計算ロジックを持っているので、ここではトリガーのみ、あるいは簡易保存
            // 実際はLifePlanPageを開いたときに最新のPortfoliosを読みに行くロジック(useEffect)になっているため、
            // ここでは特に何もしなくてもLifePlanPageに行けば反映されます。
            // 念のため、現在時刻を更新して「更新があったこと」を記録する
            const settingsRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'simulationSettings');
            await setDoc(settingsRef, { syncedAt: serverTimestamp() }, { merge: true });

            alert(`同期完了！\nライフプラン画面をリロードすると最新の資産残高が反映されます。`);
        } catch (e) {
            console.error(e);
            alert("同期に失敗しました");
        } finally {
            setSyncing(false);
        }
    };

    const formatYen = (val) => {
        const num = Number(val);
        if (isNaN(num)) return '¥0';
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(num);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '---';
        if (timestamp.toDate) return timestamp.toDate().toLocaleDateString('ja-JP');
        return new Date(timestamp).toLocaleDateString('ja-JP');
    };

    // 全資産をフラット化してグラフ用に集計
    const { chartData, totalAssets, riskAssets } = useMemo(() => {
        const typeMap = {};
        let total = 0;
        let risk = 0;

        portfolios.forEach(pf => {
            if (pf.assets && Array.isArray(pf.assets)) {
                pf.assets.forEach(asset => {
                    const val = Number(asset.amount || 0);
                    const assetType = asset.type || 'その他';
                    const name = asset.name || "";

                    const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(assetType);
                    // 外貨の場合は円換算する。それ以外はそのまま
                    const convertedVal = isForeign ? convertToJPY(val, asset.currency, rates) : val;

                    if (!typeMap[assetType]) typeMap[assetType] = 0;
                    typeMap[assetType] += convertedVal;
                    total += convertedVal;

                    // 安全資産判定 (円預金、国債など)
                    // 名称も考慮して判定 (LifePlanPageと同期)
                    const lowerName = name.toLowerCase();
                    const lowerType = assetType.toLowerCase();
                    const isCash = ['円預金', '預金', '普通預金', '定期預金', '現金', 'cash', '小規模企業共済'].includes(lowerType) ||
                        lowerName.includes('預金') || lowerName.includes('普通') || lowerName.includes('定期') ||
                        lowerName.includes('セービング') || lowerName.includes('貯金') || lowerName.includes('当座') ||
                        lowerName.includes('口座') || lowerName.includes('キャッシュ') || lowerName.includes('cash') ||
                        lowerName.includes('wise');

                    // リスク資産判定
                    // 不動産や貴金属は実物資産として「金融リスク資産」からは除外するのが一般的
                    const isTangible = lowerType.includes('不動産') || lowerName.includes('不動産') || lowerName.includes('自宅') ||
                        lowerType.includes('貴金属') || lowerName.includes('金') || lowerName.includes('ゴールド');

                    if (!isCash && !isTangible) {
                        risk += convertedVal;
                    }
                });
            }
        });

        const COLORS = {
            '日本株': '#3B82F6', '米国株': '#10B981', '外国株': '#059669',
            '投資信託': '#F59E0B', 'ETF': '#D97706', '外貨建てMMF': '#FCD34D',
            '円預金': '#9CA3AF', '預金': '#9CA3AF', '外貨預金': '#6B7280', '債券': '#6366F1',
            '不動産': '#8B5CF6', '貴金属': '#FBBF24', '暗号資産': '#EF4444',
            '小規模企業共済': '#F472B6', '貯蓄型保険': '#EC4899', 'その他': '#CBD5E1'
        };
        const FALLBACK_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#64748B'];

        const chart = Object.keys(typeMap).map((k, i) => ({
            name: k,
            value: typeMap[k],
            color: COLORS[k] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
        })).filter(d => d.value > 0);

        return { chartData: chart, totalAssets: total, riskAssets: risk };
    }, [portfolios, rates]);

    const getAccountTypeBadge = (accType) => {
        if (!accType) return null;
        const isNisa = accType.includes('NISA') || accType === 'iDeCo';
        const colorClass = isNisa ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600';
        return (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${colorClass} mr-1`}>
                {accType.replace(' (つみたて)', '').replace(' (成長枠)', '').replace('口座', '')}
            </span>
        );
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">資産ポートフォリオ</h1>
                    <p className="text-sm text-gray-500 mt-1">証券口座ごとの資産状況を管理</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSyncToLifePlan}
                        disabled={syncing}
                        className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm text-sm"
                    >
                        <Icons.Sync /> {syncing ? '同期中...' : 'ライフプランへ反映'}
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                    >
                        <Icons.Plus /> 資産を登録
                    </button>
                </div>
            </header>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">総資産評価額</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{formatYen(totalAssets)}</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">リスク資産合計</p>
                    <p className="text-3xl font-black text-indigo-600 mt-1">{formatYen(riskAssets)}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        ポートフォリオ比率: {totalAssets > 0 ? Math.round((riskAssets / totalAssets) * 100) : 0}%
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">登録口座数</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{portfolios.length} <span className="text-sm font-bold text-gray-400">件</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側: 円グラフ */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">アセットアロケーション</h3>
                    {chartData.length > 0 ? (
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatYen(val)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-300 font-bold text-sm">データがありません</div>
                    )}
                </div>

                {/* 右側: ポートフォリオリスト */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-800 mb-2">登録済み口座・資産</h3>
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">読み込み中...</div>
                    ) : portfolios.length === 0 ? (
                        <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-gray-100 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Icons.Bank />
                            </div>
                            <p className="text-gray-400 font-bold">登録された資産はありません</p>
                            <p className="text-xs text-gray-300 mt-2">「資産を登録」ボタンから追加してください</p>
                        </div>
                    ) : (
                        portfolios.map(pf => {
                            const isExpanded = expandedId === pf.id;

                            // ポートフォリオ自体の合計額も、外貨が含まれる場合はリアルタイムで円換算して表示する
                            // pf.total_valuation はDB保存値だが、レート変動や通貨未対応の可能性があるため再計算推奨
                            const recalculatedTotal = pf.assets ? pf.assets.reduce((sum, asset) => {
                                const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type);
                                const val = Number(asset.amount || 0);
                                return sum + (isForeign ? convertToJPY(val, asset.currency, rates) : val);
                            }, 0) : 0;

                            const assetCount = pf.assets ? pf.assets.length : 0;

                            return (
                                <div key={pf.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {/* ヘッダー */}
                                    <div
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : pf.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                                <Icons.Bank />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">{pf.brokerName || '(名称なし)'}</h3>
                                                    {pf.owner && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{pf.owner}</span>}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">{assetCount}銘柄 • 更新: {formatDate(pf.updatedAt || pf.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-black text-gray-900">{formatYen(recalculatedTotal)}</span>
                                            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <Icons.ChevronDown />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 展開時 */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-gray-50/30">
                                            {pf.assets && pf.assets.length > 0 ? (
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-5 py-3 text-left">タイプ</th>
                                                            <th className="px-5 py-3 text-left">名称</th>
                                                            <th className="px-5 py-3 text-right">評価額</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {pf.assets.map((asset, idx) => {
                                                            const lowName = (asset.name || '').toLowerCase();
                                                            const lowType = (asset.type || '').toLowerCase();
                                                            const isSafe = ['円預金', '預金', '普通預金', '定期預金', '現金', 'cash', '小規模企業共済'].includes(lowType) ||
                                                                lowName.includes('預金') || lowName.includes('普通') || lowName.includes('定期') ||
                                                                lowName.includes('セービング') || lowName.includes('貯金') || lowName.includes('当座') ||
                                                                lowName.includes('口座') || lowName.includes('キャッシュ') || lowName.includes('cash') || lowName.includes('wise');
                                                            const isTangible = lowType.includes('不動産') || lowName.includes('不動産') || lowName.includes('自宅') ||
                                                                lowType.includes('貴金属') || lowName.includes('金') || lowName.includes('ゴールド');

                                                            const badgeText = isSafe ? '安全' : (isTangible ? '実物' : 'リスク');
                                                            const badgeColor = isSafe ? 'bg-emerald-50 text-emerald-500' : (isTangible ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500');

                                                            // 外貨の場合は円換算値を計算
                                                            const isForeign = ['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type);
                                                            const displayVal = isForeign
                                                                ? convertToJPY(Number(asset.amount || 0), asset.currency, rates)
                                                                : Number(asset.amount || 0);

                                                            return (
                                                                <tr key={idx} className="hover:bg-white transition-colors">
                                                                    <td className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span>{asset.type || '---'}</span>
                                                                            <span className={`text-[8px] px-1 py-0.5 rounded-sm w-fit ${badgeColor}`}>
                                                                                {badgeText}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3 text-sm text-gray-900 font-bold">
                                                                        {getAccountTypeBadge(asset.accountType)}
                                                                        {asset.name || '(名称なし)'}
                                                                        {asset.code && <span className="text-gray-300 ml-1 text-[10px] font-mono">({asset.code})</span>}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-sm font-mono font-bold text-right">
                                                                        {formatYen(displayVal)}
                                                                        {isForeign && (
                                                                            <div className="text-[10px] text-gray-400 font-medium">
                                                                                {(Number(asset.amount || 0)).toLocaleString()} {asset.currency}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic text-center py-6">銘柄データがありません</p>
                                            )}
                                            <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(pf); }}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                >
                                                    <Icons.Edit /> 編集する
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(pf.id); }}
                                                    className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1"
                                                >
                                                    <Icons.Trash /> 削除
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 編集モーダル */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* ヘッダー */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">{editingId ? '資産詳細の編集' : '新規資産の登録'}</h2>
                                <p className="text-xs text-gray-400 mt-1">口座・場所ごとに資産を管理</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <Icons.Close />
                            </button>
                        </div>

                        {/* フォーム本体 */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">管理場所 / 金融機関名</label>
                                    <input
                                        type="text"
                                        value={editForm.brokerName}
                                        onChange={(e) => setEditForm({ ...editForm, brokerName: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="例: SBI証券, 三井住友銀行, 自宅金庫"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">所有者</label>
                                    <select
                                        value={editForm.owner}
                                        onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        {members.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* AI 読み取り */}
                            {!editingId && (
                                <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-indigo-50 text-indigo-600">
                                            <Icons.Camera />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-indigo-900">AI スキャン入力</p>
                                            <p className="text-[10px] text-indigo-500 mt-0.5">スクショから資産を自動読み込み</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={analyzing}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[11px] font-black hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:bg-indigo-300"
                                    >
                                        {analyzing ? <Icons.Loading /> : <Icons.Camera />}
                                        {analyzing ? '解析中...' : 'スクショを選択'}
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleAnalyzeImage} accept="image/*" className="hidden" />
                                </div>
                            )}

                            {/* 資産リスト */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">保有資産一覧</label>
                                    <button type="button" onClick={addAssetRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                        <Icons.Plus /> 行を追加
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 text-[9px] font-black text-gray-400 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-28">タイプ</th>
                                                <th className="px-3 py-2 text-left w-24">口座区分</th>
                                                <th className="px-3 py-2 text-left">資産名/銘柄</th>
                                                <th className="px-3 py-2 text-left w-32">外貨</th>
                                                <th className="px-3 py-2 text-right w-28">評価額(円)</th>
                                                <th className="px-2 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {editForm.assets.map((asset, idx) => (
                                                <tr key={idx} className="bg-white">
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={asset.type}
                                                            onChange={(e) => updateAssetRow(idx, 'type', e.target.value)}
                                                            className="w-full text-xs border-none bg-transparent p-1 outline-none font-bold"
                                                        >
                                                            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 border-l border-gray-50">
                                                        <select
                                                            value={asset.accountType}
                                                            onChange={(e) => updateAssetRow(idx, 'accountType', e.target.value)}
                                                            className="w-full text-xs border-none bg-transparent p-1 outline-none font-medium text-gray-600"
                                                        >
                                                            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 border-l border-gray-50">
                                                        <input
                                                            type="text"
                                                            value={asset.name}
                                                            onChange={(e) => updateAssetRow(idx, 'name', e.target.value)}
                                                            className="w-full text-sm border-none bg-transparent p-1 outline-none font-bold"
                                                            placeholder="銘柄名..."
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 border-l border-gray-50">
                                                        {['外貨預金', '外貨建てMMF'].includes(asset.type) ? (
                                                            <div className="flex gap-1 items-center">
                                                                <select
                                                                    value={asset.currency || 'USD'}
                                                                    onChange={(e) => updateAssetRow(idx, 'currency', e.target.value)}
                                                                    className="text-[10px] border-none bg-indigo-50 rounded p-1 outline-none font-bold text-indigo-700 w-14"
                                                                >
                                                                    {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    value={asset.foreignAmount || ''}
                                                                    onChange={(e) => updateAssetRow(idx, 'foreignAmount', e.target.value)}
                                                                    className="w-16 text-xs text-right border-none bg-transparent p-1 outline-none font-bold font-mono"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-300 px-1">---</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 border-l border-gray-50">
                                                        <input
                                                            type="number"
                                                            value={asset.amount}
                                                            onChange={(e) => updateAssetRow(idx, 'amount', e.target.value)}
                                                            className="w-full text-sm text-right border-none bg-transparent p-1 outline-none font-bold font-mono"
                                                            placeholder="0"
                                                            readOnly={['米国株', '外国株', 'ETF', '外貨預金', '外貨建てMMF'].includes(asset.type)}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center border-l border-gray-50">
                                                        <button type="button" onClick={() => removeAssetRow(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                            <Icons.Trash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {editForm.assets.length === 0 && (
                                        <div className="p-6 text-center text-gray-300 text-sm">
                                            「行を追加」から資産を登録してください
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* フッター */}
                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                            <button type="button" onClick={closeModal} className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">キャンセル</button>
                            <button onClick={handleSavePortfolio} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all font-mono tracking-wider">
                                {editingId ? '更新する' : '登録する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}