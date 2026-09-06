/* PE3101P week 2 -- maths rendering and small page behaviours.
 *
 * ⚠️ KaTeX auto-render is DELIBERATELY NOT USED. These notes are full of prices
 * -- $100, $20 + ε -- which reach the page as literal '$' characters. Auto-render
 * scans text for '$' delimiters and would pair up two money signs and render the
 * prose between them as maths. So the build emits every piece of maths as an
 * element carrying its TeX in data-tex, and we render exactly those. No
 * delimiter scanning ever happens.
 */
(function () {
  "use strict";

  var MACROS = {
    // \Cr is \DeclareMathOperator{\Cr}{Cr} in the .tex
    "\\Cr": "\\operatorname{Cr}",
    // amsmath's \nicefrac is not in KaTeX
    "\\nicefrac": "\\tfrac{#1}{#2}"
  };

  function renderMaths(root) {
    if (typeof katex === "undefined") {
      console.warn("KaTeX did not load; maths left as source text.");
      return;
    }
    var nodes = (root || document).querySelectorAll("[data-tex]");
    var failed = 0;
    nodes.forEach(function (el) {
      var tex = el.getAttribute("data-tex");
      var display = el.classList.contains("mathblock");
      try {
        katex.render(tex, el, {
          displayMode: display,
          throwOnError: true,
          macros: MACROS,
          strict: false
        });
      } catch (e) {
        failed++;
        el.innerHTML = "<span class='math-error' title='" +
          String(e.message).replace(/'/g, "") + "'>" +
          tex.replace(/</g, "&lt;") + "</span>";
        console.error("KaTeX failed on:", tex, e.message);
      }
    });
    if (failed) {
      console.warn(failed + " of " + nodes.length + " maths spans failed.");
    }
    if (!root) {
      document.body.dataset.mathTotal = nodes.length;
      document.body.dataset.mathFailed = failed;
    }
  }

  /* ------------------------------------------------- the definition panel
   *
   * Tomi, 22 August 2026: "just like with the set theory primer, please go
   * through and fold in backtracking definitions which display on the right."
   *
   * Click a defined term anywhere in the prose and its definition opens in the
   * right-hand panel, without leaving the page. "Go to" jumps to it properly.
   *
   * ⚠️ THE GUTTER IS RESERVED WHETHER THE PANEL IS OPEN OR NOT, and that is his
   * instruction from the primer (17 August): "if you click on a definition, the
   * main text doesn't move at all. (Currently it resizes, which is not great
   * GUI)." So the reservation lives on `body` in the CSS and opening the panel
   * has NO layout effect at all. Do not make .peekopen change any geometry.
   */
  function peekPanel() {
    var DEFS = (window.NOTES_DATA && window.NOTES_DATA.defs) || {};
    var peek = document.getElementById("peek");
    if (!peek) return;
    var title = peek.querySelector(".peektitle");
    var body = peek.querySelector(".peekbody");
    var go = peek.querySelector(".peekgo");

    function close() {
      peek.hidden = true;
      document.body.classList.remove("peekopen");
    }

    function open(key) {
      var rec = DEFS[key];
      if (!rec) return false;
      title.textContent = rec.kind + " — " + rec.term;
      go.setAttribute("href", rec.page + "#" + rec.block);
      // ⚠️ Strip every id out of the copy. The panel shows a SECOND copy of a
      // block that may already be on this page, and two elements sharing an id
      // breaks both the comment anchoring and every #fragment link.
      // ⚠️ Strip every id out of the copy. The panel shows a SECOND copy of a
      // block that may already be on this page, and two elements sharing an id
      // breaks both the comment anchoring and every #fragment link.
      body.innerHTML = "<div class='peekfit'>"
        + rec.html.replace(/\sid='[^']*'/g, "") + "</div>";
      renderMaths(body);
      body.scrollTop = 0;
      peek.hidden = false;
      document.body.classList.add("peekopen");
      fit();
      return true;
    }

    /* ⛔ THE PANEL MUST NEVER SCROLL SIDEWAYS. Tomi, 22 August 2026, on Bayes'
       theorem: "That should never happen. Please fix in general." And again, on
       conditional probability, when the first attempt did not work.
       ⚠️ THE FIRST ATTEMPT SCALED THE BLOCK WITH `transform: scale()`. THAT DOES
       NOT WORK, and the reason is worth keeping: a transform is purely visual.
       The `.mathblock` inside still LAYS OUT at its natural width, still
       overflows its own box, and still shows its own scrollbar -- notes.css
       gives it `overflow-x: auto` deliberately, for the main page. Scaling just
       shrank the scrollbar along with everything else.
       ⚠️ AND THE FIRST VERIFICATION MISSED IT, because it measured `.peekbody`'s
       overflow -- which really was hidden -- rather than the overflow of the
       elements INSIDE it. Check every element that could show a bar.
       What works is changing the font size, which is a real layout change: KaTeX
       sizes in em, so the equation genuinely gets narrower and the .mathblock
       stops overflowing at all. */
    function fit() {
      var inner = body.querySelector(".peekfit");
      if (!inner) return;
      inner.style.fontSize = "";
      // ⭐ Shrink the EQUATIONS, not the panel. Only a displayed equation is ever
      // too wide; the prose around it is already reflowing happily, and dragging
      // it down to 55% with the maths would make the whole definition hard to
      // read to solve a problem it does not have.
      inner.querySelectorAll(".mathblock").forEach(function (mb) {
        mb.style.fontSize = "";
        if (mb.scrollWidth <= mb.clientWidth + 1) return;
        for (var p = 97; p >= 40; p -= 3) {
          mb.style.fontSize = p + "%";
          if (mb.scrollWidth <= mb.clientWidth + 1) return;
        }
      });
      // Anything still able to scroll -- inline maths in a long unbreakable run,
      // say -- falls back to shrinking the block as a whole.
      for (var pc = 97; pc >= 50 && overflowing(); pc -= 3) {
        inner.style.fontSize = pc + "%";
      }
    }

    /* Only elements that can actually SHOW a scrollbar count. Two things in
       KaTeX's output overflow permanently and must not drag the size down:
       `.katex-mathml` is the hidden accessibility copy and is 1px wide by
       design, and `.base` spans routinely overrun by a pixel or two. Both are
       `overflow: hidden`/`visible`, so neither can produce a bar. */
    function overflowing() {
      if (body.scrollWidth > body.clientWidth + 1) return true;
      var els = body.querySelectorAll("*");
      for (var i = 0; i < els.length; i++) {
        var ox = getComputedStyle(els[i]).overflowX;
        if (ox !== "auto" && ox !== "scroll") continue;
        if (els[i].scrollWidth > els[i].clientWidth + 1) return true;
      }
      return false;
    }

    addEventListener("resize", function () { if (!peek.hidden) fit(); });

    peek.querySelector(".peekclose").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !peek.hidden) close();
    });

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a.xref.term");
      if (!a) return;
      var key = a.getAttribute("data-def");
      // If the term has no record, the href is a perfectly good ordinary link;
      // let the browser follow it rather than swallowing the click.
      if (open(key)) e.preventDefault();
    });

    // Within this page, "Go to" scrolls rather than reloading, and closes the
    // panel behind you -- it would otherwise sit there duplicating what you
    // just landed on.
    go.addEventListener("click", function (e) {
      var href = go.getAttribute("href") || "";
      var page = href.split("#")[0];
      var id = href.split("#")[1];
      var here = location.pathname.split("/").pop() || "index.html";
      if (page !== here || !id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      close();
      // The target may be inside a subsection that is collapsed by default.
      var det = el.closest("details");
      while (det) { det.open = true; det = det.parentElement.closest("details"); }
      el.scrollIntoView({ block: "center" });
      el.classList.add("flash");
      setTimeout(function () { el.classList.remove("flash"); }, 1200);
    });
  }

  /* Keep the sidebar's current-subsection highlight in step with scrolling.
   *
   * ⚠️ THE PREVIOUS VERSION NEVER HIGHLIGHTED ANYTHING. It observed
   * `.subhead[id]`, whose ids are `h1.1`, and looked them up in a map keyed off
   * the sidebar's hrefs, which are `#s1.1` -- so every lookup missed and the
   * class was never applied. Tomi, 22 August 2026: "when scrolling through, on
   * the left it should highlight the current subsection you're on."
   *
   * ⭐ HIS RULE FOR *WHICH* ONE IS CURRENT, verbatim: "when you're at the point
   * or lower than the point you would jump to by clicking on goto for that
   * subsection." So the active subsection is the LAST one whose jump target has
   * passed the top of the viewport -- not whichever heading happens to be
   * intersecting a margin band. That is a scroll-position comparison, so it is
   * done directly rather than with IntersectionObserver, which cannot express
   * "the last one above me".
   *
   * ! HIS RULE WAS REPLACED ON 7 SEPTEMBER 2026, after he had used the old one
   * for a while: "I think it should go with whichever section has appeared by
   * now at the BOTTOM of the page, UNLESS the scroll wheel is right at the top,
   * in which case the highlight should be on the top section no matter what."
   * So the active entry is the LAST one whose jump target has entered the
   * viewport from below -- the deepest thing you can currently see, not the
   * deepest thing you have scrolled past. Something is always lit now, whereas
   * the old rule lit nothing above the first subsection.
   *
   * The point jumped to is `.headtarget` (id `s1.1`), which is what the sidebar
   * links at. It is compared against the BOTTOM of the viewport, so its
   * `scroll-margin-top` is no longer read off the element.
   */
  function spy() {
    var links = {};
    document.querySelectorAll(".toc ul a").forEach(function (a) {
      links[decodeURIComponent(a.getAttribute("href").slice(1))] = a;
    });
    var targets = Array.prototype.slice
      .call(document.querySelectorAll(".headtarget[id]"))
      .filter(function (t) { return links[t.id]; });
    if (!targets.length) return;

    var current = null;

    function update() {
      var bottom = window.innerHeight || document.documentElement.clientHeight;
      // "whichever section has appeared by now at the BOTTOM of the page"
      var active = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top <= bottom) {
          active = targets[i];
        } else {
          break;      // targets are in document order; the rest are lower still
        }
      }
      // "UNLESS the scroll wheel is right at the top, in which case the
      // highlight should be on the top section no matter what." A few pixels of
      // slack, because a browser restoring a position can land at 1 or 2 rather
      // than a clean 0.
      if ((window.scrollY || window.pageYOffset || 0) <= 4) active = targets[0];
      // At the very bottom the last subsection stays lit; the first is lit
      // before anything else has come into view, so nothing is ever unlit.
      if (active === current) return;
      if (current && links[current.id]) links[current.id].classList.remove("active");
      if (active && links[active.id]) links[active.id].classList.add("active");
      current = active;
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // Collapsing or expanding a subsection moves every target below it.
    document.addEventListener("toggle", onScroll, true);
    update();

    // Hook so a verification pass can drive this headlessly, as the primer's
    // window.PRIMER does. ⚠️ Needed because the scroll handler is throttled with
    // requestAnimationFrame, which a browser does NOT fire while the tab is not
    // compositing -- so an automated check that scrolls and waits hangs rather
    // than failing. Call this instead of waiting for a frame.
    window.NOTES_SPY = { update: update, current: function () { return current; } };
  }

  /* ------------------------------------------------- stepped figure sequences
   * One frame at a time, back and forward. ⚠️ Frames are kept in the DOM and
   * toggled with [hidden] rather than rebuilt, so their SVGs and any KaTeX in
   * their captions are rendered once, on load, and stepping is instant.
   * The frame box is sized to the TALLEST frame so the page does not jump as
   * you step through -- which would defeat the point of watching it change.
   */
  function figseqs() {
    document.querySelectorAll(".figseq").forEach(function (seq) {
      var frames = [].slice.call(seq.querySelectorAll(".seqframe"));
      if (frames.length < 2) return;
      var box = seq.querySelector(".seqframes");
      var now = seq.querySelector(".seqnow");
      var prev = seq.querySelector(".seqprev");
      var next = seq.querySelector(".seqnext");
      var at = 0;

      function size() {
        var tallest = 0;
        var shown = at;
        frames.forEach(function (f, i) {
          f.hidden = false;
          tallest = Math.max(tallest, f.offsetHeight);
          f.hidden = i !== shown;
        });
        if (tallest) box.style.minHeight = tallest + "px";
      }

      function show(i) {
        at = Math.max(0, Math.min(frames.length - 1, i));
        frames.forEach(function (f, k) { f.hidden = k !== at; });
        now.textContent = at + 1;
        prev.disabled = at === 0;
        next.disabled = at === frames.length - 1;
      }

      prev.addEventListener("click", function () { show(at - 1); });
      next.addEventListener("click", function () { show(at + 1); });
      seq.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { show(at - 1); e.preventDefault(); }
        if (e.key === "ArrowRight") { show(at + 1); e.preventDefault(); }
      });
      seq.tabIndex = 0;
      show(0);
      size();
      addEventListener("resize", size);
    });
  }

  /* --------------------------------------------------- interactive figures
   *
   * A figure marked \webwidget{name} in the .tex keeps its static drawing in the
   * PDF and gets an interactive one here. ⚠️ The static SVG is only replaced
   * once the widget has been built, so if this script never runs the reader
   * still sees a real picture rather than an empty box.
   */
  var WIDGETS = {
    /* Tomi, 22 August 2026, on the three rotated copies of V: "have a slider for
       the value of q, starting at 0 by default, and let the students drag it to
       see the dots smoothly rotating around the circle."
       Same six base angles as the static figure, same clockwise-from-the-top
       convention as the other circle figures in this aside. */
    vitalirotate: function (mount) {
      var BASE = [18, 74, 137, 205, 262, 331];
      var R = 78, C = 100, PAD = 14;
      var box = document.createElement("div");
      box.className = "widget-rot";
      box.innerHTML =
        "<svg viewBox='0 0 200 200' class='fig' role='img' " +
        "aria-label='The set V rotated by q around the circle'>" +
        "<circle cx='" + C + "' cy='" + C + "' r='" + R + "' fill='none' " +
        "stroke='currentColor' stroke-width='1.1'/>" +
        "<line x1='" + C + "' y1='" + (C - R - 6) + "' x2='" + C + "' y2='" +
        (C - R + 6) + "' stroke='currentColor' stroke-width='1.1'/>" +
        "<text x='" + C + "' y='" + (C - R - 12) +
        "' text-anchor='middle' class='figlbl' font-size='11'>0</text>" +
        "<g class='rotdots'></g></svg>" +
        "<div class='widget-ctl'>" +
        "<label>q <input type='range' min='0' max='1' step='0.002' value='0'></label>" +
        "<output>V + 0.000</output>" +
        "<button type='button' class='seqbtn widget-reset'>Reset</button>" +
        "</div>";
      var dots = box.querySelector(".rotdots");
      var slider = box.querySelector("input");
      var out = box.querySelector("output");
      BASE.forEach(function () {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", "4");
        c.setAttribute("fill", "currentColor");
        dots.appendChild(c);
      });
      function draw() {
        var q = parseFloat(slider.value);
        BASE.forEach(function (a, i) {
          // clockwise from the top, as in the static figures
          var deg = a - 360 * q;
          var rad = deg * Math.PI / 180;
          var c = dots.children[i];
          c.setAttribute("cx", (C + R * Math.cos(rad)).toFixed(2));
          c.setAttribute("cy", (C - R * Math.sin(rad)).toFixed(2));
        });
        out.textContent = "V + " + q.toFixed(3);
      }
      slider.addEventListener("input", draw);
      box.querySelector(".widget-reset").addEventListener("click", function () {
        slider.value = 0;
        draw();
      });
      draw();
      mount.replaceChildren(box);
      return PAD;   // (unused; keeps the builder signature honest)
    }

    /* ⛔ THE EVENT SANDBOX WAS REMOVED FROM THESE NOTES on 22 August 2026, at
       Tomi's request: "take out the probability playing thing currently there at
       the end. Don't delete it but save it somewhere. I think I'll make it later
       as a standalone thing."
       Nothing about it was deleted. The whole thing -- the widget, its CSS, the
       subsection as written, and how to put it back -- is in
       Teaching/PE3101P .../Tools/Event sandbox/. Read that folder's notes.md
       before reviving it. */
  };

  function widgets() {
    document.querySelectorAll("figure[data-widget]").forEach(function (fig) {
      var build = WIDGETS[fig.getAttribute("data-widget")];
      var mount = fig.querySelector(".figbody");
      if (!build || !mount) return;
      try {
        build(mount);
      } catch (e) {
        console.error("widget failed; static figure left in place", e);
      }
    });
  }

  function init() {
    renderMaths();
    spy();
    peekPanel();
    figseqs();
    widgets();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
