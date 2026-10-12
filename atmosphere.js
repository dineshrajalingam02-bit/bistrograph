(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reduced.matches && !document.documentElement.classList.contains('animations-paused');
  const runningAnimations = new Set();
  function animate(element, frames, options) {
    if (!motionAllowed() || !element.animate) return;
    const animation = element.animate(frames, options);
    runningAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => runningAnimations.delete(animation));
    return animation;
  }
  window.addEventListener('bistro-motion', event => {
    if (event.detail.paused) {
      runningAnimations.forEach(animation => animation.cancel());
      runningAnimations.clear();
    }
  });

  const gallery = document.querySelector('.moment-gallery');
  const cards = [...document.querySelectorAll('.moment-card')];
  const choices = [...document.querySelectorAll('[data-select-moment]')];
  const copy = document.querySelector('.moment-copy');
  const moments = [
    ['Let the conversation brew.', 'Your favourite people. A proper cappuccino. Nowhere else you need to be.'],
    ['One more slice. One more story.', 'Wood-fired pizza, something to share, and a lunch that takes its own sweet time.'],
    ['Leave a little room for joy.', 'A spoonful of tiramisu. A second conversation. The sweetest way to stay a little longer.'],
    ['A table, and a little time.', 'Bring a book, a friend, or absolutely no plans. Make the afternoon yours.']
  ];
  let selected = 0;
  let copyAnimation;
  function selectMoment(index) {
    const next = (index + cards.length) % cards.length;
    if (next === selected) return;
    selected = next;
    cards.forEach((card, cardIndex) => {
      const distance = (cardIndex - selected + cards.length) % cards.length;
      const position = ['active', 'next', 'back', 'previous'][distance];
      card.dataset.position = position;
      card.setAttribute('aria-pressed', String(distance === 0));
      card.tabIndex = distance === 0 ? 0 : -1;
      card.inert = position === 'back';
      card.style.setProperty('--photo-rx', '0deg');
      card.style.setProperty('--photo-ry', '0deg');
    });
    choices.forEach((choice, index) => {
      choice.classList.toggle('is-active', index === selected);
      choice.setAttribute('aria-pressed', String(index === selected));
    });
    document.querySelector('#moment-title').textContent = moments[selected][0];
    document.querySelector('#moment-description').textContent = moments[selected][1];
    copyAnimation?.cancel();
    copyAnimation = animate(copy, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.19,1,.22,1)' });
  }
  choices.forEach(choice => choice.addEventListener('click', () => selectMoment(Number(choice.dataset.selectMoment))));
  cards.forEach(card => card.addEventListener('click', () => selectMoment(Number(card.dataset.moment))));
  document.querySelector('#moment-next').addEventListener('click', () => selectMoment(selected + 1));
  document.querySelector('#moment-previous').addEventListener('click', () => selectMoment(selected - 1));
  gallery.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? selected - 1 : event.key === 'ArrowRight' ? selected + 1 : event.key === 'Home' ? 0 : cards.length - 1;
    const focusedCard = event.target.closest('.moment-card');
    selectMoment(direction);
    if (focusedCard) cards[selected].focus({ preventScroll: true });
  });
  // Optional touch swipe; visible arrows and labelled mood buttons remain available.
  const stage = document.querySelector('#moment-stage');
  let touchStart = null;
  let suppressClick = false;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    touchStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', event => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      selectMoment(selected + (dx < 0 ? 1 : -1));
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 350);
    }
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; });
  stage.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);

  // Pointer perspective belongs to photos only. The existing coffee scene is unchanged.
  const tiltTargets = [...document.querySelectorAll('.moment-card, #menu .dish-image')];
  tiltTargets.forEach(element => {
    let bounds;
    const isMoment = element.classList.contains('moment-card');
    const reset = () => {
      element.style.setProperty(isMoment ? '--photo-rx' : '--dish-rx', '0deg');
      element.style.setProperty(isMoment ? '--photo-ry' : '--dish-ry', '0deg');
    };
    element.addEventListener('pointerenter', () => { bounds = element.getBoundingClientRect(); });
    element.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !motionAllowed() || (isMoment && element.dataset.position !== 'active')) return;
      bounds ||= element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      element.style.setProperty(isMoment ? '--photo-rx' : '--dish-rx', `${(0.5 - y) * 9}deg`);
      element.style.setProperty(isMoment ? '--photo-ry' : '--dish-ry', `${(x - 0.5) * 11}deg`);
      element.style.setProperty('--shine-x', `${x * 100}%`);
      element.style.setProperty('--shine-y', `${y * 100}%`);
    });
    element.addEventListener('pointerleave', () => { bounds = null; reset(); });
    window.addEventListener('bistro-motion', reset);
  });

  // Preserve the existing filter behaviour and animate its actual before/after layout.
  const menuControls = document.querySelector('.menu-filters');
  const dishes = [...document.querySelectorAll('[data-category]')];
  let previousPositions = new Map();
  menuControls.addEventListener('click', event => {
    if (!event.target.closest('[data-filter]')) return;
    dishes.forEach(dish => dish.getAnimations().forEach(animation => animation.cancel()));
    previousPositions = new Map(dishes.filter(dish => !dish.hidden).map(dish => [dish, dish.getBoundingClientRect()]));
  }, true);
  menuControls.addEventListener('click', event => {
    if (!event.target.closest('[data-filter]') || !motionAllowed()) return;
    dishes.filter(dish => !dish.hidden).forEach((dish, index) => {
      const before = previousPositions.get(dish);
      const after = dish.getBoundingClientRect();
      const transform = before
        ? `translate(${before.left - after.left}px,${before.top - after.top}px)`
        : 'perspective(900px) translateY(36px) rotateX(12deg) scale(.96)';
      animate(dish, [{ transform, opacity: before ? 1 : 0 }, { transform: 'none', opacity: 1 }], {
        duration: 620, delay: before ? 0 : index * 45, easing: 'cubic-bezier(.19,1,.22,1)', fill: 'backwards'
      });
    });
  });
})();
