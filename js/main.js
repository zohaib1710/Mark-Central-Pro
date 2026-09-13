(() => {
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });
  if (!document.body.classList.contains('page-home')) {
    const selectors = ['.section-head','.trust-item','.card','.price-card','.step','.feature-line','.quote','.faq-item','.split > *','.footer-grid > *','.legal > section'];
    $$(selectors.join(',')).forEach((element, index) => {
      if (!element.hasAttribute('data-reveal')) element.dataset.reveal = 'up';
      element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
    });
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
      entry.target.classList.add('is-revealed'); observer.unobserve(entry.target);
    }), { threshold: .1, rootMargin: '0px 0px -36px' });
    $$('[data-reveal]').forEach((element) => observer.observe(element));
  } else $$('[data-reveal]').forEach((element) => element.classList.add('is-revealed'));
  const visual = document.querySelector('[data-command-stage]');
  if (visual && !reduceMotion && matchMedia('(pointer:fine)').matches) {
    let frame;
    const hero = visual.closest('.command-hero');
    hero?.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - .5) * 8;
        const y = ((event.clientY - bounds.top) / bounds.height - .5) * 6;
        visual.style.setProperty('--depth-x', `${x}px`); visual.style.setProperty('--depth-y', `${y}px`);
        visual.style.setProperty('--depth-x-soft', `${x * .35}px`); visual.style.setProperty('--depth-y-soft', `${y * .35}px`);
        visual.style.setProperty('--depth-x-inverse', `${x * -.45}px`); visual.style.setProperty('--depth-y-inverse', `${y * -.45}px`);
      });
    });
    hero?.addEventListener('pointerleave', () => {
      visual.style.setProperty('--depth-x', '0px'); visual.style.setProperty('--depth-y', '0px');
      visual.style.setProperty('--depth-x-soft', '0px'); visual.style.setProperty('--depth-y-soft', '0px');
      visual.style.setProperty('--depth-x-inverse', '0px'); visual.style.setProperty('--depth-y-inverse', '0px');
    });
  }
  $$('[data-command-tabs]').forEach((explorer, explorerIndex) => {
    const panels = [...explorer.children].filter((child) => child.matches('article'));
    if (panels.length < 2) return;
    const tablist = document.createElement('div');
    tablist.className = 'command-tab-list';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', explorer.dataset.commandLabel || 'Explore options');
    const select = (selectedIndex, moveFocus = false) => {
      [...tablist.children].forEach((tab, index) => {
        const selected = index === selectedIndex;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].classList.toggle('is-active', selected);
        panels[index].hidden = !selected && innerWidth > 800;
      });
      if (moveFocus) tablist.children[selectedIndex]?.focus();
    };
    panels.forEach((panel, index) => {
      const heading = panel.querySelector('h3');
      const idBase = `command-${explorerIndex}-${index}`;
      panel.id ||= `${idBase}-panel`;
      panel.setAttribute('role', 'tabpanel');
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'command-tab';
      tab.id = `${idBase}-tab`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
      tab.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${heading?.textContent || `Option ${index + 1}`}</strong><i aria-hidden="true">→</i>`;
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', (event) => {
        const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? panels.length - 1 :
          ['ArrowDown', 'ArrowRight'].includes(event.key) ? (index + 1) % panels.length : (index - 1 + panels.length) % panels.length;
        select(next, true);
      });
      tablist.append(tab);
    });
    explorer.before(tablist);
    explorer.classList.add('command-tab-panels');
    explorer.parentElement?.classList.add('command-tabs-ready');
    select(0);
    addEventListener('resize', () => {
      const active = [...tablist.children].findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      select(Math.max(active, 0));
    });
  });
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
    panel.setAttribute('aria-labelledby', tab.id);
    tab.innerHTML = `<span>0${index + 1}</span><strong>${panel.querySelector('h3')?.textContent || `Service ${index + 1}`}</strong>`;
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return; event.preventDefault();
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? panels.length - 1 : forward ? (index + 1) % panels.length : (index - 1 + panels.length) % panels.length;
      tabs.children[next].focus(); select(next);
    });
    tabs.append(tab);
  });
  explorer.before(tabs); select(0);
  addEventListener('resize', () => select([...tabs.children].findIndex((tab) => tab.getAttribute('aria-selected') === 'true')));
})();
