/* 法人ポータルAPI：メールアドレス＋パスワードのセッショントークン方式。求職者ポータルのGoogle認証は別系統。 */
window.ShokubureAPI = (() => {
  const cfg = window.SHOKUBURE_CONFIG;
  const TOKEN_KEY = "shokubure_business_session_token";
  const EMAIL_KEY = "shokubure_business_email";
  const token = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
  async function post(action, sessionToken, payload = {}) {
    const response = await fetch(cfg.API_BASE_URL, {method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({action,sessionToken,payload}),redirect:"follow",cache:"no-store"});
    if(!response.ok) throw new Error("GASからHTTP "+response.status+"が返されました。");
    const result=await response.json(); if(!result||result.ok!==true) throw new Error(result&&result.message?result.message:"処理に失敗しました。"); return result.data;
  }
  async function register(payload={}) { const data=await post("businessRegister","",payload); setSession(data); return data; }
  async function login(payload={}) { const data=await post("businessLogin","",payload); setSession(data); return data; }
  function setSession(data){ if(!data||!data.token)throw new Error("ログイン応答が正しくありません。");localStorage.setItem(TOKEN_KEY,data.token);localStorage.setItem(EMAIL_KEY,data.email||""); }
  async function request(action,payload={}) { const t=token();if(!t)throw new Error("ログイン情報がありません。メールアドレスとパスワードでログインしてください。");try{return await post(action,t,payload);}catch(e){if(/有効期限|再ログイン|ログイン情報がありません/.test(e.message||""))clearCredential();throw e;} }
  function credential(){return token();}
  function clearCredential(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(EMAIL_KEY);sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(EMAIL_KEY);}
  return {register,login,request,credential,clearCredential};
})();
