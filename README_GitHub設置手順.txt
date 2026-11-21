職ブレ-Business- GitHub Pages設置手順（Google認証API版）

【構成】
GitHub Pages（画面）→ GAS Webアプリ doPost（API・認証）→ Googleスプレッドシート／Drive
Firebase、Cloudflare Worker、メールパスワード認証は使用しません。

【GAS側】
1. 最新の「職ブレ-Business_GAS_Google認証_API版_Code.gs.txt」をCode.gsへ貼り付けます。
2. スクリプトプロパティに以下を設定します。
   BUSINESS_MASTER_SPREADSHEET_ID = 既存の職ブレ共有スプレッドシートID
   BUSINESS_PDF_FOLDER_ID = 既存の求人票保存フォルダID
   BUSINESS_ADMIN_EMAILS = 管理者Googleアカウントのメールアドレス（複数はカンマ区切り）
   BUSINESS_GOOGLE_CLIENT_ID = GitHub側config.jsと同じGoogle OAuthクライアントID
3. setupBusinessConnection() または resetBusinessConnection() を実行し、権限を承認します。
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」。実行ユーザーは自分、アクセスできるユーザーは全員に設定します。
5. デプロイURLが変わった場合、assets/js/config.js の API_BASE_URL も更新します。

【Google OAuth設定】
Google Cloud ConsoleのOAuthクライアントで、GitHub Pagesのドメインを「承認済みのJavaScript生成元」に追加してください。
例：https://＜GitHubユーザー名＞.github.io
GAS側の BUSINESS_GOOGLE_CLIENT_ID と config.js の GOOGLE_CLIENT_ID は完全一致させます。

【GitHub側】
このフォルダ内のファイルをGitHubリポジトリの公開ルートへアップロードします。
index.htmlがホーム、login.htmlがGoogleログイン、app.htmlが求人画面、admin.htmlが管理画面です。

【重要】
・この版はGoogle Identity ServicesのIDトークンをAPI呼び出しごとにGASへ送信し、GASでaudience・issuer・email_verified・有効期限を確認します。
・Business利用者シートに利用状態「有効」で登録されたGoogleアカウントだけ求人機能を利用できます。
・管理者はBUSINESS_ADMIN_EMAILSで判定します。管理者メールアドレスを必ず設定してください。
・IDトークンはブラウザのsessionStorageに保存し、タブを閉じると消えます。Google IDトークンの期限が切れた場合は再ログインしてください。
・ContentServiceのGASレスポンスはGoogle側のリダイレクト／ブラウザ制約の影響を受ける場合があります。公開後、必ずGitHub Pages上からログインと求人取得を実機確認してください。
・Googleログインが認証されてもBusiness利用者シートに未登録なら求人機能は使えません。
・既存データの削除・求人シートの複製は行いません。
