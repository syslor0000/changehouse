/**
 * Add another project here with the same room fields to extend the gallery.
 * `notice` describes the provenance of that project's actual photos.
 * Positions apply to BOTH photos, including the closer mobile crop.
 */
export const GALLERY_PROJECTS = [
  {
    id: 'daejeon-whole-home-2026', label: '대전 · 집 전체 정리',
    notice: '주방·드레스룸·신발장·생활용품장. 같은 현장의 정리 전후 사진이며 촬영 구도에는 차이가 있습니다.',
    source: 'https://blog.naver.com/btstar2078/224414107512',
    rooms: [
      { id: 'kitchen', name: '주방', description: '쓰임별 분류로 조리대를 비웠어요.', before: 'assets/daejeon-kitchen-before.webp', after: 'assets/daejeon-kitchen-after.webp', effect: 'soft-blur', position: 'center' },
      { id: 'dressing', name: '드레스룸', description: '종류와 길이를 나누고 통로를 확보했어요.', before: 'assets/daejeon-dressing-before.webp', after: 'assets/daejeon-dressing-after.webp', effect: 'soft-zoom', position: 'center' },
      { id: 'shoes', name: '신발장', description: '계절과 종류별로 찾기 쉽게.', before: 'assets/daejeon-shoes-before.webp', after: 'assets/daejeon-shoes-after.webp', effect: 'vertical', position: 'center' },
      { id: 'utility', name: '생활용품장', description: '용도별 수납함과 라벨로 제자리를.', before: 'assets/daejeon-utility-before.webp', after: 'assets/daejeon-utility-after.webp', effect: 'dissolve', position: 'center' },
    ],
  },
];

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createCard(project, room, index, hoverQuery) {
  const card = node('article', 'gallery-card');
  const button = node('button', 'gallery-photo');
  button.type = 'button';
  button.disabled = true;
  button.dataset.effect = room.effect;
  button.dataset.ready = 'false';
  button.style.setProperty('--gallery-position', room.position || 'center');
  button.setAttribute('aria-pressed', 'false');
  // The name stays stable: pressed means the AFTER image is displayed.
  button.setAttribute('aria-label', `${project.label} ${room.name} 정리 후 사진 표시`);
  button.setAttribute('aria-describedby', `gallery-caption-${room.id} gallery-sample-note`);
  const stateBadge = node('span', 'gallery-state');
  stateBadge.setAttribute('aria-hidden', 'true');
  const stateKo = node('span', '', '정리 전');
  const stateEn = node('span', 'gallery-state-en', 'BEFORE');
  stateBadge.append(stateKo, stateEn);
  const action = node('span', 'gallery-action');
  action.setAttribute('aria-hidden', 'true');
  const actionText = node('span', '', '정리 후 보기');
  action.append(actionText, node('span', 'gallery-action-icon', '↔'));
  const loading = node('span', 'gallery-loading', '사진을 불러오고 있어요.');
  loading.setAttribute('aria-hidden', 'true');
  let loaded = 0;
  let failed = false;
  for (const [key, className] of [['before', 'gallery-before'], ['after', 'gallery-after']]) {
    const image = node('img', className);
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.draggable = false;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.addEventListener('load', () => {
      loaded += 1;
      if (loaded === 2 && !failed) {
        button.disabled = false;
        button.dataset.ready = 'true';
      }
    }, { once: true });
    image.addEventListener('error', () => {
      failed = true;
      loading.textContent = '이 공간의 사진을 준비하고 있어요.';
      button.setAttribute('aria-label', `${project.label} ${room.name} 사진 준비 중`);
    }, { once: true });
    image.src = room[key];
    button.append(image);
  }
  button.append(stateBadge, action, loading);
  const caption = node('div', 'gallery-card-caption');
  const title = node('h2', 'gallery-card-title');
  title.append(node('span', '', String(index + 1).padStart(2, '0')), document.createTextNode(room.name));
  const description = node('p', 'gallery-card-description', room.description);
  description.id = `gallery-caption-${room.id}`;
  caption.append(title, description);
  card.append(button, caption);

  const state = { hover: false, focus: false, override: null, after: false };
  function paint() {
    const after = state.override ?? (state.hover || state.focus);
    state.after = after;
    button.setAttribute('aria-pressed', String(after));
    stateKo.textContent = after ? '정리 후' : '정리 전';
    stateEn.textContent = after ? 'AFTER' : 'BEFORE';
    actionText.textContent = after ? '정리 전 보기' : '정리 후 보기';
  }
  button.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || !hoverQuery.matches) return;
    state.hover = true;
    state.override = null;
    paint();
  });
  button.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch' || !hoverQuery.matches) return;
    state.hover = false;
    state.override = null;
    paint();
  });
  button.addEventListener('focus', () => {
    state.focus = button.matches(':focus-visible');
    state.override = null;
    paint();
  });
  button.addEventListener('blur', () => {
    state.focus = false;
    state.override = null;
    paint();
  });
  button.addEventListener('click', () => {
    state.override = !state.after;
    paint();
  });
  return card;
}

