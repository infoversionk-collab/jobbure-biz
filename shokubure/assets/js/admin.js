/* 職ブレ-Business- 管理者画面
 * 使用API:
 * getBusinessAdminStatus
 * businessAdminListCorporations
 * businessAdminListStaff
 * businessAdminCreateCorporation
 * businessAdminCreateStaff
 *
 * 認証情報は既存の ShokubureAPI.request() が各リクエストに付与する。
 * 管理者権限の最終判定は必ずGAS側で行う。
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let corporations = [];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = String(message || "");
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function setMessage(id, message, type) {
    const el = $(id);
    if (!el) return;
    el.textContent = message || "";
    el.className = "admin-message" + (type ? " " + type : "");
  }

  function setBusy(buttonId, busy, busyText) {
    const button = $(buttonId);
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText || "処理中...";
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function handleAuthError(error) {
    const message = error && error.message ? error.message : "処理に失敗しました。";
    if (/管理者権限|認証|ログイン|有効期限|Google認証|IDトークン/.test(message)) {
      ShokubureAPI.clearCredential();
      window.location.href = "login.html";
      return true;
    }
    return false;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  async function loadDashboardStatus() {
    const data = await ShokubureAPI.request("getBusinessAdminStatus");
    $("account-count").textContent = data.accountCount ?? "--";
    $("inquiry-count").textContent = data.inquiryCount ?? "--";
    $("system-status").textContent = "接続済み";
  }

  function renderCorporationSelects() {
    const staffSelect = $("staff-corporation");
    const filterSelect = $("staff-filter-corporation");
    const currentStaffValue = staffSelect.value;
    const currentFilterValue = filterSelect.value;

    staffSelect.innerHTML = '<option value="">法人を選択してください</option>' +
      corporations.filter((c) => c.status === "有効").map((c) =>
        `<option value="${escapeHtml(c.corporationId)}">${escapeHtml(c.corporationName)}（${escapeHtml(c.corporationId)}）</option>`
      ).join("");

    filterSelect.innerHTML = '<option value="">すべての法人</option>' +
      corporations.map((c) =>
        `<option value="${escapeHtml(c.corporationId)}">${escapeHtml(c.corporationName)}</option>`
      ).join("");

    if ([...staffSelect.options].some((o) => o.value === currentStaffValue)) staffSelect.value = currentStaffValue;
    if ([...filterSelect.options].some((o) => o.value === currentFilterValue)) filterSelect.value = currentFilterValue;
  }

  function renderCorporations() {
    const container = $("corporation-list");
    $("corporation-count").textContent = `${corporations.length} 件`;

    if (!corporations.length) {
      container.innerHTML = '<div class="admin-empty">法人はまだ登録されていません。</div>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>法人名</th><th>法人ID</th><th>利用区分</th><th>契約状態</th></tr></thead>
        <tbody>${corporations.map((c) => `
          <tr>
            <td>${escapeHtml(c.corporationName)}</td>
            <td>${escapeHtml(c.corporationId)}</td>
            <td>${escapeHtml(c.accountType || "—")}</td>
            <td>${escapeHtml(c.status || "—")}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;
  }

  async function loadCorporations() {
    const result = await ShokubureAPI.request("businessAdminListCorporations");
    corporations = Array.isArray(result) ? result : [];
    renderCorporations();
    renderCorporationSelects();
  }

  async function loadStaff() {
    const corporationId = $("staff-filter-corporation").value;
    const container = $("staff-list");
    container.innerHTML = '<div class="admin-empty">読み込み中...</div>';

    const result = await ShokubureAPI.request("businessAdminListStaff", corporationId ? { corporationId } : {});
    const staff = Array.isArray(result) ? result : [];

    if (!staff.length) {
      container.innerHTML = '<div class="admin-empty">該当する担当者は登録されていません。</div>';
      return;
    }

    const corporationNames = new Map(corporations.map((c) => [String(c.corporationId), c.corporationName]));
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>担当者名</th><th>法人名</th><th>担当者ID</th><th>メールアドレス</th><th>権限</th><th>利用状態</th></tr></thead>
        <tbody>${staff.map((s) => `
          <tr>
            <td>${escapeHtml(s.staffName)}</td>
            <td>${escapeHtml(corporationNames.get(String(s.corporationId)) || s.corporationId)}</td>
            <td>${escapeHtml(s.staffId)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.role)}</td>
            <td>${escapeHtml(s.status)}</td>
          </tr>`).join("")}
        </tbody>
      </table>`;
  }

  async function refreshAll() {
    $("system-status").textContent = "確認中";
    try {
      await loadDashboardStatus();
      await loadCorporations();
      await loadStaff();
      await loadApplications();
      await loadCompanyJobs();
      await loadReferralRequests();
    } catch (error) {
      $("system-status").textContent = "確認エラー";
      if (!handleAuthError(error)) showToast(error.message || "データの取得に失敗しました。");
      throw error;
    }
  }

  async function loadApplications() {
    const host=$('application-list'); if(!host)return;
    host.innerHTML='<div class="admin-empty">申請を読み込んでいます...</div>';
    try {
      const data=await ShokubureAPI.request('getBusinessAdminData');
      const rows=(data.applications||[]).filter(x=>x.status==='審査中');
      host.innerHTML=rows.length?`<table class="admin-table"><thead><tr><th>申請日時</th><th>法人名・利用区分</th><th>担当者</th><th>メール</th><th>法人ID</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(formatDate(x.appliedAt))}</td><td><b>${escapeHtml(x.companyName)}</b><br>${escapeHtml(x.accountType||'')}</td><td>${escapeHtml(x.contactName)}</td><td>${escapeHtml(x.email)}</td><td>${escapeHtml(x.corporationId||'申請データを確認')}</td><td><button type="button" class="admin-action-button" data-app-approve="${x.rowNumber}">承認・有効化</button> <button type="button" class="admin-action-button" data-app-reject="${x.rowNumber}">否認</button></td></tr>`).join('')}</tbody></table>`:'<div class="admin-empty">審査待ちの法人申請はありません。</div>';
      host.querySelectorAll('[data-app-approve]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await ShokubureAPI.request('approveBusinessApplication',{rowNumber:Number(b.dataset.appApprove)});showToast(r.message||'法人を承認しました。');await refreshAll()}catch(e){showToast(e.message)}finally{b.disabled=false}});
      host.querySelectorAll('[data-app-reject]').forEach(b=>b.onclick=async()=>{if(!confirm('この法人申請を否認しますか？'))return;b.disabled=true;try{await ShokubureAPI.request('rejectBusinessApplication',{rowNumber:Number(b.dataset.appReject),reason:'管理者判断'});showToast('申請を否認しました。');await refreshAll()}catch(e){showToast(e.message)}finally{b.disabled=false}});
    } catch(e) {host.innerHTML=`<div class="admin-empty">${escapeHtml(e.message)}</div>`;}
  }
  async function loadReferralRequests(){
    const host=$('referral-request-list');if(!host)return;host.innerHTML='<div class="admin-empty">申請を読み込んでいます...</div>';
    try{const rows=await ShokubureAPI.request('businessAdminListReferralRequests');
      host.innerHTML=rows.length?`<table class="admin-table"><thead><tr><th>申請</th><th>法人</th><th>求人</th><th>求職者</th><th>状態</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(x.requestId)}<br><small>${escapeHtml(formatDate(x.requestedAt))}</small></td><td>${escapeHtml(x.companyName)}<br><small>${escapeHtml(x.staffEmail)}</small></td><td>${escapeHtml(x.jobTitle)}<br><small>${escapeHtml(x.jobId)}</small></td><td>${escapeHtml(x.candidateName)}</td><td>${escapeHtml(x.status)}</td><td>${x.status==='管理者承認待ち'?`<button class="admin-action-button" data-referral-approve="${escapeHtml(x.requestId)}">紹介料を設定して承認</button> <button class="admin-action-button" data-referral-reject="${escapeHtml(x.requestId)}">否認</button>`:'—'}</td></tr>`).join('')}</tbody></table>`:'<div class="admin-empty">人材紹介利用申請はありません。</div>';
      host.querySelectorAll('[data-referral-approve]').forEach(b=>b.onclick=async()=>{const fee=prompt('紹介料の設定内容を入力してください（例：理論年収の30% / 固定30万円）');if(fee===null)return;if(!fee.trim()){showToast('紹介料設定を入力してください。');return;}b.disabled=true;try{const r=await ShokubureAPI.request('businessAdminReviewReferralRequest',{requestId:b.dataset.referralApprove,decision:'approve',feeSetting:fee.trim()});showToast(r.message);await loadReferralRequests();}catch(e){showToast(e.message);}finally{b.disabled=false;}});
      host.querySelectorAll('[data-referral-reject]').forEach(b=>b.onclick=async()=>{if(!confirm('この人材紹介利用申請を否認しますか？'))return;b.disabled=true;try{await ShokubureAPI.request('businessAdminReviewReferralRequest',{requestId:b.dataset.referralReject,decision:'reject',memo:'管理者判断'});showToast('申請を否認しました。');await loadReferralRequests();}catch(e){showToast(e.message);}finally{b.disabled=false;}});
    }catch(e){host.innerHTML=`<div class="admin-empty">${escapeHtml(e.message)}</div>`;}
  }
  async function loadCompanyJobs() {
    const host=$('company-job-list'); if(!host)return;
    host.innerHTML='<div class="admin-empty">企業求人を読み込んでいます...</div>';
    try {
      const rows=await ShokubureAPI.request('businessAdminListCompanyJobs');
      host.innerHTML=rows.length?`<table class="admin-table"><thead><tr><th>求人</th><th>法人</th><th>審査状態</th><th>求人状態</th><th>更新日</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${escapeHtml(x.title)}</b><br><small>${escapeHtml(x.jobId)}</small></td><td>${escapeHtml(x.companyName)}<br><small>${escapeHtml(x.corporationId)}</small></td><td>${escapeHtml(x.reviewStatus)}</td><td>${escapeHtml(x.jobStatus)}</td><td>${escapeHtml(formatDate(x.updatedAt))}</td><td>${x.reviewStatus==='審査待ち'?`<button class="admin-action-button" data-job-approve="${escapeHtml(x.jobId)}">承認・公開</button> <button class="admin-action-button" data-job-reject="${escapeHtml(x.jobId)}">否認</button>`:'—'}</td></tr>`).join('')}</tbody></table>`:'<div class="admin-empty">企業登録求人はありません。</div>';
      host.querySelectorAll('[data-job-approve]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await ShokubureAPI.request('businessAdminReviewCompanyJob',{jobId:b.dataset.jobApprove,decision:'approve'});showToast(r.message);await loadCompanyJobs()}catch(e){showToast(e.message)}finally{b.disabled=false}});
      host.querySelectorAll('[data-job-reject]').forEach(b=>b.onclick=async()=>{if(!confirm('この求人を否認しますか？'))return;b.disabled=true;try{await ShokubureAPI.request('businessAdminReviewCompanyJob',{jobId:b.dataset.jobReject,decision:'reject'});showToast('求人を否認しました。');await loadCompanyJobs()}catch(e){showToast(e.message)}finally{b.disabled=false}});
    } catch(e) {host.innerHTML=`<div class="admin-empty">${escapeHtml(e.message)}</div>`;}
  }

  async function submitCorporation(event) {
    event.preventDefault();
    const name = $("corporation-name").value.trim();
    const accountType = $("corporation-type").value;
    const startDate = $("corporation-start-date").value;
    const endDate = $("corporation-end-date").value;

    if (!name) {
      setMessage("corporation-form-message", "法人名を入力してください。", "error");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setMessage("corporation-form-message", "契約終了日は契約開始日以降の日付にしてください。", "error");
      return;
    }

    setBusy("corporation-submit", true, "登録中...");
    setMessage("corporation-form-message", "", "");
    try {
      const result = await ShokubureAPI.request("businessAdminCreateCorporation", {
        companyName: name,
        accountType,
        startDate: startDate || "",
        endDate: endDate || ""
      });
      setMessage("corporation-form-message",
        `登録しました。法人ID：${result.corporationId || "発行済み"}`, "success");
      $("corporation-form").reset();
      await loadCorporations();
      await loadStaff();
      showToast("法人を登録しました。");
    } catch (error) {
      setMessage("corporation-form-message", error.message || "法人登録に失敗しました。", "error");
      if (!handleAuthError(error)) showToast(error.message || "法人登録に失敗しました。");
    } finally {
      setBusy("corporation-submit", false);
    }
  }

  async function submitStaff(event) {
    event.preventDefault();
    const corporationId = $("staff-corporation").value;
    const staffName = $("staff-name").value.trim();
    const email = $("staff-email").value.trim();
    const phone = $("staff-phone").value.trim();
    const role = $("staff-role").value;

    if (!corporationId || !staffName || !email) {
      setMessage("staff-form-message", "登録先法人・担当者名・メールアドレスを入力してください。", "error");
      return;
    }

    setBusy("staff-submit", true, "登録中...");
    setMessage("staff-form-message", "", "");
    try {
      const result = await ShokubureAPI.request("businessAdminCreateStaff", {
        corporationId,
        staffName,
        email,
        phone,
        role
      });
      setMessage("staff-form-message",
        `登録しました。担当者ID：${result.staffId || "発行済み"} / 法人ID：${result.corporationId || corporationId}`,
        "success");
      $("staff-form").reset();
      await loadStaff();
      showToast("担当者を登録しました。");
    } catch (error) {
      setMessage("staff-form-message", error.message || "担当者登録に失敗しました。", "error");
      if (!handleAuthError(error)) showToast(error.message || "担当者登録に失敗しました。");
    } finally {
      setBusy("staff-submit", false);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.ShokubureAPI || !ShokubureAPI.credential()) {
      window.location.href = "login.html";
      return;
    }

    $("logout-button").addEventListener("click", () => {
      ShokubureAPI.clearCredential();
      window.location.href = "login.html";
    });
    $("corporation-form").addEventListener("submit", submitCorporation);
    $("staff-form").addEventListener("submit", submitStaff);
    $("refresh-admin-data").addEventListener("click", () => { refreshAll().catch(() => {}); });
    $("refresh-applications")?.addEventListener("click", () => loadApplications().catch(e=>showToast(e.message)));
    $("refresh-company-jobs")?.addEventListener("click", () => loadCompanyJobs().catch(e=>showToast(e.message)));
    $("staff-filter-corporation").addEventListener("change", () => {
      loadStaff().catch((error) => {
        if (!handleAuthError(error)) showToast(error.message || "担当者一覧の取得に失敗しました。");
      });
    });

    try {
      await refreshAll();
    } catch (_) {
      // refreshAll内でエラー表示・認証切れ対応を行う。
    }
  });
})();
