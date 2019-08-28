const load_num_tickets = () => {
  const netid = document.querySelector("meta[name='netid']").getAttribute("content");

  fetch("/profile/tickets/" + netid).then(res => res.json()).then(res => {
    const num_tickets_span = document.getElementById("num_tickets");

    num_tickets_span.innerHTML = res.num_tickets + " ";
  });
}

window.addEventListener("DOMContentLoaded", load_num_tickets);