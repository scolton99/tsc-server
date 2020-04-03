window.calcWidth = el => {
  const test = document.getElementById("test-span");

  test.textContent = el.value;

  if (el.value === "") {
    el.style.width = "583px";
  } else {
    el.style.width = test.offsetWidth + "px";
  }
}

window.submitRequest = () => {
  document.getElementById("response-text").style.display = "none";
  document.getElementById("loading").style.display = "block";
  
  const domain = document.getElementById("domain-field").value;

  const data = new FormData();
  data.append('domain', domain);

  const x = new XMLHttpRequest();
  x.open('POST', '', true);
  x.onload = () => {
    document.getElementById("response-text").style.display = "block";
    document.getElementById("loading").style.display = "none";

    const responseText = document.getElementById("response-text");

    const response = JSON.parse(x.responseText);

    if (response.error) {
      responseText.textContent = "Something went wrong.";
      return;
    }

    if (response.supported === true) {
      responseText.textContent = `Yes, ${response.domain} seems to be supported by Global Marketing.`
    } else if (response.supported == false) {
      responseText.textContent = `No, ${response.domain} does not seem to be supported by Global Marketing.`
    }
  };
  x.send(data);
}