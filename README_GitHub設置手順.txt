職ブレ-Business- GitHub Pages 正規構成
======================================

【このパッケージの用途】
GitHub Pagesで公開する「職ブレ-Business-」ポータル一式です。
このZIPの中身を、GitHubリポジトリのルート直下へ配置してください。
ZIPの外側のフォルダ名ごとアップロードしないでください。

【正しいフォルダ構成】
/
├── index.html
├── login.html
├── app.html
├── admin.html
├── messages.html
├── admin-messages.html
└── assets/
    ├── css/
    │   ├── style.css
    │   └── shokubure-neon.css
    └── js/
        ├── config.js
        ├── api.js
        ├── common.js
        ├── auth.js
        ├── app.js
        ├── admin.js
        ├── admin-messages.js
        └── messaging.js

【GitHubへの反映手順】
1. GitHubで「jobbure-biz」リポジトリを開く。
2. リポジトリ直下にある古いファイルを、必要に応じてバックアップする。
3. このZIPを解凍する。
4. 解凍後の中身（index.html、login.html、app.html、admin.html、messages.html、admin-messages.html、assetsフォルダ）をリポジトリ直下へアップロードする。
5. 同名ファイルは上書きする。フォルダを二重にして「職ブレ-Business_GitHub正規構成/」の下に配置しない。
6. GitHub Pagesの公開先がリポジトリのルート（/(root)）であることを確認する。
7. 公開後、https://infoversionk-collab.github.io/jobbure-biz/ を開き、ログイン・管理画面を確認する。

【重要】
・assets/js/config.js のGAS API URLとGoogle OAuth Client IDは、今回の既存設定を引き継いでいます。別のGAS URLへ変更しないでください。
・認証方式は既存のGoogleログイン（Google IDトークン）を維持しています。
・GAS側コードやスプレッドシートはこのZIPには含めていません。フロントエンドのみです。
・管理画面の法人・担当者登録は、GAS側に以下のAPIが反映済みであることが前提です。
  businessAdminListCorporations
  businessAdminListStaff
  businessAdminCreateCorporation
  businessAdminCreateStaff
・管理者権限の判定はGAS側で行います。HTMLの表示制御だけで権限管理しないでください。
・公開後はブラウザで強制再読み込み（Mac: Command + Shift + R）してください。

【ページURL】
トップ:        /jobbure-biz/
ログイン:      /jobbure-biz/login.html
求人アプリ:    /jobbure-biz/app.html
管理画面:      /jobbure-biz/admin.html
メッセージ:    /jobbure-biz/messages.html
運営DM監督:    /jobbure-biz/admin-messages.html
