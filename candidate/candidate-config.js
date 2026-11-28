
/* 職ブレ求職者ページ設定
   既存の法人向け設定を引き継いでGASに接続
*/
window.CANDIDATE_CONFIG = {
  GAS_URL:
    (window.SHOKUBURE_CONFIG &&
      window.SHOKUBURE_CONFIG.API_BASE_URL) ||
    "https://script.google.com/macros/s/AKfycbw7FatvmG7WNK5kbKXkOY95TPzooj6eGTkC0CBD1e2mI6QbidCRMRQs1nOs2QGuxVRZBg/exec",

  GOOGLE_CLIENT_ID:
    (window.SHOKUBURE_CONFIG &&
      window.SHOKUBURE_CONFIG.GOOGLE_CLIENT_ID) ||
    "519298085651-3iq9ecmtem9451suuno2mgv3jmao2qs4.apps.googleusercontent.com"
};
