// ---------- stable viewport height (avoids browser toolbar-resize jitter
// that can make pinned panels/headings shift or clip for a frame) ----------
function setAppHeight(){
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);

// ---------- scroll progress bar ----------
const progressBar = document.getElementById('progressBar');
function updateProgress(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  progressBar.style.width = (scrolled || 0) + '%';
}
document.addEventListener('scroll', updateProgress);
updateProgress();

// ---------- mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navList = document.getElementById('navList');
navToggle.addEventListener('click', () => navList.classList.toggle('open'));

// ---------- master horizontal scroll (desktop) ----------
const panels = document.querySelectorAll('.panel');
let masterTrigger = null;
const isDesktop = () => window.innerWidth > 860;

function setupMasterScroll(){
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (masterTrigger) { masterTrigger.kill(); masterTrigger = null; }
  gsap.set('#track', { x: 0 });

  if (!isDesktop()) { ScrollTrigger.refresh(); return; }

  const track = document.getElementById('track');
  const distance = track.scrollWidth - window.innerWidth;

  masterTrigger = ScrollTrigger.create({
    trigger: '#pinViewport',
    start: 'top top',
    end: () => '+=' + distance,
    pin: true,
    scrub: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      gsap.set(track, { x: -self.progress * distance });
    }
  });
}

window.addEventListener('load', setupMasterScroll);
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setupMasterScroll, 250);
});

// ---------- nav / in-page links scroll to the right panel ----------
function scrollToPanel(index){
  navList.classList.remove('open');
  if (!isDesktop() || !masterTrigger) {
    document.querySelectorAll('.panel')[index].scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const start = masterTrigger.start;
  const end = masterTrigger.end;
  const panelCount = panels.length;
  const target = start + (end - start) * (index / (panelCount - 1));
  window.scrollTo({ top: target, behavior: 'smooth' });
}

document.querySelectorAll('[data-panel]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToPanel(parseInt(link.dataset.panel, 10));
  });
});

// ---------- project hover preview: swaps image/logo, description, link, and bg color ----------
const ICONS = {
  map: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3"><path d="M32 58s18-19 18-31A18 18 0 0 0 14 27c0 12 18 31 18 31z"/><circle cx="32" cy="26" r="7"/></svg>',
  home: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 30 32 12l22 18"/><path d="M16 27v25h12v-14h8v14h12V27"/></svg>',
  chat: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M10 14h44v28H22l-12 10V14z"/></svg>',
  train: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="10" width="36" height="34" rx="8"/><circle cx="23" cy="50" r="3.5" fill="#fff" stroke="none"/><circle cx="41" cy="50" r="3.5" fill="#fff" stroke="none"/><line x1="14" y1="28" x2="50" y2="28"/></svg>',
  play: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3"><circle cx="32" cy="32" r="24"/><polygon points="27,22 44,32 27,42" fill="#fff" stroke="none"/></svg>',
  percent: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><circle cx="20" cy="20" r="7"/><circle cx="44" cy="44" r="7"/><line x1="46" y1="18" x2="18" y2="46"/></svg>',
  heart: '<svg viewBox="0 0 64 64" fill="#fff"><path d="M32 56S6 40 6 22C6 12 14 6 22 6c5 0 8.6 2.6 10 6 1.4-3.4 5-6 10-6 8 0 16 6 16 16 0 18-26 34-26 34z"/></svg>'
};

const prRows = document.querySelectorAll('#projectList .project-row[data-desc]');
const prPreview = document.getElementById('prPreview');
const prPreviewBg = document.getElementById('prPreviewBg');
const prPreviewTitle = document.getElementById('prPreviewTitle');
const prPreviewDesc = document.getElementById('prPreviewDesc');
const prPreviewLink = document.getElementById('prPreviewLink');

function setPreview(row) {
  const title = row.querySelector('h3') ? row.querySelector('h3').textContent : '';
  prPreviewTitle.textContent = title;
  prPreviewDesc.textContent = row.dataset.desc || '';
  prPreviewLink.href = row.getAttribute('href') || '#';

  if (row.dataset.logo === 'img' && row.dataset.img) {
    prPreviewBg.innerHTML = '<img src="' + row.dataset.img + '" alt="">';
  } else if (row.dataset.icon && ICONS[row.dataset.icon]) {
    prPreviewBg.innerHTML = ICONS[row.dataset.icon];
  } else {
    prPreviewBg.innerHTML = '';
  }

  const color = row.dataset.color || 'teal-dark';
  prPreview.className = 'pr-preview c-' + color;
}

prRows.forEach(row => {
  row.addEventListener('mouseenter', () => setPreview(row));
  row.addEventListener('focus', () => setPreview(row));
});

