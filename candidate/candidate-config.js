/* 職ブレ求職者ページ設定
   既存の ../assets/js/config.js を読み込み、同じGAS URL・Google OAuth Client IDを利用します。
*/
window.CANDIDATE_CONFIG = {
  GAS_URL: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.API_BASE_URL) || "https://script.google.com/macros/s/AKfycbw7FatvmG7WNK5kbKXkOY95TPzooj6eGTkC0CBD1e2mI6QbidCRMRQs1nOs2QGuxVRZBg/exec",
  GOOGLE_CLIENT_ID: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.GOOGLE_CLIENT_ID) || ""490441638610-hb6vqjd0o1a608n8glubko8kta5el407.apps.googleusercontent.com""
};
