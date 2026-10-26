/* Fine Particle · progressive enhancement only; every link works without JS. */
(function () {
  "use strict";
  var d = document, root = d.documentElement; root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // T-minus to real dates, from the visitor's own clock
  d.querySelectorAll(".dates li[data-date]").forEach(function (li) {
    var p = li.getAttribute("data-date").split("-"), t = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n.setHours(0, 0, 0, 0);
    var days = Math.round((t - n) / 864e5), el = li.querySelector(".d-t");
    if (el) el.textContent = days > 0 ? "T\u2212" + days + "d" : days === 0 ? "Today" : "Passed";
  });
  // hero line drawing: draw strokes once
  var sheet = d.querySelector(".hero .sheet");
  if (sheet) {
    sheet.querySelectorAll(".draw path,.draw rect,.draw line,.draw circle").forEach(function (el) {
      try { var L = el.getTotalLength ? el.getTotalLength() : 600; el.style.setProperty("--len", Math.ceil(L) + 1); } catch (e) {}
    });
    if (reduce) sheet.classList.add("drawn"); else requestAnimationFrame(function () { setTimeout(function () { sheet.classList.add("drawn"); }, 120); });
  }
  // reveal on scroll
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  // sticky bar after the hero
  var st = d.querySelector(".sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { st.classList.toggle("show", !es[0].isIntersecting); }).observe(hero);
  } else if (st) st.classList.add("show");
  // exploded view hotspots
  var hs = d.querySelectorAll(".hs");
  hs.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = b.getAttribute("data-i"), open = b.getAttribute("aria-expanded") === "true";
      hs.forEach(function (x) { x.setAttribute("aria-expanded", "false"); });
      d.querySelectorAll(".hs-note").forEach(function (n) { n.hidden = true; });
      var show = open ? "00" : i; if (!open) b.setAttribute("aria-expanded", "true");
      var n = d.querySelector('.hs-note[data-note="' + show + '"]'); if (n) n.hidden = false;
    });
  });
  // configure quiz
  var form = d.getElementById("quiz"), dataEl = d.getElementById("fp-data");
  if (!form || !dataEl) return;
  var data = JSON.parse(dataEl.textContent).products, res = d.getElementById("result"), current = null, LBL = {hard: "Hard floors", mixed: "Mixed floors", carpet: "Carpet", pets: "Shedding pet", long: "Long hair", dust: "Dust + crumbs", stand: "Self-standing", dock: "Hands-off bin", light: "Lightest"};
  function pick(a) {
    var best = null, bs = -1;
    Object.keys(data).forEach(function (k) {
      var t = data[k].tags, s = 0;
      if (t.floor.indexOf(a.floor) > -1) s += 2; if (t.hair.indexOf(a.hair) > -1) s += 2; if (t.store.indexOf(a.store) > -1) s += 1.5;
      s -= data[k].rank * 0.01; if (s > bs) { bs = s; best = k; }
    });
    return best;
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var fd = new FormData(form), a = { floor: fd.get("floor"), hair: fd.get("hair"), store: fd.get("store") };
    var err = form.querySelector(".q-err"); if (!a.floor || !a.hair || !a.store) { err.hidden = false; return; } err.hidden = true;
    current = pick(a); var p = data[current];
    d.getElementById("pl-model").textContent = p.short; d.getElementById("pl-role").textContent = p.role;
    d.getElementById("pl-cfg").textContent = [LBL[a.floor], LBL[a.hair], LBL[a.store]].join(" / ");
    d.getElementById("pl-rt").textContent = p.claim + " \u00b7 " + p.cond; d.getElementById("pl-for").textContent = p.forr;
    d.getElementById("pl-sn").textContent = "FP-26-" + String(p.rank).padStart(2, "0") + ["hard", "mixed", "carpet"].indexOf(a.floor) + ["pets", "long", "dust"].indexOf(a.hair) + ["stand", "dock", "light"].indexOf(a.store);
    var f = d.getElementById("pl-fig"), tp = d.getElementById("pf-" + current); f.innerHTML = ""; if (tp) f.appendChild(tp.content.cloneNode(true));
    var buy = d.getElementById("res-buy"); buy.href = p.url;
    form.hidden = true; res.hidden = false; res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  d.getElementById("res-reset").addEventListener("click", function () { form.reset(); res.hidden = true; form.hidden = false; d.getElementById("share-ok").hidden = true; form.scrollIntoView({ block: "start" }); });
  d.getElementById("res-share").addEventListener("click", function () {
    if (!current) return; var p = data[current];
    var txt = "My Fine Particle spec plate: " + p.short + " (" + p.role + "). Runtime claim: " + p.claim + ", " + p.cond + ".";
    var u = location.href.split("#")[0] + "#configure";
    if (navigator.share) { navigator.share({ title: "My spec plate", text: txt, url: u }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt + " " + u).then(function () { d.getElementById("share-ok").hidden = false; });
  });
})();
