/* 職ブレ-Business- 接続設定：Google Identity Services + GAS */

window.SHOKUBURE_CONFIG = {
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbweDsORH6yfj5b0lJMwWHscic_9ki71Hu7z74eH4f0WPAagUbPXBGK-J6p8xJ2ciG0lKg/exec",
  GOOGLE_CLIENT_ID: "519298085651-3iq9ecmtem9451suuno2mgv3jmao2qs4.apps.googleusercontent.com",
  CREDENTIAL_KEY: "shokubure_business_google_credential",
  EMAIL_KEY: "shokubure_business_google_email"
};

/*
【設置場所】
GitHubリポジトリ：
assets/js/config.js

【重要】
・既存の API_BASE_URL は変更していません。
・既存の CREDENTIAL_KEY / EMAIL_KEY も変更していません。
・Google OAuthクライアントIDのみ、新しいIDに統一しています。
・GASのスクリプトプロパティ BUSINESS_GOOGLE_CLIENT_ID も
  同じクライアントIDに設定してください。
・実際の既存ファイルに他の設定が追加されている場合は、
  その設定を消さず、GOOGLE_CLIENT_ID の値だけを置き換えてください。
*/
