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
    } catch (error) {
      $("system-status").textContent = "確認エラー";
      if (!handleAuthError(error)) showToast(error.message || "データの取得に失敗しました。");
      throw error;
    }
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
    $("refresh-admin-data").addEventListener("click", () => {
      refreshAll().catch(() => {});
    });
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
