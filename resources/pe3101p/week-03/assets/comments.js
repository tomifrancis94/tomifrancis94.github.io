/* PE3101P week 3 -- margin comments and edit suggestions.
 *
 * WHAT THIS IS FOR: Tomi reads the notes in the browser and marks up what he
 * wants changed. Claude then implements it. Nothing here edits the notes.
 *
 * TWO KINDS OF MARKUP, and the distinction is Tomi's (21 August 2026):
 *
 *   COMMENT  -- free prose. "Figures are too small, fix this in general."
 *               Needs a person to interpret it.
 *
 *   EDIT     -- deterministic. The composer is prefilled with the block's REAL
 *               .tex source; he edits it; the before/after pair is saved. His
 *               words: "These kinds of edits should be deterministic, and
 *               therefore can be implemented by script rather than by LLM/agent
 *               time." build/apply_edits.py applies them without a model in the
 *               loop. Same mechanism covers inserting and deleting a paragraph.
 *
 * AUTHOR MODE -- THIS SHIPS TO THE LIVE SITE NOW (Tomi's decision, 3 September
 * 2026), so it is gated. NOTHING is built -- no toolbar, no selection bubble, no
 * panel, no listeners -- unless localStorage['pe3101p-week-03:author'] is '1'.
 * Visiting any page with ?author=1 (or #author) sets that flag and then cleans
 * the URL with history.replaceState, so nothing bookmarked or copied carries it.
 * The flag is per-origin, so it holds on every page of the notes until the
 * panel's "Leave author mode" clears it, which removes the UI on the spot. A
 * reader who never types ?author=1 loads an inert script.
 *
 * WHERE THEY GO. If serve.py is running, everything is POSTed to it and written
 * to comments/comments.json, re-rendered into comments/COMMENTS.md. On the live
 * site (static GitHub Pages) there is no API, and nor is there off a file:// URL.
 * Markup then falls back to localStorage, WHICH CLAUDE CANNOT SEE -- it has to
 * be exported (Download JSON / Copy JSON in the panel) and merged in with
 * build/import_markup.py. The panel banner says which mode is live.
 *
 * IS THERE AN API? Decided by a GET that must come back as JSON carrying a
 * `comments` array. A 404, or a 200 of HTML from a static host's fallback page,
 * counts as no API -- trusting response.ok alone would read a soft-404 page as a
 * server and then throw every save into a fetch that quietly does nothing.
 *
 * ANCHORING. Everything stores the block id (b5.6.1) and the subsection id
 * (5.6). Those come from the .tex structure and are stable across rebuilds so
 * long as sections are not renumbered -- see build_site.py.
 */
