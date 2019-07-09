## About

Zendesk API を使って Zendesk の問い合わせデータを Spreadsheet に出力する Google Apps Script です。
 
## Environment

- Google Apps Script (Installable triggers with Google Spreadsheet)

## Installation

1. https://docs.google.com/spreadsheets/d/1WeALWBWMPyluRfznTMZvt34Rrkr0ZTaOz3a1WzJNNNA/copy にアクセス
- `コピーを作成` を選択
- ツール > スクリプトエディタ ( Google Apps Script エディタが開きます )
- ファイル > プロジェクトのプロパティ
- スクリプトのプロパティ > 行を追加
    - API_TOKEN: Zendesk API トークン ( こちらから取得できます: https://[subdomain].zendesk.com/agent/admin/api/settings)
    - MAIL_ADDRESS: Zendesk ログイン email アドレス ( 管理者ユーザーである必要があります )
    - SUB_DOMAIN: Zendesk のサブドメイン
- 保存
- 関数を選択
    - fetchTickets という関数を選択
- 実行ボタンを選択
- 編集 > 現在のプロジェクトのトリガー
- トリガーを追加
    - 関数: fetchTickets
    - 時間主導型で日付ベースのタイマーを選択
- 保存
- 以上！

## 制限事項

利用時には以下の制限事項に考慮する必要があります

- Spreadsheet limitation: https://support.google.com/drive/answer/37603?hl=en
- Apps Script Quotas (Script runtime) : https://developers.google.com/apps-script/guides/services/quotas
- Zendesk API Rate limits: https://developer.zendesk.com/rest_api/docs/support/introduction#rate-limits
