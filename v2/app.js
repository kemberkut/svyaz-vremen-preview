"use strict";

let siteConfig = {};
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

function goal(name) {
  if (siteConfig.metrikaId && typeof window.ym === "function") window.ym(siteConfig.metrikaId, "reachGoal", name);
}

function scrollToForm(purpose = "Запись на встречу") {
  const form = $("#appointment form");
  let input = $("[name=purpose]", form);
  if (!input) {
    input = document.createElement("input"); input.type = "hidden"; input.name = "purpose"; form.append(input);
  }
  input.value = purpose;
  window.scrollTo({top: $("#appointment").getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth"});
  goal("open_request");
}

function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const status = $(".form-status", form);
  status.className = "form-status";
  status.textContent = "Демонстрационная версия: заявки не отправляются. Позвоните нам: +7 (919) 077-44-44.";
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
$(".hero-buttons .button-outline").addEventListener("click", () => { requestDialog.showModal(); goal("open_quick_selection"); });

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
function showImage(image) { $(".preview-image", imageDialog).src = image.src; $(".preview-image", imageDialog).alt = image.alt; $("p", imageDialog).textContent = image.alt; imageDialog.showModal(); }
$(".dialog-close", imageDialog).addEventListener("click", () => imageDialog.close());
imageDialog.addEventListener("click", event => { if (event.target === imageDialog) imageDialog.close(); });
$$('.media-frame img').filter(image => !image.closest('.neighborhood-map')).forEach(image => image.addEventListener("click", () => showImage(image)));
$$("[data-enlarge]").forEach(button => {
  button.addEventListener("click", () => {
    const picture = $("img", document.getElementById(button.dataset.enlarge));
    showImage(picture);
  });
});

const mortgage = {
  cost: $("#mortgage-cost"),
  down: $("#mortgage-down"),
  term: $("#mortgage-years"),
  rate: $("#mortgage-rate")
};
const monthlyOutput = $(".monthly-payment");
const mortgageNote = $("[data-payment-note]");
const asRubles = value => money.format(value) + " ₽";

function readMortgageCost(value) {
  const digits = value.replace(/\s/g, "").replace(/₽$/, "");
  return /^\d+$/.test(digits) ? Number(digits) : NaN;
}

function annuityPayment(principal, yearlyRate, months) {
  if (yearlyRate === 0) return principal / months;
  const rate = yearlyRate / 1200;
  return principal * rate / -Math.expm1(-months * Math.log1p(rate));
}

function calculate() {
  const cost = readMortgageCost(mortgage.cost.value);
  const down = mortgage.down.valueAsNumber;
  const years = Number(mortgage.term.value);
  const rate = mortgage.rate.valueAsNumber;
  const validCost = Number.isSafeInteger(cost) && cost > 0;
  const validRate = Number.isFinite(rate) && mortgage.rate.validity.valid;
  const initial = validCost ? Math.round(cost * down / 100) : 0;
  const principal = validCost ? cost - initial : 0;

  $("#mortgage-down-label").textContent = down + "%";
  $("[data-down-payment]").textContent = asRubles(initial);
  $("[data-principal]").textContent = asRubles(principal);
  mortgage.cost.setAttribute("aria-invalid", String(!validCost));
  mortgage.rate.setAttribute("aria-invalid", String(!mortgage.rate.validity.valid));

  let payment = 0;
  let note = "Укажите срок и ставку";
  if (!validCost) {
    note = "Введите стоимость квартиры";
  } else if (principal === 0) {
    note = "Полная оплата";
  } else if (!mortgage.rate.validity.valid) {
    note = "Введите годовую ставку от 0 до 100%";
  } else if (years && validRate) {
    payment = annuityPayment(principal, rate, years * 12);
    note = "Ориентировочно в месяц";
  }
  monthlyOutput.textContent = asRubles(payment);
  mortgageNote.textContent = note;
}

function updateMortgageCost() {
  const field = mortgage.cost;
  const cost = readMortgageCost(field.value);
  if (Number.isSafeInteger(cost)) {
    const formatted = money.format(cost);
    if (formatted !== field.value) {
      // Keep the same number of digits after the caret when the spaces move.
      let remaining = field.value.slice(field.selectionEnd).replace(/\D/g, "").length;
      let caret = formatted.length;
      while (caret > 0 && remaining > 0) {
        caret -= 1;
        if (/\d/.test(formatted[caret])) remaining -= 1;
      }
      field.value = formatted;
      field.setSelectionRange(caret, caret);
    }
  }
  calculate();
}

mortgage.cost.addEventListener("input", event => {
  if (!event.isComposing) updateMortgageCost();
});
mortgage.cost.addEventListener("compositionend", updateMortgageCost);
mortgage.cost.addEventListener("beforeinput", event => {
  const field = mortgage.cost;
  const caret = field.selectionStart;
  if (!event.cancelable || caret !== field.selectionEnd) return;

  // A delete next to a separator removes the adjacent digit as well.
  if (event.inputType === "deleteContentBackward" && /\d\s$/.test(field.value.slice(0, caret))) {
    event.preventDefault();
    field.setRangeText("", caret - 2, caret, "end");
  } else if (event.inputType === "deleteContentForward" && /^\s\d/.test(field.value.slice(caret))) {
    event.preventDefault();
    field.setRangeText("", caret, caret + 2, "end");
  } else {
    return;
  }
  updateMortgageCost();
});
[mortgage.down, mortgage.term, mortgage.rate].forEach(control => control.addEventListener("input", calculate));
updateMortgageCost();

function messenger(button, type) {
  const url = type === "max" ? siteConfig.maxUrl : siteConfig.telegramUrl;
  if (url && /^https:\/\//.test(url)) { window.open(url, "_blank", "noopener,noreferrer"); goal(`messenger_${type}`); }
  else toast("Позвоните нам: +7 (919) 077-44-44. Поможем с вашим вопросом.");
}
$$('.messenger-buttons button,.contact-messengers button').forEach(button => button.addEventListener("click", () => messenger(button, /MAX/.test(button.textContent) ? "max" : "telegram")));
$$('a[href^="tel:"]').forEach(link => link.addEventListener("click", () => goal("phone_click")));

// This static preview never submits visitor data or loads analytics.
siteConfig = {smtpConfigured:false, metrikaId:null, telegramUrl:"", maxUrl:""};
$$('[data-preview-submit]').forEach(button => { button.disabled = false; });