(function () {
  "use strict";

  var PAGE = (location.pathname.split("/").pop() || "index.html")
    .replace(/\.html$/, "");
  /* Every key is namespaced to THIS document. Week 2 ships the same layer from
   * the same origin (tomifrancis.com), and an unprefixed key would have the two
   * sets of markup overwriting each other. */
  var NS = "pe3101p-week-03:";
  var LS_KEY = NS + "comments";
  var AUTH_KEY = NS + "author";
  var API = "api/comments";
  var SRC = window.NOTES_BLOCKS || {};

  var state = { items: [], online: false };

  /* --------------------------------------------------------- author mode */
  /* localStorage can throw outright (Safari private mode, blocked cookies), so
   * every access is wrapped. A browser that cannot store the flag simply never
   * enters author mode, which is the safe direction to fail in. */
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }
  function lsDel(k) {
    try { localStorage.removeItem(k); } catch (e) { /* nothing to do */ }
  }

  function isAuthor() { return lsGet(AUTH_KEY) === "1"; }

  /* ?author=1 or #author turns it on, then the URL is cleaned WITHOUT a reload
   * (replaceState, not assignment) so the rest of init() carries on and a copied
   * link does not hand author mode to a student. Any other query or hash on the
   * URL is preserved -- #b5.6.1 has to survive, the scroll-to depends on it. */
  function claimFromURL() {
    var q = location.search;
    var wantQ = /(^|[?&])author=1(&|$)/.test(q);
    var wantH = location.hash === "#author";
    if (!wantQ && !wantH) return;
    lsSet(AUTH_KEY, "1");
    if (!history.replaceState) return;
    var clean = q.replace(/([?&])author=1(&|$)/, "$1").replace(/[?&]$/, "");
    if (clean === "?") clean = "";
    history.replaceState(null, "",
      location.pathname + clean + (wantH ? "" : location.hash));
  }

  /* Leaving takes the UI away there and then rather than asking for a reload:
   * a page still showing toolbars after "Leave author mode" would be a lie. */
  function leaveAuthor() {
    lsDel(AUTH_KEY);
    closeComposer();
    ["#cmt-badge", "#cmt-panel", ".cmt-bubble"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });
    document.querySelectorAll(".blk-tools, .cmt-list").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll(".blk.has-cmt").forEach(function (el) {
      el.classList.remove("has-cmt");
    });
    bubble = null;
  }

  /* ------------------------------------------------------------- storage */
  function loadLocal() {
    try { return JSON.parse(lsGet(LS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function saveLocal() {
    // private mode, quota -- nothing useful to do, and lsSet swallows it
    lsSet(LS_KEY, JSON.stringify(state.items));
  }

  /* The API is there only if the GET comes back as JSON with a `comments`
   * array. A static host answers this path with a 404, or worse with 200 and an
   * HTML error page; either must count as "no API", or every subsequent save
   * would be POSTed into nothing and lost. */
  function probe() {
    return fetch(API, {
      cache: "no-store", headers: { "Accept": "application/json" }
    }).then(function (r) {
      if (!r.ok) throw new Error("status " + r.status);
      var ct = (r.headers.get("content-type") || "").toLowerCase();
      if (ct.indexOf("json") < 0) throw new Error("not json: " + ct);
      return r.json();
    }).then(function (d) {
      if (!d || !Array.isArray(d.comments)) throw new Error("no comments array");
      return d.comments;
    });
  }

  function load() {
    return probe()
      .then(function (items) { state.online = true; state.items = items; })
      .catch(function () { state.online = false; state.items = loadLocal(); });
  }

  function persist(c, action) {
    if (!state.online) { saveLocal(); return Promise.resolve(); }
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, comment: c })
    }).catch(function (e) {
      console.error("save failed, keeping a local copy", e);
      state.online = false;
      saveLocal();
    });
  }

  /* --------------------------------------------------------------- utils */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  /* LOCAL time with its offset, not toISOString(). Tomi is on SGT and the
   * workspace rule is real local dates -- a UTC stamp reads eight hours wrong. */
  function nowISO() {
    var d = new Date(), off = -d.getTimezoneOffset();
    var sign = off < 0 ? "-" : "+", abs = Math.abs(off);
    function p(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) +
      sign + p(Math.floor(abs / 60)) + ":" + p(abs % 60);
  }
  function uid() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function subOf(block) {
    var s = block.closest("section.sub");
    return s ? s.dataset.sub : "";
  }
  function forBlock(id) {
    return state.items.filter(function (c) { return c.block === id; });
  }

  /* Everything a saved item needs in order to survive a renumber. blocksrc is
   * the block's exact .tex source: build_site.py's migrate() matches on it to
   * move the item to its new id. The titles are so COMMENTS.md can say where a
   * thing is in words -- the web number and the .tex number differ once
   * sections are cut. */
  function meta(block) {
    var sub = subOf(block);
    var info = ((window.NOTES_DATA || {}).subinfo || {})[sub] || {};
    return {
      page: PAGE,
      section: sub,
      block: block.id,
      blocksrc: SRC[block.id] || "",
      subTitle: info.title || null,
      sectionTitle: info.sectionTitle || null,
      sourceSection: info.sourceSection || null
    };
  }

  function assign(target, src) {
    Object.keys(src).forEach(function (k) { target[k] = src[k]; });
    return target;
  }
  function kindOf(c) { return c.kind || "comment"; }

  /* ------------------------------------------------------------ composer */
  var open = null;

  /* Grow the box as he types rather than making him work in four lines, but cap
   * it so a very long edit still scrolls instead of running off the screen.
   * Tomi, 21 Aug 2026: "They should expand to be considerably larger, but make
   * sure that I can still scroll through them if they get too large to
   * reasonable be displayed." */
  var TA_MAX = 0.62;          // of the viewport height
  function autoGrow(ta) {
    ta.style.height = "auto";
    // innerHeight can be 0 in a background/unrendered tab; without a floor the
    // cap would collapse the box to nothing.
    var max = Math.max(240, Math.round((window.innerHeight || 800) * TA_MAX));
    var want = ta.scrollHeight + 2;
    ta.style.height = Math.min(want, max) + "px";
    ta.style.overflowY = want > max ? "auto" : "hidden";
  }

  function closeComposer() { if (open) { open.remove(); open = null; } }

  function composer(block, opts) {
    closeComposer();
    var kind = opts.kind;
    var existing = opts.existing || null;
    var isEdit = kind === "edit";
    var isInsert = kind === "insert";
    var src = SRC[block.id] || "";

    var titles = {
      comment: "Comment",
      edit: "Suggest an edit — change the LaTeX below",
      insert: "New paragraph, to go after this block"
    };
    var value = existing
      ? (isEdit ? existing.after : existing.text)
      : (isEdit ? src : "");

    var box = document.createElement("div");
    box.className = "cmt-composer kind-" + kind;
    box.innerHTML =
      "<div class='cmt-meta'>" +
        "<span class='cmt-loc'>" + esc(subOf(block) || PAGE) + "</span>" +
        "<span class='cmt-kind'>" + esc(titles[kind]) + "</span>" +
        (opts.quote ? "<span class='cmt-quote'>&ldquo;" + esc(opts.quote) +
                      "&rdquo;</span>" : "") +
      "</div>" +
      (isEdit && !src
        ? "<p class='cmt-warn'>No source is recorded for this block, so an " +
          "edit cannot be applied by script. Leave a comment instead.</p>"
        : "") +
      "<textarea rows='" + (isEdit ? 8 : isInsert ? 5 : 3) + "' spellcheck='" +
        (isEdit || isInsert ? "false" : "true") + "'" +
        (isEdit || isInsert ? " class='mono'" : "") +
        " placeholder='" + (isEdit ? "" : isInsert ? "New paragraph (LaTeX)…"
                                                   : "Suggested edit…") +
        "'></textarea>" +
      "<div class='cmt-actions'>" +
        "<button class='cmt-save'>" + (existing ? "Update" : "Save") + "</button>" +
        "<button class='cmt-cancel'>Cancel</button>" +
        (isEdit ? "<button class='cmt-reset' title='Restore the original source'>" +
                  "Reset</button>" : "") +
        "<span class='cmt-hint'>Ctrl+Enter to save</span>" +
      "</div>";

    // a heading lives inside <summary>; putting the composer after it would
    // land it inside the disclosure and vanish when collapsed
    var host = block.tagName === "SUMMARY" ? block.parentElement : block;
    host.insertAdjacentElement("afterend", box);
    open = box;
    var ta = box.querySelector("textarea");
    ta.value = value;
    autoGrow(ta);
    ta.addEventListener("input", function () { autoGrow(ta); });
    ta.focus();

    function save() {
      var text = ta.value.replace(/\s+$/, "");
      if (!text.trim()) { closeComposer(); return; }
      if (isEdit && text === src) { closeComposer(); return; }   // no change

      var c = existing ||
        assign({ id: uid(), created: nowISO(), status: "open" }, meta(block));
      c.kind = kind;
      c.quote = opts.quote || c.quote || "";
      if (isEdit) { c.before = src; c.after = text; c.text = ""; }
      else { c.text = text; }
      if (existing) { c.edited = nowISO(); }
      else { state.items.push(c); }

      persist(c, "add");
      closeComposer();
      renderBlock(block.id);
      renderBadge();
    }

    box.querySelector(".cmt-save").onclick = save;
    box.querySelector(".cmt-cancel").onclick = closeComposer;
    var reset = box.querySelector(".cmt-reset");
    if (reset) reset.onclick = function () { ta.value = src; ta.focus(); };
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
      if (e.key === "Escape") { closeComposer(); }
    });
  }

  function deleteBlock(block) {
    var src = SRC[block.id] || "";
    if (!src) { alert("No source recorded for this block; cannot delete by script."); return; }
    if (!confirm("Mark this block for deletion?\n\n" +
                 src.slice(0, 300) + (src.length > 300 ? "…" : ""))) return;
    var c = assign({
      id: uid(), kind: "delete", before: src, after: "", text: "", quote: "",
      created: nowISO(), status: "open"
    }, meta(block));
    state.items.push(c);
    persist(c, "add");
    renderBlock(block.id);
    renderBadge();
  }

  /* -------------------------------------------------------- render inline */
  var LABEL = {
    comment: "Comment", edit: "Edit", insert: "New paragraph",
    "delete": "Delete this block"
  };

  function cardHTML(c) {
    var k = kindOf(c);
    var body;
    if (k === "edit") {
      body = "<div class='cmt-diff'>" +
        "<div class='was'><span class='dl'>was</span><pre>" + esc(c.before) + "</pre></div>" +
        "<div class='now'><span class='dl'>becomes</span><pre>" + esc(c.after) + "</pre></div>" +
        "</div>";
    } else if (k === "delete") {
      body = "<pre class='cmt-del-src'>" + esc(c.before) + "</pre>";
    } else if (k === "insert") {
      body = "<pre class='cmt-ins'>" + esc(c.text) + "</pre>";
    } else {
      body = "<div class='cmt-text'>" + esc(c.text) + "</div>";
    }
    return "<div class='cmt kind-" + k + (c.status === "applied" ? " done" : "") +
      "' data-id='" + c.id + "'>" +
      "<div class='cmt-tag'>" + LABEL[k] + (c.status === "applied" ? " · applied" : "") + "</div>" +
      (c.quote ? "<div class='cmt-quote'>&ldquo;" + esc(c.quote) + "&rdquo;</div>" : "") +
      body +
      "<div class='cmt-foot'>" +
        "<span>" + esc((c.edited || c.created || "").slice(0, 16).replace("T", " ")) + "</span>" +
        "<button class='cmt-editbtn'>edit</button>" +
        "<button class='cmt-del'>delete</button>" +
      "</div></div>";
  }

  function renderBlock(id) {
    var block = document.getElementById(id);
    if (!block) return;
    // a heading's markup hangs off the <details>, not off the <summary>
    var host = block.tagName === "SUMMARY" ? block.parentElement : block;
    var next = host.nextElementSibling;
    if (next && next.classList.contains("cmt-list")) next.remove();
    var mine = forBlock(id);
    if (!mine.length) { block.classList.remove("has-cmt"); return; }
    block.classList.add("has-cmt");

    var wrap = document.createElement("div");
    wrap.className = "cmt-list";
    wrap.innerHTML = mine.map(cardHTML).join("");

    wrap.querySelectorAll(".cmt-del").forEach(function (b) {
      b.onclick = function () {
        var cid = b.closest(".cmt").dataset.id;
        var c = state.items.find(function (x) { return x.id === cid; });
        state.items = state.items.filter(function (x) { return x.id !== cid; });
        persist(c, "delete");
        renderBlock(id);
        renderBadge();
      };
    });
    wrap.querySelectorAll(".cmt-editbtn").forEach(function (b) {
      b.onclick = function () {
        var cid = b.closest(".cmt").dataset.id;
        var c = state.items.find(function (x) { return x.id === cid; });
        if (kindOf(c) === "delete") {
          alert("A deletion has nothing to edit — remove it and mark it again.");
          return;
        }
        composer(block, { kind: kindOf(c), existing: c, quote: c.quote });
      };
    });
    host.insertAdjacentElement("afterend", wrap);
  }

  function renderAll() {
    document.querySelectorAll(".blk[id]").forEach(function (b) { renderBlock(b.id); });
  }

  /* ---------------------------------------------------------- block tools */
  var TOOLS = [
    ["+", "comment", "Comment on this block"],
    ["✎", "edit", "Suggest an edit to the text"],
    ["¶", "insert", "Add a paragraph after this block"],
    ["✕", "delete", "Mark this block for deletion"]
  ];

  function addTools() {
    document.querySelectorAll(".blk[id]").forEach(function (block) {
      var bar = document.createElement("div");
      bar.className = "blk-tools";
      bar.setAttribute("aria-hidden", "true");
      TOOLS.forEach(function (t) {
        var glyph = t[0], kind = t[1], title = t[2];
        if ((kind === "edit" || kind === "delete") && !SRC[block.id]) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tool tool-" + kind;
        b.title = title;
        b.tabIndex = -1;
        b.textContent = glyph;
        b.onclick = function (e) {
          // inside a <summary> a click would toggle the disclosure as well
          e.preventDefault();
          e.stopPropagation();
          if (kind === "delete") deleteBlock(block);
          else composer(block, { kind: kind });
        };
        bar.appendChild(b);
      });
      block.appendChild(bar);
    });
  }

  /* ------------------------------------------------- comment on selection */
  var bubble;
  function selectionBubble() {
    bubble = document.createElement("button");
    bubble.className = "cmt-bubble";
    bubble.textContent = "Comment on selection";
    bubble.style.display = "none";
    document.body.appendChild(bubble);

    document.addEventListener("mouseup", function () {
      setTimeout(function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) { bubble.style.display = "none"; return; }
        var text = sel.toString().trim();
        if (text.length < 2) { bubble.style.display = "none"; return; }
        var node = sel.anchorNode;
        var el = node.nodeType === 1 ? node : node.parentElement;
        var block = el && el.closest(".blk[id]");
        if (!block) { bubble.style.display = "none"; return; }
        var r = sel.getRangeAt(0).getBoundingClientRect();
        bubble.style.display = "block";
        bubble.style.top = (window.scrollY + r.top - 38) + "px";
        bubble.style.left = (window.scrollX + r.left) + "px";
        bubble.onclick = function () {
          bubble.style.display = "none";
          composer(block, {
            kind: "comment",
            quote: text.length > 180 ? text.slice(0, 180) + "…" : text
          });
          sel.removeAllRanges();
        };
      }, 10);
    });
    document.addEventListener("scroll", function () {
      if (bubble) bubble.style.display = "none";
    }, { passive: true });
  }

  /* ---------------------------------------------------------- side panel */
  function renderBadge() {
    var b = document.getElementById("cmt-badge");
    if (!b) return;
    var here = state.items.filter(function (c) { return c.page === PAGE; }).length;
    b.textContent = here ? ("Notes " + here + " / " + state.items.length)
                         : ("Notes " + state.items.length);
    b.classList.toggle("empty", state.items.length === 0);
  }

  function panelHTML() {
    if (!state.items.length) {
      return "<p class='cmt-empty'>Nothing yet. Hover a block for the toolbar: " +
        "<strong>+</strong> comment, <strong>✎</strong> edit the text, " +
        "<strong>¶</strong> add a paragraph, <strong>✕</strong> delete. " +
        "Or select some words and click <strong>Comment on selection</strong>.</p>";
    }
    var byPage = {};
    state.items.forEach(function (c) { (byPage[c.page] = byPage[c.page] || []).push(c); });
    return Object.keys(byPage).sort().map(function (p) {
      return "<div class='cmt-group'><h4>" + esc(p) + "</h4>" +
        byPage[p].map(function (c) {
          var k = kindOf(c);
          return "<div class='cmt-row'>" +
            "<span class='pill pill-" + k + "'>" + LABEL[k] + "</span> " +
            "<a href='" + esc(p) + ".html#" + esc(c.block) + "'>" +
              esc(c.section || c.block) + "</a> " +
            "<span class='cmt-text'>" +
              esc(k === "edit" ? (c.after || "").slice(0, 90)
                 : k === "delete" ? (c.before || "").slice(0, 90)
                 : c.text) + "</span>" +
          "</div>";
        }).join("") + "</div>";
    }).join("");
  }

  function buildPanel() {
    var badge = document.createElement("button");
    badge.id = "cmt-badge";
    badge.type = "button";
    document.body.appendChild(badge);

    var panel = document.createElement("aside");
    panel.id = "cmt-panel";
    panel.hidden = true;
    document.body.appendChild(panel);

    function paint() {
      var pending = state.items.filter(function (c) {
        return c.kind && c.kind !== "comment" && c.status !== "applied";
      }).length;
      panel.innerHTML =
        "<header><strong>Markup</strong>" +
        "<button class='cmt-close' title='Close'>&times;</button></header>" +
        "<div class='cmt-status " + (state.online ? "on" : "off") + "'>" +
          (state.online
            ? "Saving to comments/comments.json"
            : "<strong>No server here.</strong> Everything you mark up is saved " +
              "<strong>in this browser only</strong> and Claude cannot see it. " +
              "To get it to him, use <strong>Copy JSON</strong> or " +
              "<strong>Download JSON</strong> below and hand the text or the " +
              "file over; it is merged in with " +
              "<code>python build/import_markup.py</code>. Nothing leaves this " +
              "browser until you do that — clearing site data loses it.") +
        "</div>" +
        (pending ? "<div class='cmt-status script'>" + pending +
                   " scriptable edit" + (pending === 1 ? "" : "s") +
                   " pending — <code>python build/apply_edits.py</code></div>" : "") +
        "<div class='cmt-body'>" + panelHTML() + "</div>" +
        "<footer><button class='cmt-dl'>Download JSON</button>" +
        (state.online ? ""
          : "<button class='cmt-copyjson'>Copy JSON</button>" +
            "<button class='cmt-import'>Import JSON</button>") +
        "<button class='cmt-copy'>Copy as Markdown</button>" +
        "<button class='cmt-leave' title='Turn the markup layer off in this " +
        "browser'>Leave author mode</button>" +
        "<span class='cmt-note' aria-live='polite'></span></footer>";
      panel.querySelector(".cmt-close").onclick = function () { panel.hidden = true; };
      panel.querySelector(".cmt-dl").onclick = download;
      panel.querySelector(".cmt-copy").onclick = copyMarkdown;
      panel.querySelector(".cmt-leave").onclick = leaveAuthor;
      var cj = panel.querySelector(".cmt-copyjson");
      if (cj) cj.onclick = copyJSON;
      var im = panel.querySelector(".cmt-import");
      if (im) im.onclick = function () { importJSON(paint); };
    }

    badge.onclick = function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) paint();
    };
  }

  function asMarkdown() {
    var byPage = {};
    state.items.forEach(function (c) { (byPage[c.page] = byPage[c.page] || []).push(c); });
    var out = ["# PE3101P week 3 — markup", ""];
    Object.keys(byPage).sort().forEach(function (p) {
      out.push("## " + p, "");
      byPage[p].forEach(function (c) {
        var k = kindOf(c);
        out.push("- **" + LABEL[k] + "** §" + (c.section || "") +
                 " (`" + c.block + "`)");
        if (c.quote) out.push("  > " + c.quote);
        if (k === "edit") {
          out.push("  - was: `" + (c.before || "").replace(/\n/g, " ") + "`");
          out.push("  - becomes: `" + (c.after || "").replace(/\n/g, " ") + "`");
        } else if (k === "delete") {
          out.push("  - remove: `" + (c.before || "").replace(/\n/g, " ") + "`");
        } else {
          out.push("  - " + c.text);
        }
      });
      out.push("");
    });
    return out.join("\n");
  }

  /* ------------------------------------------------- export and import */
  /* On a static host these ARE the save: nothing has reached disk until one of
   * them has been used, so each says out loud what it did. */
  function exportText() {
    return JSON.stringify({ comments: state.items }, null, 1);
  }

  function note(msg) {
    var n = document.querySelector("#cmt-panel .cmt-note");
    if (!n) return;
    n.textContent = msg;
    clearTimeout(note.t);
    note.t = setTimeout(function () { n.textContent = ""; }, 6000);
  }

  function flash(sel, word) {
    var b = document.querySelector(sel);
    if (!b) return;
    var t = b.getAttribute("data-label") || b.textContent;
    b.setAttribute("data-label", t);
    b.textContent = word;
    setTimeout(function () { b.textContent = t; }, 1400);
  }

  /* execCommand is deprecated, but the clipboard API refuses on an unfocused
   * document and on plain http to anything that is not localhost -- both of
   * which happen here -- and a copy button that silently does nothing would
   * lose markup. */
  function copyFallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function copyText(text, sel, what) {
    function won() { flash(sel, "Copied"); note(what + " copied to the clipboard."); }
    function lost() {
      if (copyFallback(text)) won();
      else note("The browser refused the clipboard — use Download JSON instead.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(won, lost);
    } else { lost(); }
  }

  function copyJSON() {
    copyText(exportText(), ".cmt-copyjson",
      state.items.length + " item" + (state.items.length === 1 ? "" : "s") +
      " as JSON");
  }

  function copyMarkdown() { copyText(asMarkdown(), ".cmt-copy", "Markdown"); }

  function download() {
    var blob = new Blob([exportText()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    // named for the document: a week 2 export in the same Downloads folder must
    // not be mistaken for this one
    a.download = "pe3101p-week-03-comments.json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    note("Downloaded " + a.download + " — run python build/import_markup.py on it.");
  }

  function stampOf(c) {
    var t = Date.parse(c.edited || c.created || "");
    return isNaN(t) ? 0 : t;
  }

  /* Merge by id, newer wins -- exactly the rule build/import_markup.py applies
   * at the other end. It never deletes: an item missing from the file being
   * imported might simply have been made in a different browser. */
  function mergeItems(incoming) {
    var by = {}, added = 0, updated = 0, changed = [];
    state.items.forEach(function (c) { if (c.id) by[c.id] = c; });
    incoming.forEach(function (c) {
      if (!c || !c.id) return;
      var old = by[c.id];
      if (!old) {
        state.items.push(c); by[c.id] = c; added++; changed.push(c);
      } else if (stampOf(c) > stampOf(old)) {
        state.items[state.items.indexOf(old)] = c;
        by[c.id] = c; updated++; changed.push(c);
      }
    });
    return { added: added, updated: updated, changed: changed };
  }

  function importJSON(after) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        var data, msg;
        try { data = JSON.parse(String(fr.result)); }
        catch (e) { note(f.name + " is not JSON."); return; }
        var items = Array.isArray(data) ? data : (data && data.comments);
        if (!Array.isArray(items)) {
          note(f.name + " has no comments array in it."); return;
        }
        var r = mergeItems(items);
        if (!r.added && !r.updated) {
          msg = "Nothing new in " + f.name + " — all " + items.length +
                " item(s) are already here or older.";
        } else {
          if (state.online) {
            r.changed.forEach(function (c) { persist(c, "add"); });
          } else { saveLocal(); }
          msg = "Imported from " + f.name + ": " + r.added + " new, " +
                r.updated + " updated.";
        }
        renderAll();
        renderBadge();
        // paint() rewrites the panel, so the note has to come after it
        if (after) after();
        note(msg);
      };
      fr.readAsText(f);
    };
    inp.click();
  }

  /* ---------------------------------------------------------------- init */
  function init() {
    claimFromURL();
    // THE GATE. Nothing below this line runs for a reader without the flag --
    // no toolbars, no bubble, no panel, no listeners, nothing in the DOM.
    if (!isAuthor()) return;
    addTools();
    selectionBubble();
    buildPanel();
    load().then(function () {
      renderAll();
      renderBadge();
      if (location.hash) {
        // getElementById, NOT querySelector: every id in this document has dots
        // in it (b5.1.2, s6.2), and "#b5.1.2" is not a valid CSS selector -- so
        // querySelector THREW on every hash, killing the rest of this callback.
        // Invisible until the layer shipped, because the panel's own "go to"
        // links are the main thing that lands here.
        var el = document.getElementById(location.hash.slice(1));
        // a target inside a collapsed <details> has to be opened to be seen
        if (el) {
          var d = el.closest("details");
          while (d) { d.open = true; d = d.parentElement.closest("details"); }
          el.scrollIntoView();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
