(() => {
  document.documentElement.classList.add('js');
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  if (toggle && navigation) {
    const setMenu = (open, returnFocus = false) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
      navigation.classList.toggle('is-open', open);
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true); });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
    matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  }

  const explorer = document.querySelector('.explorer');
  if (explorer) {
    const tabs = [...explorer.querySelectorAll('[data-explorer-tab]')];
    const panels = [...explorer.querySelectorAll('.explorer-panel')];
    const tablist = explorer.querySelector('.explorer-tabs');
    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
      });
      if (focus) tabs[index].focus();
    };
    tablist.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
      panels[index].tabIndex = 0;
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(next, true);
      });
    });
    select(0);
    explorer.classList.add('enhanced');
  }
})();
