"use strict";

(() => {
  const reportsUrl = new URL("reports.json", document.currentScript.src);
  const root = new URL("../", reportsUrl);
  const preview = document.querySelector(".construction-cards");
  const archive = document.querySelector("[data-construction-archive]");
  const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
    month: "long", year: "numeric", timeZone: "UTC"
  });

  function monthName(month) {
    const text = monthFormatter.format(new Date(month + "-01T00:00:00Z")).replace(/\s*г\.$/, "");
    return text[0].toUpperCase() + text.slice(1);
  }

  function element(tag, classes, text) {
    const node = document.createElement(tag);
    if (classes) node.className = classes;
    if (text) node.textContent = text;
    return node;
  }

  function image(photo) {
    const node = element("img");
    node.src = new URL(photo.thumb || photo.src, root);
    node.alt = photo.alt;
    if (photo.width && photo.height) {
      node.width = photo.width;
      node.height = photo.height;
    }
    node.loading = "lazy";
    node.decoding = "async";
    return node;
  }

  function previewCard(photo, month) {
    const card = element("figure");
    const wrapper = element("div", "construction-image");
    const frame = element("div", "media-frame");
    const thumbnail = image(photo);
    thumbnail.dataset.fullSrc = new URL(photo.src, root);
    frame.append(thumbnail);
    wrapper.append(frame);
    card.append(wrapper, element("figcaption", "", monthName(month)));
    return card;
  }

  function galleryMonth(report) {
    const month = element("section", "construction-month");
    month.id = report.month;
    const heading = element("h2");
    heading.id = "month-" + report.month;
    month.setAttribute("aria-labelledby", heading.id);
    const date = element("time", "", monthName(report.month));
    date.dateTime = report.month;
    heading.append(date);
    const list = element("ul", "construction-photo-grid");
    for (const photo of report.photos) {
      const item = element("li");
      const link = element("a");
      link.href = new URL(photo.src, root);
      link.append(image(photo));
      item.append(link);
      list.append(item);
    }
    month.append(heading, list);
    if (report.source) {
      const source = element("a", "v2-text-link construction-photo-source", "Источник фотоотчёта →");
      source.href = report.source;
      source.target = "_blank";
      source.rel = "noopener";
      month.append(source);
    }
    return month;
  }

  async function loadReports() {
    const target = preview || archive;
    try {
      const response = await fetch(reportsUrl, {cache: "no-cache"});
      if (!response.ok) throw new Error("Не удалось загрузить список");
      const reports = (await response.json())
        .filter(report => /^\d{4}-(0[1-9]|1[0-2])$/.test(report.month) && report.photos?.length)
        .sort((a, b) => b.month.localeCompare(a.month));
      if (!reports.length) throw new Error("Список фотоотчётов пуст");

      if (preview) {
        const latest = reports[0];
        const featured = latest.featured?.map(number => latest.photos[number - 1]).filter(Boolean);
        const photos = featured?.length ? featured : latest.photos;
        preview.replaceChildren(...photos.slice(0, 4).map(photo => previewCard(photo, latest.month)));
      } else {
        archive.replaceChildren(...reports.map(galleryMonth));
        const month = document.getElementById(location.hash.slice(1));
        if (month?.classList.contains("construction-month")) month.scrollIntoView();
      }
    } catch {
      const status = target.querySelector("[data-construction-status]");
      status.textContent = "Фотоотчёты временно недоступны. ";
      const source = element("a", "v2-text-link", "Посмотреть у застройщика →");
      source.href = "https://svyaz-vremen.ru/construction/";
      source.target = "_blank";
      source.rel = "noopener";
      status.append(source);
    } finally {
      target.removeAttribute("aria-busy");
    }
  }

  if (preview || archive) loadReports();
})();
