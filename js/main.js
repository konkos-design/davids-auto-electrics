/* David's Auto Electrics — interactions */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Opening hours (Australia/Sydney) ---------- */
  // day index: 0=Sun ... 6=Sat ; minutes from midnight
  var HOURS = { 0: null, 1: [480, 1020], 2: [480, 1020], 3: [480, 1020], 4: [480, 1020], 5: [480, 990], 6: null };
  var DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return h + (mm ? ":" + (mm < 10 ? "0" : "") + mm : "") + " " + ap;
  }
  function sydneyNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var h = parseInt(o.hour, 10) % 24;
      return { d: map[o.weekday], m: h * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var n = new Date();
      return { d: n.getDay(), m: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function status() {
    var n = sydneyNow(), t = HOURS[n.d];
    if (t && n.m >= t[0] && n.m < t[1]) return { open: true, text: "<b>Open now</b> · until " + fmt(t[1]) };
    for (var i = 0; i < 8; i++) {
      var d = (n.d + i) % 7, h = HOURS[d];
      if (!h) continue;
      if (i === 0 && n.m >= h[0]) continue;
      var when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY[d];
      return { open: false, text: "<b>Closed</b> · opens " + when + " " + fmt(h[0]) };
    }
    return { open: false, text: "<b>Closed</b>" };
  }
  function paintStatus() {
    var s = status();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      var span = el.querySelector("span");
      if (span) span.innerHTML = s.text;
    });
    var today = sydneyNow().d;
    document.querySelectorAll("[data-day]").forEach(function (row) {
      row.classList.toggle("today", parseInt(row.getAttribute("data-day"), 10) === today);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Years in business ---------- */
  var yrs = new Date().getFullYear() - 1987;
  document.querySelectorAll("[data-years]").forEach(function (el) {
    if (el.hasAttribute("data-count")) el.setAttribute("data-count", yrs); else el.textContent = yrs;
  });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: solid + hide on scroll ---------- */
  var header = document.querySelector(".site-header");
  var callbar = document.querySelector(".callbar");
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-solid", y > 30);
      var menuOpen = document.body.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove("is-hidden");
    }
    if (callbar) callbar.classList.toggle("is-shown", y > window.innerHeight * 0.55);
    lastY = y;
    ticking = false;
    timelineProgress();
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      var mm = document.querySelector(".mmenu");
      if (mm) mm.setAttribute("aria-hidden", open ? "false" : "true");
      if (header) header.classList.remove("is-hidden");
    });
    document.querySelectorAll(".mmenu a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) burger.click();
    });
  }

  /* ---------- Split words ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    el.classList.add("split-words");
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains("w")) { walk(c); }
      });
    })(el);
    el.classList.add("rv-split");
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".rv, .rv-clip, .split-words, .stat, .tl, .svc-media, .hero-photo, .bars-wrap, [data-count]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          if (en.target.hasAttribute("data-count")) countUp(en.target);
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); if (el.hasAttribute("data-count")) el.textContent = el.getAttribute("data-count"); });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Button ripple + magnetic ---------- */
  document.querySelectorAll(".btn, .icon-btn").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
      var rp = document.createElement("span"); rp.className = "ripple";
      rp.style.width = rp.style.height = s + "px";
      rp.style.left = e.clientX - r.left - s / 2 + "px";
      rp.style.top = e.clientY - r.top - s / 2 + "px";
      b.appendChild(rp);
      setTimeout(function () { rp.remove(); }, 700);
    });
  });
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = "translate(" + x + "px," + y + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    // subtle parallax tilt on hero visual
    var hv = document.querySelector(".hero-visual");
    if (hv) {
      window.addEventListener("pointermove", function (e) {
        var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        hv.style.transform = "translate3d(" + x * -14 + "px," + y * -10 + "px,0)";
      }, { passive: true });
    }
  }

  /* ---------- Before / after ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var input = ba.querySelector("input");
    function set(v) { ba.style.setProperty("--pos", v + "%"); }
    input.addEventListener("input", function () { set(input.value); ba.classList.add("touched"); });
    set(input.value);
    // intro sweep
    if (!reduce && "IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) {
          o.disconnect();
          var t0 = null;
          (function anim(ts) {
            if (ba.classList.contains("touched")) return;
            if (!t0) t0 = ts;
            var p = (ts - t0) / 2200;
            if (p > 1) { set(50); input.value = 50; return; }
            var v = 50 + Math.sin(p * Math.PI * 2) * 28;
            set(v); input.value = v;
            requestAnimationFrame(anim);
          })(performance.now());
        }
      }, { threshold: 0.5 });
      o.observe(ba);
    }
  });

  /* ---------- Review carousel ---------- */
  document.querySelectorAll(".rv-carousel").forEach(function (c) {
    var track = c.querySelector(".rv-track");
    var bar = c.querySelector(".rv-progress i");
    function card() { var f = track.querySelector(".rcard"); return f ? f.getBoundingClientRect().width + 16 : 300; }
    c.querySelectorAll("[data-dir]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.getAttribute("data-dir"), 10);
        var max = track.scrollWidth - track.clientWidth;
        if (dir > 0 && track.scrollLeft >= max - 4) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: dir * card(), behavior: "smooth" });
      });
    });
    function prog() {
      if (!bar) return;
      var max = track.scrollWidth - track.clientWidth;
      var vis = track.clientWidth / track.scrollWidth;
      bar.style.width = vis * 100 + "%";
      bar.style.transform = "translateX(" + (max > 0 ? (track.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0) + "%)";
    }
    track.addEventListener("scroll", prog, { passive: true });
    window.addEventListener("resize", prog);
    prog();
    // autoplay when visible, pause on interaction
    var auto = null, paused = false;
    ["pointerenter", "touchstart", "focusin"].forEach(function (ev) { c.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    c.addEventListener("pointerleave", function () { paused = false; });
    if (!reduce) auto = setInterval(function () {
      if (paused || document.hidden) return;
      var r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var next = c.querySelector('[data-dir="1"]'); if (next) next.click();
    }, 5200);
  });

  /* ---------- Filters (reviews + gallery) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var target = document.querySelector(group.getAttribute("data-filter-group"));
    if (!target) return;
    var chips = group.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-active"); chip.setAttribute("aria-pressed", "true");
        var f = chip.getAttribute("data-filter");
        Array.prototype.forEach.call(target.children, function (item, idx) {
          var tags = (item.getAttribute("data-tags") || "").split(" ");
          var show = f === "all" || tags.indexOf(f) > -1;
          item.classList.toggle("is-hidden", !show);
          if (show && !reduce) {
            item.animate([{ opacity: 0, transform: "translateY(18px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: Math.min(idx, 10) * 35, easing: "cubic-bezier(.22,.9,.24,1)", fill: "backwards" });
          }
        });
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gitem"));
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption"), cur = 0, lastFocus = null;
    function visible() { return items.filter(function (i) { return !i.classList.contains("is-hidden"); }); }
    function show(item) {
      var img = item.querySelector("img");
      lbImg.src = img.getAttribute("src"); lbImg.alt = img.alt;
      var fc = item.querySelector("figcaption"), sm = fc && fc.querySelector("small");
      lbCap.textContent = fc ? (sm ? sm.textContent + " · " : "") + Array.prototype.filter.call(fc.childNodes, function (n) { return n !== sm; }).map(function (n) { return n.textContent; }).join("").trim() : "";
    }
    function open(item) {
      lastFocus = document.activeElement; cur = visible().indexOf(item); show(item);
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function close() { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    function go(d) { var v = visible(); cur = (cur + d + v.length) % v.length; show(v[cur]); }
    items.forEach(function (it) {
      it.addEventListener("click", function () { open(it); });
      it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(it); } });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { go(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { go(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); sx = null; });
  }

  /* ---------- Services sticky sub-nav highlight ---------- */
  var subnav = document.querySelector(".svc-nav");
  if (subnav && "IntersectionObserver" in window) {
    var links = subnav.querySelectorAll("a");
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) {
            var on = l.getAttribute("href") === "#" + en.target.id;
            l.classList.toggle("is-active", on);
            if (on) {
              var wrap = l.parentNode;
              wrap.scrollTo({ left: l.offsetLeft - wrap.clientWidth / 2 + l.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
            }
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".svc[id]").forEach(function (s) { so.observe(s); });
  }

  /* ---------- Timeline progress ---------- */
  var tl = document.querySelector(".timeline");
  function timelineProgress() {
    if (!tl) return;
    var r = tl.getBoundingClientRect();
    var p = (window.innerHeight * 0.6 - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    tl.style.setProperty("--p", (p * 100).toFixed(1) + "%");
  }
  timelineProgress();
})();
