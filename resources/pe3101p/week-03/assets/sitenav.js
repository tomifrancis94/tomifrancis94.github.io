/* The site's top navigation, shared by every web edition on tomifrancis.com.
 * Two jobs, both mirroring site/assets/site.js and site/style.css:
 *   1. publish the bar's height as --sitenav-h, so the sticky contents column,
 *      the fixed definition panel and every scroll target sit below it -- the
 *      bar wraps to two rows on a phone, so the height cannot be a constant;
 *   2. give it the translucent dark background once the page is scrolled.
 * The markup itself is written by the build (build_site.SITENAV). */
(function () {
  "use strict";
  var nav = document.querySelector(".sitenav");
  if (!nav) return;
  function height() {
    document.documentElement.style.setProperty("--sitenav-h", nav.offsetHeight + "px");
  }
  function scrolled() {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  height();
  scrolled();
  window.addEventListener("resize", height);
  if (window.ResizeObserver) new ResizeObserver(height).observe(nav);
  window.addEventListener("scroll", scrolled, { passive: true });
})();
