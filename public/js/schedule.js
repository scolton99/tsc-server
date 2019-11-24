const date = new Date();
date.setMinutes(date.getMinutes() + (5 - date.getMinutes() % 5));
date.setSeconds(0);
console.log(date.toString());

window.setTimeout(() => (location.reload()), date.getTime() - (new Date()).getTime());