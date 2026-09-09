(() => {
  const $ = (selector, context = document) => context?.querySelector(selector);
  const $$ = (selector, context = document) => [...(context?.querySelectorAll(selector) || [])];
  const header = $('.site-header'), panel = $('#mobile-panel'), toggle = $('#menu-toggle'), close = $('#mobile-close');
  const dropdown = $('.nav-drop'), dropdownButton = dropdown?.querySelector('button'); let returnFocus;
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 24);
  updateHeader(); addEventListener('scroll', updateHeader, { passive: true });
  const setInert = (value) => $$('.site-header,main,.site-footer').forEach((element) => element.toggleAttribute('inert', value));
  const setMenu = (open) => {
    if (!panel) return; panel.classList.toggle('open', open); panel.setAttribute('aria-hidden', String(!open));
    toggle?.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('no-scroll', open); setInert(open);
    if (open) { returnFocus = document.activeElement; close?.focus(); } else returnFocus?.focus();
  };
  toggle?.addEventListener('click', () => setMenu(true)); close?.addEventListener('click', () => setMenu(false));
  $$('a', panel).forEach((link) => link.addEventListener('click', () => { if (!link.hasAttribute('data-modal-trigger')) setMenu(false); }));
  dropdownButton?.addEventListener('click', () => { const open = dropdown.classList.toggle('open'); dropdownButton.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', (event) => { if (dropdown && !dropdown.contains(event.target)) { dropdown.classList.remove('open'); dropdownButton?.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (event) => { if (event.key !== 'Escape') return; if (panel?.classList.contains('open')) setMenu(false); else if (dropdown?.classList.contains('open')) { dropdown.classList.remove('open'); dropdownButton.setAttribute('aria-expanded', 'false'); dropdownButton.focus(); } });
})();
