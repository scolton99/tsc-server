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

const SUPERVISOR = "1800 Supervisor";
const LIBRARY = "Library Consultant";
const CONSULTANT = "1800 Consultant";

const refresh_schedule = async() => {
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

    const mt = document.createElement("p");
    mt.textContent = "-";

    if (res_json.next.sch[CONSULTANT].length === 0) {
        n_1800_d.appendChild(mt.cloneNode());
    } else {
        for (let nn of res_json.next.sch[CONSULTANT]) {
            const nd = document.createElement("span");
            nd.textContent = nn;
            if (!res_json.now.sch[CONSULTANT].includes(nn)) {
                nd.classList.add("coming");
            }
            if (res_json.next.trades[nn]) {
                nd.classList.add("trade");
            }
            nd.addEventListener("click", st_func);
            n_1800_d.appendChild(nd);
        }
    }

    if (res_json.next.sch[LIBRARY].length === 0) {
        n_lib_d.appendChild(mt.cloneNode());
    } else {
        for (let nn of res_json.next.sch[LIBRARY]) {
            const nd = document.createElement("span");
            nd.textContent = nn;
            if (!res_json.now.sch[LIBRARY].includes(nn)) {
                nd.classList.add("coming");
            }
            if (res_json.next.trades[nn]) {
                nd.classList.add("trade");
            }
            nd.addEventListener("click", st_func);
            n_lib_d.appendChild(nd);
        }
    }   

    if (res_json.next.sch[SUPERVISOR].length === 0) {
        n_sv_d.appendChild(mt.cloneNode());
    } else {
        for (let nn of res_json.next.sch[SUPERVISOR]) {
            const nd = document.createElement("span");
            nd.textContent = nn;
            if (!res_json.now.sch[SUPERVISOR].includes(nn)) {
                nd.classList.add("coming");
            }
            if (res_json.next.trades[nn]) {
                nd.classList.add("trade");
            }
            nd.addEventListener("click", st_func);
            n_sv_d.appendChild(nd);
        }
    }

    for (let per of ex_c_1800_ppl) {
        if (!res_json.now.sch[CONSULTANT].includes(per.textContent)) {
            per.parentElement.removeChild(per);
        } else {
            res_json.now.sch[CONSULTANT].splice(res_json.now.sch[CONSULTANT].indexOf(per.textContent), 1);
        }
    }

    for (let per of ex_c_lib_ppl) {
        if (!res_json.now.sch[LIBRARY].includes(per.textContent)) {
            per.parentElement.removeChild(per);
        } else {
            res_json.now.sch[LIBRARY].splice(res_json.now.sch[LIBRARY].indexOf(per.textContent), 1);
        }
    }

    for (let per of ex_c_sv_ppl) {
        if (!res_json.now.sch[SUPERVISOR].includes(per.textContent)) {
            per.parentElement.removeChild(per);
        } else {
            res_json.now.sch[SUPERVISOR].splice(res_json.now.sch[SUPERVISOR].indexOf(per.textContent), 1);
        }
    }

    for (let nn of res_json.now.sch[CONSULTANT]) {
        const nd = document.createElement("span");
        nd.textContent = nn;
        if (!res_json.next.sch[CONSULTANT].includes(nn)) {
            nd.classList.add("going");
        }
        if (res_json.now.trades[nn]) {
            nd.classList.add("trade");
        }
        nd.addEventListener("click", st_func);
        c_1800_d.appendChild(nd);
    }

    for (let nn of res_json.now.sch[LIBRARY]) {
        const nd = document.createElement("span");
        nd.textContent = nn;
        if (!res_json.next.sch[LIBRARY].includes(nn)) {
            nd.classList.add("going");
        }
        if (res_json.now.trades[nn]) {
            nd.classList.add("trade");
        }
        nd.addEventListener("click", st_func);
        c_lib_d.appendChild(nd);
    }

    for (let nn of res_json.now.sch[SUPERVISOR]) {
        const nd = document.createElement("span");
        nd.textContent = nn;
        if (!res_json.next.sch[SUPERVISOR].includes(nn)) {
            nd.classList.add("going");
        }
        if (res_json.now.trades[nn]) {
            nd.classList.add("trade");
        }
        nd.addEventListener("click", st_func);
        c_sv_d.appendChild(nd);
    }

    if (c_sv_d.childElementCount === 0)
        c_sv_d.appendChild(mt.cloneNode());

    if (c_1800_d.childElementCount === 0)
        c_1800_d.appendChild(mt.cloneNode());

    if (c_lib_d.childElementCount === 0)
        c_lib_d.appendChild(mt.cloneNode());

    const n_date = new Date(res_json.next.date);

    let n_hours, n_minutes, n_ampm;
    n_ampm = n_date.getHours() >= 12 ? "PM" : "AM";
    n_hours = n_date.getHours() == 0 ? 12 : n_date.getHours() >= 13 ? n_date.getHours() - 12 : n_date.getHours();
    n_minutes = n_date.getMinutes() < 10 ? "0" + n_date.getMinutes() : "" + n_date.getMinutes();

    document.getElementById("next-time").textContent = `${n_hours}:${n_minutes} ${n_ampm}`;

    const date = new Date();
    date.setMinutes(date.getMinutes() + (15 - date.getMinutes() % 15));
    date.setSeconds(0);
    console.log(date.toString());

    refresh_interval = window.setTimeout(refresh_schedule, date.getTime() - (new Date()).getTime());
};

let refresh_interval = window.setTimeout(refresh_schedule, date.getTime() - (new Date()).getTime());
refresh_schedule();