/** Mount after gallery-section.html has been inserted beside #home-view. */
export function initGallery() {
  const gallery = document.querySelector('#gallery-view');
  const home = document.querySelector('#home-view');
  if (!gallery || !home) throw new Error('Gallery requires sibling #home-view and #gallery-view elements.');
  if (gallery.dataset.initialized === 'true') return;
  gallery.dataset.initialized = 'true';
  const selector = gallery.querySelector('#gallery-project-select');
  const grid = gallery.querySelector('#gallery-grid');
  const sampleNote = gallery.querySelector('#gallery-sample-note');
  const title = gallery.querySelector('#gallery-title');
  const hoverQuery = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
  const homeTitle = document.title;
  let homeScroll = scrollY;
  let galleryScroll = 0;
  let galleryActive = false;
  let scheduledScroll = 0;
  let lastAppliedHash = null;
  for (const project of GALLERY_PROJECTS) {
    const option = node('option', '', project.label);
    option.value = project.id;
    selector.append(option);
  }
  function loadProjectPhotos() {
    // Clipped AFTER photos may never intersect the viewport for lazy loading.
    // Request both sides once the gallery is opened so comparison can unlock.
    grid.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
  }
  function showProject(id) {
    const project = GALLERY_PROJECTS.find(item => item.id === id) || GALLERY_PROJECTS[0];
    selector.value = project.id;
    sampleNote.replaceChildren(document.createTextNode(`${project.label} · ${project.notice} `));
    const sourceLink=node('a','gallery-source','현장 이야기 보기');
    sourceLink.href=project.source;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sampleNote.append(sourceLink);
    grid.replaceChildren(...project.rooms.map((room, index) => createCard(project, room, index, hoverQuery)));
    if (galleryActive) loadProjectPhotos();
  }
  selector.addEventListener('change', () => showProject(selector.value));
  showProject(GALLERY_PROJECTS[0].id);

  function jump(top) {
    // Route changes should be instant even though the home page uses smooth anchors.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top, behavior: 'instant' });
    root.style.scrollBehavior = previous;
  }
  function route({ source = 'hash', force = false } = {}) {
    const hash = location.hash || '#home';
    if (!force && hash === lastAppliedHash) return;
    lastAppliedHash = hash;
    const nextGallery = hash === '#projects';
    const changedView = nextGallery !== galleryActive;
    if (changedView) {
      if (galleryActive) galleryScroll = scrollY;
      else homeScroll = scrollY;
    }
    galleryActive = nextGallery;
    home.hidden = nextGallery;
    gallery.hidden = !nextGallery;
    if (nextGallery) loadProjectPhotos();
    document.title = nextGallery ? '현장사진 — 체인지하우스' : homeTitle;
    document.querySelectorAll('.site-header a[href="#projects"]').forEach(link => {
      if (nextGallery) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    cancelAnimationFrame(scheduledScroll);
    scheduledScroll = requestAnimationFrame(() => {
      if (nextGallery) {
        jump(source === 'history' ? galleryScroll : 0);
        if (source === 'click') title.focus({ preventScroll: true });
      } else if (changedView || source === 'click') {
        let target;
        try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { target = null; }
        if (target && home.contains(target)) {
          const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
          jump(Math.max(0, target.getBoundingClientRect().top + scrollY - headerHeight));
        } else jump(source === 'history' ? homeScroll : 0);
        if (changedView && source === 'click') {
          const focusTarget = target && home.contains(target) ? target : home;
          const oldTabindex = focusTarget.getAttribute('tabindex');
          focusTarget.setAttribute('tabindex', '-1');
          focusTarget.focus({ preventScroll: true });
          if (oldTabindex === null) focusTarget.removeAttribute('tabindex');
          else focusTarget.setAttribute('tabindex', oldTabindex);
        }
      }
      // Home's scroll scenes can recalculate after being unhidden.
      window.dispatchEvent(new Event('resize'));
    });
  }
  function navigate(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    if (url.hash !== '#projects' && !galleryActive) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    route({ source: 'click', force: true });
  }
  const onHash = () => route({ source: 'hash' });
  const onHistory = () => route({ source: 'history' });
  document.addEventListener('click', navigate);
  window.addEventListener('hashchange', onHash);
  window.addEventListener('popstate', onHistory);
  route({ source: 'initial', force: true });
  return {
    destroy() {
      cancelAnimationFrame(scheduledScroll);
      document.removeEventListener('click', navigate);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHistory);
      delete gallery.dataset.initialized;
    },
  };
}
