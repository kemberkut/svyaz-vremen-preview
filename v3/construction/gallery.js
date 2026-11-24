"use strict";

const viewer = document.getElementById("construction-viewer");

if (typeof viewer.showModal === "function") {
  const preview = viewer.querySelector(".preview-image");
  const caption = viewer.querySelector("[role=status]");
  const previous = viewer.querySelector("[data-previous]");
  const next = viewer.querySelector("[data-next]");
  let photos = [];
  let index = 0;
  let monthName = "";

  function showPhoto(position) {
    index = (position + photos.length) % photos.length;
    const photo = photos[index];
    preview.alt = photo.querySelector("img").alt;
    preview.src = photo.href;
    caption.textContent = monthName + " · " + (index + 1) + " из " + photos.length;
  }

  document.querySelector("[data-construction-archive]").addEventListener("click", event => {
    const link = event.target.closest(".construction-photo-grid a");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const month = link.closest(".construction-month");
    photos = [...month.querySelectorAll(".construction-photo-grid a")];
    monthName = month.querySelector("h2").textContent.trim();
    previous.disabled = next.disabled = photos.length < 2;
    showPhoto(photos.indexOf(link));
    viewer.showModal();
  });

  previous.addEventListener("click", () => showPhoto(index - 1));
  next.addEventListener("click", () => showPhoto(index + 1));
  viewer.querySelector(".dialog-close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("keydown", event => {
    const direction = {ArrowLeft: -1, ArrowRight: 1}[event.key];
    if (!direction || photos.length < 2) return;
    event.preventDefault();
    showPhoto(index + direction);
  });
  viewer.addEventListener("close", () => preview.removeAttribute("src"));
}
