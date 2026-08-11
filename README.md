# Todoリスト Webアプリ (JavaScript版)

## 概要

Python + FastAPI + Google Sheets で作った同要件のTodoアプリを、React + TypeScript + localStorage で再実装したもの。同じ要件を異なる技術スタックで実装することで、開発体験・パフォーマンス・型安全性の違いを比較検証することを目的としています。

## 公開URL

https://react-todo-list-web-lpgj.bolt.host

## 技術スタック

- React 18 + TypeScript (strict mode)
- Vite
- Tailwind CSS
- lucide-react (アイコン)
- date-fns (日付処理)
- localStorage (データ永続化)
- Bolt.new (開発環境)

## 機能

- Todo の追加・編集・削除
- タイトル・内容・期日・時刻・重要度(4段階)・カテゴリ・タグの設定
- 5つのビュー切り替え: 今日 / 期日順 / 重要度順 / 作成日順 / 完了
- 今日ビューではサマリー表示(件数・完了数・次の予定までの時間)
- 期限切れTodoの視覚的強調(赤枠)
- URL 自動リンク化、長文の折りたたみ表示
- カテゴリ別の色分けバッジ表示

## Python版との比較で学んだこと

- **反映速度**: Google Sheets API 経由の秒単位の遅延が、localStorage で 1ms 未満になり、体感が別物になった
- **型安全性**: TypeScript strict モードで Category を union 型で絞ることで、タイポによる不具合を実行前に検出できるようになった
- **デプロイ**: FastAPI (Render) は起動待ち時間があるが、React は静的ファイルなので即時公開できる

## 開発期間

2026年7月 - 8月
