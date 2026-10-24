/* Fix Kit: LCD countdowns, reveals, I/O panel flips, annoyance dial + fix ticket, sticky bar. No trackers, no storage. */
(function () {
  var d = document, root = d.documentElement; root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var now = new Date(), t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  d.querySelectorAll("[data-countdown]").forEach(function (el) {
    var p = el.getAttribute("data-countdown").split("-"), n = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - t0) / 864e5);
    el.textContent = n > 1 ? n + " DAYS" : (n === 1 ? "TOMORROW" : (n === 0 ? "TODAY" : "PASSED"));
  });
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  // I/O panel flips
  d.querySelectorAll(".pt-btn").forEach(function (b) {
    var tap = b.querySelector(".pt-tap"), lab = tap ? tap.lastChild.nodeValue : "";
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true"; b.setAttribute("aria-pressed", on ? "false" : "true");
      var back = d.getElementById(b.getAttribute("aria-controls")); if (back) back.hidden = on;
      b.parentNode.classList.toggle("flipped", !on);
      if (tap) tap.lastChild.nodeValue = on ? lab : " Flip back";
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
  form.addEventListener("change", function () { go.disabled = !(val("where") && val("bug") && val("carry")); });
  function score(it, a) { return (it.tags.bug.indexOf(a.bug) > -1 ? 3 : 0) + (it.tags.where.indexOf(a.where) > -1 ? 2 : 0) + (it.tags.carry.indexOf(a.carry) > -1 ? 1.5 : 0) - it.rank * 0.01; }
  function pick(it, n) {
    var row = d.createElement("div"); row.className = "pick";
    var tpl = d.getElementById("tf-" + it.id); if (tpl) row.appendChild(tpl.content.cloneNode(true));
    var t = d.createElement("div"), k = d.createElement("span"), b = d.createElement("b"), i = d.createElement("i");
    k.className = "pk-n"; k.textContent = (n === 0 ? "FIX A · " : "FIX B · ") + it.annoy; b.textContent = it.short; i.textContent = "Pack it if " + it.pack.charAt(0).toLowerCase() + it.pack.slice(1) + ".";
    t.appendChild(k); t.appendChild(b); t.appendChild(i); row.appendChild(t); return row;
  }
  var last = null;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var a = { where: val("where"), bug: val("bug"), carry: val("carry") }; if (!a.where || !a.bug || !a.carry) return;
    var top = DATA.items.slice().sort(function (x, y) { return score(y, a) - score(x, a); }).slice(0, 2);
    d.getElementById("tk-where").textContent = L.where[a.where]; d.getElementById("tk-bug").textContent = L.bug[a.bug]; d.getElementById("tk-carry").textContent = L.carry[a.carry];
    d.getElementById("tk-no").textContent = "#" + String(top[0].rank) + String(top[1].rank) + ("" + (a.where.length * 7 + a.bug.length * 3 + a.carry.length)).padStart(2, "0");
    d.getElementById("tk-date").textContent = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    var box = d.getElementById("tk-picks"); box.textContent = ""; top.forEach(function (x, n) { box.appendChild(pick(x, n)); });
    var g = d.getElementById("ticket"); g.classList.remove("is-on"); void g.offsetWidth; g.classList.add("is-on");
    var r = d.getElementById("res-amz"); r.href = top[0].href; r.firstChild.nodeValue = "See " + top[0].short + " on Amazon "; r.hidden = false; d.getElementById("res-paid").hidden = false;
    share.disabled = false;
    last = "My fix ticket for " + L.bug[a.bug].toLowerCase() + ": " + top[0].short + " (or " + top[1].short + "). Printed by Fix Kit.";
    if (window.innerWidth < 1080) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  share.addEventListener("click", function () {
    if (!last) return; var url = location.href.split("#")[0] + "#dial";
    if (navigator.share) navigator.share({ title: "A fix ticket from Fix Kit", text: last, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(last + " " + url).then(function () { share.lastChild.nodeValue = " Copied"; });
  });
})();
