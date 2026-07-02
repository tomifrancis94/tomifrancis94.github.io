// Give the sticky nav a translucent dark bar once the page is scrolled
// (mirrors the current Google Sites behaviour).
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
