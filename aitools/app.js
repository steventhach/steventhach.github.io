/* Tally Light: countdowns, live timecode, reveals, timeline tracks, rundown quiz + slate, sticky bar. No trackers. Channel attribution may use sessionStorage when ?src=/utm present. */
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

  // countdowns (real dates)
  var today = new Date(); var t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  d.querySelectorAll("[data-countdown]").forEach(function (el) {
    var p = el.getAttribute("data-countdown").split("-"); var t = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var n = Math.round((t - t0) / 864e5); el.textContent = n > 0 ? "T-" + n + "d" : (n === 0 ? "Today" : "Wrapped");
  });
  // live timecode
  var tcs = [d.getElementById("tc")].concat([].slice.call(d.querySelectorAll(".tc-live"))).filter(Boolean);
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  if (tcs.length && !reduce) {
    var start = performance.now();
    (function tick(now) {
      var f = Math.floor((now - start) / (1000 / 24)), fr = f % 24, s = Math.floor(f / 24) % 60, m = Math.floor(f / 1440) % 60;
      var txt = "00:" + pad(m) + ":" + pad(s) + ":" + pad(fr);
      tcs.forEach(function (el) { el.textContent = el.id === "tc" ? txt : "TC " + txt; });
      requestAnimationFrame(tick);
    })(start);
  }
  // reveal
  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });
  // timeline tracks
  d.querySelectorAll(".tl-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", open ? "false" : "true");
      var p = d.getElementById(b.getAttribute("aria-controls")); if (p) p.hidden = open;
    });
  });
  // sticky
  var st = d.getElementById("sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    st.hidden = false;
    new IntersectionObserver(function (es) { es.forEach(function (x) { st.classList.toggle("on", !x.isIntersecting); }); }).observe(hero);
  }
  // rundown quiz
  var form = d.getElementById("quiz"), dataEl = d.getElementById("tl-data");
  if (!form || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), go = d.getElementById("q-go"), share = d.getElementById("share");
  var L = { make: { faceless: "Faceless explainer", talk: "Podcast / talking-head", shorts: "Shorts from long video" },
            face: { none: "No one on screen", avatar: "AI presenter", me: "You on camera" },
            voice: { ai: "AI voice", mine: "Your voice", clone: "Your voice, cloned" } };
  function val(n) { var x = form.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : null; }
  form.addEventListener("change", function () { go.disabled = !(val("make") && val("face") && val("voice")); });
  function score(it, a) { return (it.tags.make.indexOf(a.make) > -1 ? 2 : 0) + (it.tags.face.indexOf(a.face) > -1 ? 2 : 0) + (it.tags.voice.indexOf(a.voice) > -1 ? 1.5 : 0) - it.rank * 0.01; }
  function pick(it) {
    var row = d.createElement("div"); row.className = "pick";
    var tpl = d.getElementById("tf-" + it.id); if (tpl) row.appendChild(tpl.content.cloneNode(true));
    var t = d.createElement("div"), chip = d.createElement("span"), b = d.createElement("b"), i = d.createElement("i");
    chip.className = "trk " + (it.kind === "hardware" ? "tm" : (it.track.charAt(0) === "A" ? "ta" : "tv")); chip.textContent = it.track + " · " + it.track_name;
    b.textContent = it.name; i.textContent = it.role + ". " + it.keep + ".";
    t.appendChild(chip); t.appendChild(b); t.appendChild(i); row.appendChild(t); return row;
  }
  var last = null;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault(); var a = { make: val("make"), face: val("face"), voice: val("voice") }; if (!a.make || !a.face || !a.voice) return;
    var sw = DATA.items.filter(function (x) { return x.kind === "software"; }).sort(function (x, y) { return score(y, a) - score(x, a); }).slice(0, 2);
    var needMic = a.voice !== "ai" || a.face === "me";
    var hw = needMic ? DATA.items.filter(function (x) { return x.kind === "hardware"; }).sort(function (x, y) { return score(y, a) - score(x, a); })[0] : null;
    d.getElementById("sl-scene").textContent = L.make[a.make]; d.getElementById("sl-take").textContent = L.face[a.face]; d.getElementById("sl-voice").textContent = L.voice[a.voice];
    var dt = new Date(); d.getElementById("sl-date").textContent = pad(dt.getMonth() + 1) + "." + pad(dt.getDate()) + "." + String(dt.getFullYear()).slice(2);
    d.getElementById("sl-roll").textContent = String.fromCharCode(65 + Math.floor(Math.random() * 6));
    var box = d.getElementById("sl-picks"); box.textContent = "";
    sw.forEach(function (x) { box.appendChild(pick(x)); }); if (hw) box.appendChild(pick(hw));
    if (!hw) { var n = d.createElement("p"); n.className = "sl-empty"; n.textContent = "No mic needed for an all-AI voice. The booth is there if that changes."; box.appendChild(n); }
    var s = d.getElementById("slate"); s.classList.remove("is-on"); void s.offsetWidth; s.classList.add("is-on");
    var rs = d.getElementById("res-sw"), rh = d.getElementById("res-hw"), lg = d.getElementById("res-legal");
    rs.href = sw[0].href; rs.setAttribute("data-vendor", sw[0].id); rs.rel = sw[0].aff ? "sponsored noopener" : "noopener"; if (sw[0].aff) rs.setAttribute("data-affiliate", "1"); else rs.removeAttribute("data-affiliate"); lg.textContent = lg.getAttribute(sw[0].aff ? "data-aff" : "data-noaff"); rs.firstChild.nodeValue = "Visit " + sw[0].short + " "; rs.hidden = false;
    if (hw) { rh.href = hw.href; rh.firstChild.nodeValue = "See " + hw.short + " on Amazon "; rh.hidden = false; } else rh.hidden = true;
    lg.hidden = false; share.disabled = false;
    last = "My AI creator stack (" + L.make[a.make] + "): " + sw.map(function (x) { return x.short; }).join(" + ") + (hw ? " + " + hw.short : "") + ". Built on Tally Light.";
    if (window.innerWidth < 1080) s.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  share.addEventListener("click", function () {
    if (!last) return; var url = location.href.split("#")[0] + "#rundown";
    if (navigator.share) navigator.share({ title: "My AI creator stack", text: last, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(last + " " + url).then(function () { share.lastChild.nodeValue = " Copied"; });
  });
})();
