/* Shared login/register page — role is fixed by the URL (/admin-login/,
 * /driver-login/, /client-login/) and injected via data-role on <body>.
 * Design decision (not in spec): admin has no public registration route,
 * matching the backend (no /api/auth/register/admin/ endpoint exists) —
 * so the register toggle only appears for driver/client roles.
 */
(() => {
  const role = document.body.dataset.role;
  let mode = "login"; // or "register"

  // Redirect straight to the dashboard if already logged in as this role.
  const existing = Auth.get();
  if (existing && existing.role === role) {
    window.location.href = `/${role}/`;
    return;
  }

  if (role !== "admin") {
    $("toggle-mode").classList.remove("hidden");
    $("toggle-mode").classList.add("flex");
    $("toggle-mode").classList.add("justify-center");
  }

  $("toggle-btn").addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    const isRegister = mode === "register";
    $("login-title").textContent = isRegister ? `${cap(role)} Registration` : `${cap(role)} Login`;
    $("submit-btn").textContent = isRegister ? "Create account" : "Login";
    $("toggle-text").textContent = isRegister ? "Already have an account?" : "New here?";
    $("toggle-btn").textContent = isRegister ? "Login" : "Register";
    $("extra-fields").classList.toggle("hidden", !isRegister);
    $("extra-fields").classList.toggle("flex", isRegister);
    hideError();
  });

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function showError(message) {
    const box = $("error-box");
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function hideError() {
    $("error-box").classList.add("hidden");
  }

  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const username = $("username").value.trim();
    const password = $("password").value;

    if (!username || !password) {
      showError("Username and password are required.");
      return;
    }

    await withBusyButton("submit-btn", async () => {
      try {
        let res;
        if (mode === "register") {
          const email = $("email").value.trim();
          const body = { username, email, password };
          res = role === "driver" ? await API.registerDriver(body) : await API.registerClient(body);
        } else if (role === "admin") {
          res = await API.adminLogin({ username, password });
        } else {
          res = await API.login({ username, password, role });
        }

        Auth.set({ access: res.access, refresh: res.refresh, user: res.user });
        Toast.success(mode === "register" ? "Account created" : "Welcome back");
        window.location.href = `/${role}/`;
      } catch (err) {
        showError(err.message);
      }
    });
  });
})();
