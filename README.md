# LifeScape (ライフスケープ) 🌿

現在の資産状況を可視化し、将来のライフプランと連結させる資産管理アプリケーションです。

## 🌐 デモサイト
[https://portfolio-migration-sim-12345.web.app](https://portfolio-migration-sim-12345.web.app)
## 📖 概要
「今の資産（ポートフォリオ）」と「将来の計画（ライフプラン）」が分断されている課題を解決するために開発しました。
現在の資産を入力すると、円グラフで可視化され、ワンクリックでライフプランシミュレーションの初期値として反映されます。

## 🛠 使用技術
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Backend/Infrastracture**: Firebase (Hosting, Firestore, Authentication)
- **AI**: Gemini API (画像解析機能・実装予定)

## ✨ 主な機能
1. **資産ポートフォリオ管理**: 現金・株・投資信託などの資産割合を円グラフで可視化
2. **ライフプラン連携**: 現在の資産額を将来シミュレーションへ自動同期
3. **認証機能**: Googleアカウントによるログイン・データ保存
4. **レスポンシブ対応**: スマートフォン・PCでの利用

## 🚀 今後の展望
- Firebase Storage連携による、証券口座スクショのAI自動読み取り機能の実装