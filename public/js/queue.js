const refresh_tickets = async () => {
  fetch("/queue/status").then(res => res.json()).then(res => {
    const { background_color, verb, noun, num_tickets } = res;

    document.body.style.backgroundColor = background_color;

    const ticket_info = document.getElementById("ticket_info");
    ticket_info.innerHTML = `<h1 class="title">There ${verb} ${num_tickets} ${noun} in the queue.</h1>`;

    // const fire = document.getElementById("background-fire");
    // const nuke = document.getElementById("background-nuke");
    // const nova = document.getElementById("background-nova");
    // const hole = document.getElementById("background-hole");
    // const confetti = document.getElementById("background-confetti");

    // Per Blake Late Feb '20 -- remove animations on display
    /* if (typeof (num_tickets) === "number" && num_tickets >= 100 && num_tickets < 150)
      fire.classList.add("active");
    else
      fire.classList.remove("active");

    if (typeof (num_tickets) === "number" && num_tickets >= 150 && num_tickets < 200)
      nuke.classList.add("active");
    else
      nuke.classList.remove("active");

    if (typeof (num_tickets) === "number" && num_tickets >= 200 && num_tickets < 250)
      nova.classList.add("active");
    else
      nova.classList.remove("active");

    if (typeof (num_tickets) === "number" && num_tickets >= 250 && num_tickets < 500)
      hole.classList.add("active");
    else
      hole.classList.remove("active");

    if (typeof (num_tickets) === "number" && num_tickets >= 500)
      confetti.classList.add("active");
    else
      confetti.classList.remove("active")

    if (fire.paused)
      fire.play();

    if (nuke.paused)
      nuke.play();

    if (nova.paused)
      nova.play();
    
    if (hole.paused)
      hole.play();
    
    if (confetti.paused)
      confetti.play(); */
  });
};

window.addEventListener("DOMContentLoaded", refresh_tickets);
window.tickets_interval = window.setInterval(refresh_tickets, 120000);
