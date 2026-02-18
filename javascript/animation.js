window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

function goToSignup() {
  window.location.href = "./subpages/regist.html";
}




// addTasks.html Select fild Aniemation
function selectAnimate() {
  const wrapper = document.querySelector(".select-wrapper");
  wrapper.classList.toggle("open");
}