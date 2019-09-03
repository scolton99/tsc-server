const refresh_tickets = async () => {
  fetch("/queue/status").then(res => res.json()).then(res => {
    const { background_color, verb, noun, num_tickets } = res;

    document.body.style.backgroundColor = background_color;

    const ticket_info = document.getElementById("ticket_info");
    ticket_info.innerHTML = `<h1 class="title">There ${verb} ${num_tickets} ${noun} in the queue.</h1>`;

    const fire = document.getElementById("background-fire");
    const nuke = document.getElementById("background-nuke");

    if (typeof (num_tickets) === "number" && num_tickets >= 100 && num_tickets < 150)
      fire.classList.add("active");
    else
      fire.classList.remove("active");

    if (typeof (num_tickets) === "number" && num_tickets >= 150)
      nuke.classList.add("active");
    else
      nuke.classList.remove("active");

    if (fire.paused)
      fire.play();

    if (nuke.paused)
      nuke.play();
  });
};

window.addEventListener("DOMContentLoaded", refresh_tickets);
window.tickets_interval = window.setInterval(refresh_tickets, 120000);
