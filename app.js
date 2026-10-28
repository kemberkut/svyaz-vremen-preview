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
requestDialog.innerHTML = '<button class="dialog-close" type="button" aria-label="Закрыть"><img src="assets/icons/close.svg?v=bi-1.13.2" alt=""></button><h2 id="request-title">Подберём вашу квартиру</h2><p>Сколько комнат вам нужно? Оставьте телефон — расскажем о подходящих планировках.</p><div class="room-select" aria-label="Количество комнат"><button type="button" aria-pressed="true" data-rooms="1">1-комнатная</button><button type="button" aria-pressed="false" data-rooms="2">2-комнатная</button><button type="button" aria-pressed="false" data-rooms="3">3-комнатная</button></div>';
const quickForm = mainForm.cloneNode(true);
$("[type=submit]", quickForm).innerHTML = 'Получить подборку <span class="arrow" aria-hidden="true">→</span>';
quickForm.insertAdjacentHTML("beforeend", '<input type="hidden" name="purpose" value="Подбор квартиры за минуту"><input type="hidden" name="rooms" value="1">');
quickForm.addEventListener("submit", submitForm); requestDialog.append(quickForm); document.body.append(requestDialog);
$(".dialog-close", requestDialog).addEventListener("click", () => requestDialog.close());
requestDialog.addEventListener("click", event => { if (event.target === requestDialog) requestDialog.close(); });
$$('.room-select button', requestDialog).forEach(button => button.addEventListener("click", () => {
  $$('.room-select button', requestDialog).forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  $('[name=rooms]', quickForm).value = button.dataset.rooms;
}));
$(".hero-buttons .button-outline").addEventListener("click", () => { requestDialog.showModal(); goal("open_quick_selection"); });

// Only verified 3-room values are published; other types are a request, not invented prices.
const originalDetails = {
  price: $(".apartment-price").innerHTML, description: $(".apartment-details .intro").textContent
};
$(".apartment-tabs").setAttribute("role", "tablist");
$(".apartment-card").id = "apartment-panel";
$(".apartment-card").setAttribute("role", "tabpanel");
$$('.apartment-tabs button').forEach((button, index) => {
  button.setAttribute("role", "tab"); button.setAttribute("aria-selected", String(index === 2));
  button.id = `apartment-tab-${index + 1}`; button.setAttribute("aria-controls", "apartment-panel");
  button.tabIndex = index === 2 ? 0 : -1;
  button.addEventListener("keydown", event => {
    const tabs = $$('.apartment-tabs button');
    let target;
    if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") target = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === "Home") target = tabs[0];
    if (event.key === "End") target = tabs[tabs.length - 1];
    if (target) { event.preventDefault(); target.click(); target.focus(); }
  });
  button.addEventListener("click", () => {
    $$('.apartment-tabs button').forEach(item => { item.classList.toggle("active", item === button); item.setAttribute("aria-selected", String(item === button)); item.tabIndex = item === button ? 0 : -1; });
    $(".apartment-card").setAttribute("aria-labelledby", button.id);
    $(".apartment-details .eyebrow span").textContent = button.textContent;
    $(".apartment-price").innerHTML = index === 2 ? originalDetails.price : '<p>0 м²</p><p>0 ₽</p>';
    $(".apartment-details .intro").textContent = index === 2 ? originalDetails.description : "Подготовим актуальные планировки, цены и наличие для выбранного типа квартиры.";
    $(".amenity-list").hidden = index !== 2; $(".discount").hidden = index !== 2; $(".plan-thumbnail").hidden = index !== 2;
  });
});
$(".apartment-card").setAttribute("aria-labelledby", "apartment-tab-3");

