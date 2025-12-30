// scripts/test-gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// .envファイルからAPIキーを簡易的に読み込む関数
function getApiKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                return match[1].trim().replace(/["']/g, ''); // クォート除去
            }
        }
    } catch (e) {
        console.error("Error reading .env:", e);
    }
    return process.env.VITE_GEMINI_API_KEY || "";
}

const API_KEY = getApiKey() || "AIzaSyCIKctwwn0H263CSDjQWE5HWxDqGXeuQnY";

if (!API_KEY) {
    console.error("❌ API Key not found in .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 検証対象のモデルリスト
const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConnection() {
    console.log(`\n🚀 Starting Gemini API Connection Test...\nAPI Key: ${API_KEY.slice(0, 4)}...****\n`);

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing [ ${modelName.padEnd(25)} ] ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;

            if (response) {
                console.log("✅ OK! (Status: 200)");
            }
        } catch (error) {
            if (error.message.includes("404")) {
                console.log("❌ 404 Not Found (Invalid Model Name)");
            } else if (error.message.includes("429")) {
                console.log("⚠️ 429 Quota Exceeded (Limit Hit)");
            } else {
                const msg = error.message.split('[')[0].trim();
                console.log(`❌ Error: ${msg.substring(0, 30)}...`);
            }
        }
        await sleep(1000); // Wait 1 second between tests
    }
    console.log("\n🏁 Test Finished.\n");
}

testConnection();
