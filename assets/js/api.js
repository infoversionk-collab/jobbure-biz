/* GitHub PagesからGAS Web APIを呼び出す共通層。
   GAS側はJSONPまたはCORS対応のAPIを実装する必要があります。
   現段階では API_READY=false のため、未接続メッセージを返します。 */
window.ShokubureAPI = (() => {
  const cfg = window.SHOKUBURE_CONFIG;
  const token = () => sessionStorage.getItem(cfg.SESSION_KEY) || "";
  const unavailable = () => Promise.reject(new Error("システム接続の準備中です。GAS APIの実装・公開後に利用できます。"));
  async function request(action, payload = {}) {
    if (!cfg.API_READY) return unavailable();
    // GAS Webアプリのクロスオリジン仕様に合わせ、API方式を確定してから実装する。
    const response = await fetch(cfg.API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token: token(), payload })
    });
    if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "処理に失敗しました。");
    return result.data;
  }
  return { request, token, setToken: value => sessionStorage.setItem(cfg.SESSION_KEY, value),
    clearToken: () => sessionStorage.removeItem(cfg.SESSION_KEY) };
})();
