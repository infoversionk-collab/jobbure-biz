document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("job-list");
  const toast = document.getElementById("toast");
  const showToast = message => { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); };
  const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;", "'":"&#39;"}[c]));
  if (!ShokubureAPI.credential()) { location.href = "login.html"; return; }
  document.getElementById("logout-button").addEventListener("click", () => { ShokubureAPI.clearCredential(); location.href = "login.html"; });
  const sidebar = document.getElementById("sidebar");
  document.getElementById("sidebar-toggle").addEventListener("click", () => sidebar.classList.toggle("open"));
  let jobs = [];
  async function load() {
    list.innerHTML = '<div class="empty-state"><div class="loading-spinner"></div><b>求人情報を読み込んでいます</b></div>';
    try {
      const me = await ShokubureAPI.request("getCurrentBusinessUser");
      document.getElementById("user-company").textContent = me.companyName || "パートナー";
      document.getElementById("user-email").textContent = me.email || "";
      document.getElementById("user-avatar").textContent = (me.companyName || "P").slice(0,1);
      jobs = await ShokubureAPI.request("listBusinessJobs", { filters: { q: document.getElementById("search-query").value, businessType: document.getElementById("business-type").value, location: document.getElementById("location-query").value } });
      render(jobs || []);
    } catch (error) {
      list.innerHTML = `<div class="empty-state"><b>求人情報を取得できません</b><p>${esc(error.message)}</p></div>`;
      if (/ログイン|認証|有効期限/.test(error.message || "")) { ShokubureAPI.clearCredential(); }
    }
  }
  function render(items) {
    document.getElementById("results-count").textContent = `${items.length} 件`;
    if (!items.length) { list.innerHTML = '<div class="empty-state"><b>該当する求人はありません</b><p>検索条件を変更してください。</p></div>'; return; }
    list.innerHTML = items.map(job => `<article class="job-card" data-id="${esc(job.id)}"><div class="job-card-top"><span class="job-tag">${esc(job.businessType || "求人案件")}</span></div><h3>${esc(job.title)}</h3><div class="job-meta"><span>${esc(job.jobType || "職種未設定")}</span><span>・</span><span>${esc(job.location || "勤務地未設定")}</span></div><div class="job-card-foot"><span>${esc(job.employmentType || "")}</span><b>詳細を見る →</b></div></article>`).join("");
    list.querySelectorAll(".job-card").forEach(card => card.addEventListener("click", async () => {
      const job = jobs.find(x => String(x.id) === card.dataset.id); if (!job) return;
      const detail = document.getElementById("job-detail");
      detail.innerHTML = `<h2>${esc(job.title)}</h2><p>${esc(job.jobType)} ／ ${esc(job.location)}</p><p>${esc(job.description)}</p><p>${esc(job.requirements)}</p><button class="button button-primary" id="save-current-job">求人を保存</button>`;
      document.getElementById("job-modal").classList.add("show");
      document.getElementById("save-current-job").onclick = async () => { try { await ShokubureAPI.request("saveBusinessJob", {jobId: job.id}); showToast("求人を保存しました。"); } catch(e) { showToast(e.message); } };
    }));
  }
  document.getElementById("modal-close").addEventListener("click", () => document.getElementById("job-modal").classList.remove("show"));
  document.getElementById("search-button").addEventListener("click", load);
  document.getElementById("saved-filter").addEventListener("click", async () => {
    try { const saved = await ShokubureAPI.request("getBusinessSavedJobs"); const ids = new Set((saved || []).map(x => String(x.id))); render(jobs.filter(x => ids.has(String(x.id)))); document.getElementById("results-title").textContent = "保存した求人"; } catch(e) { showToast(e.message); }
  });
  await load();
});
