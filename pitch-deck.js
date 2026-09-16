/* Social Pitch Deck — interactions.
   - Deck rail + scroll progress that track the slide in view
   - Scroll reveals with count-up stats
   - Live 24fps timecode and a looping countdown phone on the cover
   - NLE-style beat timelines you can scrub, step, or play through
   Keyboard: 1–5 jump between slides. Inside a timeline: ← → step beats,
   Home/End jump, Space plays/pauses. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------------- Deck rail + progress ---------------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.deck-slide'));
  var rail = document.querySelector('[data-rail]');
  var progressBar = document.querySelector('[data-progress]');
  var railLinks = [];

  function goToSlide(i) {
    var s = slides[i];
    if (!s) return;
    s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#' + s.id);
  }

  if (rail) {
    slides.forEach(function (s, i) {
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.className = 'rail-link';
      a.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + (s.dataset.title || s.id));
      a.innerHTML =
        '<span class="rail-label">' + (s.dataset.title || '') + '</span>' +
        '<span class="rail-num">' + pad(i + 1) + '</span>' +
        '<span class="rail-bar"></span>';
      a.addEventListener('click', function (e) { e.preventDefault(); goToSlide(i); });
      rail.appendChild(a);
      railLinks.push(a);
    });
  }

  var scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      scrollQueued = false;
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';

      var probe = y + window.innerHeight * 0.42;
      var active = 0;
      slides.forEach(function (s, i) { if (s.offsetTop <= probe) active = i; });
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 2) active = slides.length - 1;
      railLinks.forEach(function (a, i) {
        a.classList.toggle('is-active', i === active);
        if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= slides.length) { e.preventDefault(); goToSlide(n - 1); }
  });

  /* ---------------- Reveals + count-up ---------------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    if (reduce) { el.textContent = target; return; }
    var start = null, dur = 1100;
    function step(now) {
      if (start === null) start = now;
      var p = clamp((now - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var revealEls = document.querySelectorAll('.pd-reveal, .pd-stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-in');
      el.querySelectorAll('[data-count]').forEach(function (c) { c.textContent = c.dataset.count; });
    });
  }

  /* ---------------- Live timecode (cover) ---------------- */
  var liveTc = document.querySelector('[data-live-tc]');
  if (liveTc) {
    if (reduce) {
      liveTc.textContent = '00:00:00:00';
    } else {
      var t0 = performance.now();
      var lastFrame = -1;
      (function tick(now) {
        var s = (now - t0) / 1000;
        var f = Math.floor(s * 24);
        if (f !== lastFrame) {
          lastFrame = f;
          liveTc.textContent =
            pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(Math.floor(s) % 60) + ':' + pad(f % 24);
        }
        requestAnimationFrame(tick);
      })(t0);
    }
  }

  /* ---------------- Cover phone: 60-minute loop ---------------- */
  var cover = document.querySelector('[data-cover]');
  if (cover) {
    var cClock = cover.querySelector('[data-cover-clock]');
    var cRing = cover.querySelector('[data-cover-ring]');
    var cCaption = cover.querySelector('[data-cover-caption]');
    var cSegs = cover.querySelectorAll('.story-bar i');
    var CIRC = 2 * Math.PI * 52;
    var LOOP = 15000;
    var coverBeats = [
      [0.00, 'POV: you just spent an hour making a meal.'],
      [0.14, 'On the couch. 20 minutes gone.'],
      [0.40, 'One email you can’t quite finish.'],
      [0.60, 'You could even go to space for 10 minutes.'],
      [0.78, 'Coffee run.'],
      [0.92, 'Freezer → microwave. 3:00.']
    ];
    var captionIdx = -1;

    function setCaption(i) {
      if (i === captionIdx) return;
      captionIdx = i;
      cCaption.textContent = coverBeats[i][1];
      if (!reduce) {
        cCaption.classList.remove('is-swap');
        void cCaption.offsetWidth;
        cCaption.classList.add('is-swap');
      }
    }

    function paintCover(p) {
      var left = 60 * (1 - p);
      cClock.textContent = pad(Math.floor(left)) + ':' + pad(Math.floor((left % 1) * 60));
      cRing.style.strokeDashoffset = (CIRC * p).toFixed(2);
      var n = cSegs.length;
      cSegs.forEach(function (el, i) {
        el.style.setProperty('--fill', clamp((p - i / n) * n, 0, 1).toFixed(3));
      });
      var idx = 0;
      coverBeats.forEach(function (b, i) { if (p >= b[0]) idx = i; });
      setCaption(idx);
      cover.classList.toggle('is-ding', p > 0.975);
    }

    if (reduce) {
      paintCover(0);
    } else {
      var cStart = performance.now();
      (function loop(now) {
        paintCover(((now - cStart) % LOOP) / LOOP);
        requestAnimationFrame(loop);
      })(cStart);
    }
  }

  /* ---------------- Icons (nutrients & foods) ---------------- */
  var ICO = function (inner) {
    return '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  };
  var ICONS = {
    'Iron': ICO('<rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/><rect x="5" y="7" width="2" height="10" rx="1"/><rect x="17" y="7" width="2" height="10" rx="1"/>'),
    'Healthy Fats': ICO('<path d="M12 3c4 2 6 6 6 10a6 6 0 0 1-12 0c0-4 2-8 6-10z"/><circle cx="12" cy="14" r="2.4"/>'),
    'Calcium + Vitamin D': ICO('<path d="M5 9a2 2 0 1 1 3-3 2 2 0 1 1 3 3l5 5a2 2 0 1 1-3 3 2 2 0 1 1-3-3z"/>'),
    'Protein': ICO('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    'Salmon': ICO('<path d="M3 12c4-5 10-6 15-3-2 1-2 5 0 6-5 3-11 2-15-3z"/><line x1="9" y1="10" x2="9" y2="14"/>'),
    'Eggs': ICO('<ellipse cx="12" cy="13" rx="6" ry="8"/>'),
    'Greek Yogurt': ICO('<path d="M4 11h16a8 8 0 0 1-16 0z"/><line x1="8" y1="7" x2="8" y2="9"/><line x1="12" y1="5" x2="12" y2="9"/><line x1="16" y1="7" x2="16" y2="9"/>'),
    'Lentils': ICO('<circle cx="8" cy="9" r="2.3"/><circle cx="16" cy="9" r="2.3"/><circle cx="12" cy="16" r="2.3"/>'),
    'Nut Butters': ICO('<rect x="6" y="8" width="12" height="12" rx="2"/><rect x="8" y="4" width="8" height="4" rx="1"/>'),
    'Muscle & bone growth': ICO('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    'Brain development': ICO('<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3h1V4zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-3 3h-1V4z"/>'),
    'Immune system support': ICO('<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/>'),
    'Questions? Ask in the comments!': ICO('<path d="M4 5h16v10H9l-5 4z"/><path d="M11 9a1.5 1.5 0 1 1 2 1.4c-.6.3-1 .7-1 1.3"/><circle cx="12" cy="13.6" r=".4"/>')
  };

  /* ---------------- Beat timeline (NLE) ---------------- */
  var SPEED = 2.5; // content seconds per real second (0:35 plays in ~14s)
  var treatments = {};

  function fmtClock(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + pad(Math.floor(s)) + '.' + Math.floor((s % 1) * 10);
  }

  function buildTreatment(root) {
    var cfg = TREATMENTS[root.dataset.treatment];
    if (!cfg) return;

    var nle = root.querySelector('[data-nle]');
    var track = root.querySelector('[data-track]');
    var ruler = root.querySelector('[data-ruler]');
    var detail = root.querySelector('[data-detail]');
    var playhead = root.querySelector('[data-playhead]');
    var playBtn = root.querySelector('[data-play]');
    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    var beatNum = root.querySelector('[data-beat-num]');
    var beatTotal = root.querySelector('[data-beat-total]');
    var clock = root.querySelector('[data-clock]');
    var readout = root.querySelector('[data-readout]');
    var rTc = readout.querySelector('[data-tc]');
    var rCap = readout.querySelector('[data-caption]');
    var rStory = readout.querySelector('[data-story]');

    var beats = cfg.beats;
    var n = beats.length;
    var total = beats.reduce(function (a, b) { return a + b.dur; }, 0);
    var starts = [];
    beats.reduce(function (acc, b) { starts.push(acc); return acc + b.dur; }, 0);

    var idx = -1, time = 0, playing = false, raf = null, lastNow = 0;

    /* ruler: ticks each second, labels each 5 */
    for (var s = 0; s <= total; s++) {
      var i = document.createElement('i');
      i.style.left = (s / total * 100) + '%';
      if (s % 5 === 0) i.className = 'major';
      ruler.appendChild(i);
      if (s % 5 === 0 || s === total) {
        var lbl = document.createElement('span');
        lbl.textContent = '0:' + pad(s);
        lbl.style.left = (s / total * 100) + '%';
        if (s === total) lbl.className = 'end';
        else if (s % 10 !== 0) lbl.className = 'minor';
        if (s !== total && total - s < 3) continue;
        ruler.appendChild(lbl);
      }
    }

    /* segments */
    var segs = beats.map(function (b, i) {
      var seg = document.createElement('button');
      seg.type = 'button';
      seg.className = 'nle-seg' + (b.dur / total < 0.1 ? ' is-narrow' : '');
      seg.setAttribute('role', 'tab');
      seg.id = root.id + '-tab-' + i;
      seg.setAttribute('aria-controls', root.id + '-panel');
      seg.style.flex = b.dur + ' 1 0';
      seg.innerHTML =
        '<span class="seg-fill" aria-hidden="true"></span>' +
        '<span class="seg-label">' + b.label + '</span>' +
        '<span class="seg-dur">' + b.tc + '</span>';
      seg.addEventListener('click', function () { select(i); });
      track.insertBefore(seg, playhead);
      return seg;
    });
    detail.id = root.id + '-panel';
    if (beatTotal) beatTotal.textContent = pad(n);

    /* readout story bar */
    for (var k = 0; k < n; k++) rStory.appendChild(document.createElement('i'));
    var storySegs = rStory.querySelectorAll('i');

    function field(k, v, quote) {
      if (!v) return '';
      return '<div class="field"><div class="k">' + k + '</div><div class="v' + (quote ? ' quote' : '') + '">' + v + '</div></div>';
    }
    function chips(k, arr) {
      if (!arr || !arr.length) return '';
      return '<div class="field"><div class="k">' + k + '</div><div class="chips">' + arr.map(function (c) {
        return '<span class="chip">' + (ICONS[c] || '') + '<span>' + c + '</span></span>';
      }).join('') + '</div></div>';
    }
    function seq(k, arr) {
      if (!arr || !arr.length) return '';
      return '<div class="field"><div class="k">' + k + '</div><ul class="seq">' + arr.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>';
    }

    function renderDetail(b) {
      detail.innerHTML =
        '<div class="bd-tc mono">' + b.tc + '</div>' +
        '<h3>' + b.label + '</h3>' +
        field(b.voKey || 'Voiceover / on-screen text', b.vo, true) +
        seq('Shot sequence', b.sequence) +
        field('Visual', b.visual) +
        field('Graphics', b.graphics) +
        chips('On-screen text cues', b.cues) +
        field('Music', b.music);
      var cap = b.vo || (b.cues && b.cues[0]) || b.visual || '';
      cap = cap.replace(/^"|"$/g, '');
      rCap.textContent = cap.length > 88 ? cap.slice(0, 85) + '…' : cap;
      if (!reduce) { rCap.classList.remove('is-swap'); void rCap.offsetWidth; rCap.classList.add('is-swap'); }
    }

    function paint() {
      var p = clamp(time / total, 0, 1);
      playhead.style.left = (p * 100) + '%';
      segs.forEach(function (seg, i) {
        var f = clamp((time - starts[i]) / beats[i].dur, 0, 1);
        seg.style.setProperty('--fill', f.toFixed(3));
        seg.classList.toggle('is-done', time >= starts[i] + beats[i].dur - 0.001);
        storySegs[i].style.setProperty('--fill', f.toFixed(3));
      });
      clock.querySelector('b').textContent = fmtClock(time);
      rTc.innerHTML = cfg.readout(time, total);
      readout.classList.toggle('is-ding', time >= total - 0.001 && cfg.dingAtEnd);
    }

    function select(i, keepTime) {
      i = clamp(i, 0, n - 1);
      var changed = i !== idx;
      idx = i;
      segs.forEach(function (seg, j) {
        var on = j === i;
        seg.classList.toggle('is-active', on);
        seg.setAttribute('aria-selected', on ? 'true' : 'false');
        seg.tabIndex = on ? 0 : -1;
      });
      if (changed) renderDetail(beats[i]);
      if (!keepTime) time = starts[i];
      beatNum.textContent = pad(i + 1);
      nle.classList.remove('is-ended');
      paint();
    }

    function beatAt(t) {
      var b = 0;
      for (var i = 0; i < n; i++) if (t >= starts[i]) b = i;
      return b;
    }

    function frame(now) {
      if (!playing) return;
      var dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      time = Math.min(total, time + dt * SPEED);
      var b = beatAt(time);
      if (b !== idx) select(b, true); else paint();
      if (time >= total) { stop(true); return; }
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (nle.classList.contains('is-ended') || time >= total) { time = 0; select(0); }
      playing = true;
      nle.classList.add('is-playing');
      nle.classList.remove('is-ended');
      playBtn.setAttribute('aria-label', 'Pause');
      lastNow = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop(ended) {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      nle.classList.remove('is-playing');
      if (ended) {
        nle.classList.add('is-ended');
        playBtn.setAttribute('aria-label', 'Replay');
        paint();
      } else {
        playBtn.setAttribute('aria-label', 'Play');
      }
    }
    function toggle() { playing ? stop(false) : play(); }

    playBtn.addEventListener('click', toggle);
    prevBtn.addEventListener('click', function () { select(idx - 1); });
    nextBtn.addEventListener('click', function () { select(idx + 1); });

    track.addEventListener('keydown', function (e) {
      var handled = true;
      switch (e.key) {
        case 'ArrowRight': select(idx + 1); break;
        case 'ArrowLeft': select(idx - 1); break;
        case 'Home': select(0); break;
        case 'End': select(n - 1); break;
        case ' ': toggle(); break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); segs[idx].focus({ preventScroll: true }); }
    });

    /* scrub by clicking the ruler */
    ruler.addEventListener('click', function (e) {
      var r = ruler.getBoundingClientRect();
      time = clamp((e.clientX - r.left) / r.width, 0, 1) * total;
      select(beatAt(time), true);
    });

    document.addEventListener('visibilitychange', function () { if (document.hidden && playing) stop(false); });

    select(0);
    treatments[root.id] = { play: play, stop: stop, focus: function () { segs[idx].focus({ preventScroll: true }); } };
  }

  /* ---------------- Content ---------------- */
  var TREATMENTS = {
    short: {
      dingAtEnd: true,
      readout: function (t, total) {
        var left = 60 * (1 - t / total);
        return pad(Math.floor(left)) + ':' + pad(Math.floor((left % 1) * 60)) + '<small>LEFT</small>';
      },
      beats: [
        {
          label: 'Hook', tc: '0:00–0:03', dur: 3,
          voKey: 'On-screen text', vo: 'POV: you’re a mom who just spent an hour making a meal.',
          visual: 'A time-lapse of hands mixing dough and chopping on a cutting board.',
          graphics: 'A countdown clock opens center-screen, then shrinks down into the bottom-right corner.',
          music: 'Something dynamic and trend-forward.'
        },
        {
          label: 'Body', tc: '0:03–0:30', dur: 27,
          sequence: [
            'She’s on the couch watching TV — 5 real seconds stands in for 20 minutes gone on the clock.',
            'Cut to 3 real seconds of whatever show is actually on — no dialogue, just a quick reveal. The screen fades to black.',
            'She’s back at her laptop, typing hard, deleting, typing again — 5 more real seconds, 10 more minutes gone. Clock reads 25 minutes left.',
            'Close on the screen: an email she can’t quite finish. She gives up and clicks one of Gmail’s suggested replies.',
            'On-screen text: “You could even go to space for 10 minutes.” She’s driving. Text fades. Beat. Then: “(Although we don’t recommend doing that.)”',
            'She pulls into a coffee shop, grabs a drink, and drives back.'
          ],
          graphics: 'The countdown keeps ticking under every cut — the clock is the joke.'
        },
        {
          label: 'End', tc: '0:30–0:35', dur: 5,
          visual: 'A frozen meal comes out of the freezer, a few holes poked in the wrap, into the microwave — the timer synced exactly to the on-screen countdown. It beeps. Cinematic shots of the finished plate. Cut to black.',
          graphics: 'The countdown graphic briefly enlarges at the 5-minute mark to pull the eye back in.'
        }
      ]
    },
    long: {
      dingAtEnd: false,
      readout: function (t) {
        return '0:' + pad(Math.floor(t)) + '<small>/ 0:45</small>';
      },
      beats: [
        {
          label: 'Hook', tc: '0:00–0:03', dur: 3,
          voKey: 'Voiceover', vo: '“Your baby just turned one (two, five, and so on) — so what exactly do they need to grow strong and smart?”',
          visual: 'A short, playful archival clip in the background — something that grabs attention immediately.',
          music: 'Subtle and catchy.'
        },
        {
          label: 'Intro', tc: '0:03–0:07', dur: 4,
          voKey: 'Voiceover', vo: '“Hi parents! I’m Dr. [Name], pediatric nutritionist. Between [this age] and [this age], your child’s body is going through a major growth shift.”',
          visual: 'A documentary-style talking head, cut with b-roll and simple animation.'
        },
        {
          label: 'Explaining', tc: '0:07–0:20', dur: 13,
          voKey: 'Voiceover', vo: '“Their muscles and bones are growing fast as they learn to move with more control. Their brain is wiring millions of new connections that support memory, language, and emotion. Their immune system is still building strength, and their body is starting to store nutrients for focus and energy.”',
          visual: 'Relatable baby footage that illustrates the point — like a baby trying to lift something heavy for muscles — or graphics of neurons building connections.',
          cues: ['Muscle & bone growth', 'Brain development', 'Immune system support']
        },
        {
          label: 'What Nutrients', tc: '0:20–0:30', dur: 10,
          voKey: 'Voiceover', vo: '“To fuel all of this, they need a diet rich in iron, healthy fats, calcium, vitamin D, and protein.”',
          visual: 'Back to the talking head.',
          cues: ['Iron', 'Healthy Fats', 'Calcium + Vitamin D', 'Protein']
        },
        {
          label: 'Where to Find', tc: '0:30–0:35', dur: 5,
          voKey: 'Voiceover', vo: '“You’ll find those nutrients in salmon, eggs, full-fat Greek yogurt, lentils, and nut butters…” (swap in age-appropriate foods per episode).',
          visual: 'Each nutrient label slides left, an equals sign appears, then a photo of the matching food.',
          cues: ['Salmon', 'Eggs', 'Greek Yogurt', 'Lentils', 'Nut Butters']
        },
        {
          label: 'Soft CTA', tc: '0:35–0:40', dur: 5,
          voKey: 'Voiceover', vo: '“And also in Yummers — ready-to-serve meals customized for your child’s needs at every stage of their growth.”',
          visual: 'The product goes into the microwave, then a baby eats it. Freeze-frame and zoom in on the baby.'
        },
        {
          label: 'Engagement CTA', tc: '0:40–0:45', dur: 5,
          voKey: 'Voiceover', vo: '“Got questions? Ask below for our upcoming Q&A with a pediatrician.”',
          visual: 'Graphic arrows point toward the comment section.',
          cues: ['Questions? Ask in the comments!']
        }
      ]
    }
  };

  document.querySelectorAll('[data-treatment]').forEach(buildTreatment);

  /* ---------------- Proposal cards -> treatment ---------------- */
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var id = el.dataset.goto;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var i = slides.indexOf(target);
      if (i >= 0) goToSlide(i); else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      var tr = treatments[id];
      if (tr) setTimeout(function () { tr.focus(); if (!reduce) tr.play(); }, reduce ? 0 : 750);
    });
  });
})();
