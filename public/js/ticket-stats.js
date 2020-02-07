const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const init = () => {
  document.getElementById("start-month").addEventListener("change", change);
  document.getElementById("end-month").addEventListener("change", change);

  document.getElementById("start-year").addEventListener("change", change_year);
  document.getElementById("end-year").addEventListener("change", change_year);
};

const is_leap_year = year => {
  return (year % 4 === 0 && !(year % 100 === 0)) || (year % 4 === 0 && year % 400 === 0 && year % 100 === 0);
};

const num_days = (month, year) => {
  switch (month) {
    case "January": 
    case "March": 
    case "May": 
    case "July": 
    case "August":
    case "October": 
    case "December": {
      return 31;
    }
    case "April":
    case "June": 
    case "September": 
    case "November": {
      return 30;
    }
    case "February": {
      return is_leap_year(year) ? 29 : 28;
    }
    default: {
      return -1;
    }
  }
};

const change_year = e => {
  const el = e.currentTarget;

  if (el.id === "start-year") {
    return change({currentTarget: document.getElementById("start-month")});
  } else if (el.id === "end-year") {
    return change({currentTarget: document.getElementById("end-month")});
  }
}

const change = e => {
  const el = e.currentTarget;

  let date, year;
  if (el.id === "start-month") {
    date = document.getElementById("start-date");
    year = document.getElementById("start-year");
  } else if (el.id === "end-month") {
    date = document.getElementById("end-date");
    year = document.getElementById("end-year");
  }

  const old_date = parseInt(date.value);

  while (date.firstElementChild)
    date.removeChild(date.firstElementChild);

  const days = num_days(MONTHS[parseInt(el.value) - 1], parseInt(year.value));
  const select_1 = old_date > days;

  for (let i = 1; i <= days; ++i) {
    const day = document.createElement("option");
    day.value = `${i}`;
    day.textContent = `${i}`;
    
    if ((select_1 && i === 1) || i === old_date) 
      day.selected = true;

    date.appendChild(day);
  }
};

window.addEventListener("DOMContentLoaded", init);