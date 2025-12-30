import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ChatPage() {
    const { currentUser } = useAuth();
    // Initialize messages from localStorage
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chatHistory");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load chat history:", e);
            return [];
        }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [financialContext, setFinancialContext] = useState("");

    // Persist messages to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem("chatHistory", JSON.stringify(messages));
        } catch (e) {
            console.error("Failed to save chat history:", e);
        }
    }, [messages]);

    const handleClearHistory = () => {
        if (window.confirm("会話履歴を削除しますか？\nこの操作は取り消せません。")) {
            setMessages([]);
            localStorage.removeItem("chatHistory");
        }
    };

    // Fetch financial data to build context
    useEffect(() => {
        const fetchFinancialData = async () => {
            if (!currentUser) return;

            try {
                // 1. Fetch Assets
                const portfoliosRef = collection(db, 'users', currentUser.uid, 'portfolios');
                const portfolioSnap = await getDocs(portfoliosRef);

                let contextText = "【資産ポートフォリオ (Assets)】\n";
                let totalAssets = 0;

                portfolioSnap.forEach(doc => {
                    const data = doc.data();
                    // Handle both legacy and new data structures
                    let docTotal = 0;
                    if (data.assets && Array.isArray(data.assets)) {
                        docTotal = data.total_valuation || data.assets.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                        contextText += `- ${data.brokerName || "不明な口座"}: ¥${Math.round(docTotal).toLocaleString()}\n`;
                        data.assets.forEach(asset => {
                            contextText += `  ・${asset.name} (${asset.type}): ¥${Number(asset.amount).toLocaleString()}\n`;
                        });
                    } else if (data.amount) {
                        docTotal = Number(data.amount);
                        contextText += `- ${data.name} (${data.type}): ¥${Math.round(docTotal).toLocaleString()}\n`;
                    }
                    totalAssets += docTotal;
                });
                contextText += `>> 資産合計: ¥${Math.round(totalAssets).toLocaleString()}\n\n`;

                // 2. Fetch Loans
                const loansRef = collection(db, 'users', currentUser.uid, 'loans');
                const loanSnap = await getDocs(loansRef);

                contextText += "【負債・ローン (Liabilities)】\n";
                let totalLiabilities = 0;

                loanSnap.forEach(doc => {
                    const data = doc.data();
                    const balance = Number(data.balance) || 0;
                    contextText += `- ${data.name}: 残高 ¥${balance.toLocaleString()} (金利 ${data.interestRate}%, 月返済 ¥${Number(data.monthlyPayment).toLocaleString()})\n`;
                    totalLiabilities += balance;
                });
                contextText += `>> 負債合計: ¥${totalLiabilities.toLocaleString()}\n\n`;

                // 3. Net Worth
                const netWorth = totalAssets - totalLiabilities;
                contextText += `【純資産 (Net Worth)】: ¥${Math.round(netWorth).toLocaleString()}\n`;

                console.log("Generated Financial Context for AI:", contextText);
                setFinancialContext(contextText);

            } catch (error) {
                console.error("Error fetching financial data:", error);
            }
        };

        fetchFinancialData();
    }, [currentUser]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');

        // Add user message to UI
        const newHistory = [...messages, { role: 'user', text: userMsg }];
        setMessages(newHistory);
        setLoading(true);

        try {
            // Convert UI message history to Gemini history format (excluding the very last text which is 'userMsg')
            // Gemini expects: { role: 'user' | 'model', parts: [{ text: "..." }] }
            const geminiHistory = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            // Call API with history and context
            // Note: Updated geminiService.js signature is (history, userMessage, context)
            const response = await geminiService.chatWithFinancialAdvisor(geminiHistory, userMsg, financialContext);

            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'model', text: 'エラー: AIからの応答を取得できませんでした。時間をおいて再度お試しください。' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <svg className="w-8 h-8 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AIファイナンシャル・アドバイザー
                </h1>

                {messages.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        履歴クリア
                    </button>
                )}
            </div>

            <div className="bg-white shadow-xl rounded-lg flex-1 flex flex-col overflow-hidden border border-gray-200">
                {/* Chat Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">
                            <p className="mb-2">あなたの資産状況を把握したAIアドバイザーです。</p>
                            <p className="text-sm">「老後の資金は足りますか？」</p>
                            <p className="text-sm">「今のポートフォリオの改善点は？」</p>
                            <p className="mt-4 text-xs text-gray-400">※登録された資産・ローンデータが自動的にAIに共有されます。</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-gray-500 rounded-2xl px-5 py-3 shadow-sm border border-gray-100 rounded-bl-none flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSend} className="flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            placeholder="お金の悩みを相談してください..."
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                        >
                            送信
                        </button>
                    </form>
                    <p className="text-xs text-center text-gray-400 mt-2">
                        AIの回答は助言であり、投資の成果を保証するものではありません。
                    </p>
                </div>
            </div>
        </div>
    );
}
