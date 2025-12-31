import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) console.error("Error: API Key is missing.");

const genAI = new GoogleGenerativeAI(API_KEY || "DUMMY_KEY");

// 優先順位: 1.5-flash -> 1.5-pro -> 2.0-flash -> pro
const MODEL_CANDIDATES = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-pro"
];

async function generateWithFallback(prompt, imagePart = null, systemInstruction = null) {
    let lastError = null;
    for (const modelName of MODEL_CANDIDATES) {
        try {
            const requestOptions = { model: modelName };
            if (systemInstruction) requestOptions.systemInstruction = systemInstruction;
            const model = genAI.getGenerativeModel(requestOptions);
            const inputs = imagePart ? [prompt, imagePart] : [prompt];
            const result = await model.generateContent(inputs);
            const response = await result.response;
            console.log(`Successfully used model: ${modelName}`);
            return response.text();
        } catch (error) {
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;
            continue;
        }
    }
    throw new Error(`AI解析失敗: 全てのエラーが発生しました。(詳細: ${lastError?.message})`);
}

export const geminiService = {
    async fileToGenerativePart(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: file.type } });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    async analyzeAssetImage(imageFile) {
        const imagePart = await this.fileToGenerativePart(imageFile);
        const prompt = `資産画面解析: JSONのみ出力。
        { 
          "brokerName": "証券会社名",
          "assets": [{ 
            "type": "日本株|米国株|投資信託|預金|不動産|貴金属|暗号資産|その他", 
            "accountType": "特定口座|新NISA (つみたて)|新NISA (成長枠)|旧NISA|iDeCo|一般口座",
            "name": "銘柄名", 
            "code": "銘柄コード", 
            "amount": 数値
          }] 
        }`;
        const text = await generateWithFallback(prompt, imagePart);
        return JSON.parse(text.replace(/```json|```/g, '').trim());
    },
    async analyzeReceiptImage(imageFile) {
        const imagePart = await this.fileToGenerativePart(imageFile);
        const prompt = `レシート解析: 日付(date:YYYY-MM-DD), 項目(name), 金額(amount:数値), 収支(type:'income'|'expense'), カテゴリ(category) を抽出。JSON配列のみ返す。`;
        const text = await generateWithFallback(prompt, imagePart);
        return JSON.parse(text.replace(/```json|```/g, '').trim());
    },
    async analyzeCsvText(csvText) {
        const prompt = `CSV解析: ヘッダー推測しJSON配列変換: [{ "date": "YYYY-MM-DD", "name": "...", "amount": 数値, "type": "income"|"expense", "category": "..." }] データ:\n${csvText}\nJSONのみ返す。`;
        const text = await generateWithFallback(prompt);
        return JSON.parse(text.replace(/```json|```/g, '').trim());
    },
    async chatWithFinancialAdvisor(history, userMessage, context) {
        const sysInst = context ? `あなたはFPです。データ:\n${context}` : "あなたはFPです。";
        try {
            const chat = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: sysInst }).startChat({ history: history || [] });
            return (await (await chat.sendMessage(userMessage)).response).text();
        } catch (e) {
            const chat = genAI.getGenerativeModel({ model: "gemini-pro" }).startChat({ history: [] });
            return (await (await chat.sendMessage(userMessage + `\n(背景: ${context})`)).response).text();
        }
    }
};