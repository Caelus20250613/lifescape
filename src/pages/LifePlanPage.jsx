import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import AssetSettings from '../components/AssetSettings';
import RetirementSettings from '../components/RetirementSettings';
import FamilyPlan from '../components/FamilyPlan';
import HousingPlan from '../components/HousingPlan';
import SummaryCards from '../components/SummaryCards';
import AssetChart from '../components/AssetChart';
import YearlyDetailModal from '../components/YearlyDetailModal';
import { getAnnualEducationCost } from '../utils/educationCosts';

const LifePlanPage = () => {
    const { currentUser } = useAuth();
    const [selectedYearData, setSelectedYearData] = useState(null);
    const [settings, setSettings] = useState({
        currentAge: 35,
        targetAge: 85,
        initialNisa: 0,
        initialTaxable: 0,
        initialCash: 0,
        monthlyNisa: 50000,
        monthlyTaxable: 0,
        returnRate: 5,
        retirementAge: 65,
        retirementBonus: 0,
        monthlySpendingPostRetire: 250000,
        pensionAmount: 150000,
        children: [],
        educationCostPerChild: 5000000,
        buyHomeAge: 0,
        homePrice: 40000000,
        downPayment: 5000000,
        loanRate: 1.0,
        loanDuration: 35
    });

    const [syncing, setSyncing] = useState(false);
    const [loans, setLoans] = useState([]);
    const [incomes, setIncomes] = useState([]);

    // データの読み込み (永続化保存データ & ローンデータ & 収入データ & 積立データ)
    useEffect(() => {
        const fetchPersistence = async () => {
            if (!currentUser) return;
            try {
                // 1. シミュレーション設定の読み込み
                const settingsRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'simulationSettings');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) {
                    setSettings(prev => ({ ...prev, ...settingsSnap.data() }));
                }

                // 2. ローンデータの読み込み
                const loansRef = collection(db, 'users', currentUser.uid, 'loans');
                const loansSnap = await getDocs(loansRef);
                const fetchedLoans = loansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLoans(fetchedLoans);

                // 3. 収入データの読み込み
                const incomesRef = collection(db, 'users', currentUser.uid, 'incomes');
                const incomesSnap = await getDocs(incomesRef);
                const fetchedIncomes = incomesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIncomes(fetchedIncomes);

                // 4. 積立マネージャーデータの読み込み & 計算 (settingsを上書き)
                const invRef = collection(db, 'users', currentUser.uid, 'investments');
                const invSnap = await getDocs(invRef);
                let nisaTotal = 0;
                let taxableTotal = 0;

                invSnap.forEach(doc => {
                    const data = doc.data();

                    // 【修正ポイント】スポット購入(type='spot')は毎月のシミュレーションから除外
                    if (data.type === 'spot') return;

                    const m = Number(data.monthlyAmount || 0);
                    const b = Number(data.bonusAmount || 0);
                    // ボーナスは年2回と仮定して月額換算
                    const realMonthly = m + (b * 2 / 12);

                    if (['nisa_tsumitate', 'nisa_growth', 'ideco'].includes(data.accountType)) {
                        nisaTotal += realMonthly;
                    } else {
                        taxableTotal += realMonthly;
                    }
                });

                // ポートフォリオ初期残高 (初期設定が空の場合のみ)
                let initialNisaVal = 0;
                let initialTaxableVal = 0;
                let initialCashVal = 0;
                if (!settingsSnap.exists()) {
                    const pfQuery = collection(db, 'users', currentUser.uid, 'portfolios');
                    const pfSnap = await getDocs(pfQuery);
                    const nisaTypes = ['新NISA (つみたて)', '新NISA (成長枠)', '旧NISA', 'iDeCo'];
                    pfSnap.docs.forEach(doc => {
                        const d = doc.data();
                        if (d.assets) {
                            d.assets.forEach(asset => {
                                const amt = Number(asset.amount || 0);
                                if (nisaTypes.includes(asset.accountType)) initialNisaVal += amt;
                                else if (asset.type === '預金' || asset.originalAssetType === '預金') initialCashVal += amt;
                                else if (asset.type !== '不動産') initialTaxableVal += amt;
                            });
                        }
                    });
                }

                setSettings(prev => ({
                    ...prev,
                    ...(settingsSnap.exists() ? settingsSnap.data() : {}),
                    // 積立額は常に最新のInvestmentPageデータを優先
                    monthlyNisa: Math.round(nisaTotal),
                    monthlyTaxable: Math.round(taxableTotal),
                    // 初期残高は初回のみポートフォリオから、以降は保存値
                    ...(settingsSnap.exists() ? {} : {
                        initialNisa: initialNisaVal,
                        initialTaxable: initialTaxableVal,
                        initialCash: initialCashVal
                    })
                }));

            } catch (e) {
                console.error("Fetch persistence error:", e);
            }
        };
        fetchPersistence();
    }, [currentUser]);

    const handleSaveSettings = async () => {
        if (!currentUser) return;
        try {
            const settingsRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'simulationSettings');
            await setDoc(settingsRef, {
                ...settings,
                updatedAt: serverTimestamp()
            });

            alert("設定を保存しました。次回アクセス時もこの設定が適用されます。");
        } catch (e) {
            alert("保存失敗: " + e.message);
        }
    };

    // 手動同期ボタン（念のため残していますが、useEffectで自動取得されるので基本使いません）
    const handleSyncFromCashFlow = async () => {
        if (!currentUser) return;
        setSyncing(true);
        try {
            const snap = await getDocs(collection(db, 'users', currentUser.uid, 'investments'));
            let totalNisa = 0;
            let totalTaxable = 0;
            snap.forEach(doc => {
                const data = doc.data();

                // 【修正ポイント】ここでもスポット購入を除外
                if (data.type === 'spot') return;

                const m = Number(data.monthlyAmount || 0);
                const b = Number(data.bonusAmount || 0);
                const realMonthly = m + (b * 2 / 12);

                if (['nisa_tsumitate', 'nisa_growth', 'ideco'].includes(data.accountType)) {
                    totalNisa += realMonthly;
                } else {
                    totalTaxable += realMonthly;
                }
            });

            setSettings(prev => ({
                ...prev,
                monthlyNisa: Math.round(totalNisa),
                monthlyTaxable: Math.round(totalTaxable)
            }));
            alert(`積立マネージャーから最新データを反映しました：\n非課税積立: ${Math.round(totalNisa).toLocaleString()}円\n課税積立: ${Math.round(totalTaxable).toLocaleString()}円`);

        } catch (error) { console.error(error); } finally { setSyncing(false); }
    };

    const simulationData = useMemo(() => {
        const {
            currentAge, targetAge, initialNisa, initialTaxable, initialCash,
            monthlyNisa, monthlyTaxable, returnRate,
            retirementAge, retirementBonus,
            monthlySpendingPostRetire, pensionAmount,
            children,
            buyHomeAge, homePrice, downPayment, loanRate, loanDuration
        } = settings;

        const chartData = [];
        let currentNisaVal = Number(initialNisa);
        let currentTaxableVal = Number(initialTaxable);
        let currentCashVal = Number(initialCash || 0);
        const yearlyRate = Number(returnRate) / 100;
        const simulationYears = targetAge - currentAge;

        // 内訳追跡用
        let nisaFromInitial = Number(initialNisa);
        let nisaFromContrib = 0;
        let taxableFromInitial = Number(initialTaxable);
        let taxableFromContrib = 0;
        let cashFromInitial = Number(initialCash || 0);
        let cashFromSurplus = 0;

        // 住宅ローン計算
        let remainingLoan = 0;
        let annualLoanPayment = 0;
        if (buyHomeAge > 0) {
            const principal = homePrice - downPayment;
            const r = (loanRate / 100) / 12;
            const n = loanDuration * 12;
            if (r > 0 && n > 0) {
                const monthlyPay = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                annualLoanPayment = monthlyPay * 12;
            } else if (n > 0) {
                annualLoanPayment = principal / loanDuration;
            }
        }

        for (let i = 0; i <= simulationYears; i++) {
            const age = currentAge + i;
            const isWorking = age < retirementAge;
            let yearlyIncome = 0;
            let yearlyExpense = 0;
            const livingCost = Number(monthlySpendingPostRetire) * 12;

            // 年初：運用益
            const nisaGrowthRate = 1 + yearlyRate;
            const taxableGrowthRate = 1 + yearlyRate * 0.8;
            currentNisaVal *= nisaGrowthRate;
            currentTaxableVal *= taxableGrowthRate;
            nisaFromInitial *= nisaGrowthRate;
            nisaFromContrib *= nisaGrowthRate;
            taxableFromInitial *= taxableGrowthRate;
            taxableFromContrib *= taxableGrowthRate;

            // 支出計算
            let currentYearlyEdCost = 0;
            let currentYearlyStudyAbroad = 0;
            children.forEach(child => {
                const childAge = Number(child.age) + i;
                let cost = 0;
                let level = '';
                if (childAge >= 4 && childAge <= 6) level = 'kinder';
                else if (childAge >= 7 && childAge <= 12) level = 'elem';
                else if (childAge >= 13 && childAge <= 15) level = 'middle';
                else if (childAge >= 16 && childAge <= 18) level = 'high';
                else if (childAge >= 19 && childAge <= 22) level = 'uni';

                if (level) {
                    if (child.customCosts && child.customCosts[level] !== undefined && child.customCosts[level] !== '') {
                        cost = Number(child.customCosts[level]);
                    } else {
                        cost = getAnnualEducationCost(child.educationCourse || 'ALL_PUBLIC', childAge);
                    }
                }
                currentYearlyEdCost += cost;

                if (child.studyAbroad && childAge >= 19 && childAge <= 22) {
                    currentYearlyStudyAbroad += 2000000;
                }
            });
            yearlyExpense = livingCost + currentYearlyEdCost + currentYearlyStudyAbroad;

            // 住宅購入
            let currentYearlyDownPayment = 0;
            if (buyHomeAge > 0 && age === Number(buyHomeAge)) {
                currentYearlyDownPayment = Number(downPayment);
                yearlyExpense += currentYearlyDownPayment;
                remainingLoan = homePrice - downPayment;
            }

            // ローン返済の個別集計
            const currentLoanBreakdown = [];
            let currentYearlyHomeLoan = 0;
            if (remainingLoan > 0) {
                currentYearlyHomeLoan = annualLoanPayment;
                yearlyExpense += currentYearlyHomeLoan;
                currentLoanBreakdown.push({ name: '新規住宅ローン', amount: Math.round(currentYearlyHomeLoan) });
                remainingLoan -= (annualLoanPayment - (remainingLoan * (loanRate / 100)));
                if (remainingLoan < 0) remainingLoan = 0;
            }

            let currentYearlyExistingLoansTotal = 0;
            loans.forEach(loan => {
                const balance = Number(loan.balance || 0);
                const monthly = Number(loan.monthlyPayment || 0);
                if (balance > 0 && monthly > 0) {
                    const yearsToPay = Math.ceil(balance / (monthly * 12));
                    if (i < yearsToPay) {
                        const annualPay = monthly * 12;
                        currentYearlyExistingLoansTotal += annualPay;
                        currentLoanBreakdown.push({ name: loan.name || '既存ローン', amount: Math.round(annualPay) });
                    }
                }
            });
            yearlyExpense += currentYearlyExistingLoansTotal;

            // 収入の内訳
            let currentSalary = 0;
            let currentPension = 0;
            let currentRetirementBonus = 0;

            const monthlyIncomeFromData = incomes
                .filter(inc => inc.frequency === 'monthly')
                .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
            const actualAnnualIncome = monthlyIncomeFromData * 12;

            let currentAnnualNisaContrib = 0;
            let currentAnnualTaxableContrib = 0;
            let currentAnnualCashSavings = 0;

            if (isWorking) {
                yearlyIncome = actualAnnualIncome > 0 ? actualAnnualIncome : yearlyExpense + (Number(monthlyNisa) + Number(monthlyTaxable)) * 12;
                currentSalary = yearlyIncome;

                const targetNisaSaving = Number(monthlyNisa) * 12;
                const targetTaxableSaving = Number(monthlyTaxable) * 12; // 課税積立設定分
                const netCashFlow = yearlyIncome - yearlyExpense;

                // 1. NISA積立
                currentAnnualNisaContrib = targetNisaSaving;
                currentNisaVal += targetNisaSaving;
                nisaFromContrib += targetNisaSaving;

                // 2. 課税投資積立
                currentAnnualTaxableContrib = targetTaxableSaving;
                currentTaxableVal += targetTaxableSaving;
                taxableFromContrib += targetTaxableSaving;

                // 3. 家計の余剰分を「現預金」へ
                const surplus = netCashFlow - targetNisaSaving - targetTaxableSaving;
                currentAnnualCashSavings = surplus;
                currentCashVal += surplus;
                if (surplus > 0) cashFromSurplus += surplus;

            } else {
                currentPension = Number(pensionAmount) * 12;
                yearlyIncome = currentPension;
                const annualDeficit = yearlyExpense - yearlyIncome;
                if (annualDeficit > 0) {
                    // 取り崩し順序: 1. 現預金 -> 2. 課税資産 -> 3. NISA
                    let remainingDeficit = annualDeficit;

                    if (currentCashVal >= remainingDeficit) {
                        currentCashVal -= remainingDeficit;
                        remainingDeficit = 0;
                    } else {
                        remainingDeficit -= currentCashVal;
                        currentCashVal = 0;

                        if (currentTaxableVal >= remainingDeficit) {
                            currentTaxableVal -= remainingDeficit;
                            remainingDeficit = 0;
                        } else {
                            remainingDeficit -= currentTaxableVal;
                            currentTaxableVal = 0;
                            currentNisaVal -= remainingDeficit;
                        }
                    }
                }
            }

            if (age === retirementAge) {
                currentRetirementBonus = Number(retirementBonus);
                currentAnnualCashSavings += currentRetirementBonus; // 退職金は現預金へ
                currentCashVal += currentRetirementBonus;
                cashFromSurplus += currentRetirementBonus;
                yearlyIncome += currentRetirementBonus;
            }

            if (currentNisaVal < 0) currentNisaVal = 0;
            if (currentTaxableVal < 0) currentTaxableVal = 0;
            if (currentCashVal < 0) currentCashVal = 0;

            chartData.push({
                age,
                nisa: Math.round(currentNisaVal),
                taxable: Math.round(currentTaxableVal),
                cash: Math.round(currentCashVal),
                total: Math.round(currentNisaVal + currentTaxableVal + currentCashVal),
                income: Math.round(yearlyIncome),
                expense: Math.round(yearlyExpense),
                details: {
                    incomeBreakdown: {
                        salary: Math.round(currentSalary),
                        pension: Math.round(currentPension),
                        retirementBonus: Math.round(currentRetirementBonus)
                    },
                    expenseBreakdown: {
                        livingCost: Math.round(livingCost),
                        education: Math.round(currentYearlyEdCost),
                        housingLoan: Math.round(currentYearlyHomeLoan + currentYearlyExistingLoansTotal),
                        eventCost: Math.round(currentYearlyDownPayment + currentYearlyStudyAbroad)
                    },
                    loanBreakdown: currentLoanBreakdown,
                    nisaBreakdown: {
                        fromInitial: Math.round(nisaFromInitial),
                        fromContrib: Math.round(nisaFromContrib),
                        annualContribution: Math.round(currentAnnualNisaContrib)
                    },
                    taxableBreakdown: {
                        fromInitial: Math.round(taxableFromInitial),
                        fromContrib: Math.round(taxableFromContrib),
                        annualContribution: Math.round(currentAnnualTaxableContrib)
                    },
                    cashBreakdown: {
                        fromInitial: Math.round(cashFromInitial),
                        fromSurplus: Math.round(cashFromSurplus),
                        annualSavings: Math.round(currentAnnualCashSavings)
                    }
                }
            });
        }

        const finalData = chartData[chartData.length - 1];
        return { chartData, finalAsset: finalData ? finalData.total : 0 };

    }, [settings, loans, incomes]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-sm py-4 px-6 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-blue-600">Life Plan Simulation</h1>
                    <p className="text-[10px] text-gray-400">詳細リファクタリング版 (Integrated State Management)</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncFromCashFlow}
                        disabled={syncing}
                        className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-100 font-bold hover:bg-indigo-100 transition-colors"
                    >
                        {syncing ? '同期中...' : 'データ再同期'}
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700 shadow-sm"
                    >
                        設定を保存
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pb-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* 左カラム: 入力エリア */}
                    <div className="w-full lg:w-[35%] flex flex-col gap-6">
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                資産設定
                            </h2>
                            {/* 積立マネージャーの値を使っているため、InvestmentはReadOnlyに設定 */}
                            <AssetSettings settings={settings} setSettings={setSettings} readOnlyInvestment={true} />
                            <p className="text-[10px] text-gray-400 mt-2 text-right">※積立額は<a href="/investments" className="text-blue-500 underline">積立マネージャー</a>の設定が自動適用されます</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                                退職・老後設定
                            </h2>
                            <RetirementSettings settings={settings} setSettings={setSettings} />
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
                                家族構成
                            </h2>
                            <FamilyPlan settings={settings} setSettings={setSettings} />
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                                住宅プラン
                            </h2>
                            <HousingPlan settings={settings} setSettings={setSettings} />
                        </div>
                    </div>

                    {/* 右カラム: 結果エリア */}
                    <div className="w-full lg:flex-1">
                        <div className="sticky top-6 flex flex-col gap-6">
                            <SummaryCards totalAsset={simulationData.finalAsset} retirementAge={settings.retirementAge} />
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-[600px]">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                                    将来資産推移シミュレーション
                                </h2>
                                <div className="w-full h-full pb-12">
                                    <AssetChart
                                        data={simulationData.chartData}
                                        onPointClick={(data) => setSelectedYearData(data)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {selectedYearData && (
                <YearlyDetailModal
                    data={selectedYearData}
                    onClose={() => setSelectedYearData(null)}
                />
            )}
        </div>
    );
};

export default LifePlanPage;