/* Monarch Health Scribing — interactions + award-level motion */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ===== Header shadow on scroll ===== */
  var header = $("#siteHeader");
  if (header) {
    var hs = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    hs(); window.addEventListener("scroll", hs, { passive: true });
  }

  /* ===== Mobile nav ===== */
  var toggle = $("#navToggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ===== Scroll progress bar ===== */
  var prog = document.createElement("div");
  prog.className = "scroll-progress";
  document.body.appendChild(prog);
  var updateProg = function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  };
  updateProg();
  window.addEventListener("scroll", updateProg, { passive: true });
  window.addEventListener("resize", updateProg);

  /* ===== Custom cursor (fine pointers only) ===== */
  if (finePointer && !reduceMotion) {
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("use-custom-cursor");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      document.body.classList.add("cursor-ready");
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    var linkSel = "a, button, .btn, .faq-q, .svc-card, .q-card";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(linkSel)) document.body.classList.add("cursor-on-link");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(linkSel)) document.body.classList.remove("cursor-on-link");
    });
  }

  /* ===== Word-split reveal on signature headings ===== */
  if (!reduceMotion) {
    var splitWords = function (el) {
      var counter = { i: 0 };
      var walk = function (node, out) {
        Array.prototype.forEach.call(node.childNodes, function (child) {
          if (child.nodeType === 3) {
            var parts = child.textContent.split(/(\s+)/);
            parts.forEach(function (p) {
              if (p.trim() === "") { out.appendChild(document.createTextNode(p)); return; }
              var w = document.createElement("span"); w.className = "word-anim";
              var inner = document.createElement("i"); inner.textContent = p;
              inner.style.setProperty("--w", counter.i++);
              w.appendChild(inner); out.appendChild(w);
            });
          } else if (child.nodeName === "BR") {
            out.appendChild(document.createElement("br"));
          } else {
            var clone = child.cloneNode(false);
            walk(child, clone); out.appendChild(clone);
          }
        });
      };
      var frag = document.createElement("span");
      walk(el, frag);
      el.innerHTML = ""; el.appendChild(frag);
    };
    $$(".hero-copy h1, .page-head h1").forEach(function (h) {
      splitWords(h);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          $$(".word-anim", h).forEach(function (w) { w.classList.add("in"); });
        });
      });
    });
  }

  /* ===== Image clip reveal ===== */
  $$(".svc-row-media, .split-media img").forEach(function (el) {
    el.classList.add("img-reveal");
  });

  /* ===== Scroll reveal + image reveal observer ===== */
  var revealEls = $$(".reveal, .img-reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ===== Animated counters ===== */
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var runCount = function (el) {
    var raw = el.getAttribute("data-count");
    var to = parseFloat(raw);
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = (raw.split(".")[1] || "").length;
    var grp = to >= 1000;
    var dur = 1600, start = null;
    var fmt = function (n) {
      var s = n.toFixed(dec);
      if (grp) s = parseFloat(s).toLocaleString("en-US");
      return s + suffix;
    };
    var tick = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = fmt(to * easeOut(p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  var nums = $$("[data-count]");
  if ("IntersectionObserver" in window && nums.length) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); nio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { nio.observe(el); });
  }

  /* ===== Magnetic buttons ===== */
  if (finePointer && !reduceMotion) {
    $$(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.18 + "px," + y * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ===== Marquee — duplicate track for seamless loop ===== */
  $$(".marquee-track").forEach(function (track) {
    track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ===== Hero parallax ===== */
  var heroMedia = $(".hero-media");
  if (heroMedia && finePointer && !reduceMotion) {
    var pTick = false;
    window.addEventListener("scroll", function () {
      if (pTick) return; pTick = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 600);
        heroMedia.style.transform = "translateY(" + y * 0.06 + "px)";
        pTick = false;
      });
    }, { passive: true });
  }

  /* ===== Page-head ghost word ===== */
  var ph = $(".page-head .container");
  var cur = $(".page-head .crumb .cur");
  if (ph && cur) {
    var ghost = document.createElement("span");
    ghost.className = "ph-ghost"; ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = cur.textContent.trim();
    ph.parentNode.insertBefore(ghost, ph);
  }

  /* ===== Footer big wordmark ===== */
  var footer = $(".site-footer");
  var fbottom = $(".footer-bottom");
  if (footer && fbottom) {
    var big = document.createElement("div");
    big.className = "footer-bigmark"; big.setAttribute("aria-hidden", "true");
    big.textContent = "Monarch";
    footer.insertBefore(big, fbottom);
  }

  /* ===== FAQ accordion ===== */
  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var a = $(".faq-a", item);
      var open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : null;
    });
  });

  /* ===== Contact form (front-end demo) ===== */
  var form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("#formNote");
      if (note) note.classList.add("show");
      form.reset();
    });
  }

  /* ===== Footer year ===== */
  var y = $("#year");
  if (y) y.textContent = "2026";

  /* ===== Floating WhatsApp chat widget ===== */
  (function () {
    var phone = "918953452487";
    var display = "+91 89534 52487";
    var text = encodeURIComponent("Hi Monarch Health Scribing, I'd like to know more about your services.");
    var waLink = "https://wa.me/" + phone + "?text=" + text;
    var glyph = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2.01a9.9 9.9 0 00-8.48 14.95L2 22l5.2-1.36A9.9 9.9 0 1012.04 2.01zm0 1.8a8.1 8.1 0 016.95 12.2l-.2.33.78 2.85-2.92-.77-.32.19a8.1 8.1 0 11-4.1-15.04zm4.5 10.3c-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.21-.45-2.3-1.43-.85-.76-1.43-1.7-1.6-1.98-.16-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.14.19 2.01 3.08 4.88 4.32.68.29 1.21.46 1.63.59.68.22 1.3.19 1.79.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36z"/></svg>';
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="wa-panel" id="waPanel" role="dialog" aria-label="Chat on WhatsApp">' +
        '<div class="wa-head"><span class="wa-avatar">' + glyph + '</span>' +
          '<div><h4>Start a Conversation</h4><p>Hi! Click the button below to chat with our team on WhatsApp.</p></div></div>' +
        '<div class="wa-body"><p class="wa-note">The team typically replies in a few minutes.</p>' +
          '<a class="wa-contact" href="' + waLink + '" target="_blank" rel="noopener">' +
            '<span class="av">' + glyph + '</span>' +
            '<span class="meta"><b>Monarch Health Scribing</b><span>' + display + '</span></span>' +
            '<span class="go">' + glyph + '</span></a></div></div>' +
      '<button class="wa-fab" id="waFab" type="button" aria-label="Chat on WhatsApp" aria-expanded="false">' +
        '<svg class="wa-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2.01a9.9 9.9 0 00-8.48 14.95L2 22l5.2-1.36A9.9 9.9 0 1012.04 2.01zm0 1.8a8.1 8.1 0 016.95 12.2l-.2.33.78 2.85-2.92-.77-.32.19a8.1 8.1 0 11-4.1-15.04zm4.5 10.3c-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.21-.45-2.3-1.43-.85-.76-1.43-1.7-1.6-1.98-.16-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.14.19 2.01 3.08 4.88 4.32.68.29 1.21.46 1.63.59.68.22 1.3.19 1.79.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36z"/></svg>' +
        '<svg class="wa-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>' +
      '</button>';
    document.body.appendChild(wrap);
    var fab = $("#waFab"), panel = $("#waPanel");
    var setOpen = function (open) {
      fab.classList.toggle("open", open);
      panel.classList.toggle("open", open);
      fab.setAttribute("aria-expanded", String(open));
    };
    fab.addEventListener("click", function () { setOpen(!fab.classList.contains("open")); });
    document.addEventListener("click", function (e) {
      if (fab.classList.contains("open") && !panel.contains(e.target) && !fab.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();
})();
