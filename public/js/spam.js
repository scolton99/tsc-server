const refresh_spam = async () => {
  const spam_txt = await fetch("/spam/status");
  const spam = await spam_txt.json();

  const spam_info = document.getElementById("spam_info");

  if (spam.length === 0) {
    spam_info.innerHTML = "No potential spam tickets.";
  } else {
    spam_info.innerHTML = "";

    const h1 = document.createElement("h1");
    h1.textContent = "Potential spam tickets";
    spam_info.appendChild(h1);

    for (const spam_tick of spam) {
      const p = document.createElement("p");
      p.textContent = spam_tick;

      spam_info.appendChild(p);
    }
  }
}

window.setInterval(refresh_spam, 120000);

refresh_spam();