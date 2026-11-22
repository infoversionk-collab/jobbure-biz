function adminEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id);
  const toast = message => {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 3200);
  };
  let adminData = { applications: [], users: [] };

  if (!window.ShokubureAPI || !ShokubureAPI.credential()) {
    location.replace("login.html");
    return;
  }
  $("logout-button").addEventListener("click", () => {
    ShokubureAPI.clearCredential();
    location.href = "login.html";
  });
  $("refresh-button").addEventListener("click", loadAdminData);
  $("dialog-close").addEventListener("click", closeDialog);
  $("dialog-cancel").addEventListener("click", closeDialog);
  $("user-edit-form").addEventListener("submit", saveUserEdit);

  async function loadAdminData() {
    $("system-status").textContent = "取得中";
    $("application-rows").innerHTML = '<tr><td colspan="7" class="table-empty">読み込み中...</td></tr>';
    $("user-rows").innerHTML = '<tr><td colspan="6" class="table-empty">読み込み中...</td></tr>';
    try {
      const data = await ShokubureAPI.request("getBusinessAdminData");
      adminData = data || { applications: [], users: [] };
      $("account-count").textContent = adminData.accountCount ?? (adminData.users || []).length;
      $("pending-count").textContent = adminData.pendingCount ?? 0;
      $("system-status").textContent = "接続済み";
      $("system-status").classList.remove("stat-error");
      renderApplications();
      renderUsers();
    } catch (error) {
      $("system-status").textContent = "エラー";
      $("system-status").classList.add("stat-error");
      $("application-rows").innerHTML = `<tr><td colspan="7" class="table-empty">${adminEscape(error.message)}</td></tr>`;
      $("user-rows").innerHTML = '<tr><td colspan="6" class="table-empty">利用者情報を取得できません。</td></tr>';
      toast(error.message || "管理情報を取得できませんでした。");
      if (/管理者権限|認証|ログイン/.test(error.message || "")) {
        ShokubureAPI.clearCredential();
        location.replace("login.html");
      }
    }
  }

  function renderApplications() {
    const rows = adminData.applications || [];
    if (!rows.length) {
      $("application-rows").innerHTML = '<tr><td colspan="7" class="table-empty">利用申請はありません。</td></tr>';
      return;
    }
    $("application-rows").innerHTML = rows.map(item => {
      const pending = item.status === "審査中";
      const actions = pending
        ? `<button class="table-action approve" data-action="approve" data-row="${Number(item.rowNumber)}">承認</button><button class="table-action reject" data-action="reject" data-row="${Number(item.rowNumber)}">否認</button>`
        : `<span class="status-label">${adminEscape(item.status || "未設定")}</span>`;
      return `<tr>
        <td>${adminEscape(item.appliedAt)}</td>
        <td><strong>${adminEscape(item.companyName)}</strong></td>
        <td>${adminEscape(item.contactName)}</td>
        <td>${adminEscape(item.email)}</td>
        <td>${adminEscape(item.accountType)}</td>
        <td><span class="status-label ${pending ? "pending" : ""}">${adminEscape(item.status)}</span></td>
        <td class="action-cell">${actions}</td>
      </tr>`;
    }).join("");
    $("application-rows").querySelectorAll("[data-action]").forEach(button => {
      button.addEventListener("click", () => reviewApplication(button.dataset.action, Number(button.dataset.row)));
    });
  }

  function renderUsers() {
    const rows = adminData.users || [];
    if (!rows.length) {
      $("user-rows").innerHTML = '<tr><td colspan="6" class="table-empty">登録済み利用者はありません。</td></tr>';
      return;
    }
    $("user-rows").innerHTML = rows.map((user, index) => `<tr>
      <td><strong>${adminEscape(user.companyName)}</strong></td>
      <td>${adminEscape(user.email)}</td>
      <td>${adminEscape(user.accountType)}</td>
      <td>${user.commissionRate === "" ? "未設定" : adminEscape(user.commissionRate) + "%"}</td>
      <td><span class="status-label ${user.status === "有効" ? "active" : "stopped"}">${adminEscape(user.status)}</span></td>
      <td><button class="table-action edit" data-user-index="${index}">編集</button></td>
    </tr>`).join("");
    $("user-rows").querySelectorAll("[data-user-index]").forEach(button => {
      button.addEventListener("click", () => openUserEditor(rows[Number(button.dataset.userIndex)]));
    });
  }

  async function reviewApplication(action, rowNumber) {
    const item = (adminData.applications || []).find(x => Number(x.rowNumber) === rowNumber);
    if (!item) return toast("申請情報が見つかりません。");
    const approving = action === "approve";
    const message = approving
      ? `${item.companyName}（${item.email}）を承認して利用登録しますか？`
      : `${item.companyName}（${item.email}）の申請を否認しますか？`;
    if (!confirm(message)) return;
    try {
      await ShokubureAPI.request(approving ? "approveBusinessApplication" : "rejectBusinessApplication", { rowNumber });
      toast(approving ? "承認し、利用者登録しました。" : "申請を否認しました。");
      await loadAdminData();
    } catch (error) {
      toast(error.message || "処理に失敗しました。");
    }
  }

  function openUserEditor(user) {
    $("edit-email").value = user.email || "";
    $("edit-company").value = user.companyName || "";
    $("edit-type").value = user.accountType || "企業";
    $("edit-rate").value = user.commissionRate === "" ? "" : user.commissionRate;
    $("edit-status").value = user.status || "有効";
    $("user-edit-dialog").showModal();
  }

  function closeDialog() {
    if ($("user-edit-dialog").open) $("user-edit-dialog").close();
  }

  async function saveUserEdit(event) {
    event.preventDefault();
    const payload = {
      email: $("edit-email").value,
      companyName: $("edit-company").value.trim(),
      accountType: $("edit-type").value,
      commissionRate: $("edit-rate").value,
      status: $("edit-status").value
    };
    try {
      await ShokubureAPI.request("saveBusinessUser", payload);
      closeDialog();
      toast("利用者情報を更新しました。");
      await loadAdminData();
    } catch (error) {
      toast(error.message || "保存に失敗しました。");
    }
  }

  await loadAdminData();
});
