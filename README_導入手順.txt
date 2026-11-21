職ブレ-Business- 統合版 導入手順

【今回の構成】
・home.html：サービス紹介HP（今回アップロードされたindex.htmlをベースに移植）
・login.html：Googleアカウント認証・利用登録確認画面
・index.html：ログイン後の求人閲覧アプリ
・Code.gs.txt：3画面をURLパラメータで切り替えるGASコード

【URLの動き】
・WebアプリURL（パラメータなし） → home.html（サービス紹介HP）
・WebアプリURL?page=login → login.html
・WebアプリURL?page=app → index.html（求人アプリ）

【GASへの設置】
1. Apps Scriptプロジェクトを開き、既存のCode.gsをバックアップする
2. Code.gs.txtの内容をCode.gsへ反映する
   ※既存コードを保持する場合は doGet(e) 関数だけ差し替える
3. HTMLファイル「home」を新規作成し、home.htmlの内容を貼り付ける
4. HTMLファイル「login」を作成または置き換え、login.htmlの内容を貼り付ける
5. HTMLファイル「index」を作成または置き換え、index.htmlの内容を貼り付ける
6. 保存後、Webアプリを新しいバージョンとして再デプロイする

【重要】
・GASのHTMLファイル名は拡張子を付けず、home / login / index としてください。
・今回のHPは元のデザイン・セクション構成を維持しつつ、GAS内で表示できるようロゴ画像の外部ファイル依存をなくしています。
・HPのログインボタンは ?page=login に接続します。
・ログイン成功後は ?page=app に遷移します。
・認証はGoogleアカウントのメールアドレスと「Business利用者」シートを照合します。独自パスワードはありません。
・利用者のメールアドレスを「Business利用者」シートに登録し、利用状態を「有効」にしてください。
・GASの setupBusinessConnection() または resetBusinessConnection() を初回実行してください。
・Googleアカウントのメールアドレスを取得できるよう、Webアプリのデプロイ設定とGoogle Workspace等の実行環境を確認してください。

【未実施・要確認】
・Google Apps Script上での実認証、スプレッドシート接続、PDF生成はこの作成環境では実行検証できていません。
・HPのお問い合わせボタンは仮でログイン画面へ接続しています。公開前に実際の問い合わせフォーム、メールアドレス、または問い合わせ管理画面へ接続してください。
