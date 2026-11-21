職ブレ-Business-｜GitHub Pages フロントエンド一式

【フォルダ構成】
index.html                 ホーム画面（GitHub Pagesのトップ）
login.html                 ログイン画面
app.html                   職ブレ本体画面
admin.html                 管理者画面
assets/css/style.css       共通デザイン
assets/js/config.js        GAS API URL・接続設定
assets/js/common.js        共通処理
assets/js/api.js           GAS API通信層
assets/js/auth.js          ログイン画面処理
assets/js/app.js           求人画面処理
assets/js/admin.js         管理画面処理

【GitHubへの配置】
1. GitHubで職ブレ用リポジトリを開く
2. ZIPを解凍し、ファイル・assetsフォルダをリポジトリ直下へアップロード
3. リポジトリの Settings → Pages を開く
4. Deploy from a branch を選択
5. Branch を main、Folder を /(root) にして保存
6. 公開されたURLを開き、ホーム画面を確認する

【画面URL】
ホーム：/ 
ログイン：/login.html
職ブレ本体：/app.html
管理者：/admin.html

【GAS接続について：重要】
assets/js/config.js には、会話で共有されたGASウェブアプリURLを設定済みです。
ただし、現在のGAS Code.gsはHTML Serviceとgoogle.script.runを前提とした旧構成です。
GitHub Pagesから直接google.script.runは利用できません。

このフロントエンド一式は、将来のGAS API接続を想定した画面とAPI呼び出し口です。
config.js の API_READY は false にしてあります。GAS APIが完成する前に true に変更しないでください。
APIのaction名・認証トークン・レスポンス形式・CORS/リダイレクト方式は、GAS側をAPI対応に改修してから最終確定する必要があります。

【現在の実装状態】
・ホーム画面：デザイン・レスポンシブ対応済み
・ログイン画面：UI作成済み。認証APIは未接続
・求人画面：UI作成済み。求人取得・保存APIは未接続
・管理画面：UI作成済み。管理者APIは未接続
・ログアウト：フロント側のセッショントークン消去のみ
・認証・権限保護：GAS側のAPI実装が必要

【セキュリティ】
GitHub PagesのHTML/JavaScriptは誰でも閲覧できます。パスワードや管理者秘密鍵をフロントエンドへ記載しないでください。
admin.htmlを直接開けないようにするだけでは管理者保護になりません。GAS側ですべての管理者API・データAPIの権限を検証してください。
本番データで利用する前に、テスト用アカウントと複製したスプレッドシートで動作確認してください。
