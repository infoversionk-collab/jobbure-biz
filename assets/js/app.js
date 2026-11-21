document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("job-list");
  const toast = document.getElementById("toast");
  const showToast = text => { toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); };
  const token = ShokubureAPI.token();
  if (!token) { location.href = "login.html"; return; }
  document.getElementById("logout-button").addEventListener("click", () => { ShokubureAPI.clearToken(); location.href = "login.html"; });
  const sidebar = document.getElementById("sidebar");
  document.getElementById("sidebar-toggle").addEventListener("click", () => sidebar.classList.toggle("open"));
  document.getElementById("saved-filter").addEventListener("click", () => showToast("保存求人APIはGAS接続後に有効になります。"));
  const load = async () => {
    try {
      const me = await ShokubureAPI.request("getCurrentBusinessUser");
      if (me) {
        document.getElementById("user-company").textContent = me.companyName || "パートナー";
        document.getElementById("user-email").textContent = me.email || "";
        document.getElementById("user-avatar").textContent = (me.companyName || "P").slice(0,1);
      }
      const jobs = await ShokubureAPI.request("listBusinessJobs", {
        q: document.getElementById("search-query").value,
        businessType: document.getElementById("business-type").value,
        location: document.getElementById("location-query").value
      });
      renderJobs(jobs || []);
    } catch (error) {
      list.innerHTML = `<div class="empty-state"><b>API接続待ち</b><p>${escapeHtml(error.message)}</p><p>GAS側のAPI実装・デプロイ後に求人データが表示されます。</p></div>`;
      document.getElementById("results-count").textContent = "-- 件";
    }
  };
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderJobs(jobs) {
    document.getElementById("results-count").textContent = `${jobs.length} 件`;
    if (!jobs.length) { list.innerHTML = '<div class="empty-state"><b>該当する求人はありません</b><p>検索条件を変更してお試しください。</p></div>'; return; }
    list.innerHTML = jobs.map(job => `<article class="job-card" data-id="${escapeHtml(job.id)}">
      <div class="job-card-top"><span class="job-tag">${escapeHtml(job.businessType || "求人案件")}</span><button class="save-job" data-save="${escapeHtml(job.id)}" aria-label="求人を保存">☆</button></div>
      <h3>${escapeHtml(job.title)}</h3><div class="job-meta"><span>${escapeHtml(job.jobType || "職種未設定")}</span><span>・</span><span>${escapeHtml(job.location || "勤務地未設定")}</span></div>
      <div class="job-card-foot"><span>${escapeHtml(job.employmentType || "")}</span><b>詳細を見る →</b></div></article>`).join("");
    list.querySelectorAll(".job-card").forEach(card => card.addEventListener("click", () => showToast("求人詳細API接続後に詳細を表示します。")));
    list.querySelectorAll("[data-save]").forEach(btn => btn.addEventListener("click", async e => { e.stopPropagation(); try { await ShokubureAPI.request("saveBusinessJob", {jobId:btn.dataset.save}); btn.classList.add("saved"); btn.textContent="★"; showToast("求人を保存しました。"); } catch(err) { showToast(err.message); } }));
  }
  document.getElementById("search-button").addEventListener("click", load);
  load();
});
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
