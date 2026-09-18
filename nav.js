/* Mobile nav drawer + small site-wide housekeeping.
   Markup contract (same on every page):
     <nav class="site-nav">
       <a class="nav-logo">…</a>
       <button class="nav-toggle" aria-controls="nav-menu" aria-expanded="false">…</button>
       <ul class="nav-links" id="nav-menu">…</ul>
     </nav> */
(function () {
  const nav = document.querySelector('.site-nav');
  const toggle = nav && nav.querySelector('.nav-toggle');
  const menu = nav && nav.querySelector('.nav-links');

  if (nav && toggle && menu) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

    // Any link in the drawer closes it (same-page anchors included).
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Leaving the mobile breakpoint with the drawer open would lock scroll.
    const mq = window.matchMedia('(min-width: 901px)');
    mq.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  // Pause decorative animations while the tab is hidden (see base.css).
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('is-hidden', document.hidden);
  });
})();
