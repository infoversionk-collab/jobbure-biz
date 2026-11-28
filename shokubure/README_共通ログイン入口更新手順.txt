職ブレ｜法人・求職者 共通ログイン入口 更新手順

今回の更新内容
- login.htmlを共通の利用区分選択画面に変更
- business-login.htmlに既存の法人ログイン・利用申請画面を保持
- 求職者ログイン画面は candidate/candidate-login.html
- Google OAuth Client IDを全画面で次の値に統一
519298085651-3iq9ecmtem9451suuno2mgv3jmao2qs4.apps.googleusercontent.com
- 求職者ログイン画面で assets/js/config.js を先に読み込み、法人側と同じGAS URL・Client IDを参照
- 宇宙・ネオン系の配色、カード、ボタン、レスポンシブ表示を統一

GitHub配置
1. ZIP内のファイルをリポジトリ jobbure-biz のルートへアップロード（既存構成を維持して上書き）
2. login.html は共通入口。法人ログインの旧画面は business-login.html に移動済み
3. assets/js/config.js の API_BASE_URL は従来値を維持し、GOOGLE_CLIENT_IDだけ更新済み
4. candidate/candidate-config.js は共通設定を参照

GAS側の必須設定
Apps Script > プロジェクトの設定 > スクリプト プロパティで
BUSINESS_GOOGLE_CLIENT_ID = 519298085651-3iq9ecmtem9451suuno2mgv3jmao2qs4.apps.googleusercontent.com
に変更する。GASソースの認証検証はこのプロパティと一致するIDトークンのみを許可する。

Google Cloud Console
OAuthクライアントの「承認済みのJavaScript生成元」に次を登録：
https://infoversionk-collab.github.io

公開後のテスト
- /login.html で2つの選択カードが表示される
- 法人として利用 → /business-login.html へ進み、既存Googleログインと利用申請が動く
- 求職者として利用 → /candidate/candidate-login.html へ進み、Googleログイン・会員登録が動く
- 求職者画面でGoogleボタンが表示され、GAS認証が成功する
- PC・スマートフォンでレイアウト崩れがない

注意
このZIPはGitHub Pages側のフロントエンド更新です。GitHubへのアップロード・公開、GASスクリプトプロパティ変更、GAS再デプロイはまだ実行していません。
