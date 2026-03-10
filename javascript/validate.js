let full_name = document.getElementById("name");
let email = document.getElementById("mail");
let password = document.getElementById("password");
let infoPassword = document.getElementById("info-password");
let infoName = document.getElementById("info-name");
let infoEmail = document.getElementById("info-email");
let confirmPassword = document.getElementById("confirm-password");
let infoConfirmPassword = document.getElementById("info-confirm-password");
let isAccept = document.getElementById("accept-id");
let isAcceptPolice = document.getElementById("accept-police");
let acceptTooltipTimer = null;
let singupButton = document.getElementById("singup-button");
let iconImgMail = document.getElementById("email-icon");
let iconImg = document.getElementById("lock-icon");
let passwordToggleIcon = document.getElementById("password-toggle");
let confirmPasswordToggleIcon = document.getElementById("confirm-password-toggle");

function setInfoState(el, visible) {
  if (!el) return;
  el.style.visibility = visible ? "visible" : "hidden";
}

if (full_name) {
  full_name.addEventListener("blur", validateFullname);
}

function getIconBase(icon) {
  if (icon && icon.src) {
    const idx = icon.src.lastIndexOf("/");
    if (idx !== -1) return icon.src.slice(0, idx + 1);
  }
  return window.location.pathname.includes("/subpages/") ? "../assets/icons/" : "./assets/icons/";
}

function setIconSrc(icon, filename) {
  if (!icon) return;
  icon.src = getIconBase(icon) + filename;
}

function isSignupFormValid() {
  if (!full_name || !email || !password || !confirmPassword || !isAccept) return false;
  const okName = full_name.value.trim() !== "";
  const okEmail = validateEmailRegEx(email);
  const okPass = password.value.length > 5;
  const okConfirm = confirmPassword.value !== "" && password.value === confirmPassword.value;
  const okCheckbox = isAccept.checked;
  return okName && okEmail && okPass && okConfirm && okCheckbox;
}

function syncSignupButtonState() {
  if (!singupButton) return;
  const ok = isSignupFormValid();
  singupButton.disabled = !ok;
  singupButton.classList.toggle("disebles-singup-button", !ok);
}

(function initSignupButtonState() {
  if (!singupButton || !full_name || !email || !password || !confirmPassword || !isAccept) return;
  const fields = [full_name, email, password, confirmPassword];
  fields.forEach((el) => {
    el.addEventListener("input", syncSignupButtonState);
    el.addEventListener("change", syncSignupButtonState);
  });
  isAccept.addEventListener("change", syncSignupButtonState);
  syncSignupButtonState();
})();
/**
 * Input  Name prüfen
 */
function validateFullname() {
  const ok = full_name.value.trim() !== "";

  if (ok) {
    full_name.classList.add("isValidate");
    full_name.classList.remove("isInvaled");
    setInfoState(infoName, false);
  } else {
    full_name.classList.add("isInvaled");
    full_name.classList.remove("isValidate");
    setInfoState(infoName, true);
  }

  return ok;
}
/**
 * Akzeptiert einen String und gibt true/false zurück
 */
function validateEmailRegEx(emailInput) {
  const value =
    typeof emailInput === "string" ? emailInput : (emailInput && emailInput.value) || "";
  const pattern =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(String(value).toLowerCase());
}
/**
 * Email prüfen
 */
function validateEmail() {
  const isValid = validateEmailRegEx(email);

  if (!iconImgMail) {
    iconImgMail = document.createElement("img");
    iconImgMail.id = "email-icon";
    email.appendChild(iconImgMail);
  }

  if (isValid) {
    email.classList.remove("isInvaled");
    email.classList.add("isValidate");
    setInfoState(infoEmail, false);
  } else {
    email.classList.add("isInvaled");
    email.classList.remove("isValidate");
    setInfoState(infoEmail, true);
  }

  return isValid;
}
/**
 * Password prüfen
 */
function updatePasswordIcon() {
  if (password.value.length === 0) {
    if (!iconImg) return;
    setIconSrc(iconImg, "lock.png");
    return;
  }
  if (!iconImg) return;
  setIconSrc(
    iconImg,
    password.type === "text" ? "visibility.svg" : "visibility_off.svg",
  );
}

function updateSignupToggleIcons() {
  if (passwordToggleIcon && password) {
    setIconSrc(
      passwordToggleIcon,
      password.type === "text" ? "visibility.svg" : "visibility_off.svg",
    );
  }
  if (confirmPasswordToggleIcon && confirmPassword) {
    setIconSrc(
      confirmPasswordToggleIcon,
      confirmPassword.type === "text" ? "visibility.svg" : "visibility_off.svg",
    );
  }
}

