const visitedBefore = localStorage.getItem("visited_before");
const loginForm = document.querySelector(".login-form");
window.addEventListener("load", () => {
  if (visitedBefore) {
    console.log("Seite wurde schon einmal in der Vergangenheit besucht.");
    document.body.classList.add("loaded", "visited");
    if (loginForm) {
      loginForm.style.opacity = 1;
      loginForm.style.transform = "translateY(0)";
      loginForm.style.transition = "unset"; 
    }
  } else {
    console.log("Dies ist der erste Besuch überhaupt.");
    setTimeout(() => {
      document.body.classList.add("loaded");
      if (loginForm) {
        loginForm.style.opacity = 1;
        loginForm.style.transform = "translateY(0)";
      }
    }, 100);
    localStorage.setItem("visited_before", "true");
  }
});

function goToSignup() {
  window.location.href = "./subpages/regist.html";
}

// addTasks.html Select fild Aniemation
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}
