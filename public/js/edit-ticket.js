window.submitting = false;

window.calcWidth = el => {
  const test = document.getElementById("test-span");

  test.textContent = el.value;

  if (el.value === "") {
    switch (el.id) {
      case "netid-field": {
        el.style.width = "200px";
        break;
      }
      case "ticket-id-field": {
        el.style.width = "194px";
        break;
      }
    }
  } else {
    el.style.width = test.offsetWidth + "px";
  }

  const nf = document.getElementById("netid-field");
  const tif = document.getElementById("ticket-id-field");

  if (nf.value !== "" && tif.value !== "")
    document.getElementById("submit-button").removeAttribute("disabled");
  else
    document.getElementById("submit-button").setAttribute("disabled", "disabled");
}

window.toggleMenu = () => {
  document.getElementById("submission-tracking-options").classList.toggle("active");
}

window.makeSelection = el => {
  document.getElementById("submission-tracking-display-text").textContent = el.textContent;
}

window.submitEdit = () => {
  if (window.submitting)
    return;

  const netid = document.getElementById("netid-field").value;
  const ticket_id = document.getElementById("ticket-id-field").value;
  const submission_tracking = document.getElementById("submission-tracking-display-text").textContent;

  if (netid === "" || ticket_id === "" || submission_tracking === "")
    return;

  const data = new URLSearchParams();
  data.append("netid", netid);
  data.append("submission_tracking", submission_tracking);
  data.append("ticket_id", ticket_id);

  const request = new XMLHttpRequest();
  request.open("POST", "/edit-ticket", true);
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      const response = JSON.parse(request.responseText);

      window.submitting = false;

      if (response.result === "success")
        showSuccess();
      else if (response.result === "failure")
        showFailure();
    }
  };
  request.send(data);

  document.getElementById("submit-button").innerHTML = "<span class='lds-dual-ring'></span>";

  window.submitting = true;
}

window.clearValue = () => {
  document.getElementById("submit-button").innerHTML = "Go";
}

window.showSuccess = () => {
  document.getElementById("submit-button").innerHTML = "<span style='color: #55e54b' class='fas fa-check'></span>";
  window.setTimeout(clearValue, 3000);
}

window.showFailure = () => {
  document.getElementById("submit-button").innerHTML = "<span style='color: #ce2323' class='fas fa-times'></span>";
  window.setTimeout(clearValue, 3000);
}