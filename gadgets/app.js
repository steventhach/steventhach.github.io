/* Fix Kit: LCD countdowns, reveals, I/O faceplate open, annoyance dial + fix ticket, sticky bar,
   power-on LEDs, console arming, MagSafe charge snap — device-native pulse (not K-pop photocards). No trackers. Channel attribution may use sessionStorage when ?src=/utm present. */
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


  // Power-on: faceplate boots, status LEDs come alive (device metaphor — not a card flip)
  if (!reduce) {
    root.classList.add("is-booting");
    setTimeout(function () { root.classList.remove("is-booting"); root.classList.add("is-powered"); }, 480);
  } else {
    root.classList.add("is-powered");
  }

  var now = new Date(), t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  d.querySelectorAll("[data-countdown]").forEach(function (el) {
    var p = el.getAttribute("data-countdown").split("-"), n = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - t0) / 864e5);
    el.textContent = n > 1 ? n + " DAYS" : (n === 1 ? "TOMORROW" : (n === 0 ? "TODAY" : "PASSED"));
  });

  var rv = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add("in");
        // Plate LED: lit when the fix card enters the bench
        var led = x.target.querySelector(".frame-tag .led, .pl-h .led");
        if (led) led.classList.add("on");
        io.unobserve(x.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // I/O faceplate: open the back panel (ports listing) — device chassis, not a photocard
  d.querySelectorAll(".pt-btn").forEach(function (b) {
    var tap = b.querySelector(".pt-tap"), lab = tap ? tap.lastChild.nodeValue : "";
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true"; b.setAttribute("aria-pressed", on ? "false" : "true");
      var back = d.getElementById(b.getAttribute("aria-controls")); if (back) back.hidden = on;
      b.parentNode.classList.toggle("open", !on);
      b.parentNode.classList.toggle("flipped", !on); // legacy class kept for CSS
      if (tap) tap.lastChild.nodeValue = on ? lab : " Close panel";
    });
  });

  // MagSafe bay: charge LED + magnet snap when the limited section is on-bench
  var mag = d.getElementById("magsafe");
  if (mag && "IntersectionObserver" in window) {
    if (reduce) mag.classList.add("is-charging");
    else {
      function magInView() {
        var r = mag.getBoundingClientRect();
        return r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1;
      }
      if (magInView()) mag.classList.add("is-charging");
      new IntersectionObserver(function (es) {
        es.forEach(function (x) { mag.classList.toggle("is-charging", x.isIntersecting); });
      }, { threshold: [0, 0.12, 0.3], rootMargin: "0px 0px -5% 0px" }).observe(mag);
    }
  } else if (mag) mag.classList.add("is-charging");

  // Sticky: status LED pulse when the cart bar docks
  var st = d.getElementById("sticky"), hero = d.querySelector(".hero");
  if (st && hero && "IntersectionObserver" in window) {
    st.hidden = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        var on = !x.isIntersecting;
        st.classList.toggle("on", on);
        st.classList.toggle("is-live", on);
      });
    }).observe(hero);
  }

  // Console arming: LEDs + Print button when all three switches are set
  var form = d.getElementById("quiz"), dataEl = d.getElementById("data");
  var goBtn = d.getElementById("q-go");
  var consoleEl = form;

  function armConsole() {
    if (!form || !goBtn) return;
    var ready = !goBtn.disabled;
    form.classList.toggle("is-armed", ready);
    goBtn.classList.toggle("is-hot", ready);
  }
  if (goBtn) {
    new MutationObserver(armConsole).observe(goBtn, { attributes: true, attributeFilter: ["disabled"] });
  }

  if (!form || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), go = d.getElementById("q-go"), share = d.getElementById("share"), L = DATA.labels;
  function val(n) { var x = form.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : null; }
  form.addEventListener("change", function () {
    go.disabled = !(val("where") && val("bug") && val("carry"));
    armConsole();
    // Light the switch LEDs already handled by CSS; mark each fieldset as set
    form.querySelectorAll(".q").forEach(function (fs) {
      var name = fs.querySelector("input") && fs.querySelector("input").name;
      if (!name) return;
      fs.classList.toggle("is-set", !!val(name));
    });
  });
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
    var g = d.getElementById("ticket");
    g.classList.remove("is-on", "is-scanning"); void g.offsetWidth;
    g.classList.add("is-on", "is-scanning");
    if (!reduce) setTimeout(function () { g.classList.remove("is-scanning"); }, 1100);
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
