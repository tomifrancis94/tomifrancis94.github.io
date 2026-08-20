/* Set theory primer — interaction layer.

   - click a reference   -> peek at it in the sidebar
   - press "Go to"       -> go there: right page, element at the top, proof expanded
   - click a figure      -> collapse/expand it (proofs have their own Proof button)
*/
(function () {
  "use strict";

  var REFS = window.PRIMER_REFS || {};

  // There is no double-click handling (dropped 18 Aug 2026: "Go to" is better and
  // it's enough of a feature). With nothing to wait for, a click opens the sidebar
  // immediately — the old 220ms delay existed only to see whether a second click
  // was coming, and it made every click feel slightly sluggish.
  var TOUCH = window.matchMedia("(pointer: coarse)").matches;

  /* ------------------------------------------------------------ collapsing */
  /* Only proofs and diagrams collapse (Tomi, 18 Aug 2026). Propositions,
     definitions and exercises are always shown in full, and clicking one does
     nothing. */
  function ownerOf(el) {
    return el.closest(".proof, .fig");
  }

  function toggle(target) {
    var open = target.getAttribute("data-open") === "1";
    target.setAttribute("data-open", open ? "0" : "1");
    var btn = target.querySelector(".prooftog");
    if (btn) btn.setAttribute("aria-expanded", String(!open));
  }

  // Arriving at a proposition via "Go to" should reveal its proof.
  function open(el) {
    var target = el.classList.contains("prop") || el.classList.contains("exercise")
      ? el.querySelector(".proof")
      : el;
    if (target && target.hasAttribute("data-open")) {
      target.setAttribute("data-open", "1");
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-toggle]");
    if (!t) return;
    if (e.target.closest("a")) return;        // a link inside a label still navigates
    var owner = ownerOf(t);
    if (owner) { e.preventDefault(); toggle(owner); }
  });

  /* ------------------------------------------------------------ sidebar */
  var peek = document.getElementById("peek");
  var peekTitle = peek.querySelector(".peektitle");
  var peekBody = peek.querySelector(".peekbody");
  var peekGo = peek.querySelector(".peekgo");

  function closePeek() {
    peek.hidden = true;
    document.body.classList.remove("peekopen");
  }

  peek.querySelector(".peekclose").addEventListener("click", closePeek);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !peek.hidden) closePeek();
  });

  /* The sidebar shows a second copy of a figure that is already on the page. SVG
     ids are document-global, so without re-prefixing them the two copies fight and
     `url(#…)` resolves to whichever came first — the same fault that mis-shaded the
     diagrams site-wide. Also strip the id so the anchor stays unique. */
  function reid(markup) {
    return markup
      .replace(/id='([^']+)'/g, "id='peek-$1'")
      .replace(/url\(#([^)]+)\)/g, "url(#peek-$1)")
      .replace(/\sid='peek-(fig:[^']+)'/g, " data-of='$1'");
  }

  function renderPeek(id) {
    var rec = REFS[id];
    if (!rec) return;
    peekTitle.textContent = rec.kind === "Section"
      ? "Section " + rec.number
      : rec.kind + " " + rec.number + (rec.title ? " (" + rec.title + ")" : "");
    peekGo.setAttribute("href", rec.page + "#" + id);

    var html = "";
    if (rec.kind === "Figure") {
      html += "<div class='figbody' style='cursor:default'>" + reid(rec.statement) + "</div>";
      if (rec.title) html += "<figcaption>" + rec.title + "</figcaption>";
    } else if (rec.kind === "Section") {
      html += "<p><strong>" + rec.title + "</strong></p>" +
              "<p class='peekhint'>A whole section — open it to read.</p>";
    } else {
      html += "<p class='stmt'>" + rec.statement + "</p>";
      if (rec.figure) html += reid(rec.figure);
    }
    if (rec.proof) {
      html += "<section class='proof' data-open='0'>" +
              "<button type='button' class='prooftog' data-toggle>" +
              "<span class='caret'></span>Proof</button>" +
              "<div class='proofbody'>" + rec.proof + "</div></section>";
    }
    if (!TOUCH) html += "<p class='peekhint'>Press Esc to close.</p>";
    peekBody.innerHTML = html;
    peekBody.scrollTop = 0;
    peek.hidden = false;
    document.body.classList.add("peekopen");
  }

  /* ------------------------------------------------------------ references */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a.xref");
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute("data-ref");
    if (REFS[id]) renderPeek(id);
    else window.location.href = a.getAttribute("href");   // no record: follow the link
  });

  // "Go to" is the only way to jump. Within the same page, do it without a reload
  // and close the sidebar, since it would otherwise duplicate what you just landed on.
  peekGo.addEventListener("click", function (e) {
    var href = peekGo.getAttribute("href") || "";
    var page = href.split("#")[0];
    var id = href.split("#")[1];
    var here = location.pathname.split("/").pop() || "index.html";
    if (page === here && id) {
      e.preventDefault();
      closePeek();
      focusTarget(decodeURIComponent(id));
      history.replaceState(null, "", "#" + id);
    }
  });

  /* ------------------------------------------------------------ arriving */
  function focusTarget(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    open(el);
    if (el.classList.contains("fig")) el.setAttribute("data-open", "1");
    var bar = document.querySelector(".topbar");
    var offset = (bar ? bar.getBoundingClientRect().height : 0) + 14;
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "auto" });
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 1200);
  }

  // ?peek=<id> opens the sidebar straight away, so a peek can be linked to.
  var qp = new URLSearchParams(location.search).get("peek");
  if (qp && REFS[qp]) renderPeek(qp);

  if (location.hash) {
    focusTarget(decodeURIComponent(location.hash.slice(1)));
  }

  // Small hook so the build's verification pass can drive the UI headlessly.
  window.PRIMER = { peek: renderPeek, focus: focusTarget, toggle: toggle, refs: REFS };
  window.addEventListener("hashchange", function () {
    focusTarget(decodeURIComponent(location.hash.slice(1)));
  });

  /* ------------------------------------------------------------ contents */
  var tocBtn = document.getElementById("tocbtn");
  var toc = document.getElementById("toc");
  if (tocBtn && toc) {
    var narrow = window.matchMedia("(max-width: 62rem)");

    // A backdrop so tapping beside the drawer closes it, the way a drawer should.
    var veil = document.createElement("button");
    veil.className = "tocveil";
    veil.type = "button";
    veil.hidden = true;
    veil.setAttribute("aria-label", "Close contents");
    document.body.appendChild(veil);

    function setToc(open) {
      if (narrow.matches) {
        // Drawer: class-driven, and it stays in the tree so it can slide.
        toc.hidden = false;
        toc.classList.toggle("open", open);
        toc.setAttribute("aria-hidden", String(!open));
      } else {
        // Desktop: a plain sticky column, always there.
        toc.hidden = false;
        toc.classList.remove("open");
        toc.removeAttribute("aria-hidden");
      }
      veil.hidden = !(open && narrow.matches);
      document.body.classList.toggle("tocopen", open && narrow.matches);
      tocBtn.setAttribute("aria-expanded", String(open && narrow.matches));
    }
    function isOpen() { return !narrow.matches || toc.classList.contains("open"); }
    function sync() { setToc(!narrow.matches); }

    sync();
    narrow.addEventListener("change", sync);
    tocBtn.addEventListener("click", function () { setToc(!isOpen()); });
    veil.addEventListener("click", function () { setToc(false); });
    // Choosing a section on a phone should close the drawer behind you.
    toc.addEventListener("click", function (e) {
      if (e.target.closest("a") && narrow.matches) setToc(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && narrow.matches && isOpen()) setToc(false);
    });
  }
})();
