// src/services/stockService.js

const API_KEY = "8WYCTQ87ATW50ZR4";

/**
 * 銘柄コードから現在の株価を取得する
 * @param {string} code - 銘柄コード (例: "7203", "AAPL")
 * @returns {Promise<number|null>} - 現在値 (取得失敗時はnull)
 */
export const fetchStockPrice = async (code) => {
    if (!code) return null;

    // 日本株(数字4桁)の場合は末尾に ".T" を付与
    const symbol = /^\d{4}$/.test(code) ? `${code}.T` : code;

    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        const quote = data["Global Quote"];
        if (quote && quote["05. price"]) {
            return Number(quote["05. price"]);
        } else {
            console.warn(`Price not found for ${code}`, data);
            return null;
        }
    } catch (error) {
        console.error("Stock fetch error:", error);
        return null;
    }
};
