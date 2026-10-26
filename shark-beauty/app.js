/* Gloss Lab: countdowns, reveals, fold-card flips, floor finder + fold slip, sticky bar. No trackers. Channel attribution may use sessionStorage when ?src=/utm present. */
(function () {
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

  var now = new Date(), t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  d.querySelectorAll("[data-countdown]").forEach(function (el) {
    var p = el.getAttribute("data-countdown").split("-"), n = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - t0) / 864e5);
    el.textContent = n > 1 ? n + " days out" : (n === 1 ? "Tomorrow" : (n === 0 ? "Today" : "Passed"));
  });
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  d.querySelectorAll(".ct-btn").forEach(function (b) {
    var tap = b.querySelector(".ct-tap"), lab = tap ? tap.lastChild.nodeValue : "";
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true"; b.setAttribute("aria-pressed", on ? "false" : "true");
      var back = d.getElementById(b.getAttribute("aria-controls")); if (back) back.hidden = on;
      if (tap) tap.lastChild.nodeValue = on ? lab : " Turn it back";
    });
  });
  var st = d.getElementById("sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    st.hidden = false;
    new IntersectionObserver(function (es) { es.forEach(function (x) { st.classList.toggle("on", !x.isIntersecting); }); }).observe(hero);
  }
  var form = d.getElementById("quiz"), dataEl = d.getElementById("data");
  if (!form || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), go = d.getElementById("q-go"), share = d.getElementById("share"), L = DATA.labels;
  function val(n) { var x = form.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : null; }
  form.addEventListener("change", function () { go.disabled = !(val("who") && val("where") && val("what")); });
  function score(it, a) { return (it.tags.what.indexOf(a.what) > -1 ? 3 : 0) + (it.tags.where.indexOf(a.where) > -1 ? 2 : 0) + (it.tags.who.indexOf(a.who) > -1 ? 1.5 : 0) - it.rank * 0.01; }
  function pick(it, n) {
    var row = d.createElement("div"); row.className = "pick";
    var tpl = d.getElementById("tf-" + it.id); if (tpl) row.appendChild(tpl.content.cloneNode(true));
    var t = d.createElement("div"), k = d.createElement("span"), b = d.createElement("b"), i = d.createElement("i");
    k.className = "pk-n"; k.textContent = (n === 0 ? "Pick this · " : "Or this · ") + it.shelf; b.textContent = it.short; i.textContent = "Take it if " + it.wrap.charAt(0).toLowerCase() + it.wrap.slice(1) + ".";
    t.appendChild(k); t.appendChild(b); t.appendChild(i); row.appendChild(t); return row;
  }
  var last = null;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var a = { who: val("who"), where: val("where"), what: val("what") }; if (!a.who || !a.where || !a.what) return;
    var top = DATA.items.slice().sort(function (x, y) { return score(y, a) - score(x, a); }).slice(0, 2);
    d.getElementById("gc-to").textContent = L.who[a.who]; d.getElementById("gc-where").textContent = L.where[a.where]; d.getElementById("gc-what").textContent = L.what[a.what];
    var dt = new Date(); d.getElementById("gc-date").textContent = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    var box = d.getElementById("gc-picks"); box.textContent = ""; top.forEach(function (x, n) { box.appendChild(pick(x, n)); });
    var g = d.getElementById("giftcard"); g.classList.remove("is-on"); void g.offsetWidth; g.classList.add("is-on");
    var r = d.getElementById("res-amz"); r.href = top[0].href; r.firstChild.nodeValue = "See " + top[0].short + " on Amazon "; r.hidden = false; d.getElementById("res-paid").hidden = false;
    share.disabled = false;
    last = "Glossi slip for " + L.who[a.who].toLowerCase() + ": " + top[0].short + " (or " + top[1].short + "). Written on Gloss Lab.";
    if (window.innerWidth < 1080) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  share.addEventListener("click", function () {
    if (!last) return; var url = location.href.split("#")[0] + "#finder";
    if (navigator.share) navigator.share({ title: "A Glossi slip from Gloss Lab", text: last, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(last + " " + url).then(function () { share.lastChild.nodeValue = " Copied"; });
  });
})();
