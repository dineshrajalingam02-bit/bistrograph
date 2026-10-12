(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  const motionButton = document.querySelector('.motion-toggle');
  function updateMotion() {
    const paused = userPaused || reducedMotion.matches;
    document.documentElement.classList.toggle('animations-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Play animations' : 'Pause animations');
    motionButton.disabled = reducedMotion.matches;
    if (reducedMotion.matches) motionButton.setAttribute('aria-label', 'Animations paused by your system preference');
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    window.dispatchEvent(new CustomEvent('bistro-motion', { detail: { paused } }));
  }
  motionButton.addEventListener('click', () => { userPaused = !userPaused; updateMotion(); });
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    revealItems.forEach(item => observer.observe(item));
  }

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#navigation');
  function closeNavigation() {
    nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open navigation');
  }
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open); navToggle.setAttribute('aria-expanded', String(open)); navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNavigation(); });

  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(filter => { filter.classList.toggle('active', filter === button); filter.setAttribute('aria-pressed', String(filter === button)); });
    let count = 0;
    cards.forEach(card => { const show = category === 'all' || card.dataset.category === category; card.hidden = !show; if (show) { count++; card.classList.add('is-visible'); } });
    document.querySelector('.menu-count').textContent = `${count} ${category === 'all' ? 'favourites' : 'menu items'}`;
  }));

  document.querySelectorAll('[data-tilt]').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches || userPaused) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    window.addEventListener('bistro-motion', () => { element.style.transform = ''; });
  });

  const reservation = document.querySelector('#reservation-dialog');
  const dishDialog = document.querySelector('#dish-dialog');
  let lastTrigger = null;
  function openDialog(dialog, trigger) {
    closeNavigation(); lastTrigger = trigger; dialog.showModal(); document.body.classList.add('modal-open');
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open'); if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true }); });
  });
  document.querySelectorAll('[data-reserve]').forEach(button => button.addEventListener('click', () => openDialog(reservation, button)));
  document.querySelector('#dish-reserve').addEventListener('click', () => { dishDialog.close(); openDialog(reservation, document.querySelector('[data-reserve]')); });

  const dateInput = document.querySelector('#visit-date');
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  dateInput.min = localDate; dateInput.value = localDate;
  const timeSelect = document.querySelector('#visit-time');
  for (let hour = 11; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const option = new Option(`${hour > 12 ? hour - 12 : hour}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`, value);
      timeSelect.add(option);
    }
  }
  timeSelect.value = '19:00';
  const form = document.querySelector('#reservation-form');
  const summary = document.querySelector('#reservation-summary');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get('date')) < dateInput.min) { dateInput.setCustomValidity('Please choose today or a future date.'); dateInput.reportValidity(); return; }
    const day = new Date(`${data.get('date')}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const name = String(data.get('guestName')).trim();
    if (!name) { form.elements.guestName.setCustomValidity('Please enter your name.'); form.elements.guestName.reportValidity(); return; }
    document.querySelector('#summary-copy').textContent = `${name}, your plan is for ${data.get('guests')} ${data.get('guests') === '1' ? 'guest' : 'guests'} on ${day} at ${timeSelect.selectedOptions[0].text}. Call +91 73059 92096 to check availability and confirm.`;
    form.hidden = true; summary.hidden = false;
    summary.querySelector('a').focus();
  });
  dateInput.addEventListener('input', () => dateInput.setCustomValidity(''));
  form.elements.guestName.addEventListener('input', () => form.elements.guestName.setCustomValidity(''));
  document.querySelector('#edit-visit').addEventListener('click', () => { form.hidden = false; summary.hidden = true; form.elements.guestName.focus(); });

  const dishes = {
    gnocchi: { label: 'The comfort classic', name: 'Pan Fried Gnocchi', description: 'One of the bistro’s guest favourites. A European-inspired plate to settle in with, and a good excuse to linger over lunch.', price: '₹475' },
    cappuccino: { label: 'Your daily ritual', name: 'Cappuccino', description: 'Specialty coffee, a moment to yourself, and a table waiting for a conversation. Ask the team about our photo-print coffee experience.', price: '₹245' },
    tiramisu: { label: 'Save a little room', name: 'Classic Tiramisu', description: 'The classic coffee-inspired finish to your bistro visit. Ask our team about today’s dessert selection.', price: 'Price available at the bistro' },
    arancini: { label: 'For the table', name: 'Asparagus & Green Peas Arancini', description: 'Start with a guest favourite from the small plates menu. Perfect for sharing while you decide what comes next.', price: '₹365' },
    matcha: { label: 'A different kind of green', name: 'Ceremonial Matcha Latte', description: 'A warm alternative to your usual coffee ritual. Take your time with it.', price: '₹295' },
    tart: { label: 'The sweet spot', name: 'Chocolate Salted Caramel Tart', description: 'Chocolate meets salted caramel. An indulgent finish for an unhurried meal.', price: '₹295' }
  };
  document.querySelectorAll('[data-dish]').forEach(button => button.addEventListener('click', () => {
    const dish = dishes[button.dataset.dish];
    document.querySelector('#dish-label').textContent = dish.label;
    document.querySelector('#dish-title').textContent = dish.name;
    document.querySelector('#dish-description').textContent = dish.description;
    document.querySelector('#dish-price').textContent = dish.price;
    openDialog(dishDialog, button);
  }));
  document.querySelector('#full-menu').addEventListener('click', event => {
    openDialog(document.querySelector('#full-menu-dialog'), event.currentTarget);
  });
})();
