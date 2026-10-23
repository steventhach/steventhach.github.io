/* Seoul Annotated v4 (K-pop album world): small vanilla JS. No third-party scripts, no analytics, no storage. */
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

  // Real holiday dates: days away (computed from the visitor's clock; no timers)
  d.querySelectorAll(".dates li[data-date]").forEach(function (li) {
    var p = li.getAttribute("data-date").split("-");
    var target = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = Math.round((target - now) / 86400000);
    var em = li.querySelector(".dleft");
    if (em) em.textContent = days > 0 ? "D-" + days : days === 0 ? "D-DAY" : "";
  });

  // Photocards: tap to flip (front art/photo, back = who it's for / skip + link)
  d.querySelectorAll("[data-pc]").forEach(function (pc) {
    var b = pc.querySelector(".pc-flip");
    function flip(ev) {
      if (ev && ev.target.closest("a")) return;
      var on = !pc.classList.contains("flipped");
      pc.classList.toggle("flipped", on); b.setAttribute("aria-pressed", on ? "true" : "false");
    }
    b.addEventListener("click", function (ev) { ev.stopPropagation(); flip(); });
    pc.querySelector(".pc-front").addEventListener("click", flip);
    pc.querySelector(".pc-back").addEventListener("click", function (ev) { if (!ev.target.closest("a,details,summary")) flip(ev); });
  });

  // Sticky lightstick bar: appears after the hero (never covers the hero CTAs)
  var hero = d.querySelector(".hero, .ahead"), bar = d.querySelector(".sticky");
  if (hero && bar && "IntersectionObserver" in window) {
    root.classList.add("js-sticky");
    new IntersectionObserver(function (en) { bar.classList.toggle("show", !en[0].isIntersecting); }, { rootMargin: "-120px 0px 0px 0px" }).observe(hero);
  }

  // Skip / buy cards (tap to reveal)
  d.querySelectorAll("[data-flip]").forEach(function (card) {
    var b = card.querySelector(".sb-btn");
    if (b) b.addEventListener("click", function () {
      card.classList.add("open"); b.setAttribute("aria-expanded", "true");
      var a = card.querySelector(".sb-buy a"); if (a) a.focus({ preventScroll: true });
    });
  });

  // The forgotten step (tap to reveal)
  var fb = d.getElementById("forgot-btn");
  if (fb) fb.addEventListener("click", function () {
    fb.closest(".forgot").classList.add("open"); fb.setAttribute("aria-expanded", "true");
  });

  // Bias Finder
  var quiz = d.getElementById("quiz"), dataEl = d.getElementById("picks-data");
  if (!quiz || !dataEl) return;
  var picks = JSON.parse(dataEl.textContent), ans = {}, order = ["skin", "concern", "feel"];
  var byAsin = {}; picks.forEach(function (p) { byAsin[p.asin] = p; });

  function score(p) {
    var s = 0, t = p.tags;
    if (t.skin.indexOf(ans.skin) > -1) s += 2;
    if (t.concern.indexOf(ans.concern) > -1) s += 3;
    if (t.feel.indexOf(ans.feel) > -1) s += 3;
    if (ans.skin === "sensitive" && t.skin.indexOf("sensitive") < 0) s -= 2;
    return s;
  }
  function best() {
    return picks.slice().sort(function (a, b) { return score(b) - score(a) || a.rank - b.rank; })[0];
  }
  function show(p) {
    var art = d.getElementById("art-" + p.asin);
    var box = d.getElementById("rart"); box.innerHTML = "";
    if (art) box.appendChild(art.content.cloneNode(true));
    d.getElementById("rname").textContent = p.short;
    d.getElementById("rhook").textContent = p.hook;
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
    var u = shareUrl(asin), text = "My bias pick from the Seoul Annotated Bias Finder: " + p.short + ".";
    var msg = d.getElementById("rmsg");
    if (navigator.share) {
      navigator.share({ title: "My bias pick", text: text, url: u }).catch(function () {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(u).then(function () { msg.textContent = "Link copied. Paste it anywhere to share your match."; },
        function () { msg.textContent = "Copy this link: " + u; });
    } else { msg.textContent = "Copy this link: " + u; }
  });

  // Shared link: ?pick=ASIN opens that result
  var m = /[?&]pick=([A-Z0-9]{10})/.exec(location.search);
  if (m && byAsin[m[1]]) show(byAsin[m[1]]);
})();
