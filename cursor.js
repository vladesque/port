(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.body.classList.add('custom-cursor-active');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  const magnetTargets = new Map();

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  }, { passive: true });

  const hoverSelector = 'a, button, .work-card';
  document.querySelectorAll(hoverSelector).forEach((el) => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('is-hover');
      if (el.matches('.work-card, .btn-primary')) magnetTargets.set(el, { x: 0, y: 0 });
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('is-hover');
      if (magnetTargets.has(el)) {
        magnetTargets.delete(el);
        el.style.transform = '';
      }
    });
  });

  function frame() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

    magnetTargets.forEach((state, el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (mx - cx) * 0.15;
      const dy = (my - cy) * 0.15;
      const maxPull = 8;
      const tx = Math.max(-maxPull, Math.min(maxPull, dx));
      const ty = Math.max(-maxPull, Math.min(maxPull, dy));
      state.x += (tx - state.x) * 0.2;
      state.y += (ty - state.y) * 0.2;
      el.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px)`;
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
