window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

function goToSignup() {
  window.location.href = "./subpages/regist.html";
}
