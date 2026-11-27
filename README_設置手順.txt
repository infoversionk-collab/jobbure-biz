職ブレ-Business- 宇宙デザイン統一版
====================================

このZIPはGitHub Pagesに配置するポータル一式です。
全ページを宇宙・近未来の共通デザインに統一し、縦スクロール不能の原因となるoverflow指定を強制解除する共通CSSを追加しました。

【設置方法】
1. ZIPを解凍
2. GitHubの jobbure-biz リポジトリを開く
3. ZIPの中身をリポジトリ直下にアップロードし、同名ファイルを上書き
4. assets/css/cosmos.css が assets/css/ 内に追加されていることを確認
5. GitHub Pages反映後、Macは Command + Shift + R で強制再読み込み

【重要】
・フォルダごと入れ子にせず、中身をリポジトリ直下に置いてください。
・GAS、API URL、Google Client ID、既存JavaScriptロジックは変更していません。
・index / login / app / admin / messages / admin-messages 全ページに共通デザインを適用しています。
・縦スクロールを許可するため html/body の overflow-y:auto、height:auto を !important で指定しています。
