/* NoAtMark app wiring: UI events, scan/clean/render, newsletter. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const input = $("input");
  const result = $("result");
  const emptyState = $("emptyState");
  const statsEl = $("stats");
  const charCount = $("charCount");
  const highlighted = $("highlighted");
  const scanBtn = $("scanBtn");
  const sampleBtn = $("sampleBtn");
  const clearBtn = $("clearBtn");
  const cleanBtn = $("cleanBtn");
  const copyCleanBtn = $("copyCleanBtn");
  const optKeepBom = $("optKeepBom");
  const optKeepSpecial = $("optKeepSpecial");
  const optKeepCtrl = $("optKeepCtrl");

  let lastScan = { text: "", matches: [], counts: {}, total: 0 };
  let cleanedText = "";

  const SAMPLE = "Hello​ World!\nThis line has a hidden zero‍ width joiner and a﻿ BOM.\nCopying from ChatGPT⁠ often drags these in.";

  function options() {
    return {
      keepBom: optKeepBom.checked,
      keepSpecial: optKeepSpecial.checked,
      keepCtrl: optKeepCtrl.checked,
    };
  }

  function scan() {
    const text = input.value;
    const res = scanner.scanText(text, options());
    lastScan = { text, matches: res.matches, counts: res.counts, total: res.total };
    if (emptyState) emptyState.classList.add("hidden");
    result.classList.remove("hidden");
    statsEl.innerHTML = statsHtml(res);
    highlighted.innerHTML = scanner.renderHighlight(text, res.matches, options());
    cleanedText = scanner.cleanText(text, options());
    copyCleanBtn.disabled = res.total === 0;
    copyCleanBtn.textContent = res.total === 0 ? "Copy cleaned" : `Copy cleaned (${res.total} removed)`;
  }

  function statsHtml(res) {
    if (!res.total) {
      return `<span class="clean-note">&#x2705; <b>0</b> invisible characters found — text is clean.</span>`;
    }
    const chips = Object.entries(res.counts)
      .map(([g, n]) => `<span class="chip">${g} &times; ${n}</span>`)
      .join("");
    return `<b>${res.total}</b> invisible character${res.total === 1 ? "" : "s"} found. ${chips}`;
  }

  function copyText(text) {
    return navigator.clipboard
      .writeText(text)
      .catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      });
  }

  scanBtn.addEventListener("click", scan);
  input.addEventListener("input", () => {
    if (charCount) charCount.textContent = input.value.length.toLocaleString() + " chars";
    if (result.classList.contains("hidden")) return;
    scan();
  });

  sampleBtn.addEventListener("click", () => {
    input.value = SAMPLE;
    if (charCount) charCount.textContent = SAMPLE.length.toLocaleString() + " chars";
    scan();
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    if (charCount) charCount.textContent = "0 chars";
    result.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    cleanedText = "";
    input.focus();
  });

  cleanBtn.addEventListener("click", async () => {
    await copyText(cleanedText);
    flash(cleanBtn, "Copied! Clean text is on your clipboard.");
  });

  copyCleanBtn.addEventListener("click", async () => {
    if (cleanedText) await copyText(cleanedText);
    flash(copyCleanBtn, "Copied!");
  });

  [optKeepBom, optKeepSpecial, optKeepCtrl].forEach((el) => el.addEventListener("change", scan));

  function flash(btn, text) {
    const prev = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = prev), 1600);
  }

  // Newsletter (front-end only stub; wire a backend/email service later).
  const nlForm = $("nlForm");
  const nlMsg = $("nlMsg");
  if (nlForm) {
    nlForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("nlEmail").value.trim();
      // TODO: POST to your email capture endpoint (e.g. a Worker or Formspree).
      nlMsg.classList.remove("hidden");
      nlMsg.textContent = `Thanks${email ? ", " + email.split("@")[0] : ""}! We'll let you know when Humanize ships.`;
      nlForm.reset();
    });
  }
})();
