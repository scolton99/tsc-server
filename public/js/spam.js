const hidden_spam = new Set();

const refresh_spam = async() => {
    const spam_txt = await fetch("/spam/status");
    const spam = await spam_txt.json();

    const spam_info = document.getElementById("spam_info");

    if (spam.length === 0) {
        spam_info.innerHTML = "<p>No potential spam tickets.</p>";
    } else {
        spam_info.innerHTML = "";

        const h1 = document.createElement("h1");
        h1.textContent = "Potential spam tickets";
        spam_info.appendChild(h1);

        for (const spam_tick of spam) {
            if (hidden_spam.has(parseInt(spam_tick)))
                continue;

            const p = document.createElement("p");
            const a = document.createElement("a");
            const span = document.createElement("span");

            a.setAttribute("href", `https://itsm-fp.northwestern.edu/MRcgi/MRlogin.pl?DL=${spam_tick}DA1`)
            a.setAttribute("target", "_blank");
            a.textContent = spam_tick;

            span.classList.add("remove");
            span.dataset.ticketNumber = spam_tick;
            span.addEventListener("click", e => {
                hidden_spam.add(parseInt(e.currentTarget.dataset.ticketNumber));
                e.currentTarget.parentElement.parentElement.removeChild(e.currentTarget.parentElement);
            });
            span.textContent = "⨯";

            p.appendChild(a);
            p.appendChild(span);
            spam_info.appendChild(p);
        }
    }
}

window.setInterval(refresh_spam, 120000);

refresh_spam();