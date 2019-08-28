const init_edit_profile = () => {
  const profile_photo_container = document.getElementById("photo-container");

  profile_photo_container.addEventListener("click", () => {
    window.open("https://kb.northwestern.edu/internal/62391", "_blank");
  });
};

window.addEventListener("DOMContentLoaded", init_edit_profile);