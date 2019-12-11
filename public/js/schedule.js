const refresh_every = 15; // minutes

const date = new Date();
date.setMinutes(date.getMinutes() + (15 - date.getMinutes() % 15));
date.setSeconds(0);
console.log(date.toString());

const c_sv_d = document.querySelector("#now .supervisor");
const c_1800_d = document.querySelector("#now .i1800");
const c_lib_d = document.querySelector("#now .library");

const n_sv_d = document.querySelector("#next .supervisor");
const n_1800_d = document.querySelector("#next .i1800");
const n_lib_d = document.querySelector("#next .library");

const refresh_schedule = async () => {
  const req_date = location.hash.substr(1);
  let req_uri;
  if (req_date === "")
    req_uri = "/schedule/status"
  else
    req_uri = `/schedule/status?date=${req_date}`

  const res_raw = await fetch(req_uri);
  const res_json = await res_raw.json();

  document.body.classList.remove("loading");

  console.log(res_json);

  while (n_sv_d.firstElementChild) {
    n_sv_d.removeChild(n_sv_d.firstElementChild);
  }

  while (n_1800_d.firstElementChild) {
    n_1800_d.removeChild(n_1800_d.firstElementChild);
  }

  while (n_lib_d.firstElementChild) {
    n_lib_d.removeChild(n_lib_d.firstElementChild);
  }

  const ex_c_sv_ppl = Array.from(c_sv_d.children);
  const ex_c_1800_ppl = Array.from(c_1800_d.children);
  const ex_c_lib_ppl = Array.from(c_lib_d.children);

  const st_func = e => {
    e.currentTarget.classList.toggle("st");
  };  

  for (let nn of res_json.next.sch["1800 Consultant"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (!res_json.now.sch["1800 Consultant"].includes(nn)) {
      nd.classList.add("coming");
    }
    if (res_json.next.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    n_1800_d.appendChild(nd);
  }

  for (let nn of res_json.next.sch["Library Consultant"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (!res_json.now.sch["Library Consultant"].includes(nn)) {
      nd.classList.add("coming");
    }
    if (res_json.next.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    n_lib_d.appendChild(nd);
  }

  for (let nn of res_json.next.sch["Consultant Supervisor"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (!res_json.now.sch["Consultant Supervisor"].includes(nn)) {
      nd.classList.add("coming");
    }
    if (res_json.next.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    n_sv_d.appendChild(nd);
  }

  for (let per of ex_c_1800_ppl) {
    if (!res_json.now.sch["1800 Consultant"].includes(per.textContent)) {
      per.parentElement.removeChild(per);
    } else {
      res_json.now.sch["1800 Consultant"].splice(res_json.now.sch["1800 Consultant"].indexOf(per.textContent), 1);
    }
  }

  for (let per of ex_c_lib_ppl) {
    if (!res_json.now.sch["Library Consultant"].includes(per.textContent)) {
      per.parentElement.removeChild(per);
    } else {
      res_json.now.sch["Library Consultant"].splice(res_json.now.sch["Library Consultant"].indexOf(per.textContent), 1);
    }
  }

  for (let per of ex_c_sv_ppl) {
    if (!res_json.now.sch["Consultant Supervisor"].includes(per.textContent)) {
      per.parentElement.removeChild(per);
    } else {
      res_json.now.sch["Consultant Supervisor"].splice(res_json.now.sch["Consultant Supervisor"].indexOf(per.textContent), 1);
    }
  }

  for (let nn of res_json.now.sch["1800 Consultant"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (res_json.now.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    c_1800_d.appendChild(nd);
  }

  for (let nn of res_json.now.sch["Library Consultant"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (res_json.now.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    c_lib_d.appendChild(nd);
  }

  for (let nn of res_json.now.sch["Consultant Supervisor"]) {
    const nd = document.createElement("span");
    nd.textContent = nn;
    if (res_json.now.trades[nn]) {
      nd.classList.add("trade");
    }
    nd.addEventListener("click", st_func);
    c_sv_d.appendChild(nd);
  }

  const n_date = new Date(res_json.next.date);

  let n_hours, n_minutes, n_ampm;
  n_ampm = n_date.getHours() >= 12 ? "PM" : "AM";
  n_hours = n_date.getHours() == 0 ? 12 : n_date.getHours() >= 13 ? n_date.getHours() - 12 : n_date.getHours();
  n_minutes = n_date.getMinutes() < 10 ? "0" + n_date.getMinutes() : "" + n_date.getMinutes();

  document.getElementById("next-time").textContent = `${n_hours}:${n_minutes} ${n_ampm}`;
};

const refresh_interval = window.setTimeout(refresh_schedule, date.getTime() - (new Date()).getTime());
refresh_schedule();