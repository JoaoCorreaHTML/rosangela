// ===== Header scroll shadow =====
const hdr = document.getElementById('hdr');
window.addEventListener('scroll', () => {
  hdr.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ===== Mobile nav =====
const ham = document.getElementById('ham');
const mobNav = document.getElementById('mobNav');

function toggleNav() {
  const isOpen = ham.classList.toggle('open');
  mobNav.classList.toggle('open', isOpen);
  ham.setAttribute('aria-expanded', String(isOpen));
  ham.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  mobNav.setAttribute('aria-hidden', String(!isOpen));
}
function closeNav() {
  ham.classList.remove('open');
  mobNav.classList.remove('open');
  ham.setAttribute('aria-expanded', 'false');
  ham.setAttribute('aria-label', 'Abrir menu');
  mobNav.setAttribute('aria-hidden', 'true');
}
mobNav.setAttribute('aria-hidden', 'true');
ham.addEventListener('click', toggleNav);
// Expose closeNav for inline onclick handlers on mobile nav links
window.closeNav = closeNav;

// Close mobile nav when clicking outside the menu/header
document.addEventListener('click', (e) => {
  if (!mobNav.classList.contains('open')) return;
  if (!mobNav.contains(e.target) && !ham.contains(e.target)) closeNav();
});

// Close mobile nav on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobNav.classList.contains('open')) {
    closeNav();
    ham.focus();
  }
});

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('on');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10 });
  revealEls.forEach((el) => obs.observe(el));
} else {
  // Fallback: show everything immediately
  revealEls.forEach((el) => el.classList.add('on'));
}

// ===== Cookie consent banner =====
(function initCookieBanner() {
  const STORAGE_KEY = 'rc_cookie_consent';
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage unavailable (private mode, etc.) — skip banner
    return;
  }

  if (!saved) {
    // Show after a short delay so it doesn't block initial paint
    window.setTimeout(() => banner.classList.add('show'), 600);
  }

  function setChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignore */ }
    banner.classList.remove('show');
  }

  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  if (acceptBtn) acceptBtn.addEventListener('click', () => setChoice('accepted'));
  if (declineBtn) declineBtn.addEventListener('click', () => setChoice('declined'));
})();
