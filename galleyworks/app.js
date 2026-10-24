/* The Galley Works v4 (crew room): first-party, no tracking, no network calls. */
(function () {
  "use strict";
  var d = document;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Facebook-ad attribution: rewrite Amazon tags to galleyworks-facebook-20 on this path only.
  // Signals: utm_source=facebook|fb, or utm_medium=paid_social with facebook in source/campaign, or fbclid.
  // Persist in sessionStorage so in-site navigation keeps attribution. Organic keeps placement tags.
  (function () {
    var FB_TAG = "galleyworks-facebook-20";
    var KEY = "gw_fb_ad";
    function params() {
      try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); }
    }
    function detect() {
      var q = params();
      var src = (q.get("utm_source") || "").toLowerCase();
      var med = (q.get("utm_medium") || "").toLowerCase();
      var camp = (q.get("utm_campaign") || "").toLowerCase();
      if (src === "facebook" || src === "fb") return true;
      if (med === "paid_social" && (src.indexOf("facebook") > -1 || src.indexOf("fb") > -1 || camp.indexOf("facebook") > -1 || camp.indexOf("fb") > -1)) return true;
      if (q.get("fbclid")) return true;
      return false;
    }
    var on = false;
    try {
      if (detect()) { sessionStorage.setItem(KEY, "1"); on = true; }
      else { on = sessionStorage.getItem(KEY) === "1"; }
    } catch (e) { on = detect(); }
    if (!on) return;
    function rewrite(href) {
      if (!href || href.indexOf("amazon.") === -1) return href;
      return href.replace(/([?&])tag=[a-z0-9-]+/i, function (_m, p) { return p + "tag=" + FB_TAG; });
    }
    d.querySelectorAll('a[href*="amazon."]').forEach(function (a) {
      var h = a.getAttribute("href");
      if (!h) return;
      var n = rewrite(h);
      if (n !== h) { a.setAttribute("href", n); a.setAttribute("data-fb-tag", FB_TAG); }
    });
    var dataEl = d.getElementById("gw-data");
    if (dataEl) {
      try {
        var DATA = JSON.parse(dataEl.textContent);
        Object.keys(DATA.products || {}).forEach(function (asin) {
          if (DATA.products[asin].url) DATA.products[asin].url = rewrite(DATA.products[asin].url);
        });
        dataEl.textContent = JSON.stringify(DATA);
      } catch (e) {}
    }
    // Keep later quiz CTA writes on the FB tag
    d.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="amazon."]');
      if (!a) return;
      var h = a.getAttribute("href"), n = rewrite(h);
      if (n !== h) a.setAttribute("href", n);
    }, true);
  })();

  // Real holiday dates: T-minus days (computed from the visitor's own clock; no fake timers).
  d.querySelectorAll(".strip[data-date]").forEach(function (li) {
    var p = li.getAttribute("data-date").split("-"), t = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = Math.round((t - now) / 864e5), em = li.querySelector("em");
    if (em) em.textContent = days > 1 ? "T-" + days + "d" : days === 1 ? "Tomorrow" : days === 0 ? "Today" : "";
  });
  // Departures board: visitor's local time + split-flap settle when the board scrolls into view.
  var clock = d.getElementById("board-clock");
  function tick() { if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local"; }
  tick(); setInterval(tick, 30000);
  var flaps = d.querySelectorAll("[data-flap]"), CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function flap(el) {
    var final = el.textContent, n = 0;
    var iv = setInterval(function () {
      n++;
      el.textContent = final.split("").map(function (c, i) { return c === " " || i < n * 2 ? c : CH[(Math.random() * CH.length) | 0]; }).join("");
      if (n * 2 >= final.length) { clearInterval(iv); el.textContent = final; }
    }, 45);
  }
  // Sticky galley-cart bar: appears once the hero CTAs scroll away (never covers the hero buttons).
  var hero = d.querySelector(".hero"), bar = d.querySelector(".sticky-bar");
  if (hero && bar && "IntersectionObserver" in window) {
    d.documentElement.classList.add("js-sticky");
    new IntersectionObserver(function (en) { bar.classList.toggle("show", !en[0].isIntersecting); }, { rootMargin: "-120px 0px 0px 0px" }).observe(hero);
  }
  var board = d.querySelector(".board");
  if (board && !reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { flaps.forEach(flap); io.disconnect(); }
    }, { threshold: .4 });
    io.observe(board);
  }
  // Open a ranked pick when arriving on #pick-ASIN (shared links).
  function openHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    var el = d.getElementById(h);
    if (!el) return;
    if (el.tagName === "DETAILS") el.open = true;
    el.scrollIntoView({ block: "center" });
  }
  window.addEventListener("hashchange", openHash); openHash();

  var dataEl = d.getElementById("gw-data");
  var form = d.getElementById("quiz");
  if (!dataEl || !form) return;
  var DATA = JSON.parse(dataEl.textContent);
  var res = d.getElementById("quiz-result"), err = form.querySelector(".quiz-err");
  var current = null;

  function pick(ans) {
    var best = null, bestScore = -1;
    Object.keys(DATA.products).forEach(function (a) {
      var p = DATA.products[a], s = 0;
      if (p.tags.who.indexOf(ans.who) > -1) s += 4;
      if (p.tags.need.indexOf(ans.need) > -1) s += 3;
      if (p.tags.size.indexOf(ans.size) > -1) s += 2;
      s -= p.rank / 100; // tie-break toward higher-ranked picks
      if (s > bestScore) { bestScore = s; best = a; }
    });
    return best;
  }
  form.addEventListener("change", function (ev) {
    var fs = ev.target.closest(".q");
    if (fs) fs.classList.add("done");
  });
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = new FormData(form), ans = { who: f.get("who"), need: f.get("need"), size: f.get("size") };
    if (!ans.who || !ans.need || !ans.size) { err.hidden = false; return; }
    err.hidden = true;
    current = pick(ans);
    var p = DATA.products[current];
    d.getElementById("sc-name").textContent = p.short;
    d.getElementById("sc-hook").textContent = p.hook;
    d.getElementById("sc-host").textContent = p.host;
    d.getElementById("sc-take").textContent = p.take;
    d.getElementById("sc-flight").textContent = p.flight;
    d.getElementById("sc-gate").textContent = p.gate;
    var tpl = d.getElementById("pw-" + current), box = d.getElementById("sc-art");
    box.innerHTML = ""; if (tpl) box.appendChild(tpl.content.cloneNode(true));
    var cta = d.getElementById("sc-cta");
    cta.href = p.url; cta.setAttribute("data-asin", current);
    form.hidden = true; res.hidden = false;
    res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  d.getElementById("sc-again").addEventListener("click", function () {
    form.reset(); form.querySelectorAll(".q").forEach(function (q) { q.classList.remove("done"); });
    res.hidden = true; form.hidden = false; form.scrollIntoView({ block: "start" });
  });
  d.getElementById("sc-share").addEventListener("click", function () {
    if (!current) return;
    var p = DATA.products[current], link = DATA.share_url + "#pick-" + current;
    var text = "My crew gift bag tag from The Galley Works Gift Finder: " + p.short + ". " + p.hook;
    var msg = d.getElementById("share-msg");
    if (navigator.share) {
      navigator.share({ title: "The Galley Works Gift Finder", text: text, url: link }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + " " + link).then(function () { msg.textContent = "Link copied. Paste it anywhere."; },
        function () { msg.textContent = "Copy this link: " + link; });
    } else { msg.textContent = "Copy this link: " + link; }
  });
})();
