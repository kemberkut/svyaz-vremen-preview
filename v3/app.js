"use strict";

const money = new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 0});
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
let toastTimer;

function toast(message) {
  const element = $(".toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 6500);
}

function scrollToForm(purpose = "Запись на встречу") {
  const form = $("#appointment form");
  let input = $("[name=purpose]", form);
  if (!input) {
    input = document.createElement("input"); input.type = "hidden"; input.name = "purpose"; form.append(input);
  }
  input.value = purpose;
  window.scrollTo({top: $("#appointment").getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth"});
}

function submitForm(event) {
  event.preventDefault();
  $(".form-status", event.currentTarget).focus();
}

const mainForm = $(".appointment-form");
mainForm.addEventListener("submit", submitForm);
$(".header .button").addEventListener("click", () => scrollToForm("Получить планировки"));
$(".hero-buttons .button").addEventListener("click", () => scrollToForm("Планировки и цены"));
$$('a[href="#appointment"]').forEach(link => link.addEventListener("click", event => { event.preventDefault(); scrollToForm(link.textContent.trim()); }));

const menuButton = document.createElement("button");
menuButton.type = "button"; menuButton.className = "menu-toggle"; menuButton.innerHTML = '<img src="assets/icons/menu.svg?v=bi-1.13.2" alt="">';
menuButton.setAttribute("aria-label", "Открыть меню"); menuButton.setAttribute("aria-expanded", "false");
const navigation = $(".navigation"); navigation.id = "site-navigation";
menuButton.setAttribute("aria-controls", navigation.id);
$(".header").insertBefore(menuButton, $(".header-actions"));
menuButton.addEventListener("click", () => {
  const opened = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(opened));
  menuButton.setAttribute("aria-label", opened ? "Закрыть меню" : "Открыть меню");
  menuButton.innerHTML = `<img src="assets/icons/${opened ? 'close' : 'menu'}.svg?v=bi-1.13.2" alt="">`;
});
$$('a', navigation).forEach(link => link.addEventListener("click", () => {
  navigation.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); menuButton.setAttribute("aria-label", "Открыть меню"); menuButton.innerHTML = '<img src="assets/icons/menu.svg?v=bi-1.13.2" alt="">';
}));

const requestDialog = document.createElement("dialog");
requestDialog.className = "request-dialog"; requestDialog.setAttribute("aria-labelledby", "request-title");
requestDialog.innerHTML = '<button class="dialog-close" type="button" aria-label="Закрыть"><img src="assets/icons/close.svg?v=bi-1.13.2" alt=""></button><h2 id="request-title">Подберём вашу квартиру</h2><p>Какой тип квартиры вам подходит? Оставьте телефон — расскажем о подходящих планировках.</p><div class="room-select" aria-label="Количество комнат"><button type="button" aria-pressed="true" data-rooms="Студия">Студия</button><button type="button" aria-pressed="false" data-rooms="1">1 комната</button><button type="button" aria-pressed="false" data-rooms="2">2 комнаты</button><button type="button" aria-pressed="false" data-rooms="3">3 комнаты</button></div>';
const quickForm = mainForm.cloneNode(true);
$("[type=submit]", quickForm).innerHTML = 'Получить подборку <span class="arrow" aria-hidden="true">→</span>';
quickForm.insertAdjacentHTML("beforeend", '<input type="hidden" name="purpose" value="Подбор квартиры за минуту"><input type="hidden" name="rooms" value="Студия">');
quickForm.addEventListener("submit", submitForm); requestDialog.append(quickForm); document.body.append(requestDialog);
$(".dialog-close", requestDialog).addEventListener("click", () => requestDialog.close());
requestDialog.addEventListener("click", event => { if (event.target === requestDialog) requestDialog.close(); });
$$('.room-select button', requestDialog).forEach(button => button.addEventListener("click", () => {
  $$('.room-select button', requestDialog).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  $('[name=rooms]', quickForm).value = button.dataset.rooms;
}));
$(".hero-buttons .button-outline").addEventListener("click", () => { requestDialog.showModal(); });

const flatCatalog = JSON.parse($("#flat-catalog").textContent);
const flatTabs = $$('.apartment-tabs button');
const flatPanel = $(".apartment-card");
const flatInterior = $(".apartment-original", flatPanel);
const flatPlan = $(".plan-thumbnail img", flatPanel);
$(".apartment-tabs").setAttribute("role", "tablist");
flatPanel.id = "apartment-panel";
flatPanel.setAttribute("role", "tabpanel");

function showFlat(button) {
  const flat = flatCatalog[button.dataset.flatType];
  flatTabs.forEach(tab => {
    const selected = tab === button;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  flatPanel.setAttribute("aria-labelledby", button.id);
  $(".apartment-details .eyebrow span").textContent = flat.label;
  $("[data-flat-area]").textContent = flat.area + " м²";
  $("[data-flat-price]").textContent = flat.price === null ? "" : money.format(flat.price) + " ₽";
  $("[data-flat-caption]").textContent = "Квартира № " + flat.number + " · пример из каталога застройщика.";
  $("[data-flat-link]").href = flat.href;

  flatInterior.width = flat.width;
  flatInterior.height = flat.height;
  flatInterior.srcset = flat.interiorSet;
  flatInterior.src = flat.interior;
  flatPlan.width = flat.planWidth;
  flatPlan.height = flat.planHeight;
  flatPlan.alt = "План квартиры № " + flat.number;
  flatPlan.src = flat.plan;
}

flatTabs.forEach((button, index) => {
  button.id = "apartment-tab-" + button.dataset.flatType;
  button.setAttribute("role", "tab");
  button.setAttribute("aria-controls", flatPanel.id);
  button.addEventListener("click", () => showFlat(button));
  button.addEventListener("keydown", event => {
    const destinations = {
      ArrowRight: (index + 1) % flatTabs.length,
      ArrowLeft: (index + flatTabs.length - 1) % flatTabs.length,
      Home: 0,
      End: flatTabs.length - 1
    };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    const target = flatTabs[destinations[event.key]];
    showFlat(target);
    target.focus();
  });
});
showFlat(flatTabs.find(tab => tab.classList.contains("active")));

const neighborItems = $$("[data-neighbor]");
const neighborRows = $$(".neighbor-list li");
const neighborCard = $(".neighbor-copy");
let selectedNeighbor = null;

function highlightNeighbor(id) {
  neighborItems.forEach(element => {
    const active = element.dataset.neighbor === id;
    element.classList.toggle("is-active", active);
    element.setAttribute("aria-pressed", String(active));
  });

  const row = neighborRows.find(item => item.dataset.neighbor === id) || neighborRows[0];
  $(".eyebrow span", neighborCard).textContent = row.dataset.street;
  $("h3", neighborCard).textContent = $(".neighbor-name", row).textContent;
  $("p", neighborCard).textContent = row.dataset.description;
  $(".neighbor-link", neighborCard).href = row.dataset.href;
  $(".neighbor-art").hidden = row.dataset.neighbor !== "1";
}

neighborItems.forEach(element => {
  if (element.tagName === "LI") {
    element.tabIndex = 0;
    element.setAttribute("role", "button");
  }

  element.addEventListener("pointerenter", event => {
    if (event.pointerType !== "touch") highlightNeighbor(element.dataset.neighbor);
  });
  element.addEventListener("pointerleave", event => {
    if (event.relatedTarget?.closest?.("[data-neighbor]")?.dataset.neighbor !== element.dataset.neighbor) {
      highlightNeighbor(selectedNeighbor);
    }
  });
  element.addEventListener("focus", () => highlightNeighbor(element.dataset.neighbor));
  element.addEventListener("blur", () => highlightNeighbor(selectedNeighbor));
  element.addEventListener("click", () => {
    const id = element.dataset.neighbor;
    selectedNeighbor = selectedNeighbor === id ? null : id;
    highlightNeighbor(selectedNeighbor);
  });
  element.addEventListener("keydown", event => {
    if (element.tagName === "LI" && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      element.click();
    }
  });
});
highlightNeighbor(null);

const imageDialog = document.createElement("dialog"); imageDialog.className = "image-dialog";
imageDialog.setAttribute("aria-label", "Просмотр изображения");
imageDialog.innerHTML = '<button class="dialog-close" type="button" aria-label="Закрыть"><img src="assets/icons/close.svg?v=bi-1.13.2" alt=""></button><img class="preview-image" alt=""><p></p>';
document.body.append(imageDialog);
function showImage(image) { $(".preview-image", imageDialog).src = image.dataset.fullSrc || image.src; $(".preview-image", imageDialog).alt = image.alt; $("p", imageDialog).textContent = image.alt; imageDialog.showModal(); }
$(".dialog-close", imageDialog).addEventListener("click", () => imageDialog.close());
imageDialog.addEventListener("click", event => { if (event.target === imageDialog) imageDialog.close(); });
$$('.media-frame img').filter(image => !image.closest('.neighborhood-map, .restoration-enlarge, .construction-cards')).forEach(image => image.addEventListener("click", () => showImage(image)));
const restorationButton = $(".restoration-enlarge");
restorationButton.addEventListener("click", () => showImage($("img", restorationButton)));
$(".construction-cards").addEventListener("click", event => {
  if (event.target.matches("img")) showImage(event.target);
});

// Enable preview controls only after both forms have a local submit handler.
$$("[data-preview-submit]").forEach(button => { button.disabled = false; });
