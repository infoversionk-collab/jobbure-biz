/* 職ブレ-Business- 接続設定：Google Identity Services + GAS */
window.SHOKUBURE_CONFIG = {
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbweDsORH6yfj5b0lJMwWHscic_9ki71Hu7z74eH4f0WPAagUbPXBGK-J6p8xJ2ciG0lKg/exec",
  GOOGLE_CLIENT_ID: "490441638610-hb6vqjd0o1a608n8glubko8kta5el407.apps.googleusercontent.com",
  CREDENTIAL_KEY: "shokubure_business_google_credential",
  EMAIL_KEY: "shokubure_business_google_email"
};

/* GitHub Pages -> GAS Web API */
window.ShokubureAPI = (() => {
  const cfg = window.SHOKUBURE_CONFIG;

  if (!cfg || !cfg.API_BASE_URL || !cfg.CREDENTIAL_KEY || !cfg.EMAIL_KEY) {
    throw new Error("SHOKUBURE_CONFIGが正しく読み込まれていません。config.jsを先に読み込んでください。");
  }

  const credential = () => sessionStorage.getItem(cfg.CREDENTIAL_KEY) || "";

  async function post(action, googleCredential, payload = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(cfg.API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, googleCredential, payload }),
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("GASからHTTP " + response.status + " が返されました。");
      }

      let result;
      try {
        result = await response.json();
      } catch (_error) {
        throw new Error("GASの応答をJSONとして読み取れません。WebアプリのデプロイURLとdoPostの戻り値を確認してください。");
      }

      if (!result || result.ok !== true) {
        throw new Error(result && result.message ? result.message : "GAS側の処理に失敗しました。");
      }

      return result.data;
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("GASとの通信が30秒でタイムアウトしました。GASの実行履歴とNetworkを確認してください。");
      }
      if (error instanceof TypeError) {
        throw new Error("GASとの通信に失敗しました。URL・公開設定・ブラウザのCORSエラーを確認してください。");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function authenticate(idToken) {
    const data = await post("auth", idToken, {});
    sessionStorage.setItem(cfg.CREDENTIAL_KEY, idToken);
    sessionStorage.setItem(cfg.EMAIL_KEY, data && data.email ? data.email : "");
    return data;
  }

  async function submitApplication(idToken, payload = {}) {
    return post("submitBusinessApplication", idToken, payload);
  }

  async function request(action, payload = {}) {
    const idToken = credential();
    if (!idToken) {
      throw new Error("ログイン情報がありません。Googleログインを行ってください。");
    }

    try {
      return await post(action, idToken, payload);
    } catch (error) {
      if (/有効期限|再ログイン|Google認証|ログイン情報/.test(error.message || "")) {
        clearCredential();
      }
      throw error;
    }
  }

  function clearCredential() {
    sessionStorage.removeItem(cfg.CREDENTIAL_KEY);
    sessionStorage.removeItem(cfg.EMAIL_KEY);
  }

  return { authenticate, submitApplication, request, credential, clearCredential };
})();
