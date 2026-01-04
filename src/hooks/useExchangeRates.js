import { useState, useEffect } from 'react';

const FALLBACK_RATES = { USD: 150, MYR: 34, EUR: 160, AUD: 100, GBP: 190, NZD: 90, CAD: 110, CHF: 170 };

/**
 * 為替レートを取得するカスタムフック
 * @returns {{ rates: Object, loading: boolean, error: string|null }}
 */
export const useExchangeRates = () => {
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
                const data = await res.json();
                // APIは 1JPY に対する各通貨のレートを返すため、逆数をとって円換算レートを算出
                const jpyRates = {};
                Object.keys(data.rates).forEach(key => {
                    jpyRates[key] = 1 / data.rates[key];
                });
                setRates(jpyRates);
                setError(null);
            } catch (e) {
                console.error("為替レート取得失敗:", e);
                setRates(FALLBACK_RATES);
                setError("為替レート取得に失敗しました。フォールバック値を使用します。");
            } finally {
                setLoading(false);
            }
        };
        fetchRates();
    }, []);

    return { rates, loading, error };
};

/**
 * 外貨金額を円換算する関数
 * @param {number} foreignAmount - 外貨金額
 * @param {string} currency - 通貨コード (USD, EUR等)
 * @param {Object} rates - 為替レートオブジェクト
 * @returns {number} - 円換算金額
 */
export const convertToJPY = (foreignAmount, currency, rates) => {
    if (!foreignAmount || !currency) return 0;
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    return Math.round(Number(foreignAmount) * rate);
};

/**
 * サポートされている通貨リスト
 */
export const SUPPORTED_CURRENCIES = ['USD', 'MYR', 'EUR', 'AUD', 'GBP', 'NZD', 'CAD', 'CHF'];

export default useExchangeRates;
