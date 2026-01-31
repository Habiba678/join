let full_name = document.getElementById("name");
let email = document.getElementById("mail");
let password = document.getElementById("password");
let confirmPassword = document.getElementById("confirm-password");
let infoPassword = document.getElementById("info-password");
let infoConfirmPassword = document.getElementById("info-password");
let isAccept = document.getElementById("accept-id");
let isAcceptPolice = document.getElementById("accept-police");
let singupButton = document.getElementById("singup-button");

function validateFullname() {
  // Name prüfen
  switch (true) {
    case full_name.value !== "":
      full_name.classList.add("isValidate");
      full_name.classList.remove("isInvaled");
      break;
    default:
      full_name.classList.add("isInvaled");
      full_name.classList.remove("isValidate");
  }
}

function validateEmailRegEx(emailInput) {
  // Akzeptiert ein Input-Element oder einen String und gibt true/false zurück
  const value = typeof emailInput === 'string' ? emailInput : (emailInput && emailInput.value) || '';
  const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(String(value).toLowerCase());
}

function validateEmail() {
  // Email prüfen
  const isValid = validateEmailRegEx(email);
  if (isValid) {
    email.classList.add("isValidate");
    email.classList.remove("isInvaled");
  } else {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
  }
}

function validatePassword() {
  // Password prüfen
  switch (true) {
    case password.value.length > 5:
      password.classList.add("isValidate");
      password.classList.remove("isInvaled");
      infoPassword.style.display = "none";
      break;
    default:
      infoPassword.style.display = "block";
      password.classList.add("isInvaled");
      password.classList.remove("isValidate");
  }
}

function validateConfirmPassword() {
  validatePassword(password, infoPassword);
  // Confirm Password prüfen
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

function validateSingUpForm() {
  // Formular Validierung - Alle Felder prüfen
  switch (true) {
    case isAccept.checked &&
      full_name.value !== "" &&
      email.value.includes("@") &&
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
