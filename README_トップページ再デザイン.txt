職ブレ-Business- トップページ再デザイン版

今回の変更はトップページ（index.html）専用です。
1) ZIPを解凍
2) 中身をjobbure-bizリポジトリ直下へアップロード
3) index.htmlを上書き
4) assets/css/landing.cssを追加
5) 既存の他ページ・assets/js・GAS設定は変更しない
6) GitHub Pages反映後、Command + Shift + Rで再読み込み

トップページは専用CSS assets/css/landing.cssのみを読み込みます。
既存のstyle.css / shokubure-neon.cssの競合を避ける構成です。
ログイン先は既存のlogin.htmlです。


【求職者ページ統合版 追加内容】
- candidate/candidate-index.html : ログイン不要の求人一覧・詳細、会員マイページ
- candidate/candidate-login.html : Googleログイン・会員登録
- candidate/candidate.css : 宇宙・近未来デザイン
- candidate/candidate.js : 求職者画面のAPI接続
- candidate/candidate-config.js : 既存 assets/js/config.js の接続設定を参照

GitHub Pagesへの配置:
1. ZIP内の最上位フォルダの中身を、既存 jobbure-biz リポジトリのルートへ配置。
2. candidate フォルダもそのままアップロード。
3. 既存 login.html に「求職者の方」リンクを追加済み。法人ログイン処理は保持。
4. 求職者向け求人一覧は /candidate/candidate-index.html で公開。

注意:
このZIPはGitHub Pages側の画面ファイルを統合したものです。GAS側のAPI実装・認可・データ保存が必要です。
未ログインAPIは公開求人一覧・詳細だけに限定し、会員情報・応募・書類・スカウトはGAS側で認証してください。
スカウト受信OFFの会員は企業側検索結果から除外し、送信時にもGAS側で受信設定を再検証してください。
応募時には履歴書・職務経歴書の両方が完成・保存済みかGAS側で再検証してください。
既存GASコードや既存データをこのZIPで置き換えないでください。