// ---------- capabilities: continuous-loop one-polaroid-at-a-time scroller ----------
// The scroller holds 6 slots: [clone-of-last, real1, real2, real3, real4, clone-of-first].
// Landing on a clone slot is visually identical to its real counterpart, so once the
// scroll settles there we silently snap back to the real slot — giving the illusion of
// an endless loop in either direction.
const capScroller = document.getElementById('capScroller');
const capCol = document.querySelector('.cap-col');
const capDots = document.querySelectorAll('#capDots span');
if (capScroller) {
  const cards = capScroller.querySelectorAll('.cap-card');
  const REAL_COUNT = cards.length - 2; // 4 real cards
  const FIRST_REAL = 1;
  const LAST_REAL = REAL_COUNT; // 4

  // Measure a card's scroll offset directly against capScroller's own
  // rendered box (via getBoundingClientRect, which is transform-safe since
  // both live inside the same GSAP-translated #track) rather than assuming
  // every slot is exactly capScroller.clientHeight tall (it isn't, once
  // margins are added) or using scrollIntoView (which in Safari can nudge
  // the outer pinned page scroll and clip the section title).
  function cardOffset(card) {
    return card.getBoundingClientRect().top - capScroller.getBoundingClientRect().top + capScroller.scrollTop;
  }
  function rawIndex() {
    let closest = 0, minDiff = Infinity;
    cards.forEach((c, i) => {
      const diff = Math.abs(cardOffset(c) - capScroller.scrollTop);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    return closest;
  }
  function updateDots(idx) {
    const dotIndex = ((idx - FIRST_REAL) % REAL_COUNT + REAL_COUNT) % REAL_COUNT;
    capDots.forEach((dot, i) => dot.classList.toggle('active', i === dotIndex));
  }
  function goTo(idx, smooth) {
    capScroller.scrollTo({ top: cardOffset(cards[idx]), behavior: smooth ? 'smooth' : 'auto' });
  }

  // Start on the real first card (slot 1), no animation.
  capScroller.scrollTop = cardOffset(cards[FIRST_REAL]);

  let loopTimer = null;
  capScroller.addEventListener('scroll', () => {
    const idx = rawIndex();
    updateDots(idx);
    clearTimeout(loopTimer);
    loopTimer = setTimeout(() => {
      const settled = rawIndex();
      if (settled === 0) goTo(LAST_REAL, false);
      else if (settled === cards.length - 1) goTo(FIRST_REAL, false);
    }, 120);
  });

  capDots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(FIRST_REAL + i, true));
  });

  // Only scrolling directly over the polaroid card (plus this small column's
  // own padding as a natural buffer) drives the polaroids — not the info
  // panel next to it. Outside that zone, wheel input falls through untouched
  // to the master page scroll.
  let capLock = false;
  if (capCol) {
    capCol.addEventListener('wheel', (e) => {
      // If the wheel is directly over the scroller, let the browser's own
      // scrolling + scroll-snap handle it natively — hijacking scrollTop
      // here fights the snap and gets it stuck on one card.
      if (e.target.closest('#capScroller')) return;

      e.preventDefault();
      if (capLock) return;
      capLock = true;
      const idx = rawIndex();
      const next = Math.max(0, Math.min(cards.length - 1, idx + (e.deltaY > 0 ? 1 : -1)));
      goTo(next, true);
      setTimeout(() => { capLock = false; }, 650);
    }, { passive: false });
  }

  // Auto-advance one polaroid every 5s when the visitor isn't scrolling
  // through it themselves. Pauses on any manual interaction, resumes after
  // 5s of no further interaction, and only runs while this panel is in view.
  let capAutoTimer = null;
  let capIdleTimer = null;

  function capAutoAdvance() {
    goTo(rawIndex() + 1, true);
  }
  function startCapAutoplay() {
    stopCapAutoplay();
    capAutoTimer = setInterval(capAutoAdvance, 5000);
  }
  function stopCapAutoplay() {
    if (capAutoTimer) clearInterval(capAutoTimer);
    capAutoTimer = null;
  }
  function onCapUserActivity() {
    stopCapAutoplay();
    clearTimeout(capIdleTimer);
    capIdleTimer = setTimeout(startCapAutoplay, 5000);
  }

  capScroller.addEventListener('wheel', onCapUserActivity, { passive: true });
  capScroller.addEventListener('touchstart', onCapUserActivity, { passive: true });
  if (capCol) {
    capCol.addEventListener('wheel', onCapUserActivity, { passive: true });
    capCol.addEventListener('touchstart', onCapUserActivity, { passive: true });
  }
  capDots.forEach(dot => dot.addEventListener('click', onCapUserActivity));

  const capSection = document.getElementById('capabilities');
  if (capSection && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) startCapAutoplay();
        else stopCapAutoplay();
      });
    }, { threshold: 0.6 }).observe(capSection);
  } else {
    startCapAutoplay();
  }
}

// ---------- keep internal scroll areas from fighting the master scroll ----------
document.querySelectorAll('.exp-wrap, .pr-scroll').forEach(el => {
  el.addEventListener('wheel', (e) => {
    const atTop = el.scrollTop === 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
      e.stopPropagation();
    }
  });
});
