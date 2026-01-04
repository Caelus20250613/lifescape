// 通貨型
export type Currency = 'JPY' | 'USD' | 'MYR' | 'GBP' | 'AUD';

// 教育フェーズ（マレーシア留学対応：ステップ変動型）
export interface EducationPhase {
    id: string;
    name: string;      // 例: "マレーシア・ボーディング", "英国大学"
    startAge: number;  // 子供の年齢
    endAge: number;
    annualCost: number; // 現地通貨建ての金額
    currency: Currency;
    inflationRate: number; // 学費特有のインフレ率 (例: 3-5%)
}

// 教育プラン（子供1人につき1プラン）
export interface AdvancedEducationPlan {
    childId: string; // 既存の children データの ID と紐付け
    childName: string; // 表示用
    phases: EducationPhase[];
}

// キャリア・インカム（期間ごとの積み上げ式）
export interface IncomeStream {
    id: string;
    name: string;       // 例: "理事長報酬", "個人クリニック事業所得", "顧問料"
    type: 'Salary' | 'Business' | 'Pension' | 'AdvisorReward';
    startAge: number;   // 自身の年齢
    endAge: number;
    annualAmount: number;
    taxCategory: 'Kyuyo' | 'Jigyo' | 'Zatsu'; // 税金計算用区分
}

// Exitイベント（医療法人出口戦略）
export interface ExitEvent {
    targetAge: number;
    type: 'RetirementBonus' | 'AssetTransfer'; // 退職金 or 資産譲渡
    grossAmount: number; // 額面
    serviceYears: number; // 退職所得控除計算用
}

// マクロ経済前提
export interface EconomicAssumptions {
    inflationRate: number;      // 日本の一般物価上昇率
    exchangeRates: {            // シミュレーション用固定レート
        MYR: number; // 例: 35
        USD: number; // 例: 150
        GBP: number;
        AUD: number;
    };
}

// 全体設定オブジェクト（Firestore保存対象）
export interface AdvancedSimulationConfig {
    isEnabled: boolean; // 詳細モードを有効にするか
    economics: EconomicAssumptions;
    incomes: IncomeStream[]; // 既存の年収設定を上書き・詳細化
    exitStrategy: ExitEvent | null;
    educationPlans: AdvancedEducationPlan[];
}
