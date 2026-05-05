import React, { useState, useMemo } from 'react';
import {
    Search, Book, LayoutDashboard, Briefcase, Home, Wallet,
    TrendingUp, Bot, BookOpen, HelpCircle, ChevronDown, ChevronRight,
    Info, AlertTriangle, CheckCircle2, Lightbulb
} from 'lucide-react';

const HelpPage = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    // Search functionality
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return HELP_SECTIONS;

        const lowerQuery = searchQuery.toLowerCase();
        return HELP_SECTIONS.filter(section => {
            const matchesTitle = section.title.toLowerCase().includes(lowerQuery);
            const matchesKeywords = section.keywords && section.keywords.toLowerCase().includes(lowerQuery);
            return matchesTitle || matchesKeywords;
        });
    }, [searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (activeSection !== 'search_results' && e.target.value) {
            // Optional: could auto-switch to a search view, but filtering sidebar is cleaner
        }
    };

    const ActiveComponent = useMemo(() => {
        const section = HELP_SECTIONS.find(s => s.id === activeSection);
        return section ? section.component : OverviewSection;
    }, [activeSection]);

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        ヘルプセンター
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        FinanceManagerの使い方や、よくある質問をまとめています。<br />
                        お探しの情報が見つからない場合は、検索機能をご利用ください。
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mt-8 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="help-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="キーワードで検索 (例: NISA, ローン, 資産登録)..."
                            className="block w-full pl-11 pr-4 py-4 rounded-2xl border-0 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 shadow-xl sm:text-base leading-6 transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sticky top-6 overflow-hidden">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-4 py-2">
                                メニュー
                            </h2>
                            {filteredSections.length > 0 ? (
                                <ul className="space-y-1">
                                    {filteredSections.map(section => (
                                        <li key={section.id}>
                                            <button
                                                id={`help-nav-${section.id}`}
                                                onClick={() => setActiveSection(section.id)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all group flex items-center gap-3 ${activeSection === section.id
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <span className={`${activeSection === section.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                    {section.icon}
                                                </span>
                                                {section.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    <p>一致する項目がありません</p>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ActiveComponent />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

// ========== UI Components ==========

const SectionTitle = ({ icon, children }) => (
    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {children}
        </h2>
    </div>
);

const SubSection = ({ title, children }) => (
    <div className="mb-10 last:mb-0">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            {title}
        </h3>
        <div className="text-gray-600 leading-relaxed text-base space-y-4 pl-1">
            {children}
        </div>
    </div>
);

const InfoBox = ({ type = 'info', children }) => {
    const config = {
        info: { style: 'bg-blue-50 border-blue-100 text-blue-800', icon: Info },
        warning: { style: 'bg-amber-50 border-amber-100 text-amber-800', icon: AlertTriangle },
        success: { style: 'bg-emerald-50 border-emerald-100 text-emerald-800', icon: CheckCircle2 },
        tip: { style: 'bg-purple-50 border-purple-100 text-purple-800', icon: Lightbulb },
    };
    const { style, icon: Icon } = config[type];

    return (
        <div className={`p-5 rounded-2xl border ${style} my-6 flex gap-3 text-sm leading-relaxed`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{children}</div>
        </div>
    );
};

// ========== Section Components ==========

const OverviewSection = () => (
    <div>
        <SectionTitle icon={<Book />}>概要・はじめに</SectionTitle>

        <SubSection title="FinanceManagerとは">
            <p>
                FinanceManagerは、あなたの資産、ローン、収支を一元管理し、将来のライフプランをシミュレーションできる
                総合的な家計管理アプリケーションです。
            </p>
            <p>
                「資産の見える化」「将来の不安の解消」「日々の家計管理の効率化」をサポートします。
                写真やスクリーンショットをアップロードするだけで、AI が自動的にデータを読み取り・分類し、
                面倒な手入力の手間を大幅に削減します。
            </p>
        </SubSection>

        <SubSection title="主な機能">
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {[
                    { title: '資産管理', desc: '株式、投資信託、不動産を一括管理', icon: Briefcase },
                    { title: 'ローン管理', desc: '完済時期や利息を自動計算', icon: Home },
                    { title: '収支管理', desc: '収入・支出を記録し家計を把握', icon: Wallet },
                    { title: 'ライフプラン', desc: '老後までの資産推移を予測', icon: TrendingUp },
                    { title: 'AIアドバイザー', desc: '資産状況に基づいた的確な助言', icon: Bot },
                ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 font-bold text-gray-900">
                            <item.icon size={18} className="text-blue-500" />
                            {item.title}
                        </div>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                ))}
            </div>
        </SubSection>

        <SubSection title="データの保存とセキュリティ">
            <InfoBox type="info">
                すべてのデータはGoogleのクラウドプラットフォーム（Firebase）に安全に保存されます。
                暗号化された通信を使用しており、第三者がデータを閲覧することはできません。
                ログインすれば、PC、スマホ、タブレットなど、どのデバイスからでもデータにアクセス可能です。
            </InfoBox>
            <InfoBox type="warning">
                ブラウザのシークレットモードを利用する場合、ブラウザを閉じるとログイン状態が解除されます。
                再度ログインすればデータは復元されますのでご安心ください。
            </InfoBox>
        </SubSection>

        <SubSection title="推奨環境">
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
                <li>Google Chrome（最新版）</li>
                <li>Safari（最新版）</li>
                <li>Firefox（最新版）</li>
                <li>Edge（最新版）</li>
            </ul>
            <p className="mt-2 text-sm text-gray-500">※スマートフォンのブラウザでもご利用いただけます。</p>
        </SubSection>
    </div>
);

const DashboardSection = () => (
    <div>
        <SectionTitle icon={<LayoutDashboard />}>ダッシュボード</SectionTitle>

        <SubSection title="ダッシュボードの役割">
            <p>
                ダッシュボードは、あなたの財務状況の「今」を一目で把握できる司令塔です。
                ログイン直後に表示され、資産総額や注目の指標をチェックできます。
            </p>
        </SubSection>

        <SubSection title="表示項目">
            <ul className="space-y-4">
                <li className="flex gap-4 items-start">
                    <span className="font-bold text-gray-900 min-w-[5rem]">総資産</span>
                    <span className="text-gray-600">登録された全ての資産（預金、株式、不動産など）の合計額です。</span>
                </li>
                <li className="flex gap-4 items-start">
                    <span className="font-bold text-gray-900 min-w-[5rem]">純資産</span>
                    <span className="text-gray-600">総資産から負債（ローン残高）を差し引いた金額です。これが「本当の自分の資産」と言えます。</span>
                </li>
                <li className="flex gap-4 items-start">
                    <span className="font-bold text-gray-900 min-w-[5rem]">月間収支</span>
                    <span className="text-gray-600">今月の収入と支出の状況を表示します。</span>
                </li>
                <li className="flex gap-4 items-start">
                    <span className="font-bold text-gray-900 min-w-[5rem]">資産グラフ</span>
                    <span className="text-gray-600">ポートフォリオの内訳（現金比率、投資比率など）を円グラフで視覚化します。</span>
                </li>
            </ul>
        </SubSection>

        <InfoBox type="tip">
            ダッシュボードの数値がおかしいと感じたら、各管理ページ（資産、ローン、収支）のデータを確認してみてください。
            ダッシュボードはそれらの集計結果を表示しています。
        </InfoBox>
    </div>
);

const PortfolioSection = () => (
    <div>
        <SectionTitle icon={<Briefcase />}>資産管理</SectionTitle>

        <SubSection title="機能概要">
            <p>
                あなたの保有する全ての資産を一元管理します。
                銀行預金、証券口座の株式、投資信託、iDeCo、不動産、暗号資産など、あらゆる資産を登録可能です。
            </p>
        </SubSection>

        <SubSection title="便利な登録機能">
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Bot size={18} className="text-purple-600" />
                        AI自動読み取り（推奨）
                    </h4>
                    <p className="text-sm text-gray-600">
                        証券会社のポートフォリオ画面のスクリーンショットをアップロードするだけで、
                        銘柄名、数量、評価額などをAIが自動で読み取ります。手入力の手間が省け、入力ミスも防げます。
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-2">手動入力</h4>
                    <p className="text-sm text-gray-600">
                        AI読み取りに対応していない資産や、現金などは手動で詳細に入力できます。
                    </p>
                </div>
            </div>
        </SubSection>

        <SubSection title="口座種別の重要性">
            <p className="mb-4">
                資産登録時に「口座種別」を正しく設定することで、ライフプランシミュレーションの精度が向上します。
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold">口座種別</th>
                            <th className="px-4 py-3 text-left font-bold">税金</th>
                            <th className="px-4 py-3 text-left font-bold">特徴</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        <tr>
                            <td className="px-4 py-3 font-medium">特定口座 / 一般</td>
                            <td className="px-4 py-3 text-red-600 font-bold">約20%</td>
                            <td className="px-4 py-3 text-gray-600">利益に対して課税されます。</td>
                        </tr>
                        <tr className="bg-indigo-50/50">
                            <td className="px-4 py-3 font-medium text-indigo-900">新NISA / 旧NISA</td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">0%</td>
                            <td className="px-4 py-3 text-gray-600">運用益が非課税。優先的に利用すべき口座です。</td>
                        </tr>
                        <tr className="bg-indigo-50/50">
                            <td className="px-4 py-3 font-medium text-indigo-900">iDeCo</td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">0%</td>
                            <td className="px-4 py-3 text-gray-600">老後資金専用。60歳まで引き出せませんが節税効果が高いです。</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </SubSection>
    </div>
);

const LoansSection = () => (
    <div>
        <SectionTitle icon={<Home />}>ローン管理</SectionTitle>

        <SubSection title="負債を正しく把握する">
            <p>
                住宅ローン、自動車ローン、教育ローン、奨学金などを登録します。
                負債を直視することは不安かもしれませんが、健全な家計管理の第一歩です。
            </p>
        </SubSection>

        <SubSection title="登録できる項目">
            <ul className="list-disc list-inside space-y-2 ml-2 text-gray-600">
                <li><strong>借入人</strong> - 家族の誰の借入か</li>
                <li><strong>借入残高</strong> - 返済すべき残りの金額</li>
                <li><strong>金利（年利）</strong> - 支払う利息の割合。重要です。</li>
                <li><strong>毎月の返済額</strong> - ボーナス払いなども考慮して平均化するか、別途管理します。</li>
            </ul>
        </SubSection>

        <SubSection title="自動計算機能">
            <p>
                残高、金利、返済額を入力すると、<strong>「あと何年で完済できるか」</strong>を自動計算します。
                繰上げ返済の計画を立てるのに役立ちます。
            </p>
            <InfoBox type="warning">
                金利が高く、毎月の返済額が少ないと、利息ばかり支払って元本が減らない状態（返済不能判定）になることがあります。
                この警告が出た場合は、返済計画の見直しをお勧めします。
            </InfoBox>
        </SubSection>
    </div>
);

const CashFlowSection = () => (
    <div>
        <SectionTitle icon={<Wallet />}>収支管理</SectionTitle>

        <SubSection title="お金の流れを記録する">
            <p>
                毎月の収入と支出を記録・管理します。
                家計簿のように細かくつけることも、ざっくりとカテゴリごとに管理することも可能です。
            </p>
        </SubSection>

        <SubSection title="収入の登録">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="block font-bold mb-1">定期収入</span>
                    <span className="text-sm text-gray-600">給与、年金など毎月決まって入るお金</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="block font-bold mb-1">一時所得</span>
                    <span className="text-sm text-gray-600">賞与（ボーナス）、配当金、副業収入など</span>
                </div>
            </div>
        </SubSection>

        <SubSection title="支出カテゴリ">
            <p className="mb-4">以下のようなカテゴリで管理できます。</p>
            <div className="flex flex-wrap gap-2">
                {['住居費', '食費', '水道光熱費', '通信費', '保険料', '教育費', '医療費', '娯楽費', '交通費', '一般財形', '投資信託積立'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
                        {tag}
                    </span>
                ))}
            </div>
        </SubSection>

        <InfoBox type="tip">
            「投資・貯蓄」カテゴリの支出（例：つみたてNISAの毎月購入額）は、
            ライフプランページの「収支データから同期」機能を使うことで、自動的に将来シミュレーションの積立額として反映できます。
        </InfoBox>
    </div>
);

const LifePlanSection = () => (
    <div>
        <SectionTitle icon={<TrendingUp />}>ライフプラン</SectionTitle>

        <SubSection title="未来をシミュレーション">
            <p>
                現在の資産、これからの収入・支出、そして運用のリターン（利回り）を仮定して、
                <strong>「将来、資産がどう推移するか」</strong>をグラフで可視化します。
                「老後2000万円問題」など、将来のお金の不安を具体的な数値で確認できます。
            </p>
        </SubSection>

        <SubSection title="シミュレーション設定">
            <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-bold text-gray-900">資産設定</h4>
                    <p className="text-sm text-gray-600">現在のNISA残高、課税口座残高、それぞれの毎月の積立額を設定します。</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-bold text-gray-900">リターン設定（利回り）</h4>
                    <p className="text-sm text-gray-600">
                        年率何%で運用できるかを設定します。
                        <br />(目安: 全世界株式 4~7%, 債券バランス 2~4% 程度)
                    </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-bold text-gray-900">退職・老後設定</h4>
                    <p className="text-sm text-gray-600">何歳まで働くか、退職金はいくらか、年金は月額いくら貰えるかを設定します。</p>
                </div>
            </div>
        </SubSection>

        <SubSection title="グラフの見方">
            <ul className="space-y-2 mt-2 bg-gray-50 p-4 rounded-xl">
                <li className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                    <span className="text-sm"><strong>非課税資産 (NISA/iDeCo)</strong>: 税金がかからず効率よく増える資産</span>
                </li>
                <li className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span className="text-sm"><strong>課税資産</strong>: 利益に税金がかかる資産</span>
                </li>
                <li className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-800 rounded"></div>
                    <span className="text-sm"><strong>資産合計</strong>: すべての合計。これが右肩上がりなら安心です。</span>
                </li>
            </ul>
        </SubSection>

        <InfoBox type="info">
            グラフの特定の年齢をクリックすると、その年齢時点での詳細な収支内訳や資産内訳が表示されます。
        </InfoBox>
    </div>
);

const AISection = () => (
    <div>
        <SectionTitle icon={<Bot />}>AIアドバイザー</SectionTitle>

        <SubSection title="あなた専用のファイナンシャルプランナー">
            <p>
                登録されたデータを元に、AIがあなたの家計状況を分析し、アドバイスを提供します。
                一般的な回答だけでなく、あなたの「資産額」や「家族構成」を踏まえた回答が可能です。
            </p>
        </SubSection>

        <SubSection title="活用例">
            <div className="grid gap-3">
                {[
                    "「今のペースで老後資金は足りますか？」",
                    "「住宅ローンの繰上げ返済とNISA増額、どっちがお得？」",
                    "「ポートフォリオのリスクが高すぎませんか？」",
                    "「子供の教育費、いつまでにいくら必要？」"
                ].map((q, i) => (
                    <div key={i} className="flex gap-3 items-center p-3 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-blue-300 transition-colors">
                        <HelpCircle size={16} className="text-blue-500" />
                        {q}
                    </div>
                ))}
            </div>
        </SubSection>

        <InfoBox type="warning">
            AIのアドバイスは参考情報です。最終的な投資判断はご自身の責任で行ってください。
            また、AIは未来を完全に予測できるわけではありません。
        </InfoBox>
    </div>
);

const GlossarySection = () => (
    <div>
        <SectionTitle icon={<BookOpen />}>用語集</SectionTitle>
        <div className="grid gap-4">
            <GlossaryItem term="アセットアロケーション" reading="あせっとあろけーしょん" description="資産配分のこと。リスクとリターンを決定づける最も重要な要素と言われます。" />
            <GlossaryItem term="NISA（ニーサ）" reading="にーさ" description="少額投資非課税制度。投資の利益にかかる約20%の税金がゼロになるお得な制度。" />
            <GlossaryItem term="iDeCo（イデコ）" reading="いでこ" description="個人型確定拠出年金。掛け金が全額所得控除になり税金が安くなるが、60歳まで引き出せない。" />
            <GlossaryItem term="キャピタルゲイン" reading="きゃぴたるげいん" description="資産の値上がり益のこと。安く買って高く売ることで得られる利益。" />
            <GlossaryItem term="インカムゲイン" reading="いんかむげいん" description="資産を持っているだけで得られる利益。配当金、分配金、家賃収入など。" />
            <GlossaryItem term="流動性" reading="りゅうどうせい" description="現金への換えやすさ。預金は流動性が高く、不動産は流動性が低い。" />
            <GlossaryItem term="ポートフォリオ" reading="ぽーとふぉりお" description="保有資産の内訳・組み合わせ。" />
            <GlossaryItem term="リバランス" reading="りばらんす" description="崩れた資産配分を元の比率に戻すこと。高くなった資産を売り、安くなった資産を買う作業。" />
            <GlossaryItem term="ドルコスト平均法" reading="どるこすとへいきんほう" description="定期的に一定金額ずつ購入し続ける投資手法。安い時には多く、高い時には少なく買うことで平均取得単価を下げられる。" />
        </div>
    </div>
);

const GlossaryItem = ({ term, reading, description }) => (
    <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-white">
        <div className="flex items-baseline gap-2 mb-2">
            <span className="font-bold text-lg text-gray-900">{term}</span>
            <span className="text-xs text-gray-400">（{reading}）</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
);

const FAQSection = () => (
    <div>
        <SectionTitle icon={<HelpCircle />}>よくある質問</SectionTitle>
        <div className="space-y-4">
            <FAQItem
                q="データは安全ですか？"
                a="はい。世界最高水準のセキュリティを持つGoogle Cloud Platform上で厳重に管理されています。"
            />
            <FAQItem
                q="無料で使えますか？"
                a="はい、現在の機能はすべて無料でご利用いただけます。"
            />
            <FAQItem
                q="スマートフォンで使えますか？"
                a="はい。PC、スマホ、タブレット、どの端末からでもブラウザでアクセス可能です。"
            />
            <FAQItem
                q="NISAとiDeCoはどう登録すればいい？"
                a="資産登録画面で「口座種別」を選択できます。そこでNISAやiDeCoを指定してください。"
            />
            <FAQItem
                q="退会したい（データを全消去したい）"
                a="ユーザー設定ページから退会処理を行うことで、サーバー上の全データが削除されます。復元はできません。"
            />
        </div>
    </div>
);

const FAQItem = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 text-left hover:bg-gray-50 transition-colors flex justify-between items-center group"
            >
                <div className="flex gap-3 items-center font-bold text-gray-900">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs shrink-0">Q</span>
                    {q}
                </div>
                {isOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />}
            </button>
            {isOpen && (
                <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed bg-gray-50/50 border-t border-gray-100">
                    <div className="mt-4 flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs shrink-0 font-bold">A</span>
                        <div>{a}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Data Configuration
const HELP_SECTIONS = [
    {
        id: 'overview',
        title: '概要・はじめに',
        icon: <Book size={20} />,
        component: OverviewSection,
        keywords: 'finance manager, introduction, はじめ方, 使い方, 概要, アプリについて'
    },
    {
        id: 'dashboard',
        title: 'ダッシュボード',
        icon: <LayoutDashboard size={20} />,
        component: DashboardSection,
        keywords: 'dashboard, home, ホーム, 資産推移, 純資産, サマリー'
    },
    {
        id: 'portfolio',
        title: '資産管理',
        icon: <Briefcase size={20} />,
        component: PortfolioSection,
        keywords: 'portfolio, asset, stock, 株式, 投資信託, 不動産, 資産登録, AI読み取り, NISA, iDeCo'
    },
    {
        id: 'loans',
        title: 'ローン管理',
        icon: <Home size={20} />,
        component: LoansSection,
        keywords: 'loan, debt, mortgage, 借金, 住宅ローン, 返済, 金利, 負債'
    },
    {
        id: 'cashflow',
        title: '収支管理',
        icon: <Wallet size={20} />,
        component: CashFlowSection,
        keywords: 'cashflow, income, expense, 家計簿, 収入, 支出, 給与, ボーナス'
    },
    {
        id: 'lifeplan',
        title: 'ライフプラン',
        icon: <TrendingUp size={20} />,
        component: LifePlanSection,
        keywords: 'lifeplan, simulation, future, retirement, 老後, シミュレーション, 将来設計, 年金'
    },
    {
        id: 'ai',
        title: 'AIアドバイザー',
        icon: <Bot size={20} />,
        component: AISection,
        keywords: 'ai, advisor, artificial intelligence, 相談, アドバイス, チャット'
    },
    {
        id: 'glossary',
        title: '用語集',
        icon: <BookOpen size={20} />,
        component: GlossarySection,
        keywords: 'glossary, terms, dictionary, 用語, 意味, 解説'
    },
    {
        id: 'faq',
        title: 'よくある質問',
        icon: <HelpCircle size={20} />,
        component: FAQSection,
        keywords: 'faq, question, help, 質問, エラー, トラブルシューティング'
    },
];

export default HelpPage;
