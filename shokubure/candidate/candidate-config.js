/* 職ブレ求職者ページ設定：法人側と同じGoogle OAuth Client ID / GAS APIを共有 */
window.CANDIDATE_CONFIG = {
  GAS_URL: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.API_BASE_URL) || "",
  GOOGLE_CLIENT_ID: (window.SHOKUBURE_CONFIG && window.SHOKUBURE_CONFIG.GOOGLE_CLIENT_ID) || "519298085651-3iq9ecmtem9451suuno2mgv3jmao2qs4.apps.googleusercontent.com"
};
