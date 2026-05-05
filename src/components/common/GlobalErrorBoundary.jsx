import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">予期せぬエラーが発生しました</h2>
                <p className="text-sm text-gray-500 mb-6">
                    申し訳ありません、処理中に問題が発生しました。<br />
                    再読み込みをお試しください。
                </p>
                <div className="bg-red-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-32">
                    <pre className="text-[10px] text-red-600 font-mono">{error.message}</pre>
                </div>
                <button
                    onClick={resetErrorBoundary}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-100"
                >
                    再読み込みする
                </button>
            </div>
        </div>
    );
}

export default function GlobalErrorBoundary({ children }) {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
        >
            {children}
        </ErrorBoundary>
    );
}
