document.addEventListener("DOMContentLoaded", async () => {
  const toast = document.getElementById("toast");
  const show = text => { toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); };
  if (!ShokubureAPI.token()) { location.href = "login.html"; return; }
  document.getElementById("logout-button").addEventListener("click", () => { ShokubureAPI.clearToken(); location.href = "login.html"; });
  try {
    const data = await ShokubureAPI.request("getBusinessAdminStatus");
    document.getElementById("account-count").textContent = data.accountCount ?? "--";
    document.getElementById("inquiry-count").textContent = data.inquiryCount ?? "--";
    document.getElementById("system-status").textContent = "接続済み";
  } catch (error) {
    document.getElementById("system-status").textContent = "未接続";
    show(error.message);
  }
});
