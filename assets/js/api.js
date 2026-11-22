/* GitHub Pages -> GAS Web API */
window.ShokubureAPI = (() => {
  const cfg = window.SHOKUBURE_CONFIG;

  const credential = () =>
    sessionStorage.getItem(cfg.CREDENTIAL_KEY) || "";

  async function post(action, googleCredential, payload = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(cfg.API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify({
          action,
          googleCredential,
          payload
        }),
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("GASからHTTP " + response.status + " が返されました。");
      }

      const result = await response.json();

      if (!result || result.ok !== true) {
        throw new Error(
          result && result.message
            ? result.message
            : "処理に失敗しました。"
        );
      }

      return result.data;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("通信がタイムアウトしました。時間をおいて再度お試しください。");
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  async function authenticate(idToken) {
    const data = await post("auth", idToken, {});

    sessionStorage.setItem(cfg.CREDENTIAL_KEY, idToken);
    sessionStorage.setItem(cfg.EMAIL_KEY, data.email || "");

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
      if (/有効期限|再ログイン|Google認証/.test(error.message || "")) {
        clearCredential();
      }

      throw error;
    }
  }

  function clearCredential() {
    sessionStorage.removeItem(cfg.CREDENTIAL_KEY);
    sessionStorage.removeItem(cfg.EMAIL_KEY);
  }

  return {
    authenticate,
    submitApplication,
    request,
    credential,
    clearCredential
  };

})();