// Initial prüfen
(function() {
  toggleIconState();
  password.addEventListener("input", toggleIconState);
  password.addEventListener("click", (e) => {
    if (!password.value) return;
    const clickOnIcon = e.offsetX > password.offsetWidth - 35;
    if (!clickOnIcon) return;
    password.type = password.type === "password" ? "text" : "password";
    password.classList.toggle("show-password");
    updatePasswordIcon();
    updateSignupToggleIcons();
  });
  if (!confirmPassword) return;
  confirmPassword.addEventListener("input", toggleIconState);
  confirmPassword.addEventListener("click", (e) => {
    if (!confirmPassword.value) return;

    const clickOnIcon = e.offsetX > confirmPassword.offsetWidth - 35;
    if (!clickOnIcon) return;
    const hidden2 = confirmPassword.type === "password";
    confirmPassword.type = hidden2 ? "text" : "password";
    confirmPassword.classList.toggle("show-password", hidden2);
    updateSignupToggleIcons();
  });

  function toggleIconState() {
    if (password.value.length === 0) {
      password.classList.add("password-empty");
      password.type = "password";
      password.classList.remove("show-password");
    } else {
      password.classList.remove("password-empty");
    }
    updatePasswordIcon();
    updateSignupToggleIcons();
  }
})();

if (passwordToggleIcon && password) {
  passwordToggleIcon.addEventListener("click", (e) => {
    e.preventDefault();
    const hidden = password.type === "password";
    password.type = hidden ? "text" : "password";
    password.classList.toggle("show-password", hidden);
    updateSignupToggleIcons();
    password.focus();
  });
}

if (confirmPasswordToggleIcon && confirmPassword) {
  confirmPasswordToggleIcon.addEventListener("click", (e) => {
    e.preventDefault();
    const hidden = confirmPassword.type === "password";
    confirmPassword.type = hidden ? "text" : "password";
    confirmPassword.classList.toggle("show-password", hidden);
    updateSignupToggleIcons();
    confirmPassword.focus();
  });
}


function validatePassword() {
  const ok = password.value.length > 5;

  if (ok) {
    password.classList.add("isValidate");
    password.classList.remove("isInvaled");
    setInfoState(infoPassword, false);
  } else {
    setInfoState(infoPassword, true);
    password.classList.add("isInvaled");
    password.classList.remove("isValidate");
    if (iconImg) {
      setIconSrc(iconImg, "lock.png");
    }

    updatePasswordIcon();
  }

  return ok;
}
/**
 *  Confirm Password prüfen
 */
function validateConfirmPassword() {
  const okPass = validatePassword();
  const ok = okPass && confirmPassword.value !== "" && password.value === confirmPassword.value;

  if (ok) {
    confirmPassword.classList.add("isValidate");
    confirmPassword.classList.remove("isInvaled");
    setInfoState(infoPassword, false);
    setInfoState(infoConfirmPassword, false);
  } else {
    setInfoState(infoPassword, true);
    setInfoState(infoConfirmPassword, true);
    confirmPassword.classList.add("isInvaled");
    confirmPassword.classList.remove("isValidate");
  }

  return ok;
}

function validateCheckbox() {
  const ok = isAccept.checked;

  if (ok) {
    isAcceptPolice.classList.remove("show");
    document.getElementById("singup-button").classList.remove("disebles-singup-button");
  document.getElementById("singup-button").disabled = false;
  } else {
    document.getElementById("singup-button").disabled = true;
    document.getElementById("singup-button").classList.add("disebles-singup-button");
    showAcceptTooltip();
  }

  return ok;
}

function showAcceptTooltip() {
  if (!isAcceptPolice) return;
  isAcceptPolice.classList.add("show");
  if (acceptTooltipTimer) {
    clearTimeout(acceptTooltipTimer);
  }
  acceptTooltipTimer = setTimeout(() => {
    isAcceptPolice.classList.remove("show");
  }, 2000);
}
/**
 *  Formular Validierung - Alle Felder prüfen
 *  Gibt true zurück, wenn alle Felder gültig sind
 */
function validateSingUpForm() {
  const okCheckbox = validateCheckbox();
  const okName = validateFullname();
  const okEmail = validateEmail();
  const okPass = validatePassword();
  const okConfirm = validateConfirmPassword();

  const allValid = okCheckbox && okName && okEmail && okPass && okConfirm;

  if (!allValid) {
    document.getElementById("singup-button").disabled = true;
    document.getElementById("singup-button").classList.add("disebles-singup-button");
    return false;
  }
  document.getElementById("singup-button").classList.remove("disebles-singup-button");
  document.getElementById("singup-button").disabled = false;
  isAcceptPolice.classList.add("accept-police");

  return true;
}
