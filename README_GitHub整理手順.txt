職ブレ GitHub Pages｜ルート最小構成

【GitHubリポジトリ直下に置くもの】
- index.html（公開入口。shokubure/index.htmlへ自動転送）
- shokubure/（職ブレのWebサイト一式）

【shokubureフォルダ内】
法人向け画面、共通ログイン画面、求職者ページ、assets（CSS/JS）など、Webサイトで使うファイルをまとめています。
HTML/CSS/JSの相対パスは、フォルダ内の構成を維持してください。

【初回移行】
1. 現在のGitHubリポジトリをZIPでバックアップしてください。
2. リポジトリ直下の既存HTMLファイルと旧assets・候補者などのフォルダを整理します。
3. このZIPの index.html と shokubure フォルダをリポジトリ直下へ配置します。
4. GitHub Pagesの公開元は従来どおり main / root のままにします。
5. https://＜ユーザー名＞.github.io/＜リポジトリ名＞/ を開き、職ブレのトップページへ移動することを確認します。

【次回以降の更新】
Webサイトの更新ファイルは、原則として shokubure/ の中だけを更新します。
index.html（ルート入口）は通常変更不要です。
フォルダ構成・ファイル名を維持してください。フォルダを丸ごと置換する運用はGitHub Desktopを使うと簡単です。

【注意】
- GASのCode.gs、スプレッドシート、Script PropertiesはこのZIPには含まれません。
- このZIPに含まれるHTML/JSのリンク先は、shokubure/配下に配置する前提です。
- 既存の直リンク（例：/login.html）をブックマークしている場合はURLが変わります。今後は /shokubure/login.html を使ってください。
- API URLやOAuth設定はこの整理作業では変更していません。
