const refresh_tickets = async () => {
    fetch("/queue/status").then(res => res.json()).then(res => {
        const { background_color, verb, noun, num_tickets } = res;

        document.body.style.backgroundColor = background_color;

        const ticket_info = document.getElementById("ticket_info");
        ticket_info.innerHTML = `<h1 class="title">There ${verb} ${num_tickets} ${noun} in the queue.</h1>`;

        const fire = document.getElementById("background-fire");
        const blue_fire = document.getElementById("blue-fire");

        if (num_tickets >= 100)
            fire.classList.add("active");
        else
            fire.classList.remove("active");

        if (num_tickets === 0)
            blue_fire.classList.add("active");
        else
            blue_fire.classList.remove("active");

        if (fire.paused)
            fire.play();

        if (fire.paused)
            blue_fire.play();
    });
};

window.addEventListener("DOMContentLoaded", refresh_tickets);
window.tickets_interval = window.setInterval(refresh_tickets, 120000);
