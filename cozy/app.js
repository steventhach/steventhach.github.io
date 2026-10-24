/* The Warm Label: gift-tag countdowns, reveals, care-tag turns, fiber finder + gift tag, sticky bar,
   stitch draw-in, heated warm glow, ember sticky — cozy-native pulse (not K-pop photocards). No trackers, no storage. */
(function () {
  var d = document, root = d.documentElement; root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // countdowns to real dates
  var now = new Date(), t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  d.querySelectorAll("[data-countdown]").forEach(function (el) {
    var p = el.getAttribute("data-countdown").split("-"), n = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - t0) / 864e5);
    el.textContent = n > 1 ? n + " days out" : (n === 1 ? "Tomorrow" : (n === 0 ? "Today" : "Passed"));
  });
  // reveal
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  // care tags: tap to turn (sewing label — not a K-pop photocard)
  d.querySelectorAll(".ct-btn").forEach(function (b) {
    var tap = b.querySelector(".ct-tap"), lab = tap ? tap.lastChild.nodeValue : "";
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true"; b.setAttribute("aria-pressed", on ? "false" : "true");
      var back = d.getElementById(b.getAttribute("aria-controls")); if (back) back.hidden = on;
      if (tap) tap.lastChild.nodeValue = on ? lab : " Turn it back";
    });
  });
  // Theme-native pulse: stitch draw-in, heated warm glow, Write-the-tag ember
  if ("IntersectionObserver" in window) {
    var stitchIO = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("is-drawn");
        stitchIO.unobserve(x.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.2 });
    d.querySelectorAll("svg.stitch").forEach(function (el) {
      if (reduce) el.classList.add("is-drawn"); else stitchIO.observe(el);
    });
    var heat = d.getElementById("heated");
    if (heat) {
      if (reduce) heat.classList.add("is-warm");
      else {
        new IntersectionObserver(function (es) {
          es.forEach(function (x) { heat.classList.toggle("is-warm", x.isIntersecting); });
        }, { threshold: 0.25 }).observe(heat);
      }
    }
  } else {
    d.querySelectorAll("svg.stitch").forEach(function (el) { el.classList.add("is-drawn"); });
    var heat0 = d.getElementById("heated"); if (heat0) heat0.classList.add("is-warm");
  }
  var goBtn = d.getElementById("q-go");
  if (goBtn) {
    new MutationObserver(function () {
      goBtn.classList.toggle("is-ember", !goBtn.disabled);
    }).observe(goBtn, { attributes: true, attributeFilter: ["disabled"] });
  }
  // sticky bar after the hero
  var st = d.getElementById("sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    st.hidden = false;
    new IntersectionObserver(function (es) { es.forEach(function (x) { st.classList.toggle("on", !x.isIntersecting); }); }).observe(hero);
  }
  // fiber finder
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
    k.className = "pk-n"; k.textContent = (n === 0 ? "Wrap this · " : "Or this · ") + it.shelf; b.textContent = it.short; i.textContent = "Wrap it if " + it.wrap.charAt(0).toLowerCase() + it.wrap.slice(1) + ".";
    t.appendChild(k); t.appendChild(b); t.appendChild(i); row.appendChild(t); return row;
  }
  var last = null;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var a = { who: val("who"), where: val("where"), what: val("what") }; if (!a.who || !a.where || !a.what) return;
    var top = DATA.items.slice().sort(function (x, y) { return score(y, a) - score(x, a); }).slice(0, 2);
    d.getElementById("gc-to").textContent = L.who[a.who]; d.getElementById("gc-where").textContent = L.where[a.where]; d.getElementById("gc-what").textContent = L.what[a.what];
    var dt = new Date(); d.getElementById("gc-date").textContent = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    var box = d.getElementById("gc-picks"); box.textContent = ""; top.forEach(function (x, n) { box.appendChild(pick(x, n)); });
    var g = d.getElementById("giftcard"); g.classList.remove("is-on", "is-tied"); void g.offsetWidth; g.classList.add("is-on", "is-tied");
    var r = d.getElementById("res-amz"); r.href = top[0].href; r.firstChild.nodeValue = "See " + top[0].short + " on Amazon "; r.hidden = false; d.getElementById("res-paid").hidden = false;
    share.disabled = false;
    last = "Gift tag for " + L.who[a.who].toLowerCase() + ": " + top[0].short + " (or " + top[1].short + "). Written on The Warm Label.";
    if (window.innerWidth < 1080) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  share.addEventListener("click", function () {
    if (!last) return; var url = location.href.split("#")[0] + "#finder";
    if (navigator.share) navigator.share({ title: "A gift tag from The Warm Label", text: last, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(last + " " + url).then(function () { share.lastChild.nodeValue = " Copied"; });
  });
})();
