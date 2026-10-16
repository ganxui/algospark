export function initLessonActions() {
  const drawer = document.getElementById('eval-drawer');
  if (!drawer || drawer.dataset.viewportBound) return;
  drawer.dataset.viewportBound = 'true';
  const root = document.documentElement;
  const sync = () => {
    const visible = getComputedStyle(drawer).display !== 'none';
    document.body.classList.toggle('has-evaluation-drawer', visible);
    document.body.classList.toggle('has-app-modal', Boolean(document.querySelector('.modal-overlay.active, .confirm-dialog-overlay.active')));
    root.style.setProperty('--as-drawer-height', `${visible ? drawer.offsetHeight : 0}px`);
    const viewport = window.visualViewport;
    const inset = viewport && Math.abs(viewport.scale - 1) < .01
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
    root.style.setProperty('--as-keyboard-inset', `${Math.round(inset)}px`);
    root.style.setProperty('--as-visible-height', `${Math.round(viewport?.height || window.innerHeight)}px`);
  };
  new MutationObserver(sync).observe(drawer, { attributes: true, attributeFilter: ['style', 'class'] });
  document.querySelectorAll('.modal-overlay, .confirm-dialog-overlay').forEach(modal => {
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(drawer);
  window.addEventListener('resize', sync, { passive: true });
  window.visualViewport?.addEventListener('resize', sync, { passive: true });
  window.visualViewport?.addEventListener('scroll', sync, { passive: true });
  sync();
}
