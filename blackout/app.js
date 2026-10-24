/* Blackout Kit: reveals, outage finder, sticky. No trackers. */
(function () {
  var d = document, root = d.documentElement; root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  var st = d.getElementById("sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    st.hidden = false;
    new IntersectionObserver(function (es) { es.forEach(function (x) { st.classList.toggle("on", !x.isIntersecting); }); }).observe(hero);
  }
  var form = d.getElementById("quiz"), dataEl = d.getElementById("data");
  if (!form || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), go = d.getElementById("q-go"), share = d.getElementById("share"), L = DATA.labels;
  function val(n) { var x = form.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : null; }
  form.addEventListener("change", function () { go.disabled = !(val("who") && val("need") && val("size")); });
  function score(it, a) {
    var t = it.tags || {};
    return ((t.need || []).indexOf(a.need) > -1 ? 3 : 0) + ((t.size || []).indexOf(a.size) > -1 ? 2 : 0) + ((t.who || []).indexOf(a.who) > -1 ? 1.5 : 0) - it.rank * 0.01;
  }
  function pick(it, n) {
    var row = d.createElement("div"); row.className = "pick";
    var tpl = d.getElementById("tf-" + it.id); if (tpl) row.appendChild(tpl.content.cloneNode(true));
    var t = d.createElement("div"), k = d.createElement("span"), b = d.createElement("b"), i = d.createElement("i");
    k.className = "pk-n"; k.textContent = (n === 0 ? "Pick this · " : "Or this · ") + it.shelf; b.textContent = it.short; i.textContent = "Take it if " + it.wrap.charAt(0).toLowerCase() + it.wrap.slice(1) + ".";
    t.appendChild(k); t.appendChild(b); t.appendChild(i); row.appendChild(t); return row;
  }
  var last = null;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var a = { who: val("who"), need: val("need"), size: val("size") }; if (!a.who || !a.need || !a.size) return;
    var top = DATA.items.slice().sort(function (x, y) { return score(y, a) - score(x, a); }).slice(0, 2);
    d.getElementById("gc-to").textContent = L.who[a.who]; d.getElementById("gc-where").textContent = L.need[a.need]; d.getElementById("gc-what").textContent = L.size[a.size];
    var box = d.getElementById("gc-picks"); box.textContent = ""; top.forEach(function (x, n) { box.appendChild(pick(x, n)); });
    var g = d.getElementById("giftcard"); g.classList.remove("is-on"); void g.offsetWidth; g.classList.add("is-on");
    var r = d.getElementById("res-amz"); r.href = top[0].href; r.firstChild.nodeValue = "See " + top[0].short + " on Amazon "; r.hidden = false; d.getElementById("res-paid").hidden = false;
    share.disabled = false;
    last = "Blackout Kit tag for " + L.who[a.who].toLowerCase() + ": " + top[0].short + " (or " + top[1].short + ").";
    if (window.innerWidth < 1080) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  share.addEventListener("click", function () {
    if (!last) return; var url = location.href.split("#")[0] + "#finder";
    if (navigator.share) navigator.share({ title: "A Blackout Kit shelf tag", text: last, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(last + " " + url).then(function () { share.lastChild.nodeValue = " Copied"; });
  });
})();
