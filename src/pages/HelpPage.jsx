import React, { useState } from 'react';

const HelpPage = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const sections = [
        { id: 'overview', title: '概要・はじめに', icon: '📘' },
        { id: 'dashboard', title: 'ダッシュボード', icon: '📊' },
        { id: 'portfolio', title: '資産管理', icon: '💼' },
        { id: 'loans', title: 'ローン管理', icon: '🏠' },
        { id: 'cashflow', title: '収支管理', icon: '💰' },
        { id: 'lifeplan', title: 'ライフプラン', icon: '📈' },
        { id: 'ai', title: 'AIアドバイザー', icon: '🤖' },
        { id: 'glossary', title: '用語集', icon: '📖' },
        { id: 'faq', title: 'よくある質問', icon: '❓' },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return <OverviewSection />;
            case 'dashboard':
                return <DashboardSection />;
            case 'portfolio':
                return <PortfolioSection />;
            case 'loans':
                return <LoansSection />;
            case 'cashflow':
                return <CashFlowSection />;
            case 'lifeplan':
                return <LifePlanSection />;
            case 'ai':
                return <AISection />;
            case 'glossary':
                return <GlossarySection />;
            case 'faq':
                return <FAQSection />;
            default:
                return <OverviewSection />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-gray-900 mb-3">
                        📚 ヘルプセンター
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        FinanceManagerの使い方、各機能の詳細、用語の説明など、お困りの際はこちらをご覧ください。
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-6">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">
                                目次
                            </h2>
                            <ul className="space-y-1">
                                {sections.map(section => (
                                    <li key={section.id}>
                                        <button
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === section.id
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className="mr-2">{section.icon}</span>
                                            {section.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

// ========== Section Components ==========

const SectionTitle = ({ icon, children }) => (
    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        {children}
    </h2>
);

const SubSection = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3">
            {title}
        </h3>
        <div className="text-gray-600 leading-relaxed space-y-3">
            {children}
        </div>
    </div>
);

const InfoBox = ({ type = 'info', children }) => {
    const styles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        tip: 'bg-purple-50 border-purple-200 text-purple-800',
    };
    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        tip: '💡',
    };
    return (
        <div className={`p-4 rounded-xl border ${styles[type]} my-4`}>
            <span className="mr-2">{icons[type]}</span>
            {children}
        </div>
    );
};

// ========== Overview Section ==========
const OverviewSection = () => (
    <div>
        <SectionTitle icon="📘">概要・はじめに</SectionTitle>

        <SubSection title="FinanceManagerとは">
            <p>
                FinanceManagerは、あなたの資産、ローン、収支を一元管理し、将来のライフプランをシミュレーションできる
                総合的な家計管理アプリケーションです。
            </p>
            <p>
                写真やスクリーンショットをアップロードするだけで、AI が自動的にデータを読み取り・分類し、
                手入力の手間を大幅に削減します。
            </p>
        </SubSection>

        <SubSection title="主な機能">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>資産管理</strong> - 株式、投資信託、預金、不動産などを一括管理</li>
                <li><strong>ローン管理</strong> - 住宅ローンや各種借入を管理し、完済時期を自動計算</li>
                <li><strong>収支管理</strong> - 毎月の収入・支出を記録し、家計の健全性を把握</li>
                <li><strong>ライフプラン</strong> - 老後までの資産推移をシミュレーション</li>
                <li><strong>AIアドバイザー</strong> - 資産状況に基づいたアドバイスを提供</li>
            </ul>
        </SubSection>

        <SubSection title="データの保存について">
            <InfoBox type="info">
                すべてのデータはクラウド（Firebase）に安全に保存されます。
                ログインすれば、どのデバイスからでもデータにアクセスできます。
            </InfoBox>
            <InfoBox type="warning">
                ブラウザのキャッシュクリアやシークレットモードでは、ログインが必要です。
                データ自体はクラウドに保存されているため消失しません。
            </InfoBox>
        </SubSection>

        <SubSection title="推奨環境">
            <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Google Chrome（最新版）</li>
                <li>Safari（最新版）</li>
                <li>Firefox（最新版）</li>
                <li>画面サイズ: 1280px以上推奨（スマートフォンでも利用可能）</li>
            </ul>
        </SubSection>
    </div>
);

// ========== Dashboard Section ==========
const DashboardSection = () => (
    <div>
        <SectionTitle icon="📊">ダッシュボード</SectionTitle>

        <SubSection title="ダッシュボードの役割">
            <p>
                ダッシュボードは、あなたの財務状況を一目で把握できるホーム画面です。
                総資産、純資産、月間収支などの重要な指標がカード形式で表示されます。
            </p>
        </SubSection>

        <SubSection title="表示される指標">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>総資産</strong> - すべての資産の合計金額</li>
                <li><strong>純資産</strong> - 総資産からローン残高を差し引いた金額</li>
                <li><strong>月間収入</strong> - 登録された月間収入の合計</li>
                <li><strong>月間支出</strong> - 登録された月間支出の合計</li>
                <li><strong>資産グラフ</strong> - ポートフォリオの内訳を視覚化</li>
            </ul>
        </SubSection>

        <InfoBox type="tip">
            ダッシュボードのデータは、各管理ページ（資産管理、ローン管理、収支管理）で
            登録したデータが自動的に反映されます。
        </InfoBox>
    </div>
);

// ========== Portfolio Section ==========
const PortfolioSection = () => (
    <div>
        <SectionTitle icon="💼">資産管理</SectionTitle>

        <SubSection title="資産管理ページでできること">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li>株式、投資信託、預金、不動産などの資産を登録・管理</li>
                <li>証券会社のスクリーンショットをAIで自動読み取り</li>
                <li>口座種別（特定口座、NISA、iDeCoなど）の設定</li>
                <li>リアルタイム株価の取得（対応銘柄のみ）</li>
            </ul>
        </SubSection>

        <SubSection title="資産の登録方法">
            <p><strong>方法1: 画像アップロード（AI読み取り）</strong></p>
            <p className="ml-4 text-sm">
                証券会社のポートフォリオ画面のスクリーンショットをアップロードすると、
                AIが銘柄名、数量、金額を自動的に読み取ります。
            </p>

            <p className="mt-4"><strong>方法2: 手動入力</strong></p>
            <p className="ml-4 text-sm">
                資産の種類、名称、金額、口座種別を手動で入力します。
            </p>
        </SubSection>

        <SubSection title="口座種別について">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left font-bold">口座種別</th>
                            <th className="px-4 py-2 text-left font-bold">税金区分</th>
                            <th className="px-4 py-2 text-left font-bold">説明</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="px-4 py-2 font-medium">特定口座</td>
                            <td className="px-4 py-2"><span className="text-red-600 font-bold">課税</span></td>
                            <td className="px-4 py-2">一般的な証券口座。売却益・配当に約20%課税</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-2 font-medium">一般口座</td>
                            <td className="px-4 py-2"><span className="text-red-600 font-bold">課税</span></td>
                            <td className="px-4 py-2">確定申告が必要な口座。売却益・配当に課税</td>
                        </tr>
                        <tr className="bg-indigo-50">
                            <td className="px-4 py-2 font-medium">新NISA（つみたて）</td>
                            <td className="px-4 py-2"><span className="text-indigo-600 font-bold">非課税</span></td>
                            <td className="px-4 py-2">年間120万円まで。長期積立向け投資信託専用</td>
                        </tr>
                        <tr className="bg-indigo-50">
                            <td className="px-4 py-2 font-medium">新NISA（成長枠）</td>
                            <td className="px-4 py-2"><span className="text-indigo-600 font-bold">非課税</span></td>
                            <td className="px-4 py-2">年間240万円まで。株式・投資信託に投資可能</td>
                        </tr>
                        <tr className="bg-indigo-50">
                            <td className="px-4 py-2 font-medium">旧NISA</td>
                            <td className="px-4 py-2"><span className="text-indigo-600 font-bold">非課税</span></td>
                            <td className="px-4 py-2">2023年以前に購入した旧制度のNISA</td>
                        </tr>
                        <tr className="bg-indigo-50">
                            <td className="px-4 py-2 font-medium">iDeCo</td>
                            <td className="px-4 py-2"><span className="text-indigo-600 font-bold">非課税</span></td>
                            <td className="px-4 py-2">個人型確定拠出年金。60歳まで引き出し不可</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </SubSection>

        <InfoBox type="info">
            <strong>課税 vs 非課税の違い:</strong><br />
            課税口座では売却益や配当に約20%の税金がかかります。
            非課税口座（NISA・iDeCo）では税金がかからないため、長期的な資産形成に有利です。
        </InfoBox>
    </div>
);

// ========== Loans Section ==========
const LoansSection = () => (
    <div>
        <SectionTitle icon="🏠">ローン管理</SectionTitle>

        <SubSection title="ローン管理ページでできること">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li>住宅ローン、自動車ローン、事業ローンなどを登録・管理</li>
                <li>完済予定日の自動計算</li>
                <li>借入人（名義）ごとの管理</li>
                <li>ライフプランシミュレーションへの自動連携</li>
            </ul>
        </SubSection>

        <SubSection title="ローンの登録項目">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>借入人（名義）</strong> - 誰のローンか（自分、配偶者など）</li>
                <li><strong>ローン名称</strong> - ローンを識別するための名前</li>
                <li><strong>借入残高</strong> - 現在の残高（円）</li>
                <li><strong>毎月の返済額</strong> - 月々の返済金額（円）</li>
                <li><strong>金利</strong> - 年利（%）</li>
                <li><strong>登録日（基準日）</strong> - 残高の基準となる日付</li>
            </ul>
        </SubSection>

        <SubSection title="完済予定日の計算">
            <p>
                入力された残高、月々の返済額、金利から、完済予定日を自動計算します。
                金利が設定されている場合は、利息を考慮した正確な計算が行われます。
            </p>
            <InfoBox type="warning">
                金利が高すぎて返済額が利息分を下回る場合、「返済不能」と表示されます。
                この場合は返済額の増額を検討してください。
            </InfoBox>
        </SubSection>
    </div>
);

// ========== CashFlow Section ==========
const CashFlowSection = () => (
    <div>
        <SectionTitle icon="💰">収支管理</SectionTitle>

        <SubSection title="収支管理ページでできること">
            <ul className="list-disc list-inside space-y-2 ml-2">
                <li>月間・年間の収入・支出を登録</li>
                <li>給与明細や領収書のAI読み取り</li>
                <li>カテゴリ別の支出分析</li>
                <li>投資・貯蓄の自動識別</li>
            </ul>
        </SubSection>

        <SubSection title="収入の登録">
            <p>以下のような収入を登録できます：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>給与・賞与</li>
                <li>事業収入</li>
                <li>配当・利子</li>
                <li>年金</li>
                <li>その他の収入</li>
            </ul>
        </SubSection>

        <SubSection title="支出の登録">
            <p>以下のようなカテゴリで支出を管理できます：</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>住居費（家賃、住宅ローン返済）</li>
                <li>食費</li>
                <li>光熱費</li>
                <li>通信費</li>
                <li>交通費</li>
                <li>医療費</li>
                <li>教育費</li>
                <li>保険料</li>
                <li>投資・貯蓄</li>
                <li>その他</li>
            </ul>
        </SubSection>

        <InfoBox type="tip">
            「投資・貯蓄」カテゴリの支出は、ライフプランの「収支データから同期」機能で
            毎月の積立額として自動反映できます。
        </InfoBox>
    </div>
);

// ========== LifePlan Section ==========
const LifePlanSection = () => (
    <div>
        <SectionTitle icon="📈">ライフプラン</SectionTitle>

        <SubSection title="ライフプランシミュレーションとは">
            <p>
                現在の年齢から設定した年齢（例: 85歳）までの資産推移をシミュレーションします。
                収入、支出、ローン、教育費、退職金などを考慮した長期的な資産計画を立てられます。
            </p>
        </SubSection>

        <SubSection title="設定項目の説明">
            <p><strong>■ 資産設定</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                <li><strong>現在の年齢</strong> - シミュレーション開始時点の年齢</li>
                <li><strong>シミュレーション終了年齢</strong> - 何歳までシミュレーションするか</li>
                <li><strong>初期NISA残高</strong> - 現在の非課税口座の合計金額</li>
                <li><strong>初期課税残高</strong> - 現在の課税口座の合計金額</li>
                <li><strong>毎月のNISA積立額</strong> - 月々の非課税口座への積立額</li>
                <li><strong>毎月の課税口座積立額</strong> - 月々の課税口座への積立額</li>
                <li><strong>想定利回り</strong> - 年間の期待リターン（%）</li>
            </ul>

            <p className="mt-4"><strong>■ 退職・老後設定</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                <li><strong>退職年齢</strong> - 働くことをやめる年齢</li>
                <li><strong>退職金</strong> - 退職時に受け取る一時金</li>
                <li><strong>月間生活費</strong> - 退職後の月々の生活費</li>
                <li><strong>年金月額</strong> - 受け取る年金の月額</li>
            </ul>
        </SubSection>

        <SubSection title="グラフの見方">
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 bg-indigo-50 rounded-lg">
                    <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                    <span><strong>非課税残高</strong> - NISA・iDeCoなど、売却益に税金がかからない資産</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span><strong>課税残高</strong> - 特定口座など、売却益に税金がかかる資産</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 bg-gray-700 rounded"></div>
                    <span><strong>合計資産</strong> - 非課税 + 課税の総額</span>
                </div>
            </div>
        </SubSection>

        <SubSection title="年齢別詳細モーダル">
            <p>
                グラフ上の任意の年齢をクリックすると、その年の収支内訳と資産内訳を確認できます。
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
                <li><strong>年間収入</strong> - 給与・事業収入（働いている期間）、年金（退職後）</li>
                <li><strong>年間支出</strong> - 生活費、教育費、ローン返済など</li>
                <li><strong>年間収支（キャッシュフロー）</strong> - 収入 − 支出。黒字/赤字で表示</li>
                <li><strong>非課税残高の内訳</strong> - 初期残高からの成長分 / 積立累積からの成長分</li>
                <li><strong>課税残高の内訳</strong> - 初期残高からの成長分 / 積立・退職金からの成長分</li>
            </ul>
        </SubSection>

        <InfoBox type="info">
            <strong>運用益の計算について:</strong><br />
            非課税口座は設定した利回りがそのまま適用されます。
            課税口座は税金（約20%）を考慮し、利回りの80%が適用されます。
        </InfoBox>

        <InfoBox type="warning">
            シミュレーションはあくまで参考値です。実際の運用成果は市場状況により変動します。
        </InfoBox>
    </div>
);

// ========== AI Section ==========
const AISection = () => (
    <div>
        <SectionTitle icon="🤖">AIアドバイザー</SectionTitle>

        <SubSection title="AIアドバイザーとは">
            <p>
                あなたの資産状況、ローン、収支データをもとに、
                AIが個別化されたファイナンシャルアドバイスを提供します。
            </p>
        </SubSection>

        <SubSection title="使い方">
            <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>AIアドバイザーページを開く</li>
                <li>質問や相談内容をテキストで入力</li>
                <li>「送信」ボタンをクリック</li>
                <li>AIからの回答を確認</li>
            </ol>
        </SubSection>

        <SubSection title="質問の例">
            <ul className="list-disc list-inside space-y-1 ml-2">
                <li>「私の資産配分は適切ですか？」</li>
                <li>「老後資金は足りそうですか？」</li>
                <li>「ローンの繰上げ返済をすべきですか？」</li>
                <li>「NISAの活用方法を教えてください」</li>
                <li>「子供の教育費の準備はどうすればいいですか？」</li>
            </ul>
        </SubSection>

        <InfoBox type="warning">
            AIの回答は一般的な情報提供であり、投資助言ではありません。
            重要な財務判断は、必ず専門家（ファイナンシャルプランナー、税理士など）に相談してください。
        </InfoBox>
    </div>
);

// ========== Glossary Section ==========
const GlossarySection = () => (
    <div>
        <SectionTitle icon="📖">用語集</SectionTitle>

        <div className="space-y-4">
            <GlossaryItem
                term="課税口座"
                reading="かぜいこうざ"
                description="売却益や配当金に税金がかかる口座。特定口座、一般口座が該当。売却益の約20%が税金として差し引かれます。"
            />
            <GlossaryItem
                term="非課税口座"
                reading="ひかぜいこうざ"
                description="売却益や配当金に税金がかからない口座。NISA（つみたて・成長枠）、iDeCoが該当。税金がかからない分、長期的な資産形成に有利です。"
            />
            <GlossaryItem
                term="NISA（ニーサ）"
                reading="にーさ"
                description="少額投資非課税制度。年間投資枠内で購入した株式・投資信託の売却益・配当が非課税になります。2024年から新NISAがスタートし、つみたて投資枠（年120万円）と成長投資枠（年240万円）の合計360万円まで投資可能。"
            />
            <GlossaryItem
                term="iDeCo（イデコ）"
                reading="いでこ"
                description="個人型確定拠出年金。毎月の掛金が全額所得控除され、運用益も非課税。ただし、原則60歳まで引き出せません。"
            />
            <GlossaryItem
                term="特定口座"
                reading="とくていこうざ"
                description="証券会社が年間取引報告書を作成してくれる口座。「源泉徴収あり」を選ぶと、確定申告が不要になります。"
            />
            <GlossaryItem
                term="純資産"
                reading="じゅんしさん"
                description="総資産（持っているものすべての価値）から負債（ローンなど借りているお金）を差し引いた金額。実質的な自分の資産。"
            />
            <GlossaryItem
                term="キャッシュフロー"
                reading="きゃっしゅふろー"
                description="ある期間における収入から支出を差し引いた金額。プラスなら黒字（お金が増えている）、マイナスなら赤字（お金が減っている）。"
            />
            <GlossaryItem
                term="利回り"
                reading="りまわり"
                description="投資額に対する収益の割合。例えば、100万円投資して1年後に5万円の利益が出たら、利回りは5%です。"
            />
            <GlossaryItem
                term="複利"
                reading="ふくり"
                description="元本だけでなく、それまでの利息に対しても利息がつく計算方法。長期投資では複利効果により資産が大きく成長します。"
            />
            <GlossaryItem
                term="繰上げ返済"
                reading="くりあげへんさい"
                description="ローンの通常の返済に加えて、追加で元本を返済すること。総支払利息を減らし、完済を早められます。"
            />
            <GlossaryItem
                term="ポートフォリオ"
                reading="ぽーとふぉりお"
                description="保有する資産の組み合わせ・内訳のこと。株式、債券、預金などをどのような割合で持っているかを表します。"
            />
            <GlossaryItem
                term="アセットアロケーション"
                reading="あせっとあろけーしょん"
                description="資産配分のこと。リスクとリターンのバランスを考慮して、どの資産クラスにどれだけ投資するかを決めること。"
            />
        </div>
    </div>
);

const GlossaryItem = ({ term, reading, description }) => (
    <div className="border-b border-gray-100 pb-4">
        <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-gray-900">{term}</span>
            <span className="text-xs text-gray-400">（{reading}）</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);

// ========== FAQ Section ==========
const FAQSection = () => (
    <div>
        <SectionTitle icon="❓">よくある質問</SectionTitle>

        <div className="space-y-6">
            <FAQItem
                question="データは安全に保存されていますか？"
                answer="はい、すべてのデータはGoogle Firebaseのクラウドに暗号化されて保存されています。Googleアカウントでログインしている限り、データは安全に保護されます。"
            />
            <FAQItem
                question="別のデバイスからアクセスできますか？"
                answer="はい、同じGoogleアカウントでログインすれば、パソコン、スマートフォン、タブレットなど、どのデバイスからでも同じデータにアクセスできます。"
            />
            <FAQItem
                question="AI読み取り機能が正確に読み取れません"
                answer="画像の解像度が低い、文字がぼやけている、特殊なフォーマットの場合は読み取り精度が下がることがあります。可能であれば、より高解像度のスクリーンショットを使用するか、手動で修正してください。"
            />
            <FAQItem
                question="ライフプランのシミュレーションは信頼できますか？"
                answer="シミュレーションは入力された条件に基づく概算です。実際の運用成果は市場状況により変動します。あくまで計画の参考としてご利用ください。"
            />
            <FAQItem
                question="課税口座と非課税口座、どちらを優先すべきですか？"
                answer="一般的には、非課税口座（NISA）の年間投資枠を使い切ることを優先し、余裕があれば課税口座で追加投資することが推奨されます。ただし、個人の状況によりますので、詳しくは専門家にご相談ください。"
            />
            <FAQItem
                question="データを削除したい場合は？"
                answer="各管理ページで個別のデータを削除できます。アカウント全体のデータ削除をご希望の場合は、設定ページからお問い合わせください。"
            />
            <FAQItem
                question="アプリの利用料金はかかりますか？"
                answer="基本機能は無料でご利用いただけます。将来的にプレミアム機能を追加する可能性がありますが、現在の機能は引き続き無料で提供予定です。"
            />
        </div>
    </div>
);

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
            >
                <span className="font-medium text-gray-900">{question}</span>
                <span className={`text-xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {isOpen && (
                <div className="p-4 text-gray-600 text-sm leading-relaxed bg-white">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default HelpPage;