const neighborDescription = $(".neighbor-copy").innerHTML;
const neighborRows = $$('.neighbor-list li');
let touchNeighbor = null;
function highlightNeighbor(id) {
  $$('[data-neighbor]').forEach(element => {
    const active = element.dataset.neighbor === id;
    element.classList.toggle("is-active", active);
    if (element.matches('button,li')) element.setAttribute("aria-pressed", String(active));
  });
  const row = neighborRows.find(item => item.dataset.neighbor === id);
  if (!row || id === '5') $(".neighbor-copy").innerHTML = neighborDescription;
  else {
    $(".neighbor-copy h3").textContent = $(".neighbor-name", row).textContent;
    $(".neighbor-copy p").textContent = `На схеме квартала — точка ${id}.`;
    $(".neighbor-copy .eyebrow span").textContent = "Исторический квартал";
  }
  $(".neighbor-art").hidden = Boolean(row && id !== '5');
}
$$('[data-neighbor]').forEach(element => {
  if (element.tagName === 'LI') { element.tabIndex = 0; element.setAttribute('role', 'button'); element.setAttribute('aria-pressed', 'false'); }
  element.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') highlightNeighbor(element.dataset.neighbor); });
  element.addEventListener('pointerleave', event => {
    if (event.relatedTarget?.closest?.('[data-neighbor]')?.dataset.neighbor !== element.dataset.neighbor) highlightNeighbor(touchNeighbor);
  });
  element.addEventListener('focus', () => highlightNeighbor(element.dataset.neighbor));
  element.addEventListener('blur', () => highlightNeighbor(touchNeighbor));
  element.addEventListener('click', () => {
    if (!window.matchMedia('(hover:hover)').matches) {
      touchNeighbor = touchNeighbor === element.dataset.neighbor ? null : element.dataset.neighbor;
      highlightNeighbor(touchNeighbor);
    } else highlightNeighbor(element.dataset.neighbor);
  });
  element.addEventListener('keydown', event => {
    if (element.tagName === 'LI' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); element.click(); }
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
$(".gallery-controls").innerHTML = '<button class="button button-outline" type="button">Рассмотреть иллюстрацию <span class="arrow" aria-hidden="true">→</span></button>';
$(".gallery-controls button").addEventListener("click", () => showImage($("#restoration .section-backdrop")));

// Native mortgage controls; rate remains unselected until the visitor chooses an illustrative value.
const rangeFields = $$('.calculator .range-field');
const rangeSpecs = [{min:11090000,max:50000000,value:28200000,step:10000,label:"Стоимость квартиры"}, {min:10,max:90,value:59,step:1,label:"Первый взнос"}];
rangeFields.forEach((field, index) => {
  const spec = rangeSpecs[index];
  $(".static-range", field).outerHTML = `<input class="native-range" type="range" min="${spec.min}" max="${spec.max}" value="${spec.value}" step="${spec.step}" aria-label="${spec.label}">`;
});
const selections = $$('.calculator .static-select');
$("div", selections[0]).outerHTML = '<select class="native-select" aria-label="Срок кредита"><option value="">Выберите срок</option><option value="10">10 лет</option><option value="15">15 лет</option><option value="20">20 лет</option><option value="25">25 лет</option><option value="30">30 лет</option></select>';
$("div", selections[1]).outerHTML = '<select class="native-select" aria-label="Ставка"><option value="">Выберите ставку</option><option value="6">6% — пример расчёта</option><option value="15">15% — пример расчёта</option><option value="20">20% — пример расчёта</option><option value="25">25% — пример расчёта</option></select>';
$(".calculator-result .caption").textContent = "Пример расчёта. Не является предложением банка.";
function calculate() {
  const cost = Number($("input", rangeFields[0]).value), down = Number($("input", rangeFields[1]).value);
  const years = Number($("select", selections[0]).value), rate = Number($("select", selections[1]).value);
  const initial = cost * down / 100, loan = cost - initial;
  $("strong", rangeFields[0]).textContent = `${money.format(cost)} ₽`; $("strong", rangeFields[1]).textContent = `${down}%`;
  const details = $$('.calculator-result dd'); details[0].textContent = `${money.format(loan)} ₽`; details[1].textContent = `${money.format(initial)} ₽`;
  if (years && rate) { const monthly = rate / 1200, periods = years * 12; const payment = loan * monthly / (1 - (1 + monthly) ** -periods); $(".monthly-payment").textContent = `${money.format(payment)} ₽`; $(".calculator-result>p").textContent = "Ориентировочно в месяц"; }
  else { $(".monthly-payment").textContent = "0 ₽"; $(".calculator-result>p").textContent = "После выбора срока и ставки"; }
}
$$('.calculator input,.calculator select').forEach(control => control.addEventListener("input", calculate));
calculate();

function messenger(button, type) {
  const url = type === "max" ? siteConfig.maxUrl : siteConfig.telegramUrl;
  if (url && /^https:\/\//.test(url)) { window.open(url, "_blank", "noopener,noreferrer"); goal(`messenger_${type}`); }
  else toast("Позвоните нам: +7 (919) 077-44-44. Поможем с вашим вопросом.");
}
$$('.messenger-buttons button,.contact-messengers button').forEach(button => button.addEventListener("click", () => messenger(button, /MAX/.test(button.textContent) ? "max" : "telegram")));
$$('a[href^="tel:"]').forEach(link => link.addEventListener("click", () => goal("phone_click")));
$$('.footer-links>span').forEach(item => { item.tabIndex = 0; item.setAttribute("role", "button"); item.addEventListener("click", () => toast("По вопросам обработки данных позвоните: +7 (919) 077-44-44.")); });

// This static preview never submits visitor data or loads analytics.
siteConfig = {smtpConfigured:false, metrikaId:null, telegramUrl:"", maxUrl:""};
$$('[data-preview-submit]').forEach(button => { button.disabled = false; });
