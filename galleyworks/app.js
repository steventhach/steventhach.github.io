/* The Galley Works v4 (crew room): first-party, no tracking, no network calls.
   Aviation-native pulse: bay doors, stamp thud, sticky brass, bag-tag print — not K-pop photocards. */
(function () {
  "use strict";
  var d = document;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Channel attribution: rewrite Amazon tags when src/utm/fbclid says facebook|pinterest|tiktok.
  // Persist in sessionStorage (wie_channel) so in-site nav keeps attribution. Organic keeps placement tags.
  (function () {
    var TAGS = {
      facebook: "galleyworks-facebook-20",
      pinterest: "worthitedit-pinterest-20",
      tiktok: "worthitedit-tiktok-20"
    };
    var KEY = "wie_channel";
    function params() {
      try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); }
    }
    function norm(v) {
      v = (v || "").toLowerCase();
      if (v === "facebook" || v === "fb") return "facebook";
      if (v === "pinterest" || v === "pin") return "pinterest";
      if (v === "tiktok" || v === "tt") return "tiktok";
      return "";
    }
    function detect() {
      var q = params();
      var fromSrc = norm(q.get("src"));
      if (fromSrc) return fromSrc;
      var fromUtm = norm(q.get("utm_source"));
      if (fromUtm) return fromUtm;
      // Keep Meta paid_social / fbclid signals (Galley FB ads)
      var src = (q.get("utm_source") || "").toLowerCase();
      var med = (q.get("utm_medium") || "").toLowerCase();
      var camp = (q.get("utm_campaign") || "").toLowerCase();
      if (med === "paid_social" && (src.indexOf("facebook") > -1 || src.indexOf("fb") > -1 || camp.indexOf("facebook") > -1 || camp.indexOf("fb") > -1)) return "facebook";
      if (q.get("fbclid")) return "facebook";
      return "";
    }
    var channel = "";
    try {
      channel = detect();
      if (channel) sessionStorage.setItem(KEY, channel);
      else channel = sessionStorage.getItem(KEY) || "";
    } catch (e) { channel = detect(); }
    if (!channel || !TAGS[channel]) return;
    var TAG = TAGS[channel];
    function rewrite(href) {
      if (!href || href.indexOf("amazon.") === -1) return href;
      if (/([?&])tag=/i.test(href)) {
        return href.replace(/([?&])tag=[a-z0-9-]+/i, function (_m, p) { return p + "tag=" + TAG; });
      }
      return href + (href.indexOf("?") > -1 ? "&" : "?") + "tag=" + TAG;
    }
    d.querySelectorAll('a[href*="amazon."]').forEach(function (a) {
      var h = a.getAttribute("href");
      if (!h) return;
      var n = rewrite(h);
      if (n !== h) { a.setAttribute("href", n); a.setAttribute("data-wie-channel", channel); }
    });
    ["gw-data", "picks-data", "data"].forEach(function (id) {
      var el = d.getElementById(id);
      if (!el) return;
      try {
        var DATA = JSON.parse(el.textContent);
        function walk(o) {
          if (!o || typeof o !== "object") return;
          if (Array.isArray(o)) { o.forEach(walk); return; }
          Object.keys(o).forEach(function (k) {
            if (typeof o[k] === "string" && o[k].indexOf("amazon.") > -1) o[k] = rewrite(o[k]);
            else walk(o[k]);
          });
        }
        walk(DATA);
        el.textContent = JSON.stringify(DATA);
      } catch (e) {}
    });
    // Keep later quiz CTA writes on the channel tag
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

  // —— Aviation-native interactive pulse (crew room / bay / checklist — not photocard flips) ——
  d.documentElement.classList.add("js");
  // Bay doors open when a shop bay rolls onto the stand
  var bays = d.querySelectorAll(".bay, .bp");
  if ("IntersectionObserver" in window) {
    var bayIO = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("is-open");
        bayIO.unobserve(x.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
    bays.forEach(function (el) {
      if (reduce) el.classList.add("is-open");
      else {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-open");
        else bayIO.observe(el);
      }
    });
  } else {
    bays.forEach(function (el) { el.classList.add("is-open"); });
  }
  // Pre-flight stamps thud onto the checklist when they enter view
  var stamps = d.querySelectorAll(".preflight .stamp, .pp .stamp");
  if ("IntersectionObserver" in window && stamps.length) {
    var stampIO = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("is-thud");
        stampIO.unobserve(x.target);
      });
    }, { threshold: 0.4 });
    stamps.forEach(function (el) {
      if (reduce) el.classList.add("is-thud"); else stampIO.observe(el);
    });
  } else stamps.forEach(function (el) { el.classList.add("is-thud"); });
  // Section on-stand: kicker beacon for the bay you're reading
  var secs = d.querySelectorAll("section.sec");
  if ("IntersectionObserver" in window && secs.length && !reduce) {
    secs.forEach(function (sec) {
      new IntersectionObserver(function (es) {
        es.forEach(function (x) { x.target.classList.toggle("is-on-stand", x.isIntersecting); });
      }, { threshold: 0.22 }).observe(sec);
    });
  }
  // Sticky galley-cart: brass glow when docked
  if (bar) {
    var mo = new MutationObserver(function () {
      bar.classList.toggle("is-brass", bar.classList.contains("show"));
    });
    mo.observe(bar, { attributes: true, attributeFilter: ["class"] });
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
    var tag = d.getElementById("share-card");
    if (tag) { tag.classList.remove("is-printed"); void tag.offsetWidth; tag.classList.add("is-printed"); }
    var gate = d.getElementById("sc-gate");
    if (gate && !reduce && typeof flap === "function") flap(gate);
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

  // Spice: soft lift when product panels enter the stand (cabin lights on)
  var pops = d.querySelectorAll(".card-pop");
  if (pops.length && "IntersectionObserver" in window && !reduce) {
    var popIO = new IntersectionObserver(function (es) {
      es.forEach(function (x) { x.target.classList.toggle("is-on-stand", x.isIntersecting); });
    }, { rootMargin: "-8% 0px -12% 0px", threshold: 0.2 });
    pops.forEach(function (el) { popIO.observe(el); });
  } else {
    pops.forEach(function (el) { el.classList.add("is-on-stand"); });
  }

})();
