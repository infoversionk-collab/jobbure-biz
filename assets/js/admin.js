function escapeHtml(value){return String(value??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;", "'":"&#39;"}[c]));}
document.addEventListener("DOMContentLoaded", async () => {
  const toast = document.getElementById("toast");
  const show = message => { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); };
  if (!ShokubureAPI.credential()) { location.href = "login.html"; return; }
  document.getElementById("logout-button").addEventListener("click", () => { ShokubureAPI.clearCredential(); location.href = "login.html"; });
  try {
    const data = await ShokubureAPI.request("getBusinessAdminStatus");
    document.getElementById("account-count").textContent = data.accountCount ?? "--";
    document.getElementById("inquiry-count").textContent = data.inquiryCount ?? "--";
    document.getElementById("system-status").textContent = "接続済み";
  } catch (error) {
    document.getElementById("system-status").textContent = "認証エラー";
    show(error.message);
    if (/管理者権限|認証|ログイン/.test(error.message || "")) { ShokubureAPI.clearCredential(); location.href = "login.html"; }
  }
});
