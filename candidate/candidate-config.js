/* 職ブレ求職者ページ設定
   既存の ../assets/js/config.js を読み込み、同じGAS URL・Google OAuth Client IDを利用します。
*/
window.CANDIDATE_CONFIG = {
  GAS_URL: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.API_BASE_URL) || "",
  GOOGLE_CLIENT_ID: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.GOOGLE_CLIENT_ID) || ""
};
