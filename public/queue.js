const refresh_tickets = async () => {
    fetch("/queue/status").then(res => res.json()).then(res => {
        const { background_color, verb, noun, num_tickets } = res;

        document.body.style.backgroundColor = background_color;
        
        const ticket_info = document.getElementById("ticket_info");
        ticket_info.innerHTML = `<h1 class="title">There ${verb} ${num_tickets} ${noun} in the queue.</h1>`;
    });
};

window.addEventListener("DOMContentLoaded", refresh_tickets);
window.tickets_interval = window.setInterval(refresh_tickets, 120000);