const NETID = document.querySelector("meta[name='netid']").getAttribute("content");
const RECID = document.querySelector("meta[name='recid']").getAttribute("content");

const init = () => {
  const button = document.getElementById("photo-upload-button");
  button.addEventListener("click", start_photo_upload);
  
  const file_input = document.getElementById("photo-upload");
  file_input.addEventListener("change", upload_photo);

  load_num_tickets();

  document.getElementById("save").addEventListener("click", save_record);

  Array.from(document.getElementsByTagName("input")).forEach(e => {
    e.addEventListener("input", show_save_button);
    e.addEventListener("change", show_save_button);
  });
  
  Array.from(document.getElementsByTagName("select")).forEach(e => {
    e.addEventListener("change", show_save_button);
  });

  Array.from(document.getElementsByTagName("textarea")).forEach(e => {
    e.addEventListener("input", show_save_button);
    e.addEventListener("change", show_save_button);
  });
};

const show_save_button = () => {
  document.getElementById("save").parentElement.classList.add("active");
};

const start_photo_upload = () => {
  const file_input = document.getElementById("photo-upload");
  file_input.click();
};

const upload_photo = () => {
  const file_input = document.getElementById("photo-upload");
  const files = file_input.files;

  if (files.length === 0) return;

  const file = files[0];

  const data = new FormData();
  data.append("photo", file);
  data.append("netid", NETID);
  data.append("conweb_token", "OnqtpZTPV8qAkFhaJuYT0mmkhmx6BK3F1KYNkwr3wiLgtG9A6QnWmLReTl5rFeHV");

  const x = new XMLHttpRequest();
  x.open("POST", "/photo");
  x.onreadystatechange = () => {
    if (x.readyState === XMLHttpRequest.DONE) {
      document.getElementById("photo-upload-button").classList.remove("uploading");

      if (x.status < 400) {
        document.getElementById("profile-photo").setAttribute("src", x.responseText);
      } else {
        console.error("POST failed.");        
      }
    }
  };
  x.send(data);

  document.getElementById("photo-upload-button").classList.add("uploading");
};

const load_num_tickets = () => {
  const netid = document.querySelector("meta[name='netid']").getAttribute("content");

  fetch("/profile/tickets/" + netid).then(res => res.json()).then(res => {
    const num_tickets_span = document.getElementById("num_tickets");

    num_tickets_span.innerHTML = res.num_tickets + " ";
  });
};

const format_phone = phone => {
  if (!phone) return "";

  const sanitized = phone.replace(/[^\d]/g, "");
  if (sanitized.length !== 10) return "";

  const area_code = sanitized.substr(0, 3);
  const prefix = sanitized.substr(3, 3);
  const number = sanitized.substr(6, 4);

  return `(${area_code}) ${prefix}-${number}`;
};

const save_record = () => {
  const first_name = document.getElementById("first-name").value;
  const t_shirt_size = document.getElementById("shirt-size").value;
  const dietary_restrictions = document.getElementById("dietary-restrictions").value;
  const pronouns = Array.from(document.getElementsByName("Pronouns")).filter(e => e.checked).map(e => e.value);
  const other_pronouns = document.getElementById("other-pronouns").value;
  const wildcard_hid = document.getElementById("wildcard-hid").value;
  const phone_number = format_phone(document.getElementById("phone-number").value);
  const bio = document.getElementById("bio").value;
  const grad_year = document.getElementById("grad-year").value;
  const grad_month = document.getElementById("grad-month").value;
  const record_id = RECID;

  const data = new FormData();
  data.append("first_name", first_name);
  data.append("t_shirt_size", t_shirt_size);
  data.append("dietary_restrictions", dietary_restrictions);
  data.append("other_pronouns", other_pronouns);
  data.append("wildcard_hid", wildcard_hid);
  data.append("phone_number", phone_number);
  data.append("bio", bio);
  data.append("grad_year", grad_year);
  data.append("grad_month", grad_month);
  data.append("record_id", record_id);

  pronouns.forEach(pronoun => {
    data.append("pronouns", pronoun);
  });

  const x = new XMLHttpRequest();
  x.open('POST', '');
  x.onreadystatechange = () => {
    if (x.readyState === XMLHttpRequest.DONE) {
      if (x.status < 400) {
        const res = JSON.parse(x.responseText);

        document.getElementById("first-name").value = res["First Name"] || "";
        document.getElementById("shirt-size").value = res["Shirt Size"];
        document.getElementById("dietary-restrictions").value = res["Dietary Restrictions"] || "";
        document.getElementById("other-pronouns").value = res["Other Pronouns"] || "";
        document.getElementById("wildcard-hid").value = res["Wildcard HID"] || "";
        document.getElementById("phone-number").value = res["Phone Number"] || "";
        document.getElementById("bio").value = res["Bio"] || "";
        document.getElementById("grad-year").value = res["Grad Year"] || "";
        document.getElementById("grad-month").value = res["Grad Month"] || "";

        document.getElementById("first-name-disp").textContent = res["First Name"] || "";
        document.getElementById("grad-disp").textContent = res["Grad Display"] || "";

        Array.from(document.getElementsByName("Pronouns")).forEach(e => {
          e.checked = false;
        });

        if (res.Pronouns)
          for (const pronoun of res.Pronouns)
            document.getElementById(pronoun.replace(/\//g, "-")).checked = true;

        const save_btn = document.getElementById("save");

        document.getElementById("pronouns-disp").textContent = res["Pronouns Display"] || "";

        const save_span = save_btn.children[0];

        save_span.classList.remove("fa-pulse");
        save_span.classList.remove("fa-spinner");
        save_span.classList.add("fa-save");

        save_btn.parentElement.classList.remove("active");
      } else {
        const save_btn = document.getElementById("save");

        save_btn.classList.remove("fa-pulse");
        save_btn.classList.remove("fa-spinner");
        save_btn.classList.add("fa-exclamation");

        console.error("Couldn't save profile")
      }
    }
  };
  x.send(data);

  const save_btn = document.getElementById("save");
  const save_span = save_btn.children[0];
  save_span.classList.remove("fa-save");
  save_span.classList.add("fa-spinner");
  save_span.classList.add("fa-pulse");
};

window.addEventListener("DOMContentLoaded", init);