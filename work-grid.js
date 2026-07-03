/* Hover-play work grid.
   Loops are fetched only when a card nears the viewport, play on
   hover/focus (tap-to-preview on touch), and fall back to the static
   poster when a clip is missing, playback fails, or the user prefers
   reduced motion. */
(function () {
  const cards = Array.from(document.querySelectorAll('.work-card'));
  if (!cards.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach((card) => {
      const v = card.querySelector('.work-card-loop');
      if (v) v.remove();
    });
    return;
  }

  const loop = (card) => card.querySelector('.work-card-loop');

  function load(card) {
    const v = loop(card);
    if (!v) return null;
    if (!v.dataset.loaded) {
      v.dataset.loaded = 'true';
      v.addEventListener('error', () => {
        card.classList.remove('is-playing', 'is-tapped');
        v.remove();
      }, { once: true });
      v.addEventListener('playing', () => card.classList.add('is-playing'));
      v.addEventListener('pause', () => card.classList.remove('is-playing'));
      v.src = v.dataset.src;
      v.preload = 'auto';
    }
    return v;
  }

  function play(card) {
    const v = load(card);
    if (!v) return;
    const p = v.play();
    if (p) p.catch(() => card.classList.remove('is-playing'));
  }

  function stop(card, rewind) {
    card.classList.remove('is-tapped');
    const v = loop(card);
    if (!v || !v.dataset.loaded) return;
    v.pause();
    if (rewind) v.currentTime = 0;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) load(e.target);
      else stop(e.target, true);
    });
  }, { rootMargin: '200px 0px' });
  cards.forEach((card) => io.observe(card));

  if (window.matchMedia('(hover: hover)').matches) {
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => play(card));
      card.addEventListener('mouseleave', () => stop(card, false));
    });
  } else {
    // Touch: first tap previews the loop, second tap follows the link.
    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        if (!loop(card)) return;
        if (card.classList.contains('is-tapped')) return;
        e.preventDefault();
        cards.forEach((other) => { if (other !== card) stop(other, false); });
        card.classList.add('is-tapped');
        play(card);
      });
    });
  }

  // Keyboard focus gets the same preview as hover.
  cards.forEach((card) => {
    card.addEventListener('focusin', () => play(card));
    card.addEventListener('focusout', () => stop(card, false));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cards.forEach((card) => stop(card, false));
  });
})();
