/* Scroll-world behaviour: parallax drift, reveal-on-scroll, sticky bar state.
   All motion is disabled under prefers-reduced-motion (world freezes to poster). */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- reveal on scroll ---- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));

  if (reduce.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- sticky topbar state ---- */
  var topbar = document.querySelector('.topbar');

  /* ---- scroll-driven parallax on the world layers ---- */
  var layers = [].slice.call(document.querySelectorAll('.world__layer'));
  var video = document.querySelector('.world__video');
  var ticking = false;

  function onFrame() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (topbar) { topbar.classList.toggle('is-stuck', y > 24); }

    if (reduce.matches) { return; }

    layers.forEach(function (layer) {
      var depth = parseFloat(layer.getAttribute('data-depth')) || 0.08;
      layer.style.transform = 'translate3d(0,' + (-y * depth).toFixed(2) + 'px,0)';
    });

    if (video) {
      // slow counter-drift + a touch of scale so the hero feels like it has depth
      var scale = 1.14 + Math.min(y / 9000, 0.06);
      video.style.transform =
        'translate(-50%, calc(-50% + ' + (y * 0.035).toFixed(2) + 'px)) scale(' + scale.toFixed(4) + ')';
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onFrame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onFrame();

  /* ---- respect a live change to the motion preference ---- */
  function applyMotionPref() {
    if (reduce.matches) {
      if (video) { video.pause(); video.style.transform = ''; }
      layers.forEach(function (l) { l.style.transform = ''; });
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    } else if (video && video.paused) {
      video.play().catch(function () { /* autoplay blocked; poster stands in */ });
    }
  }
  if (reduce.addEventListener) { reduce.addEventListener('change', applyMotionPref); }
  applyMotionPref();

  /* ---- if autoplay is blocked, the poster is already showing; nothing to do ---- */
  if (video) {
    video.addEventListener('error', function () { video.style.display = 'none'; }, true);
  }
})();
