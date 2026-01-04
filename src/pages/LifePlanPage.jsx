import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp, query } from 'firebase/firestore';
import AssetSettings from '../components/AssetSettings';
import RetirementSettings from '../components/RetirementSettings';
import FamilyPlan from '../components/FamilyPlan';
import HousingPlan from '../components/HousingPlan';
import SummaryCards from '../components/SummaryCards';
import AssetChart from '../components/AssetChart';
import YearlyDetailModal from '../components/YearlyDetailModal';
import AdvancedSimulationSettings from '../components/AdvancedSimulationSettings';
import { getAnnualEducationCost } from '../utils/educationCosts';
import { useExchangeRates } from '../hooks/useExchangeRates';

const LifePlanPage = () => {
    const { currentUser } = useAuth();
    const [selectedYearData, setSelectedYearData] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advancedSettings, setAdvancedSettings] = useState(null);
    const { rates } = useExchangeRates();
    const [settings, setSettings] = useState({
        currentAge: 35,
        targetAge: 85,
        initialNisa: 0,
        initialTaxable: 0,
        initialCash: 0,
        initialRealEstate: 0,
        initialMetals: 0,
        initialCrypto: 0,
        initialFx: 0,
        fxReturnRate: 3.0,
        minCashBuffer: 1000000,
        monthlyNisa: 0,
        monthlyIdeco: 0,
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
        loanDuration: 35,
        initialUsedNisaQuota: 0,
        nisaLifetimeLimit: 18000000,
        nisaOverflowToTaxable: true,
        sellHomeAge: 0,
        sellHomePrice: 30000000,
        repayLoanOnSale: true
    });

    const [syncing] = useState(false);
    const [loans, setLoans] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        const fetchPersistence = async () => {
            if (!currentUser || Object.keys(rates).length === 0) return;
            try {
                const settingsRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'simulationSettings');
                const settingsSnap = await getDoc(settingsRef);
                const savedSettings = settingsSnap.exists() ? settingsSnap.data() : {};

                const [loansSnap, incomesSnap, propsSnap, invSnap, pfSnap] = await Promise.all([
                    getDocs(collection(db, 'users', currentUser.uid, 'loans')),
                    getDocs(collection(db, 'users', currentUser.uid, 'incomes')),
                    getDocs(collection(db, 'users', currentUser.uid, 'properties')),
                    getDocs(collection(db, 'users', currentUser.uid, 'investments')),
                    getDocs(collection(db, 'users', currentUser.uid, 'portfolios'))
                ]);

                setLoans(loansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setIncomes(incomesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setProperties(propsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                let nisaTotal = 0, idecoTotal = 0, taxableTotal = 0;
                invSnap.forEach(d => {
                    const data = d.data();
                    if (data.type === 'spot') return;
                    const val = Number(data.monthlyAmount || 0) + (Number(data.bonusAmount || 0) * 2 / 12);
                    const aType = (data.accountType || '').toLowerCase();
                    const name = (data.name || '').toLowerCase();
                    if (aType.includes('nisa') || name.includes('nisa')) nisaTotal += val;
                    else if (aType.includes('ideco') || name.includes('確定拠出')) idecoTotal += val;
                    else taxableTotal += val;
                });

                let iNisa = 0, iIdeco = 0, iTaxable = 0, iCash = 0, iRealEstate = 0, iMetals = 0, iCrypto = 0, iFx = 0;
                let iUsedNisaQuota = 0;
                pfSnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.assets) d.assets.forEach(a => {
                        const rawAmount = Number(a.amount || 0);
                        const currency = a.currency || 'JPY';
                        const acquisition = Number(a.acquisitionCost || rawAmount);
                        let yenValue = currency !== 'JPY' && rates[currency] ? rawAmount * rates[currency] : rawAmount;
                        const lowerType = (a.type || '').toLowerCase();
                        const lowerAType = (a.accountType || '').toLowerCase();
                        const lowerName = (a.name || '').toLowerCase();

                        if (lowerAType.includes('ideco') || lowerName.includes('確定拠出')) iIdeco += yenValue;
                        else if (lowerAType.includes('nisa')) { iNisa += yenValue; iUsedNisaQuota += acquisition; }
                        else if (['預金', '現金', 'cash'].some(k => lowerType.includes(k))) iCash += yenValue;
                        else if (lowerType.includes('不動産')) iRealEstate += yenValue;
                        else if (lowerType.includes('貴金属')) iMetals += yenValue;
                        else if (lowerType.includes('暗号')) iCrypto += yenValue;
                        else if (currency !== 'JPY') iFx += yenValue;
                        else iTaxable += yenValue;
                    });
                });

                setSettings(prev => ({
                    ...prev,
                    ...savedSettings,
                    monthlyNisa: Math.round(nisaTotal),
                    monthlyIdeco: Math.round(idecoTotal),
                    monthlyTaxable: Math.round(taxableTotal),
                    initialNisa: Math.round(iNisa),
                    initialIdeco: Math.round(iIdeco),
                    initialUsedNisaQuota: Math.round(iUsedNisaQuota),
                    initialTaxable: Math.round(iTaxable),
                    initialCash: Math.round(iCash),
                    initialRealEstate: Math.round(iRealEstate),
                    initialMetals: Math.round(iMetals),
                    initialCrypto: Math.round(iCrypto),
                    initialFx: Math.round(iFx)
                }));

                const advRef = doc(db, 'users', currentUser.uid, 'lifePlan', 'advancedSettings');
                const advSnap = await getDoc(advRef);
                if (advSnap.exists()) setAdvancedSettings(advSnap.data());
            } catch (e) { console.error("Data Fetch Error:", e); }
        };
        fetchPersistence();
    }, [currentUser, rates]);

    const handleSaveSettings = async () => {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, 'users', currentUser.uid, 'lifePlan', 'simulationSettings'), { ...settings, updatedAt: serverTimestamp() });
            alert("設定を保存しました");
        } catch (e) { alert("保存失敗: " + e.message); }
    };

    const handleSyncFromCashFlow = () => window.location.reload();

    const simulationData = useMemo(() => {
        const {
            currentAge = 35, targetAge = 85,
            initialNisa = 0, initialIdeco = 0, initialTaxable = 0, initialCash = 0,
            initialRealEstate = 0, initialMetals = 0, initialCrypto = 0, initialFx = 0,
            monthlyNisa = 0, monthlyIdeco = 0, monthlyTaxable = 0,
            returnRate = 5, fxReturnRate = 3.0,
            retirementAge = 65, retirementBonus = 0,
            monthlySpendingPostRetire = 250000, pensionAmount = 150000, children = [],
            buyHomeAge = 0, homePrice = 40000000, downPayment = 5000000, loanRate = 1.0, loanDuration = 35,
            initialUsedNisaQuota = 0, nisaLifetimeLimit = 18000000
        } = settings;

        let curNisa = Number(initialNisa);
        let curIdeco = Number(initialIdeco);
        let curTaxable = Number(initialTaxable);
        let curCash = Number(initialCash);
        // 物件管理がある場合はそれを優先し、ない場合は初期資産設定の値をフォールバックとして使う
        let initialPropVal = properties.length > 0 ? properties.reduce((sum, p) => sum + Number(p.value || 0), 0) : Number(initialRealEstate);
        let curRE = initialPropVal;
        let curMetals = Number(initialMetals);
        let curCrypto = Number(initialCrypto);
        let curFx = Number(initialFx);
        let curUsedNisa = Number(initialUsedNisaQuota);

        const loanToProp = loans.reduce((acc, ln) => { if (ln.propertyId) acc[ln.propertyId] = (acc[ln.propertyId] || []).concat(ln.id); return acc; }, {});

        const loanStates = loans.map(l => ({
            id: l.id, name: l.name, currentBalance: Number(l.balance), monthlyPayment: Number(l.monthlyPayment),
            monthlyRate: (Number(l.interestRate) || 0) / 100 / 12, extraRepayments: l.extraRepayments || []
        }));

        let remainingHomeLoan = 0, annualHomeLoanPayment = 0;
        if (buyHomeAge > 0) {
            const principal = homePrice - downPayment;
            const r = (loanRate / 100) / 12, n = loanDuration * 12;
            if (r > 0 && n > 0) annualHomeLoanPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 12;
            else if (n > 0) annualHomeLoanPayment = principal / loanDuration;
        }

        const chartData = [];
        const years = Number(targetAge) - Number(currentAge);

        for (let i = 0; i <= years; i++) {
            const age = Number(currentAge) + i;
            const isRetired = age >= Number(retirementAge);
            let yearlyIncome = 0, yearlyExpense = 0, yearlyHomeLoan = 0;
            const currentLoanBreakdown = [];

            properties.forEach(prop => {
                if (prop.saleAge && age === Number(prop.saleAge)) {
                    const proceeds = Number(prop.salePrice || 0);
                    curCash += proceeds;
                    curRE -= Number(prop.value || 0);
                    if (prop.repayLinkedLoanOnSale) {
                        const linkedLoanIds = loanToProp[prop.id] || [];
                        loanStates.forEach(state => {
                            if (linkedLoanIds.includes(state.id) && state.currentBalance > 0) {
                                const repay = Math.min(curCash, state.currentBalance);
                                curCash -= repay; yearlyExpense += repay; state.currentBalance = 0;
                                currentLoanBreakdown.push({ name: `${state.name} (完済)`, amount: Math.round(repay) });
                            }
                        });
                    }
                }
            });

            if (buyHomeAge > 0 && age === Number(buyHomeAge)) { curCash -= Number(downPayment); curRE += Number(homePrice); remainingHomeLoan = Number(homePrice) - Number(downPayment); }
            if (remainingHomeLoan > 0) { let paid = 0; for (let m = 0; m < 12; m++) { if (remainingHomeLoan <= 0) break; let interest = remainingHomeLoan * (loanRate / 100 / 12); let p = Math.min(remainingHomeLoan + interest, annualHomeLoanPayment / 12); remainingHomeLoan = remainingHomeLoan + interest - p; paid += p; } yearlyExpense += paid; yearlyHomeLoan += paid; currentLoanBreakdown.push({ name: '住宅ローン(計算用)', amount: Math.round(paid) }); }

            loanStates.forEach(state => {
                if (state.currentBalance > 0) {
                    let yearPaid = 0;
                    const extras = state.extraRepayments.filter(r => Number(r.age) === age);
                    extras.forEach(r => {
                        const amount = r.isFullPayoff ? state.currentBalance : Number(r.amount);
                        const repay = Math.min(curCash, amount);
                        curCash -= repay; state.currentBalance -= repay; yearPaid += repay;
                        currentLoanBreakdown.push({ name: `${state.name} (繰上)`, amount: Math.round(repay) });
                    });
                    for (let m = 0; m < 12; m++) {
                        if (state.currentBalance <= 0) break;
                        const interest = state.currentBalance * state.monthlyRate;
                        const p = Math.min(state.currentBalance + interest, state.monthlyPayment);
                        state.currentBalance = state.currentBalance + interest - p;
                        yearPaid += p;
                    }
                    yearlyExpense += yearPaid; yearlyHomeLoan += yearPaid;
                    if (yearPaid > 0) currentLoanBreakdown.push({ name: state.name, amount: Math.round(yearPaid) });
                }
            });

            const soldPropertyIds = properties.filter(p => p.saleAge && age > Number(p.saleAge)).map(p => p.id);
            if (!isRetired) {
                const activeIncomes = incomes.filter(inc => !(inc.propertyId && soldPropertyIds.includes(inc.propertyId)));
                yearlyIncome = activeIncomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0) * 12;
            } else { yearlyIncome = Number(pensionAmount) * 12; }
            if (age === Number(retirementAge)) yearlyIncome += Number(retirementBonus);

            let currentYearlyEdCost = 0;
            children.forEach(c => { currentYearlyEdCost += getAnnualEducationCost(age, Number(c.birthYear), Number(currentAge), c.plan); });
            yearlyExpense += currentYearlyEdCost;

            const livingCost = isRetired ? Number(monthlySpendingPostRetire) * 12 : (yearlyIncome * 0.7);
            yearlyExpense += livingCost;

            const netCashflow = yearlyIncome - yearlyExpense;
            curCash += netCashflow;

            const nisaContrib = Math.min(curCash > 0 ? curCash : 0, Number(monthlyNisa) * 12);
            const nisaRoom = Math.max(0, nisaLifetimeLimit - curUsedNisa);
            const actualNisaContrib = Math.min(nisaContrib, nisaRoom);
            curCash -= actualNisaContrib; curNisa = (curNisa + actualNisaContrib) * (1 + Number(returnRate) / 100); curUsedNisa += actualNisaContrib;

            const taxableContrib = Number(monthlyTaxable) * 12 + (nisaContrib - actualNisaContrib > 0 ? nisaContrib - actualNisaContrib : 0);
            const actualTaxableContrib = Math.min(curCash > 0 ? curCash : 0, taxableContrib);
            curCash -= actualTaxableContrib; curTaxable = (curTaxable + actualTaxableContrib) * (1 + Number(returnRate) / 100);

            curIdeco = (curIdeco + Number(monthlyIdeco) * 12) * (1 + Number(returnRate) / 100);
            curMetals *= (1 + Number(returnRate) / 100);
            curCrypto *= (1 + Number(returnRate) / 100);
            curFx *= (1 + Number(fxReturnRate) / 100);

            chartData.push({
                age,
                total: Math.round(curNisa + curIdeco + curTaxable + curCash + curRE + curMetals + curCrypto + curFx),
                cash: Math.round(curCash),
                nisa: Math.round(curNisa),
                taxable: Math.round(curTaxable),
                ideco: Math.round(curIdeco),
                realEstate: Math.round(curRE),
                metals: Math.round(curMetals),
                crypto: Math.round(curCrypto),
                fx: Math.round(curFx),
                income: Math.round(yearlyIncome),
                expense: Math.round(yearlyExpense),
                details: { income: Math.round(yearlyIncome), expense: Math.round(yearlyExpense), loan: Math.round(yearlyHomeLoan), edCost: Math.round(currentYearlyEdCost) },
                loanBreakdown: currentLoanBreakdown
            });
        }
        return { chartData, finalAsset: chartData[chartData.length - 1]?.total || 0 };
    }, [settings, loans, incomes, properties]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <header className="bg-white shadow-sm py-4 px-6 mb-6 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Life Plan Simulation</h1>
                <div className="flex gap-2">
                    <button onClick={handleSyncFromCashFlow} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-100 font-bold hover:bg-indigo-100">データ再同期</button>
                    <button onClick={handleSaveSettings} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700">設定を保存</button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-[35%] flex flex-col gap-6">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-500">資産基本設定</h2>
                        <AssetSettings settings={settings} setSettings={setSettings} readOnlyInvestment={true} />
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-green-500">退職・老後設定</h2>
                        <RetirementSettings settings={settings} setSettings={setSettings} />
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-pink-500">家族構成</h2>
                        <FamilyPlan settings={settings} setSettings={setSettings} />
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-yellow-500">住宅・不動産プラン</h2>
                        <div className="mb-4 bg-blue-50 p-2 rounded text-[11px] text-blue-700 font-bold border border-blue-100 italic">
                            ※詳細な物件・テナント管理は「不動産管理」メニューから設定可能です。
                        </div>
                        <HousingPlan settings={settings} setSettings={setSettings} incomes={incomes} />
                    </div>
                </div>
                <div className="w-full lg:flex-1 sticky top-6">
                    <SummaryCards totalAsset={simulationData.finalAsset} retirementAge={settings.retirementAge} />
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-[600px] mt-6">
                        <h2 className="text-lg font-semibold mb-4">将来資産推移シミュレーション</h2>
                        <div className="w-full h-full pb-12">
                            <AssetChart data={simulationData.chartData} onPointClick={(data) => setSelectedYearData(data)} />
                        </div>
                    </div>
                </div>
            </main>
            {selectedYearData && <YearlyDetailModal data={selectedYearData} onClose={() => setSelectedYearData(null)} />}
        </div>
    );
};

export default LifePlanPage;