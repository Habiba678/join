async function regData() {
  validateSingUpForm(full_name, email, password);
  const db = "https://join-da53b-default-rtdb.firebaseio.com/";
  let conect = await fetch(db + "register.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namen: full_name.value,
      mail: email.value,
      passwort: password.value,
    }),
  });
  return await conect.json();
}
