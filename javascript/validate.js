let full_name = document.getElementById("name");
let email = document.getElementById("mail");
let password = document.getElementById("password");
let confirmPassword = document.getElementById("confirm-password");
let infoPassword = document.getElementById("info-password");
let infoConfirmPassword = document.getElementById("info-password");
let isAccept = document.getElementById("accept-id");
let isAcceptPolice = document.getElementById("accept-police");
let singupButton = document.getElementById("singup-button");
let iconImg = document.getElementById("lock-icon");
/**
 * Input  Name prüfen
 */
function validateFullname() {
  switch (true) {
    case full_name.value.trim() !== "":
      full_name.classList.add("isValidate");
      full_name.classList.remove("isInvaled");
      break;
    default:
      full_name.classList.add("isInvaled");
      full_name.classList.remove("isValidate");
  }
}
/**
 * Akzeptiert einen String und gibt true/false zurück
 */
function validateEmailRegEx(emailInput) {
  const value =
    typeof emailInput === "string"
      ? emailInput
      : (emailInput && emailInput.value) || "";
  const pattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(String(value).toLowerCase());
}
/**
 * Email prüfen
 */
function validateEmail() {
  const isValid = validateEmailRegEx(email);
  if (isValid) {
    email.classList.add("isValidate");
    email.classList.remove("isInvaled");
  } else {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
  }
}
/**
 * Password prüfen
 */
function updatePasswordIcon() {
  if (password.value.length === 0) {
    if (!iconImg) return;
    iconImg.src = "../assets/icons/lock.png";
    return;
  }
  if (!iconImg) return;
  iconImg.src =
    password.type === "text"
      ? "../assets/icons/visibility.svg"
      : "../assets/icons/visibility_off.svg";
}

// Initial prüfen
toggleIconState();

password.addEventListener("input", toggleIconState);
password.addEventListener("click", (e) => {
  if (!password.value) return;
  const clickOnIcon = e.offsetX > password.offsetWidth - 35;
  if (!clickOnIcon) return;
  password.type = password.type === "password" ? "text" : "password";
  password.classList.toggle("show-password");
  updatePasswordIcon();
});

if (!confirmPassword) {
  confirmPassword = "";
} else {
  confirmPassword.addEventListener("input", toggleIconState);
  confirmPassword.addEventListener("click", (e) => {
    // nur reagieren, wenn rechts geklickt wird (Icon-Bereich)
    if (!confirmPassword.value) return;

    const clickOnIcon = e.offsetX > confirmPassword.offsetWidth - 35;
    if (!clickOnIcon) return;
    const hidden2 = confirmPassword.type === "password";
    confirmPassword.type = hidden2 ? "text" : "password";
    confirmPassword.classList.toggle("show-password", hidden2);
  });
}

function toggleIconState() {
  if (password.value.length === 0) {
    password.classList.add("password-empty");
    password.type = "password";
    password.classList.remove("show-password");
  } else {
    password.classList.remove("password-empty");
  }
  updatePasswordIcon();
}

function validatePassword() {
  switch (true) {
    case password.value.length > 5:
      password.classList.add("isValidate");
      password.classList.add("visibility-off");
      password.classList.remove("isInvaled");
      infoPassword.style.display = "none";
      break;
    default:
      infoPassword.style.display = "block";
      password.classList.add("isInvaled");
      password.classList.remove("isValidate");
      password.classList.remove("visibility-off");
      iconImg.src = "../assets/icons/lock.png";
  }
  updatePasswordIcon();
}
/**
 *  Confirm Password prüfen
 */
function validateConfirmPassword() {
  validatePassword(password, infoPassword);

  switch (true) {
    case password.value === confirmPassword.value &&
      confirmPassword.value != "":
      confirmPassword.classList.add("isValidate");
      confirmPassword.classList.remove("isInvaled");
      infoPassword.style.display = "none";
      infoConfirmPassword.style.display = "none";
      break;
    default:
      infoPassword.style.display = "block";
      infoConfirmPassword.style.display = "block";
      confirmPassword.classList.add("isInvaled");
      confirmPassword.classList.remove("isValidate");
  }
}
/**
 *  Formular Validierung - Alle Felder prüfen
 */
function validateSingUpForm() {
  switch (true) {
    case isAccept.checked &&
      full_name.value !== "" &&
      email.value.length > 0 &&
      password.value.length > 5 &&
      password.value === confirmPassword.value:
      singupButton.classList.remove("disebles-singup-button");
      isAcceptPolice.classList.add("accept-police");
      document.getElementById("singup-button").disabled = false;
      break;
    default:
      isAcceptPolice.classList.remove("accept-police");
      document.getElementById("singup-button").disabled = true;
      break;
  }
}
