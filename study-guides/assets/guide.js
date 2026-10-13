/* MAT 137 Calculus II — Study Guides
   Shared behaviour: expand/collapse solutions, "done" tracking saved in
   this browser, section progress in the sidebar, theme toggle. */
(function () {
  "use strict";

  var PREFIX = "mat137-sg:";

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll("[data-action='theme']").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      writeJSON(PREFIX + "theme", next);
    });
  });

  /* ---------- Index page: show saved progress on each card ---------- */
  document.querySelectorAll("[data-progress-for]").forEach(function (el) {
    var guide = el.getAttribute("data-progress-for");
    var total = parseInt(el.getAttribute("data-total"), 10) || 0;
    var done = readJSON(PREFIX + guide, []).length;
    if (done > total) done = total;
    var label = el.querySelector(".plabel-count");
    var bar = el.querySelector(".bar > span");
    if (label) label.textContent = done ? done + " of " + total + " done" : total + " problems";
    if (bar) bar.style.width = total ? (100 * done / total) + "%" : "0";
  });

  /* ---------- Open a reference panel when linked to directly ---------- */
  function openFromHash() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === "DETAILS") { el.open = true; el.scrollIntoView(); }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

  var guide = document.body.getAttribute("data-guide");
  if (!guide) return;

  var KEY = PREFIX + guide;
  var done = {};
  readJSON(KEY, []).forEach(function (id) { done[id] = true; });

  var problems = Array.prototype.slice.call(document.querySelectorAll(".prob"));
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));
  var progLabel = document.querySelector(".progress-label");
  var progBar = document.querySelector(".toolbar .bar > span");

  function save() { writeJSON(KEY, Object.keys(done)); }

  function update() {
    var n = 0;
    problems.forEach(function (p) { if (done[p.id]) n++; });
    if (progLabel) progLabel.innerHTML = "<b>" + n + "</b> of " + problems.length + " problems marked done";
    if (progBar) progBar.style.width = problems.length ? (100 * n / problems.length) + "%" : "0";
    sections.forEach(function (s) {
      var ps = s.querySelectorAll(".prob");
      var k = 0;
      ps.forEach(function (p) { if (done[p.id]) k++; });
      var c = document.querySelector('.toc a[href="#' + s.id + '"] .count');
      if (c) {
        c.textContent = k + "/" + ps.length;
        c.classList.toggle("full", k === ps.length && ps.length > 0);
      }
    });
  }

  problems.forEach(function (p) {
    var btn = p.querySelector(".mark");
    if (!btn) return;
    function paint() {
      var on = !!done[p.id];
      p.classList.toggle("is-done", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    paint();
    btn.addEventListener("click", function () {
      if (done[p.id]) delete done[p.id]; else done[p.id] = true;
      paint(); save(); update();
    });
  });
  update();

  /* ---------- Expand / collapse / reset ---------- */
  function setAll(open) {
    document.querySelectorAll("details.sol").forEach(function (d) { d.open = open; });
  }
  document.querySelectorAll("[data-action='expand']").forEach(function (b) { b.addEventListener("click", function () { setAll(true); }); });
  document.querySelectorAll("[data-action='collapse']").forEach(function (b) { b.addEventListener("click", function () { setAll(false); }); });
  document.querySelectorAll("[data-action='reset']").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!Object.keys(done).length) return;
      if (!window.confirm || window.confirm("Clear all “done” marks on this page?")) {
        done = {};
        save();
        problems.forEach(function (p) {
          p.classList.remove("is-done");
          var m = p.querySelector(".mark");
          if (m) m.setAttribute("aria-pressed", "false");
        });
        update();
      }
    });
  });

  /* ---------- Sidebar: highlight the section in view ---------- */
  var links = {};
  document.querySelectorAll(".toc a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var first = null;
      for (var i = 0; i < sections.length; i++) { if (visible[sections[i].id]) { first = sections[i].id; break; } }
      if (!first) return;
      Object.keys(links).forEach(function (id) { links[id].classList.toggle("active", id === first); });
    }, { rootMargin: "-70px 0px -55% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }
})();
