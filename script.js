// Nav scroll state
const nav = document.querySelector('.nav');
if (nav) {
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A note for anyone who opens the console — you found the source. Hi.
console.log(
  '%cnotice the gap, then close it.',
  'font: 600 15px/1.5 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: #C8472A;'
);
console.log(
  '%cDesigned and directed by Mohit Manchanda — no framework, no page builder, no template. Built with Claude; the design, the decisions, and the hundred iterations are mine.\n%cI build with AI, and I built this with it too. If that’s your kind of operator: mohitmanchanda03@gmail.com',
  'font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; color: #2E4A33;',
  'font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; color: #8A8782;'
);

// Scroll reveal — fade + rise as elements enter, with per-batch stagger
const revealSelector = [
  '.tile-hero', '.tile-portrait', '.tile-stat', '.tile-tools', '.tile-work',
  '.tile-about', '.tile-contact', '.work-item', '.work-pair',
  '.statement-band-inner', '.tools-hero', '.tool-block',
  '.journey-row', '.skill-card', '.rec'
].join(', ');
const revealEls = Array.from(document.querySelectorAll(revealSelector));
const revealAll = () => revealEls.forEach((el) => el.classList.add('reveal-in'));

if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
  let ioFired = false;
  const io = new IntersectionObserver((entries) => {
    ioFired = true;
    const visible = entries.filter((e) => e.isIntersecting);
    visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    visible.forEach((entry, i) => {
      entry.target.style.transitionDelay = (Math.min(i, 6) * 70) + 'ms';
      entry.target.classList.add('reveal-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

  // Observe everything: above-fold fires immediately (load-in), the rest on scroll.
  revealEls.forEach((el) => io.observe(el));

  // Failsafe: only blanket-reveal if the observer NEVER fired (dead IO /
  // background tab / engine quirk). If it fired, IO is handling the cascade
  // correctly, so we leave the scroll-reveal intact.
  setTimeout(() => {
    if (!ioFired) revealAll();
  }, 2500);
} else {
  revealAll();
}

// Count-up on numeric stats when scrolled into view (respects reduced-motion)
const countEls = document.querySelectorAll('[data-count]');
if (countEls.length && 'IntersectionObserver' in window && !reduceMotion) {
  const fmt = (n) => n.toLocaleString('en-IN');
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // ease-out-quart
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCount(entry.target);
        countObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  countEls.forEach((el) => countObs.observe(el));
}

// Screenshot carousels (AI Solutions) — swipe / arrows / dots / keyboard.
// Slides whose image file is missing are auto-removed, so empty slots never show.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  let index = 0;

  const slideEls = () => Array.from(carousel.querySelectorAll('.carousel-slide'));

  // go() is stable and always reads the live slide count
  function go(n) {
    const count = slideEls().length;
    if (!count) return;
    index = (n + count) % count;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function renderDots() {
    const slides = slideEls();
    dotsWrap.innerHTML = '';
    if (slides.length <= 1) { carousel.classList.add('is-single'); return; }
    carousel.classList.remove('is-single');
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (i === index ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to screenshot ' + (i + 1));
      dot.addEventListener('click', () => go(i));
      dotsWrap.appendChild(dot);
    });
  }

  function refresh() {
    if (index > slideEls().length - 1) index = Math.max(0, slideEls().length - 1);
    renderDots();
    go(index);
  }

  // Auto-remove slides whose image fails to load (missing file)
  carousel.querySelectorAll('.carousel-slide img').forEach((img) => {
    const fail = () => { const s = img.closest('.carousel-slide'); if (s) { s.remove(); refresh(); } };
    if (img.complete && img.naturalWidth === 0) fail();
    else if (!img.complete) img.addEventListener('error', fail, { once: true });
  });

  // Controls (bound once; go() is stable)
  carousel.querySelector('.carousel-prev').addEventListener('click', () => go(index - 1));
  carousel.querySelector('.carousel-next').addEventListener('click', () => go(index + 1));
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });
  let startX = null;
  const endSwipe = (x) => {
    if (startX === null) return;
    const dx = x - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  };
  carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', (e) => endSwipe(e.changedTouches[0].clientX), { passive: true });
  carousel.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') startX = e.clientX; });
  carousel.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') endSwipe(e.clientX); });

  renderDots();
  go(0);
});

// Scroll progress bar
const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.appendChild(progress);
const updateProgress = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  progress.style.width = pct + '%';
};
updateProgress();
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
