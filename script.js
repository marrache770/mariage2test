(() => {
  'use strict';

  const TOTAL_PANELS = 5;

  const scrollTrack   = document.getElementById('scrollTrack');
  const scrollRoot    = document.querySelector('.horizontal-scroll');
  const progressFill  = document.getElementById('progressFill');
  const navDots       = document.querySelectorAll('.dot');
  const panels        = Array.from(document.querySelectorAll('.panel'));
  const themeMeta     = document.querySelector('meta[name="theme-color"]');
  const musicToggle   = document.getElementById('musicToggle');
  const bgMusic       = document.getElementById('bgMusic');
  const rsvpForm      = document.getElementById('rsvpForm');
  const rsvpSuccess   = document.getElementById('rsvpSuccess');

  let currentIndex = 0;
  let prevIndex    = 0;
  let isScrolling  = false;
  let isMobile     = window.innerWidth <= 768;
  let touchStartX  = 0;
  let touchStartY  = 0;

  /* ---- Navigation ---- */
  function goToPanel(index) {
    if (index < 0 || index >= TOTAL_PANELS || isScrolling) return;
    isScrolling = true;
    prevIndex = currentIndex;
    currentIndex = index;

    if (!isMobile) {
      scrollTrack.style.transform = `translateX(-${index * 100}vw)`;
      applyParallax(prevIndex, currentIndex);
    } else {
      const panel = document.querySelector(`.panel[data-index="${index}"]`);
      if (panel) panel.scrollIntoView({ behavior: 'smooth' });
    }

    updateUI();
    setTimeout(() => { isScrolling = false; }, 1100);
  }

  function updateUI() {
    progressFill.style.width = `${(currentIndex / (TOTAL_PANELS - 1)) * 100}%`;
    navDots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

    const panel  = document.querySelector(`.panel[data-index="${currentIndex}"]`);
    const isDark = panel && panel.classList.contains('panel-programme');
    document.body.classList.toggle('dark-section', isDark);
    syncViewportChrome(panel);

    triggerReveal(currentIndex);
  }

  function syncViewportChrome(panel) {
    if (!panel) return;
    const bg = getComputedStyle(panel).backgroundColor || '#faf9f7';
    document.documentElement.style.setProperty('--viewport-bg', bg);
    if (themeMeta) themeMeta.setAttribute('content', bg);
  }

  /* ---- Parallax depth on panel content ---- */
  function applyParallax(from, to) {
    const direction = to > from ? 1 : -1;

    const leaving = document.querySelector(`.panel[data-index="${from}"] .panel-inner`);
    if (leaving) {
      leaving.style.transition = 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
      leaving.style.transform = `translateX(${direction * -60}px)`;
      leaving.style.opacity = '0';

      setTimeout(() => {
        leaving.style.transition = 'none';
        leaving.style.transform = 'translateX(0)';
        leaving.style.opacity = '1';
      }, 1100);
    }

    const entering = document.querySelector(`.panel[data-index="${to}"] .panel-inner`);
    if (entering) {
      entering.style.transition = 'none';
      entering.style.transform = `translateX(${direction * 40}px)`;
      entering.style.opacity = '0';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          entering.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease';
          entering.style.transform = 'translateX(0)';
          entering.style.opacity = '1';
        });
      });
    }
  }

  /* ---- Reveal ---- */
  function triggerReveal(index) {
    const panel = document.querySelector(`.panel[data-index="${index}"]`);
    if (!panel) return;
    panel.querySelectorAll('.reveal-up').forEach(el => el.classList.add('visible'));
  }

  /* ---- Wheel (desktop) ---- */
  let wheelAcc = 0;
  const WHEEL_T = 50;

  function handleWheel(e) {
    if (isMobile) return;
    e.preventDefault();
    wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelAcc) >= WHEEL_T) {
      goToPanel(currentIndex + (wheelAcc > 0 ? 1 : -1));
      wheelAcc = 0;
    }
  }

  /* ---- Touch (desktop horizontal) ---- */
  function handleTouchStart(e) {
    if (isMobile) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (isMobile) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      goToPanel(currentIndex + (dx < 0 ? 1 : -1));
    }
  }

  /* ---- Keyboard ---- */
  function handleKey(e) {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToPanel(currentIndex + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goToPanel(currentIndex - 1); }
  }

  /* ---- Mobile scroll sync ---- */
  function handleMobileScroll() {
    if (!isMobile || !scrollRoot) return;
    const st = scrollRoot.scrollTop;

    let ni = currentIndex;
    let bestDistance = Number.POSITIVE_INFINITY;
    panels.forEach((panel, index) => {
      const dist = Math.abs(panel.offsetTop - st);
      if (dist < bestDistance) {
        bestDistance = dist;
        ni = index;
      }
    });

    if (ni !== currentIndex && ni >= 0 && ni < TOTAL_PANELS) {
      currentIndex = ni;
      updateUI();
    }
  }

  /* ---- Nav dots ---- */
  navDots.forEach(d => d.addEventListener('click', () => goToPanel(+d.dataset.index)));

  /* ---- Music ---- */
  let playing = false;
  musicToggle.addEventListener('click', () => {
    if (playing) {
      bgMusic.pause();
      musicToggle.classList.remove('playing');
    } else {
      bgMusic.volume = 0.25;
      bgMusic.play().catch(() => {});
      musicToggle.classList.add('playing');
    }
    playing = !playing;
  });

  /* ---- RSVP ---- */
  rsvpForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(rsvpForm).entries());
    console.log('RSVP:', data);
    rsvpForm.style.display = 'none';
    rsvpSuccess.classList.add('show');
  });

  /* ---- Resize ---- */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const was = isMobile;
      isMobile = window.innerWidth <= 768;
      if (was !== isMobile) {
        if (!isMobile) {
          scrollTrack.style.transform = `translateX(-${currentIndex * 100}vw)`;
        } else {
          scrollTrack.style.transform = 'none';
          const p = document.querySelector(`.panel[data-index="${currentIndex}"]`);
          if (p && scrollRoot) scrollRoot.scrollTo({ top: p.offsetTop, behavior: 'auto' });
        }
      }
    }, 150);
  });

  /* ---- Splash screen — rideau papier ---- */
  const splash = document.getElementById('splash');

  const topFace = splash.querySelector('.curtain-top .curtain-face');
  const bottomFace = splash.querySelector('.curtain-bottom .curtain-face');
  if (topFace && bottomFace) {
    bottomFace.innerHTML = topFace.innerHTML;
    bottomFace.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  }

  splash.addEventListener('click', (e) => {
    if (!e.target.closest('.splash-btn')) return;

    bgMusic.volume = 0.25;
    bgMusic.play().catch(() => {});
    playing = true;
    musicToggle.classList.add('playing');

    splash.classList.add('opening');

    setTimeout(() => {
      splash.classList.add('gone');
    }, 1500);
  });

  /* ---- Init ---- */
  function init() {
    const sc = scrollRoot;
    if (!sc) return;
    sc.addEventListener('wheel',      handleWheel,      { passive: false });
    sc.addEventListener('touchstart', handleTouchStart,  { passive: true });
    sc.addEventListener('touchend',   handleTouchEnd,    { passive: true });
    document.addEventListener('keydown', handleKey);

    if (isMobile) sc.addEventListener('scroll', handleMobileScroll, { passive: true });

    updateUI();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
