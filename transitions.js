(function () {
  if (!document.startViewTransition) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const selector = 'a.work-card, .nav-dropdown-menu a, a.nav-logo, a.btn-primary[href$=".html"], a.btn-ghost[href$=".html"]';

  function sameOrigin(href) {
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return false;
      if (url.pathname === location.pathname) return false;
      return url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (!link.matches(selector)) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = link.getAttribute('href');
    if (!href || !sameOrigin(href)) return;

    e.preventDefault();
    const url = new URL(href, location.href).href;
    document.startViewTransition(() => {
      location.href = url;
    });
  });
})();
