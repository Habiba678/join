window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

function goToSignup() {
  window.location.href = "./subpages/regist.html";
}

function goToSummary() {
  window.location.href = "./subpages/summary.html";
}


// addTasks.html Select fild Aniemation
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}