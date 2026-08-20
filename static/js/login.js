document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("togglePassword");
  const toggleIcon = document.getElementById("toggleIcon");

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.textContent = "visibility";
      } else {
        passwordInput.type = "password";
        toggleIcon.textContent = "visibility_off";
      }
    });
  }
});
