const form = document.getElementById("login-form");
const button = document.getElementById("login-btn");
const status = document.getElementById("login-status");
const userInput = document.getElementById("login-user");
const passInput = document.getElementById("login-pass");

const setupMessages = {
  missing_worker_secrets:
    "Ylläpidon asetukset puuttuvat. Lisää ADMIN_USER, ADMIN_PASSWORD_RECORD ja SESSION_SECRET.",
  invalid_password_record:
    "ADMIN_PASSWORD_RECORD on virheellisessä muodossa. Luo uusi arvo ja liitä se ilman lainausmerkkejä.",
  locked_try_later: "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
  turnstile_verification_failed:
    "Turvavarmennus epäonnistui. Päivitä sivu ja yritä uudelleen.",
};

function setStatus(message, kind = "error") {
  status.textContent = message;
  status.className = `status ${kind === "ok" ? "ok" : "error"}`;
}

async function login(event) {
  event.preventDefault();
  const username = userInput.value.trim();
  const password = passInput.value;
  if (!username || !password) {
    setStatus("Täytä käyttäjätunnus ja salasana.");
    return;
  }

  button.disabled = true;
  button.textContent = "Kirjaudutaan...";
  setStatus("", "ok");
  try {
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = setupMessages[payload.error] || "Kirjautuminen epäonnistui. Tarkista tunnukset.";
      setStatus(message);
      return;
    }
    setStatus("Kirjautuminen onnistui. Siirrytään ylläpitoon...", "ok");
    window.location.assign("/admin");
  } catch {
    setStatus("Yhteysvirhe. Yritä hetken päästä uudelleen.");
  } finally {
    button.disabled = false;
    button.textContent = "Kirjaudu";
  }
}

form.addEventListener("submit", login);
userInput.focus();
