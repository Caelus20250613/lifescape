import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// --- タブのスタイル定義 ---
function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const AdvancedSimulationSettings = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // --- State定義 ---
    const [economics, setEconomics] = useState({
        inflationRate: 0,
        salaryIncreaseRate: 0,
        exchangeRates: { MYR: 35, USD: 150, GBP: 190, AUD: 100 }
    });

    const [incomes, setIncomes] = useState([]);
    const [exitStrategy, setExitStrategy] = useState({
        targetAge: 65,
        type: 'RetirementBonus',
        grossAmount: 0,
        serviceYears: 20
    });

    const [educationPlans, setEducationPlans] = useState([]);

    // --- 初期データ読み込み ---
    useEffect(() => {
        if (!currentUser || !isOpen) return;

        const loadSettings = async () => {
            console.log("🔍 [AdvancedSettings] Loading settings for user:", currentUser.uid);
            try {
                const docRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'advancedSettings');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("✅ [AdvancedSettings] Data found:", data);
                    if (data.economics) setEconomics(data.economics);
                    if (data.incomes) setIncomes(data.incomes);
                    if (data.exitStrategy) setExitStrategy(data.exitStrategy);
                    if (data.educationPlans) setEducationPlans(data.educationPlans);
                } else {
                    console.log("ℹ️ [AdvancedSettings] No existing data found. Using defaults.");
                    // データがない場合、子供リストを取得して初期化する処理などをここに入れると親切
                }
            } catch (error) {
                console.error("❌ [AdvancedSettings] Load Error:", error);
                alert("設定の読み込みに失敗しました: " + error.message);
            } finally {
                setInitialLoad(false);
            }
        };

        loadSettings();
    }, [currentUser, isOpen]);

    // --- 保存処理 (ここが重要) ---
    const handleSave = async () => {
        if (!currentUser) {
            alert("エラー: ログインしていません。");
            return;
        }

        setLoading(true);
        console.group("💾 [AdvancedSettings] Saving Data...");

        try {
            // 1. 保存するデータオブジェクトを作成
            const saveData = {
                isEnabled: true,
                economics,
                incomes,
                exitStrategy,
                educationPlans,
                updatedAt: new Date().toISOString()
            };

            console.log("Draft Data:", saveData);

            // 2. Firestoreへのパスを指定
            const docRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'advancedSettings');
            console.log("Target Path:", docRef.path);

            // 3. 書き込み実行
            await setDoc(docRef, saveData);

            console.log("✅ Save Successful!");
            alert("詳細設定を保存しました！");
            onClose(); // 成功したら閉じる

        } catch (error) {
            console.error("❌ Save Failed:", error);
            alert("保存に失敗しました。\n" + error.message);
        } finally {
            console.groupEnd();
            setLoading(false);
        }
    };

    const addIncome = () => {
        setIncomes([...incomes, {
            id: Date.now().toString(),
            name: '',
            type: 'Salary',
            startAge: 46,
            endAge: 65,
            annualAmount: 0,
            taxCategory: 'Kyuyo'
        }]);
    };

    const addEducationPlanPlaceholder = () => {
        setEducationPlans([...educationPlans, {
            childId: 'dummy-' + Date.now(),
            childName: 'お子様 (新規)',
            phases: []
        }]);
    };

    const removeIncome = (index) => {
        const newIncomes = [...incomes];
        newIncomes.splice(index, 1);
        setIncomes(newIncomes);
    };

    const removeEducationPlan = (index) => {
        const newPlans = [...educationPlans];
        newPlans.splice(index, 1);
        setEducationPlans(newPlans);
    };

    const removePhase = (planIndex, phaseIndex) => {
        const newPlans = [...educationPlans];
        newPlans[planIndex].phases.splice(phaseIndex, 1);
        setEducationPlans(newPlans);
    };

    const resetExitStrategy = () => {
        setExitStrategy({
            targetAge: 65,
            type: 'RetirementBonus',
            grossAmount: 0,
            serviceYears: 20
        });
    };

    const addPhase = (planIndex) => {
        const newPlans = [...educationPlans];
        newPlans[planIndex].phases.push({
            id: Date.now().toString(),
            name: 'New Phase',
            startAge: 15,
            endAge: 18,
            annualCost: 0,
            currency: 'MYR',
            inflationRate: 3
        });
        setEducationPlans(newPlans);
    };


    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        詳細シミュレーション設定
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <Tab.Group>
                                    <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                                        {['キャリア & Exit', '教育・留学', '経済前提'].map((category) => (
                                            <Tab
                                                key={category}
                                                className={({ selected }) =>
                                                    classNames(
                                                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                                                        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                                        selected
                                                            ? 'bg-white shadow'
                                                            : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                                    )
                                                }
                                            >
                                                {category}
                                            </Tab>
                                        ))}
                                    </Tab.List>
                                    <Tab.Panels>
                                        {/* Tab 1: Career & Exit */}
                                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                                            <div className="space-y-6">
                                                <div className="border p-4 rounded-lg bg-gray-50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold text-gray-700">Exit戦略 (医療法人)</h4>
                                                        <button onClick={resetExitStrategy} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
                                                            <Trash2 size={12} /> リセット
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">ターゲット年齢</label>
                                                            <input type="number" value={exitStrategy.targetAge} onChange={e => setExitStrategy({ ...exitStrategy, targetAge: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">退職金見込み (額面)</label>
                                                            <input type="number" value={exitStrategy.grossAmount} onChange={e => setExitStrategy({ ...exitStrategy, grossAmount: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">勤続年数</label>
                                                            <input type="number" value={exitStrategy.serviceYears} onChange={e => setExitStrategy({ ...exitStrategy, serviceYears: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border p-4 rounded-lg bg-gray-50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold text-gray-700">将来の収入ストリーム</h4>
                                                        <button onClick={addIncome} className="flex items-center text-sm text-blue-600 font-bold hover:text-blue-800"><Plus size={16} className="mr-1" /> 追加</button>
                                                    </div>
                                                    {incomes.map((inc, idx) => (
                                                        <div key={inc.id} className="flex gap-2 items-end mb-2 border-b pb-2">
                                                            <div className="flex-1">
                                                                <label className="text-xs text-gray-500">名称</label>
                                                                <input type="text" value={inc.name} onChange={e => { const n = [...incomes]; n[idx].name = e.target.value; setIncomes(n); }} className="w-full text-sm border rounded p-1" placeholder="例: 個人事業" />
                                                            </div>
                                                            <div className="w-20">
                                                                <label className="text-xs text-gray-500">開始年齢</label>
                                                                <input type="number" value={inc.startAge} onChange={e => { const n = [...incomes]; n[idx].startAge = Number(e.target.value); setIncomes(n); }} className="w-full text-sm border rounded p-1" />
                                                            </div>
                                                            <div className="w-20">
                                                                <label className="text-xs text-gray-500">終了年齢</label>
                                                                <input type="number" value={inc.endAge} onChange={e => { const n = [...incomes]; n[idx].endAge = Number(e.target.value); setIncomes(n); }} className="w-full text-sm border rounded p-1" />
                                                            </div>
                                                            <div className="w-32">
                                                                <label className="text-xs text-gray-500">年額 (万円)</label>
                                                                <input type="number" value={inc.annualAmount} onChange={e => { const n = [...incomes]; n[idx].annualAmount = Number(e.target.value); setIncomes(n); }} className="w-full text-sm border rounded p-1" />
                                                            </div>
                                                            <button
                                                                onClick={() => removeIncome(idx)}
                                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="削除"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Tab.Panel>

                                        {/* Tab 2: Education */}
                                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                                            <div className="mb-4">
                                                <button onClick={addEducationPlanPlaceholder} className="bg-green-50 text-green-700 px-3 py-1 rounded text-sm border border-green-200">+ お子様プラン追加 (仮)</button>
                                            </div>
                                            {educationPlans.map((plan, pIdx) => (
                                                <div key={plan.childId} className="border rounded-lg p-4 mb-4 bg-white shadow-sm relative group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-800">{plan.childName}</h4>
                                                        <button
                                                            onClick={() => removeEducationPlan(pIdx)}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-opacity py-1 px-2 rounded hover:bg-red-50"
                                                        >
                                                            <Trash2 size={12} /> プラン削除
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {plan.phases.map((phase, phIdx) => (
                                                            <div key={phase.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded group/phase">
                                                                <div className="flex flex-col">
                                                                    <div className="flex gap-2 items-center">
                                                                        <select value={phase.currency} onChange={e => {
                                                                            const newPlans = [...educationPlans];
                                                                            newPlans[pIdx].phases[phIdx].currency = e.target.value;
                                                                            setEducationPlans(newPlans);
                                                                        }} className="text-sm border rounded p-1">
                                                                            <option value="JPY">JPY</option>
                                                                            <option value="MYR">MYR (マレーシア)</option>
                                                                            <option value="USD">USD</option>
                                                                            <option value="GBP">GBP</option>
                                                                        </select>
                                                                        <input type="number" value={phase.annualCost} onChange={e => {
                                                                            const newPlans = [...educationPlans];
                                                                            newPlans[pIdx].phases[phIdx].annualCost = Number(e.target.value);
                                                                            setEducationPlans(newPlans);
                                                                        }} className="w-24 text-sm border rounded p-1 text-right" placeholder="金額" />
                                                                    </div>
                                                                    {phase.currency !== 'JPY' && (
                                                                        <div className="text-[10px] text-gray-500 mt-1 ml-1">
                                                                            ≒ {Math.round(phase.annualCost * (economics.exchangeRates[phase.currency] || 0)).toLocaleString()} JPY
                                                                            <span className="ml-1 text-gray-400">(レート: {economics.exchangeRates[phase.currency]})</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-500 flex-1 ml-2">{phase.startAge}歳 - {phase.endAge}歳</span>
                                                                <button
                                                                    onClick={() => removePhase(pIdx, phIdx)}
                                                                    className="opacity-0 group-hover/phase:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => addPhase(pIdx)} className="text-xs text-blue-500 hover:text-blue-700 underline font-medium">+ フェーズ追加</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </Tab.Panel>

                                        {/* Tab 3: Economics */}
                                        <Tab.Panel className="rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
                                            <div className="space-y-4">
                                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                                    <label className="block text-sm font-bold text-gray-800 mb-2">資産取り崩し順序</label>
                                                    <p className="text-xs text-gray-600 mb-3">現預金が不足した際に、どの資産から優先して売却するかを設定します。</p>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="withdrawalPriority"
                                                                value="TaxableFirst"
                                                                checked={economics.withdrawalPriority !== 'NisaFirst'}
                                                                onChange={() => setEconomics({ ...economics, withdrawalPriority: 'TaxableFirst' })}
                                                                className="text-blue-600"
                                                            />
                                                            <span className="text-sm">特定口座(課税)を優先 <span className="text-xs text-gray-500">(推奨: NISAの非課税メリットを最大化)</span></span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="withdrawalPriority"
                                                                value="NisaFirst"
                                                                checked={economics.withdrawalPriority === 'NisaFirst'}
                                                                onChange={() => setEconomics({ ...economics, withdrawalPriority: 'NisaFirst' })}
                                                                className="text-blue-600"
                                                            />
                                                            <span className="text-sm">NISA(非課税)を優先 <span className="text-xs text-gray-500">(目先の税金支払いを回避)</span></span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t">
                                                    <label className="block text-sm font-medium text-gray-700">マレーシアリンギット (MYR) レート</label>
                                                    <div className="flex items-center gap-2">
                                                        <span>1 MYR = </span>
                                                        <input type="number" value={economics.exchangeRates.MYR} onChange={e => setEconomics({ ...economics, exchangeRates: { ...economics.exchangeRates, MYR: Number(e.target.value) } })} className="w-24 border rounded p-1 text-right" />
                                                        <span>JPY</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">米ドル (USD) レート</label>
                                                    <div className="flex items-center gap-2">
                                                        <span>1 USD = </span>
                                                        <input type="number" value={economics.exchangeRates.USD} onChange={e => setEconomics({ ...economics, exchangeRates: { ...economics.exchangeRates, USD: Number(e.target.value) } })} className="w-24 border rounded p-1 text-right" />
                                                        <span>JPY</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>

                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                        onClick={handleSave}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span> 保存中...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> 設定を保存
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default AdvancedSimulationSettings;