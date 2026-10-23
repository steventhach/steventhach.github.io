/* The Ask Index: small vanilla JS. No third-party scripts, no analytics, no storage. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  root.classList.remove("no-js"); root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal on scroll
  var els = d.querySelectorAll(".reveal-up");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add("in"); }); }

  // Real dates only: sleeps until Christmas, days to each date, advent doors (from the visitor's clock; no timers)
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function daysTo(y, m, dd) { return Math.round((new Date(y, m - 1, dd) - today) / 86400000); }
  var cn = d.getElementById("cnum");
  if (cn) { var x = daysTo(2026, 12, 25); cn.textContent = x > 0 ? String(x) : "0"; }
  d.querySelectorAll(".dates li[data-date]").forEach(function (li) {
    var p = li.getAttribute("data-date").split("-"), n = daysTo(+p[0], +p[1], +p[2]);
    var em = li.querySelector(".dleft");
    if (em) em.textContent = n > 1 ? n + " days away" : n === 1 ? "Tomorrow" : n === 0 ? "Today" : "Passed";
    var b = li.querySelector(".door");
    if (b) b.addEventListener("click", function () {
      var open = li.classList.toggle("open"); b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  if (today.getFullYear() === 2026 && today.getMonth() === 11) {
    d.querySelectorAll(".advent li[data-day]").forEach(function (li) {
      var day = +li.getAttribute("data-day");
      if (day < today.getDate()) li.classList.add("past"); else if (day === today.getDate()) li.classList.add("today");
    });
  }

  // Shelf-or-sleigh cards
  d.querySelectorAll("[data-flip]").forEach(function (card) {
    var b = card.querySelector(".sb-btn");
    if (b) b.addEventListener("click", function () {
      card.classList.add("open"); b.setAttribute("aria-expanded", "true");
      var a = card.querySelector(".sb-buy a"); if (a) a.focus({ preventScroll: true });
    });
  });

  // Before you wrap
  var fb = d.getElementById("forgot-btn");
  if (fb) fb.addEventListener("click", function () {
    fb.closest(".forgot").classList.add("open"); fb.setAttribute("aria-expanded", "true");
  });

  // Gift Finder: age is a hard filter, then interest (+3), gift type (+2), tie-break by rank
  var quiz = d.getElementById("quiz"), dataEl = d.getElementById("picks-data");
  if (!quiz || !dataEl) return;
  var picks = JSON.parse(dataEl.textContent), ans = {};
  var byAsin = {}; picks.forEach(function (p) { byAsin[p.asin] = p; });
  function score(p) {
    var t = p.tags;
    if (t.age.indexOf(ans.age) < 0) return -100;
    return (t.interest.indexOf(ans.interest) > -1 ? 3 : 0) + (t.gift.indexOf(ans.gift) > -1 ? 2 : 0);
  }
  function best() { return picks.slice().sort(function (a, b) { return score(b) - score(a) || a.rank - b.rank; })[0]; }
  function show(p) {
    var art = d.getElementById("art-" + p.asin), box = d.getElementById("rart");
    box.innerHTML = ""; if (art) box.appendChild(art.content.cloneNode(true));
    d.getElementById("rname").textContent = p.short;
    d.getElementById("rhook").textContent = p.hook;
    d.getElementById("rage").textContent = p.age;
    d.getElementById("rwarn").classList.toggle("on", !!p.warn); d.getElementById("rwarnt").textContent = p.warn || "";
    d.getElementById("rfor").textContent = p["for"];
    d.getElementById("rskip").textContent = p.skip;
    var cta = d.getElementById("rcta"); cta.href = p.url; cta.setAttribute("data-asin", p.asin);
    quiz.setAttribute("data-step", "3"); quiz.setAttribute("data-pick", p.asin);
    d.getElementById("rmsg").textContent = "";
    var r = d.getElementById("result"); if (r) r.focus({ preventScroll: true });
  }
  quiz.querySelectorAll(".q").forEach(function (q, i) {
    q.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        ans[q.getAttribute("data-q")] = b.getAttribute("data-v");
        if (i < 2) quiz.setAttribute("data-step", String(i + 1)); else show(best());
      });
    });
  });
  d.getElementById("rredo").addEventListener("click", function () { ans = {}; quiz.setAttribute("data-step", "0"); });

  function shareUrl(asin) {
    var c = d.querySelector('link[rel="canonical"]');
    var base = (c && c.href) || (location.origin + location.pathname);
    return base.split("#")[0].split("?")[0] + "?pick=" + encodeURIComponent(asin) + "#finder";
  }
  d.getElementById("rshare").addEventListener("click", function () {
    var asin = quiz.getAttribute("data-pick"), p = byAsin[asin]; if (!p) return;
    var u = shareUrl(asin), text = "Gift tag from The Ask Index: " + p.short + " (" + p.age + ").";
    var msg = d.getElementById("rmsg");
    if (navigator.share) {
      navigator.share({ title: "A gift idea from The Ask Index", text: text, url: u }).catch(function () {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(u).then(function () { msg.textContent = "Link copied. Send it to whoever's splitting the gift."; },
        function () { msg.textContent = "Copy this link: " + u; });
    } else { msg.textContent = "Copy this link: " + u; }
  });

  var m = /[?&]pick=([A-Z0-9]{10})/.exec(location.search);
  if (m && byAsin[m[1]]) show(byAsin[m[1]]);
})();
