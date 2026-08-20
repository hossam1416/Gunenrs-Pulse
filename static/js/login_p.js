// ── Credentials ──
const COACHES = [{ username: "arteta", password: "arsenal2004" }];

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const errorText = document.getElementById("errorText");
const toggleBtn = document.getElementById("togglePassword");
const toggleIcon = document.getElementById("toggleIcon");

// ── Login ──
function checkLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError("Please enter both username and password.");
    return;
  }

  const isValid = COACHES.some(
    (c) => c.username === username && c.password === password,
  );

  if (isValid) {
    errorMsg.classList.remove("show");
    window.location.href = "/player-home/";
  } else {
    showError("Invalid username or password. Please try again.");
    passwordInput.value = "";
    passwordInput.focus();
  }
}

function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.add("show");
}

// ── Events ──
loginBtn.addEventListener("click", checkLogin);

[usernameInput, passwordInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkLogin();
  });
  el.addEventListener("input", () => errorMsg.classList.remove("show"));
});

// ── Toggle Password ──
toggleBtn.addEventListener("click", () => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  toggleIcon.textContent = show ? "visibility_off" : "visibility";
});
