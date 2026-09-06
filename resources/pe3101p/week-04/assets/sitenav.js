/* The site's top navigation, shared by every web edition on tomifrancis.com.
 *
 * ! THE BAR IS NOT STICKY HERE, and that is deliberate. Tomi, 7 September 2026:
 * "the banner ... should only be visible at the top of the page: when you
 * scroll down, the banner shouldn't come up at the top any more ... This is a
 * change I want ONLY for the lecture notes and set theory primers ... you still
 * should NOT remove the banner from the very top of the page - just stop it
 * from following the reader down and distracting them." So the bar still heads
 * the document; it simply scrolls away with everything else, and there is no
 * "scrolled" restyling any more because it is never on screen once scrolled.
 * !! The rest of the site is UNCHANGED -- site/style.css's .nav and
 * site/assets/site.js still stick and still turn dark. Do not harmonise them.
 *
 * The one job left here is to publish HOW MUCH OF THE BAR IS STILL ON SCREEN as
 * --sitenav-h = max(0, height - scrollY). Everything that sticks to or is fixed
 * at the top of the viewport -- the contents column, the definition panel, and
 * in the primer its own topbar -- is offset by that, so it sits below the bar
 * while the bar is visible and rises to the top of the viewport as the bar
 * leaves, instead of hanging below a phantom bar that has scrolled away.
 * ! The height is measured rather than assumed: the bar wraps to two rows on a
 * phone. The markup itself is written by the build (build_site.SITENAV). */
(function () {
  "use strict";
  var nav = document.querySelector(".sitenav");
  if (!nav) return;
  var full = 0, last = -1;

  /* Deliberately NOT rAF-throttled: a frame of lag here would show as the
     contents column and the panel jittering against the bar on the first
     60-odd pixels of a scroll. Past the bar the value is pinned at 0 and the
     early return below makes the handler free. */
  function apply() {
    var y = window.scrollY || window.pageYOffset || 0;
    var left = full - y;
    if (left < 0) left = 0;
    if (left === last) return;
    last = left;
    document.documentElement.style.setProperty("--sitenav-h", left + "px");
  }

  function measure() {
    full = nav.offsetHeight;
    last = -1;
    apply();
  }

  measure();
  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("resize", measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(nav);

  /* Hook for a headless verification pass, as window.NOTES_SPY is for the
     contents highlight. */
  window.SITENAV = {
    update: apply,
    measure: measure,
    full: function () { return full; },
    visible: function () { return last; }
  };
})();
