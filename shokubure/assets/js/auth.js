document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const msg = document.getElementById("login-message");
  const submit = document.getElementById("login-submit");
  const toggle = document.querySelector(".password-toggle");
  const password = document.getElementById("password");
  if (toggle && password) toggle.addEventListener("click", () => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.textContent = show ? "隠す" : "表示";
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    msg.textContent = "";
    submit.disabled = true;
    submit.innerHTML = "認証中…";
    try {
      const data = await ShokubureAPI.request("login", {
        email: form.email.value.trim(), password: form.password.value
      });
      if (!data || !data.token) throw new Error("認証応答が正しくありません。");
      ShokubureAPI.setToken(data.token);
      location.href = data.mustChangePassword ? "change-password.html" : "app.html";
    } catch (error) {
      msg.textContent = error.message;
      submit.disabled = false;
      submit.innerHTML = 'ログイン <span>→</span>';
    }
  });
});
