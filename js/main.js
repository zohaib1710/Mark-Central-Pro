(() => {
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });
  const selectors = ['.section-head','.trust-item','.card','.price-card','.step','.feature-line','.quote','.faq-item','.split > *','.footer-grid > *','.legal > section'];
  $$(selectors.join(',')).forEach((element, index) => {
    if (!element.hasAttribute('data-reveal')) element.dataset.reveal = 'up';
    element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed'); observer.unobserve(entry.target);
    }), { threshold: .1, rootMargin: '0px 0px -36px' });
    $$('[data-reveal]').forEach((element) => observer.observe(element));
  } else $$('[data-reveal]').forEach((element) => element.classList.add('is-revealed'));
  const visual = document.querySelector('.page-home .hero-media');
  if (visual && !reduceMotion && matchMedia('(pointer:fine)').matches) {
    let frame;
    document.querySelector('.hero')?.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
        visual.style.setProperty('--parallax-x', `${(event.clientX / innerWidth - .5) * 10}px`);
        visual.style.setProperty('--parallax-y', `${(event.clientY / innerHeight - .5) * 8}px`);
      });
    });
  }
  const explorer = document.querySelector('[data-service-explorer]');
  if (!explorer) return;
  explorer.closest('section')?.classList.add('service-stage');
  const panels = [...explorer.children]; const tabs = document.createElement('div');
  tabs.className = 'service-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Services');
  const select = (index) => {
    [...tabs.children].forEach((tab, itemIndex) => {
      const active = itemIndex === index; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      panels[itemIndex].classList.toggle('is-active', active); panels[itemIndex].hidden = !active && innerWidth > 800;
    });
  };
  panels.forEach((panel, index) => {
    panel.id = `service-panel-${index}`; panel.setAttribute('role', 'tabpanel');
    const tab = document.createElement('button'); tab.type = 'button'; tab.className = 'service-tab'; tab.id = `service-tab-${index}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
    tab.innerHTML = `<span>0${index + 1}</span><strong>${panel.querySelector('h3')?.textContent || `Service ${index + 1}`}</strong>`;
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return; event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? panels.length - 1 : event.key === 'ArrowDown' ? (index + 1) % panels.length : (index - 1 + panels.length) % panels.length;
      tabs.children[next].focus(); select(next);
    });
    tabs.append(tab);
  });
  explorer.before(tabs); select(0);
  addEventListener('resize', () => select([...tabs.children].findIndex((tab) => tab.getAttribute('aria-selected') === 'true')));
})();
