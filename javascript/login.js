let info = document.getElementById("noMatsh");
async function logIn() {
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";

  const response = await fetch(db + ".json");
  const loginData = await response.json();

  validateEmail(email);
  validatePassword(password);

  const users = Object.values(loginData);

  const foundUser = users.find(
    (user) => user.mail === email.value && user.passwort === password.value,
  );

  if (foundUser) {
    window.location.href = "./subpages/summary.html";
  } else {
    alert("Check your email and password. Please try again");
  }
}
