import './styles/legacy.css';
import './styles/theme.css';
import './styles/frosted.css';
import './styles/lesson-actions.css';
import './styles/chat.css';
import { initLessonActions } from './core/lesson-actions.js';
import { app } from './app.js';
import { AudioKit } from './core/audio.js';
import './services/ai-chat.js';

window.app = app;
window.AudioKit = AudioKit;
window.addEventListener('DOMContentLoaded', () => { initLessonActions(); app.init(); }, { once: true });
document.getElementById('user-code-input')?.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  app.insertSnippet('    ');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/algospark/sw.js', {
      scope: '/algospark/',
      updateViaCache: 'none'
    }).catch(() => {});
  }, { once: true });
}
const SOUND_TARGETS = 'button,a,[role="button"],[role="switch"],summary,[tabindex="0"],.choice-card,.choice-option,.sim-toggle-btn,.bug-code-line,.token-chip,.reorder-row,.fill-chip';
document.addEventListener('click', event => { AudioKit.activeClick = event; }, true);
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest(SOUND_TARGETS) : null;
  if (target && !event.__algoSparkSoundPlayed) AudioKit.play('tap');
  if (AudioKit.activeClick === event) AudioKit.activeClick = null;
}, false);
