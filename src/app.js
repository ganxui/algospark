import { ALL_LESSONS, MASCOTS, SECTIONS, UNITS } from './curriculum.js';
import { AudioKit } from './core/audio.js';
import { askTutor, clearTutorHistory } from './services/ai-chat.js';
import { storage, readJson, localDay } from './core/storage.js';
import { compileMiniPython } from './core/mini-python.js';
import sandboxRuntime from './core/sandbox-runtime.txt?raw';

const app = {
    currLessonId: 1,
    currentSectionId: 1,
    demoMode: false,
    currentTaskIndex: 0,
    xp: 0, gems: 50, hearts: 5, streak: 0,
    completedIds: new Set(),
    claimedChests: new Set(),
    lessonProgressMap: {},
    selectedChoice: null,
    selectedToken: null,
    selectedBugLineIndex: null,
    selectedSimVal: null,
    reorderBlocks: [],
    selectedSwapIndex: null,
    isChecked: false,
    hintOpen: false,
    evaluationReady: false,
    evaluationFailed: false,
    evaluationPending: false,
    taskRevision: 0,
    codeRunId: 0,
    aiPending: false,
    userOutput: "",

    init() {
      const startButton = document.getElementById('journey-start');
      if (startButton && !startButton.dataset.actionBound) {
        startButton.dataset.actionBound = 'true';
        startButton.addEventListener('click', () => this.continueLearning());
      }
      this.load();
      this.updateStats();
      this.renderMap();
      this.renderSectionsModal();
      if (storage.getItem('algospark_cycles_v3_intro_seen') !== '1') this.openWelcome();
    },

    load() {
      try {
        // Restore progress from the original curriculum, never from the shortened course.
        if (storage.getItem('algospark_cycles_v3_done') === null) {
          for (const suffix of ['xp', 'gems', 'done', 'streak', 'badges', 'progress', 'streak_day']) {
            const value = storage.getItem(`as100_for_v1_${suffix}`);
            if (value !== null) storage.setItem(`algospark_cycles_v3_${suffix}`, value);
          }
        }
        const x = storage.getItem('algospark_cycles_v3_xp');
        const g = storage.getItem('algospark_cycles_v3_gems');
        const s = storage.getItem('algospark_cycles_v3_streak');
        const number = (value, fallback) => value !== null && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;
        this.xp = number(x, 0);
        this.gems = number(g, 50);
        this.streak = number(s, 0);
        const ids = readJson('algospark_cycles_v3_done', []);
        this.completedIds = new Set(Array.isArray(ids) ? ids.filter(id => ALL_LESSONS.some(lesson => lesson.id === id)) : []);
        const badges = readJson('algospark_cycles_v3_badges', []);
        this.claimedChests = new Set(Array.isArray(badges) ? badges.filter(id => UNITS.some(unit => unit.id === id && ALL_LESSONS.every(lesson => this.completedIds.has(lesson.id)))) : []);
        const progress = readJson('algospark_cycles_v3_progress', {});
        this.lessonProgressMap = {};
        if (progress && typeof progress === 'object' && !Array.isArray(progress)) {
          for (const lesson of ALL_LESSONS) {
            const count = progress[lesson.id];
            if (Number.isInteger(count) && count >= 0 && count < lesson.tasks.length) this.lessonProgressMap[lesson.id] = count;
          }
        }
        this.hearts = Math.min(5, Math.max(1, number(storage.getItem('algospark_cycles_v3_hearts'), 5)));
      } catch(e){}
    },

    save() {
      if (this.demoMode) return;
      try {
        storage.setItem('algospark_cycles_v3_xp', this.xp);
        storage.setItem('algospark_cycles_v3_gems', this.gems);
        storage.setItem('algospark_cycles_v3_done', JSON.stringify([...this.completedIds]));
        storage.setItem('algospark_cycles_v3_streak', this.streak);
        storage.setItem('algospark_cycles_v3_badges', JSON.stringify([...this.claimedChests]));
        storage.setItem('algospark_cycles_v3_progress', JSON.stringify(this.lessonProgressMap));
        storage.setItem('algospark_cycles_v3_hearts', this.hearts);
      } catch(e){}
    },

    updateStats() {
      document.getElementById('stat-streak').innerText = this.streak;
      document.getElementById('stat-gems').innerText = this.gems;
      document.getElementById('stat-hearts').innerText = this.hearts;
      this.updateJourneyProgress();
    },

    updateJourneyProgress() {
      const total = ALL_LESSONS.length;
      const done = ALL_LESSONS.filter(lesson => this.completedIds.has(lesson.id)).length;
      const percent = Math.round((done / total) * 100);
      const ring = document.getElementById('journey-progress-ring');
      if (!ring) return;
      ring.setAttribute('aria-valuenow', String(percent));
      ring.style.setProperty('--journey-progress', String(percent));
      ring.style.setProperty('--journey-offset', String((182.2 * (100 - percent)) / 100));
      document.getElementById('journey-progress-value').textContent = `${percent}%`;
      document.getElementById('journey-lessons-count').textContent = `${done} из ${total} уроков`;
      const nextLesson = ALL_LESSONS.find(lesson => !this.completedIds.has(lesson.id))?.id || 1;
      document.getElementById('journey-cta-label').textContent = this.demoMode ? 'Открыть демо-урок' : done === total ? 'Повторить модуль' : done ? `Продолжить · урок ${nextLesson}` : 'Начать первый урок';
      document.getElementById('journey-subtitle').textContent = this.demoMode
        ? `Демо-режим: открой любой из ${total} уроков, прогресс останется без изменений.`
        : done === total ? 'Все уроки позади. Можешь повторить маршрут и закрепить навык.' : done ? 'Отличный темп. Следующий короткий шаг уже ждёт тебя на карте.' : `Пройди ${total} уроков: от первых повторов до алгоритма для дрона.`;
    },

    continueLearning() {
      const nextLesson = this.demoMode ? 1 : (ALL_LESSONS.find(lesson => !this.completedIds.has(lesson.id))?.id || 1);
      this.startLesson(nextLesson);
    },

    openWelcome() { document.getElementById('modal-welcome')?.classList.add('active'); },
    closeWelcome(start = false) {
      storage.setItem('algospark_cycles_v3_intro_seen', '1');
      document.getElementById('modal-welcome')?.classList.remove('active');
      if (start) this.startLesson(1);
    },

    showToast(message) {
      const container = document.getElementById('duo-toast-container');
      const toast = document.createElement('div');
      toast.className = 'duo-toast-item';
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('width','16'); icon.setAttribute('height','16'); icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('fill','none'); icon.setAttribute('stroke','#38bdf8'); icon.setAttribute('stroke-width','2.5');
      const circle = document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx','12'); circle.setAttribute('cy','12'); circle.setAttribute('r','10');
      icon.append(circle); const text=document.createElement('span'); text.textContent=String(message); toast.append(icon,text);
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.transition = 'opacity 0.25s, transform 0.25s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 250);
      }, 2600);
    },

    showConfirm(opts) {
      AudioKit.play('tap');
      const overlay = document.getElementById('app-confirm-dialog');
      const icon = document.getElementById('confirm-dialog-icon');
      const title = document.getElementById('confirm-dialog-title');
      const desc = document.getElementById('confirm-dialog-desc');
      const btnOk = document.getElementById('confirm-btn-ok');
      const btnCancel = document.getElementById('confirm-btn-cancel');

      icon.innerHTML = opts.iconHtml || `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--duo-orange)" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      title.innerText = opts.title || 'Подтвердите действие';
      desc.innerText = opts.desc || 'Вы действительно хотите продолжить?';
      btnOk.innerText = opts.okText || 'ПОДТВЕРДИТЬ';
      btnCancel.innerText = opts.cancelText || 'ОТМЕНА';

      overlay.classList.add('active');

      btnOk.onclick = () => {
        overlay.classList.remove('active');
        if (opts.onOk) opts.onOk();
      };
      btnCancel.onclick = () => {
        overlay.classList.remove('active');
        if (opts.onCancel) opts.onCancel();
      };
    },

    onStreakClick() {
      AudioKit.play('flame');
      this.triggerFlameAnimation();
      this.showToast(`Серия занятий: ${this.streak} дн. Продолжай в своём темпе!`);
    },

    triggerFlameAnimation() {
      const box = document.getElementById('flame-icon-box-el');
      if (box) {
        box.classList.remove('flame-boost-animation');
        void box.offsetWidth;
        box.classList.add('flame-boost-animation');
      }
    },

    toggleSound() {
      AudioKit.muted = !AudioKit.muted;
      document.getElementById('sound-icon').style.opacity = AudioKit.muted ? '0.35' : '1';
      if (!AudioKit.muted) AudioKit.play('tap');
    },

    hideDrawer() {
      const drawer = document.getElementById('eval-drawer');
      if (drawer) {
        drawer.style.display = 'none';
        drawer.className = 'evaluation-drawer';
      }
      this.hintOpen = false;
    },

    showTaskHint() {
      const lesson = ALL_LESSONS[this.currLessonId - 1];
      const task = lesson?.tasks[this.currentTaskIndex - 1];
      if (!task) return;
      if (this.evaluationPending || this.isChecked) return;
      this.evaluationFailed = false;
      AudioKit.play('tap');
      this.hintOpen = true;
      const drawer = document.getElementById('eval-drawer');
      drawer.className = 'evaluation-drawer state-hint';
      drawer.style.display = 'block';
      document.getElementById('eval-icon').innerText = '?';
      document.getElementById('eval-title').innerText = 'Подсказка';
      document.getElementById('eval-sub').innerText = task.hint;
      const button = document.getElementById('eval-main-btn');
      button.className = 'duo-btn btn-green';
      button.disabled = false;
      button.innerText = 'ВЕРНУТЬСЯ К ЗАДАНИЮ';
    },

    setEvaluationReady(ready, changed = true) {
      if (changed) {
        this.taskRevision++;
        this.isChecked = false;
        this.evaluationFailed = false;
      }
      this.evaluationReady = Boolean(ready);
      const button = document.getElementById('eval-main-btn');
      const drawer = document.getElementById('eval-drawer');
      if (!button || !drawer) return;
      drawer.style.display = 'block';
      button.disabled = !this.evaluationReady || this.evaluationPending;
      button.className = `duo-btn ${this.evaluationReady ? 'btn-green' : 'btn-disabled'}`;
      if (!this.hintOpen && !this.isChecked) button.innerText = 'ПРОВЕРИТЬ';
      if (!this.hintOpen) drawer.className = 'evaluation-drawer';
    },

    /* Рендеринг карты с плавными жидкостными волнами */
    renderMap() {
      const container = document.getElementById('path-stream-container');
      container.innerHTML = '';

      UNITS.forEach(u => {
        const banner = document.createElement('div');
        banner.className = 'unit-card-banner';
        banner.style.setProperty('--unit-accent', u.depth);
        banner.innerHTML = `
          <div>
            <span class="unit-tag-pill">УЧЕБНЫЙ МОДУЛЬ · ${u.themeName}</span>
            <h3>${u.t}</h3>
            <p>${u.sub}</p>
          </div>
          <div style="width:48px; height:48px; display:grid; place-items:center;">
            ${MASCOTS[u.mascot]}
          </div>
        `;
        container.appendChild(banner);

        for (let id = u.start; id <= u.end; id++) {
          const section = SECTIONS.find(item => item.start === id && id !== u.start);
          if (section) {
            const sectionLessons = ALL_LESSONS.filter(item => item.id >= section.start && item.id <= section.end);
            const completedInSection = sectionLessons.filter(item => this.completedIds.has(item.id)).length;
            const sectionDivider = document.createElement('section');
            sectionDivider.id = `course-section-${section.id}`;
            sectionDivider.className = `course-section-divider${this.currentSectionId === section.id ? ' is-current' : ''}`;
            sectionDivider.setAttribute('aria-label', section.title);
            sectionDivider.innerHTML = `<div class="course-section-copy"><span class="course-section-kicker">СЛЕДУЮЩИЙ ЭТАП · ${section.range}</span><h3>${section.title.replace(/^Часть [0-9]+ · /, '')}</h3><p>${completedInSection} из ${sectionLessons.length} уроков пройдено</p></div><span class="course-section-index">0${section.id}</span>`;
            container.appendChild(sectionDivider);
          }
          const lesson = ALL_LESSONS[id - 1];
          const isDone = this.completedIds.has(id);
          const isCurrent = this.demoMode || id === 1 || this.completedIds.has(id - 1);
          const isLocked = !isDone && !isCurrent;

          let waterPercent = 0;
          if (isDone) waterPercent = 100;
          else if (isCurrent && this.lessonProgressMap[id]) waterPercent = Math.min(100, Math.round((this.lessonProgressMap[id] / 3) * 100));

          const card = document.createElement('div');
          card.id = `node-lesson-${id}`;
          card.className = `lesson-block-card ${isDone ? 'card-state-passed' : (isLocked ? 'card-state-locked' : 'card-state-active')}`;
          
          let statusText = isDone ? 'Пройдено' : (isLocked ? 'Сначала предыдущий урок' : (this.demoMode ? 'Демо-урок · прогресс не меняется' : `Твой прогресс · ${waterPercent}%`));

          // ДВЕ ПЛАВНЫЕ ПЕРЕКАТЫВАЮЩИЕСЯ СИНУСОИДАЛЬНЫЕ ВОЛНЫ ВМЕСТО МЕЛКИХ ТОЧЕК
          card.innerHTML = `
            ${(!isDone && !isLocked && waterPercent > 0) ? `
              <div class="liquid-water-layer" style="height:${waterPercent}%;">
                <svg class="wave-svg-flow wave-layer-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                  <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1000,50 L1200,50 L1200,120 L0,120 Z"></path>
                </svg>
                <svg class="wave-svg-flow" viewBox="0 0 1200 120" preserveAspectRatio="none">
                  <path d="M0,45 C150,-20 300,90 500,20 C700,-50 900,80 1200,30 L1200,120 L0,120 Z"></path>
                </svg>
              </div>
            ` : ''}
            <div class="card-content-wrap">
              <div class="card-top-meta">
                <span class="card-id-tag">УРОК ${String(id).padStart(2, '0')}</span>
                <span class="card-diff-tag">СЛОЖНОСТЬ ${lesson.diff}/10</span>
              </div>
              <div class="card-title-text">${lesson.title}</div>
              <div class="card-desc-text">${lesson.desc}</div>
              <div style="font-size:10px; font-weight:800; margin-top:4px; opacity:0.85;">${statusText}</div>
            </div>
          `;

          card.style.setProperty('--card-delay', `${Math.min(id - u.start, 8) * 34}ms`);
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', isLocked ? '-1' : '0');
          card.setAttribute('aria-label', `Урок ${id}: ${lesson.title}. ${statusText}`);
          card.onclick = () => app.startLesson(id);
          card.onkeydown = event => { if (!isLocked && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); app.startLesson(id); } };
          container.appendChild(card);
        }

        // Сундук юнита
        const isUnitFinished = Array.from({length: u.end - u.start + 1}, (_, idx) => u.start + idx).every(i => this.completedIds.has(i));
        const isClaimed = this.claimedChests.has(u.id);

        const chestCard = document.createElement('div');
        chestCard.className = `unit-chest-card ${isClaimed ? 'claimed' : ''}`;
        chestCard.setAttribute('role', 'button');
        chestCard.setAttribute('tabindex', '0');
        chestCard.setAttribute('aria-label', isClaimed ? 'Значок за модуль уже получен' : (isUnitFinished ? 'Открыть значок за весь модуль' : `Награда за модуль: пройди ${ALL_LESSONS.length} уроков`));
        chestCard.innerHTML = `
          <div>
            <div class="unit-reward-label">НАГРАДА ЗА МОДУЛЬ</div>
            <div style="font-size:12.5px; font-weight:800;">${isClaimed ? 'Значок получен ✓' : (isUnitFinished ? 'Открыть значок за модуль' : `Пройди все ${ALL_LESSONS.length} уроков`)}</div>
          </div>
          <div style="width:36px; height:36px; display:grid; place-items:center;">
            ${isClaimed ? 
              `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" stroke-width="2.3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>` : 
              (isUnitFinished ? 
                `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--duo-orange)" stroke-width="2.3"><rect x="3" y="8" width="18" height="13" rx="2"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : 
                `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.3"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
              )
            }
          </div>
        `;
        chestCard.onclick = () => app.handleChestClick(u.id, isUnitFinished, isClaimed);
        chestCard.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); app.handleChestClick(u.id, isUnitFinished, isClaimed); } };
        container.appendChild(chestCard);
      });

      this.updateJourneyProgress();
    },

    handleChestClick(unitId, isFinished, isClaimed) {
      if (this.demoMode) { this.showToast('В демо-режиме награды не сохраняются.'); return; }
      isClaimed = this.claimedChests.has(unitId);
      isFinished = ALL_LESSONS.every(lesson => this.completedIds.has(lesson.id));
      if (isClaimed) {
        AudioKit.play('tap');
        this.showToast('Этот сундук уже был открыт ранее.');
        return;
      }
      if (!isFinished) {
        AudioKit.play('err');
        this.showToast(`Завершите все ${ALL_LESSONS.length} уроков, чтобы получить значок!`);
        return;
      }

      AudioKit.play('chest_soft');
      this.gems += 50;
      this.claimedChests.add(unitId);
      this.save();
      this.updateStats();
      this.renderMap();
      this.showToast('Модуль завершён! Значок добавлен в награды.');
    },

    startLesson(id) {
      if (!ALL_LESSONS.some(lesson => lesson.id === id)) return;
      this.taskRevision++;
      this.codeRunId++;
      AudioKit.play('tap');
      if (!this.demoMode && id > 1 && !this.completedIds.has(id - 1) && !this.completedIds.has(id)) {
        this.showToast('Урок закрыт. Пройдите предыдущие шаги.');
        return;
      }

      this.currLessonId = id;
      this.currentTaskIndex = 0;
      this.isChecked = false;
      this.hideDrawer();

      const lesson = ALL_LESSONS[id - 1];
      const unit = lesson.unit;

      document.getElementById('theory-unit-tag').innerText = `${unit.themeName} · урок ${id}`;
      document.getElementById('theory-heading').innerText = lesson.title;
      document.getElementById('theory-desc').innerText = lesson.desc;
      document.getElementById('theory-rule').textContent = lesson.theoryRule.replace(/^#\s*/, '');
      document.getElementById('theory-code-snippet').innerText = lesson.theoryCode;
      document.getElementById('theory-output-preview').innerText = lesson.theoryOutput;

      document.getElementById('phase-theory').style.display = 'flex';
      document.getElementById('phase-practice').style.display = 'none';
      document.getElementById('lesson-progress-fill').style.width = '20%';
      document.getElementById('lesson-task-badge').innerText = 'ТЕОРИЯ';

      this.showScreen('screen-lesson');
    },

    startPracticeFlow() {
      AudioKit.play('tap');
      this.currentTaskIndex = this.demoMode || this.completedIds.has(this.currLessonId) ? 1 : (this.lessonProgressMap[this.currLessonId] || 0) + 1;
      this.renderCurrentTask();
    },

    renderCurrentTask() {
      const lesson = ALL_LESSONS[this.currLessonId - 1];
      const task = lesson.tasks[this.currentTaskIndex - 1];
      const unit = lesson.unit;

      this.isChecked = false;
      this.evaluationFailed = false;
      this.hintOpen = false;
      this.evaluationReady = task.f === 'reorder';
      this.selectedChoice = null;
      this.selectedToken = null;
      this.selectedBugLineIndex = null;
      this.selectedSimVal = null;
      this.selectedSwapIndex = null;
      this.userOutput = "";

      if (!this.demoMode && !this.completedIds.has(this.currLessonId)) {
        this.lessonProgressMap[this.currLessonId] = this.currentTaskIndex - 1;
        this.save();
      }

      document.getElementById('phase-theory').style.display = 'none';
      document.getElementById('phase-practice').style.display = 'flex';
      
      const progressPercent = 20 + this.currentTaskIndex * 25;
      document.getElementById('lesson-progress-fill').style.width = `${progressPercent}%`;
      document.getElementById('lesson-task-badge').innerText = `ЗАДАНИЕ ${this.currentTaskIndex}/3`;
      document.getElementById('practice-mission-count').textContent = `${this.currentTaskIndex}/3`;
      document.getElementById('practice-mission-caption').textContent = `Задание ${this.currentTaskIndex} из 3 · ${['разминка перед маршрутом','собираем алгоритм','финальная проверка'][this.currentTaskIndex - 1]}`;
      document.getElementById('practice-mission-fill').style.width = `${((this.currentTaskIndex - 1) / 2) * 100}%`;
      document.querySelectorAll('.practice-mission-node').forEach(node => {
        const step = Number(node.dataset.missionStep);
        node.classList.toggle('is-done', step < this.currentTaskIndex);
        node.classList.toggle('is-active', step === this.currentTaskIndex);
      });

      document.getElementById('lesson-mascot-avatar').innerHTML = MASCOTS[unit.mascot];
      document.getElementById('mascot-speech').innerHTML = `Задание ${this.currentTaskIndex}/3: примени полученные знания на практике!`;
      document.getElementById('task-question').innerText = task.q;

      const codeBlock = document.getElementById('lesson-code-block');
      if (task.code && task.f !== 'write') {
        codeBlock.style.display = 'block';
        codeBlock.innerText = task.code;
      } else {
        codeBlock.style.display = 'none';
      }

      const drawer = document.getElementById('eval-drawer');
      drawer.className = 'evaluation-drawer';
      drawer.style.display = 'block';

      const dBtn = document.getElementById('eval-main-btn');
      dBtn.innerText = 'ПРОВЕРИТЬ';
      this.setEvaluationReady(this.evaluationReady);

      const bChoice = document.getElementById('box-format-choice');
      const bSim = document.getElementById('box-format-sim');
      const bBug = document.getElementById('box-format-bug');
      const bReorder = document.getElementById('box-format-reorder');
      const bFill = document.getElementById('box-format-fill');
      const bWrite = document.getElementById('box-format-write');

      bChoice.style.display = bSim.style.display = bBug.style.display = bReorder.style.display = bFill.style.display = bWrite.style.display = 'none';

      if (task.f === 'choice') {
        bChoice.style.display = 'flex'; bChoice.innerHTML = '';
        task.opts.forEach((o, idx) => {
          const card = document.createElement('div');
          card.className = 'choice-card';
          card.innerHTML = `<div class="choice-badge">${idx + 1}</div><span>${o.t}</span>`;
          card.onclick = () => {
            AudioKit.play('tap');
            document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.selectedChoice = idx;
            this.setEvaluationReady(true);
          };
          bChoice.appendChild(card);
        });
      }
      else if (task.f === 'sim') {
        // ВИЗУАЛЬНЫЙ СИМУЛЯТОР РАДАРА
        bSim.style.display = 'flex';
        const btnsBox = document.getElementById('sim-controls-buttons');
        btnsBox.innerHTML = '';
        ['15', '28', '45'].forEach(val => {
          const btn = document.createElement('button');
          btn.className = 'sim-toggle-btn';
          btn.innerText = `dist = ${val}`;
          btn.onclick = () => {
            AudioKit.play('tap');
            document.querySelectorAll('.sim-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.selectedSimVal = val;
            document.getElementById('sim-dist-badge').innerText = `dist = ${val}`;
            this.setEvaluationReady(true);
          };
          btnsBox.appendChild(btn);
        });
      }
      else if (task.f === 'bug') {
        // БАГ-ХАНТЕР
        bBug.style.display = 'flex';
        const linesBox = document.getElementById('bug-hunt-lines');
        linesBox.innerHTML = '';
        task.lines.forEach((line, idx) => {
          const row = document.createElement('div');
          row.className = 'bug-code-line';
          row.innerHTML = `<span class="line-no">${idx + 1}</span><span>${line.t}</span>`;
          row.onclick = () => {
            AudioKit.play('tap');
            document.querySelectorAll('.bug-code-line').forEach(l => l.classList.remove('selected-bug'));
            row.classList.add('selected-bug');
            this.selectedBugLineIndex = idx;
            this.setEvaluationReady(true);
          };
          linesBox.appendChild(row);
        });
      }
      else if (task.f === 'reorder') {
        bReorder.style.display = 'flex';
        this.reorderBlocks = [...task.blks];
        for (let i = this.reorderBlocks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.reorderBlocks[i], this.reorderBlocks[j]] = [this.reorderBlocks[j], this.reorderBlocks[i]];
        }
        if (this.reorderBlocks.length > 1 && this.reorderBlocks.every((block, index) => block === task.blks[index])) {
          [this.reorderBlocks[0], this.reorderBlocks[1]] = [this.reorderBlocks[1], this.reorderBlocks[0]];
        }
        this.renderReorder();
        this.setEvaluationReady(true);
      }
      else if (task.f === 'fill') {
        bFill.style.display = 'block';
        document.getElementById('fill-preview').innerHTML = task.code.replace('[ ? ]', '<span class="token-slot" id="slot-tok">...</span>');
        const chipsBox = document.getElementById('fill-chips'); chipsBox.innerHTML = '';
        task.chips.forEach(c => {
          const chip = document.createElement('div');
          chip.className = 'token-chip';
          chip.innerText = c;
          chip.onclick = () => {
            AudioKit.play('tap');
            document.querySelectorAll('.token-chip').forEach(x => x.classList.remove('selected'));
            chip.classList.add('selected');
            this.selectedToken = c;
            document.getElementById('slot-tok').innerText = c;
            this.setEvaluationReady(true);
          };
          chipsBox.appendChild(chip);
        });
      }
      else if (task.f === 'write') {
        bWrite.style.display = 'flex';
        document.getElementById('user-code-input').value = '';
        document.getElementById('live-console-output').innerText = '>>> (Нажми «Запустить код» для проверки вывода)';
        document.getElementById('console-status-text').innerText = 'Ожидает код';
      }
      this.prepareTaskControls();
    },

    prepareTaskControls() {
      const selector = '.choice-card, .bug-code-line, .token-chip, .reorder-row';
      document.querySelectorAll(selector).forEach(control => {
        control.setAttribute('role', 'button');
        control.tabIndex = 0;
        control.setAttribute('aria-pressed', String(control.matches('.selected, .selected-bug, .selected-swap')));
        if (control.dataset.keyboardBound) return;
        control.dataset.keyboardBound = 'true';
        control.addEventListener('keydown', event => {
          if (event.target === control && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); control.click(); }
        });
        control.addEventListener('click', () => this.prepareTaskControls());
      });
    },

    insertSnippet(text) {
      AudioKit.play('tap');
      const input = document.getElementById('user-code-input');
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.substring(0, start) + text + input.value.substring(end);
      input.focus();
      input.selectionStart = input.selectionEnd = start + text.length;
      this.onCodeTyping();
    },

    onCodeTyping() {
      const code = document.getElementById('user-code-input').value.trim();
      this.setEvaluationReady(code.length > 2);
    },

    async executeMiniPython(codeStr) {
      let jsCode;
      try { jsCode = compileMiniPython(codeStr).code; }
      catch (error) { return { success: false, error: error.message }; }
      const frame = document.createElement('iframe');
      frame.sandbox = 'allow-scripts';
      const id = crypto.randomUUID();
      const program = sandboxRuntime.replace('__REQUEST_ID__', () => JSON.stringify(id)).replace('/* USER_CODE */', () => jsCode);
      frame.srcdoc = `<!doctype html><meta charset="utf-8"><script>${program.replace(/<\/script/gi, '<\\/script')}<\/script>`;
      frame.title = 'Изолированная среда Python';
      frame.hidden = true;
      return await new Promise(resolve => {
        const done = result => { clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); resolve(result); };
        const receive = event => { if (event.source === frame.contentWindow && event.data?.id === id) done(event.data.result); };
        let timer = setTimeout(() => done({success:false,error:'Не удалось загрузить среду запуска. Проверь соединение и попробуй ещё раз.'}), 15000);
        window.addEventListener('message', receive);
        document.body.append(frame);
      });
    },

    async runUserCode() {
      const runId = ++this.codeRunId;
      const revision = this.taskRevision;
      AudioKit.play('tap');
      this.userOutput = '';
      const code = document.getElementById('user-code-input').value;
      const consoleOut = document.getElementById('live-console-output');
      const statusText = document.getElementById('console-status-text');

      const res = await this.executeMiniPython(code);
      if (runId !== this.codeRunId || revision !== this.taskRevision || code !== document.getElementById('user-code-input').value) return { success: false, stale: true };

      if (res.success) {
        if (res.output.trim().length > 0) {
          this.userOutput = res.output.trim();
          consoleOut.innerText = '>>> ' + this.userOutput;
          statusText.innerText = 'OK';
          statusText.style.color = '#4ade80';
        } else {
          this.userOutput = '';
          consoleOut.innerText = '>>> [Программа завершилась без вывода]';
          statusText.innerText = 'Нет вывода';
          statusText.style.color = '#f59e0b';
        }
      } else {
        consoleOut.innerText = '>>> Ошибка: ' + res.error;
        statusText.innerText = 'Ошибка';
        statusText.style.color = '#ef4444';
      }

      this.setEvaluationReady(code.trim().length > 2, false);
      return res;
    },

    renderReorder() {
      const box = document.getElementById('reorder-items-stack');
      box.innerHTML = '';

      this.reorderBlocks.forEach((text, idx) => {
        const row = document.createElement('div');
        row.className = 'reorder-row';
        if (this.selectedSwapIndex === idx) row.classList.add('selected-swap');

        const isFirst = (idx === 0);
        const isLast = (idx === this.reorderBlocks.length - 1);

        row.innerHTML = `
          <div class="line-number-badge">${idx + 1}</div>
          <span class="block-text-label">${text}</span>
          <div class="arrows-group">
            <button class="move-btn" aria-label="Поднять строку ${idx + 1}" ${isFirst ? 'disabled' : ''} onclick="event.stopPropagation(); app.moveBlock(${idx}, -1)">▲</button>
            <button class="move-btn" aria-label="Опустить строку ${idx + 1}" ${isLast ? 'disabled' : ''} onclick="event.stopPropagation(); app.moveBlock(${idx}, 1)">▼</button>
          </div>
        `;

        row.onclick = () => {
          AudioKit.play('tap');
          if (app.selectedSwapIndex === null) {
            app.selectedSwapIndex = idx;
            app.renderReorder();
          } else if (app.selectedSwapIndex === idx) {
            app.selectedSwapIndex = null;
            app.renderReorder();
          } else {
            const temp = app.reorderBlocks[app.selectedSwapIndex];
            app.reorderBlocks[app.selectedSwapIndex] = app.reorderBlocks[idx];
            app.reorderBlocks[idx] = temp;
            app.selectedSwapIndex = null;
            app.renderReorder();
            app.setEvaluationReady(true);
          }
        };

        box.appendChild(row);
      });
      this.prepareTaskControls();
    },

    moveBlock(index, direction) {
      AudioKit.play('tap');
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= this.reorderBlocks.length) return;

      const temp = this.reorderBlocks[index];
      this.reorderBlocks[index] = this.reorderBlocks[targetIndex];
      this.reorderBlocks[targetIndex] = temp;

      this.selectedSwapIndex = null;
      this.renderReorder();
      this.setEvaluationReady(true);
    },

    handleDrawerAction() {
      if (this.evaluationPending) return;
      if (this.hintOpen) {
        AudioKit.play('tap');
        this.hintOpen = false;
        const drawer = document.getElementById('eval-drawer');
        drawer.className = 'evaluation-drawer';
        drawer.style.display = 'block';
        document.getElementById('eval-main-btn').innerText = 'ПРОВЕРИТЬ';
        this.setEvaluationReady(this.evaluationReady);
        return;
      }
      if (this.evaluationFailed) {
        AudioKit.play('tap');
        this.evaluationFailed = false;
        const drawer = document.getElementById('eval-drawer');
        drawer.className = 'evaluation-drawer';
        drawer.style.display = 'block';
        document.getElementById('eval-main-btn').innerText = 'ПРОВЕРИТЬ';
        this.setEvaluationReady(this.evaluationReady);
        return;
      }
      if (!this.isChecked) {
        this.evaluateCurrentTask();
      } else {
        if (this.currentTaskIndex < 3) {
          AudioKit.play('tap');
          this.currentTaskIndex++;
          this.renderCurrentTask();
        } else {
          this.finishLessonComplete();
        }
      }
    },

    async evaluateCurrentTask() {
      if (this.evaluationPending || this.isChecked) return;
      const lesson = ALL_LESSONS[this.currLessonId - 1];
      const task = lesson?.tasks[this.currentTaskIndex - 1];
      if (!task) return;
      const revision = this.taskRevision;
      this.evaluationPending = true;
      document.getElementById('eval-main-btn').disabled = true;
      try {
      let ok = false;

      if (task.f === 'choice') {
        if (this.selectedChoice === null) return;
        ok = task.opts[this.selectedChoice].ok;
      }
      else if (task.f === 'sim') {
        if (!this.selectedSimVal) return;
        ok = this.selectedSimVal === task.correctVal;
      }
      else if (task.f === 'bug') {
        if (this.selectedBugLineIndex === null) return;
        ok = task.lines[this.selectedBugLineIndex].err;
      }
      else if (task.f === 'reorder') {
        ok = this.reorderBlocks.every((b, i) => b === task.blks[i]);
      }
      else if (task.f === 'fill') {
        if (!this.selectedToken) return;
        ok = this.selectedToken === task.ans;
      }
      else if (task.f === 'write') {
        const userCode = document.getElementById('user-code-input').value;
        const execRes = await this.runUserCode();
        const check = task.targetCheck;
        let syntax = '';
        try { syntax = compileMiniPython(userCode).syntax; } catch {}
        const hasAllKeywords = check.contains.every(word => word === '*' ? syntax.includes('*') : new RegExp(`\\b${word}\\b`).test(syntax));
        
        const cleanUserOutput = String(execRes.output || '').replace(/\r\n/g, '\n').trim();
        const cleanExpected = String(check.expectedOutput).replace(/\r\n/g, '\n').trim();
        const outputMatches = cleanUserOutput === cleanExpected;
        
        ok = hasAllKeywords && execRes.success && outputMatches;
      }

      const drawer = document.getElementById('eval-drawer');
      if (revision !== this.taskRevision) return;
      const icon = document.getElementById('eval-icon');
      const title = document.getElementById('eval-title');
      const sub = document.getElementById('eval-sub');
      const btn = document.getElementById('eval-main-btn');

      if (ok) {
        AudioKit.play('ok');
        drawer.className = 'evaluation-drawer state-success';
        icon.innerText = '✓';
        title.innerText = (this.currentTaskIndex === 3) ? 'Урок полностью завершен!' : 'Верно!';
        sub.innerText = (this.currentTaskIndex === 3) ? 'Все 3 практических задания выполнены успешно.' : 'Переходим к следующему заданию!';
        btn.className = 'duo-btn btn-green';
        btn.innerText = (this.currentTaskIndex === 3) ? 'ЗАВЕРШИТЬ УРОК →' : `СЛЕДУЮЩЕЕ ЗАДАНИЕ (${this.currentTaskIndex + 1}/3) →`;
        this.isChecked = true;
        this.evaluationFailed = false;
        if (!this.demoMode && !this.completedIds.has(this.currLessonId)) {
          this.lessonProgressMap[this.currLessonId] = Math.min(this.currentTaskIndex, lesson.tasks.length - 1);
          this.save();
        }
      } else {
        AudioKit.play('err');
        drawer.className = 'evaluation-drawer state-error';
        icon.innerText = '✕'; title.innerText = task.f === 'write' ? 'Код нужно поправить' : 'Ответ пока не подходит'; sub.innerText = task.hint;
        btn.className = 'duo-btn btn-orange'; btn.innerText = 'ПОПРОБОВАТЬ СНОВА';
        this.isChecked = false;
        this.evaluationFailed = true;
        
        const heartEl = document.getElementById('heart-svg-el');
        heartEl.classList.remove('heart-hurt');
        void heartEl.offsetWidth;
        heartEl.classList.add('heart-hurt');

        if (!this.demoMode && this.hearts > 1) { this.hearts--; this.save(); this.updateStats(); }
      }
      } finally {
        this.evaluationPending = false;
        document.getElementById('eval-main-btn').disabled = !(this.isChecked || this.evaluationFailed || this.evaluationReady);
      }
    },

    finishLessonComplete() {
      AudioKit.play('victory');
      document.getElementById('lesson-progress-fill').style.width = '100%';

      const isFirstTime = !this.demoMode && !this.completedIds.has(this.currLessonId);
      if (isFirstTime) {
        this.xp += 50;
        this.gems += 5;
        this.completedIds.add(this.currLessonId);
      }

      if (!this.demoMode) {
        const today = localDay();
        const previousDay = new Date();
        previousDay.setDate(previousDay.getDate() - 1);
        const yesterday = localDay(previousDay);
        const lastActive = storage.getItem('algospark_cycles_v3_streak_day');
        if (lastActive !== today) {
          this.streak = lastActive === yesterday ? this.streak + 1 : 1;
          storage.setItem('algospark_cycles_v3_streak_day', today);
        }
        this.save(); this.updateStats();
      }

      setTimeout(() => {
        AudioKit.play('flame');
        this.triggerFlameAnimation();
      }, 450);

      const moduleDone = !this.demoMode && ALL_LESSONS.every(lesson => this.completedIds.has(lesson.id));
      const firstMilestone = !this.demoMode && this.currLessonId === 3 && [1, 2, 3].every(id => this.completedIds.has(id));
      document.getElementById('finish-streak-val').innerText = this.demoMode ? 'ДЕМО' : `${this.streak} дн.`;
      document.getElementById('finish-xp-val').innerText = moduleDone ? String(this.xp) : isFirstTime ? '+50' : '+0';
      document.getElementById('finish-gems-val').innerText = moduleDone ? String(this.gems) : isFirstTime ? '+5' : '+0';
      const moduleSummary = document.getElementById('finish-module-summary');
      moduleSummary.hidden = !(moduleDone || firstMilestone);
      if (moduleDone) {
        document.getElementById('finish-module-count').textContent = `${ALL_LESSONS.length} из ${ALL_LESSONS.length} уроков`;
        document.getElementById('finish-module-xp').textContent = `Модуль завершён · ${this.xp} XP набрано. Значок можно открыть на карте.`;
      } else if (firstMilestone) {
        document.getElementById('finish-module-count').textContent = `3 из ${ALL_LESSONS.length} уроков`;
        document.getElementById('finish-module-xp').textContent = `Первые три урока пройдены · ${this.xp} XP набрано. Продолжай с урока 4.`;
      }
      document.getElementById('finish-title').textContent = this.demoMode ? 'Демо-урок завершён!' : moduleDone ? 'Модуль пройден!' : firstMilestone ? 'Первые три урока пройдены!' : 'Урок пройден!';
      document.getElementById('finish-description').textContent = this.demoMode
        ? 'В демо-режиме награды и прогресс не меняются.'
        : moduleDone ? 'Все 12 уроков завершены. Ты умеешь строить цикл for и собрал алгоритм маршрута.' : firstMilestone ? 'Ты освоил первые повторы и границы range(). Награда за урок получена — впереди ещё девять уроков по циклам.' : 'Теория и три практических задания решены. Следующий урок откроет новый шаг.';
      document.getElementById('finish-next-button').textContent = this.demoMode ? 'ВЕРНУТЬСЯ К КАРТЕ' : moduleDone ? 'К КАРТЕ МОДУЛЯ' : `К УРОКУ ${this.currLessonId + 1}`;

      this.hideDrawer();
      this.renderMap();
      const medal = document.querySelector('.finish-medal');
      if (medal) { medal.style.animation = 'none'; void medal.offsetWidth; medal.style.animation = ''; }
      this.showScreen('screen-finish');
    },

    returnToMap() {
      this.taskRevision++;
      this.codeRunId++;
      AudioKit.play('tap');
      this.hideDrawer();
      this.renderMap();
      this.showScreen('screen-map');
    },

    continueAfterFinish() {
      const moduleDone = !this.demoMode && ALL_LESSONS.every(lesson => this.completedIds.has(lesson.id));
      if (!this.demoMode && !moduleDone && this.currLessonId < ALL_LESSONS.length) {
        this.startLesson(this.currLessonId + 1);
        return;
      }
      this.returnToMap();
    },

    exitLesson() {
      this.showConfirm({
        title: 'Выйти в карту уроков?',
        desc: 'Решённые задания сохранятся. Текущий ответ нужно будет ввести заново. Вернуться к карте?',
        okText: 'ВЫЙТИ',
        cancelText: 'ОСТАТЬСЯ',
        iconHtml: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--duo-orange)" stroke-width="2.4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
        onOk: () => {
          this.hideDrawer();
          this.returnToMap();
        }
      });
    },

    renderSectionsModal() {
      const c = document.getElementById('sections-list-container'); c.innerHTML = '';
      SECTIONS.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `section-option${this.currentSectionId === s.id ? ' is-selected' : ''}`;
        btn.setAttribute('aria-pressed', String(this.currentSectionId === s.id));
        const sectionLessons = ALL_LESSONS.filter(item => item.id >= s.start && item.id <= s.end);
        const completed = sectionLessons.filter(item => this.completedIds.has(item.id)).length;
        btn.innerHTML = `<span class="section-option-copy"><b>${s.title}</b><small>${completed} из ${sectionLessons.length} уроков</small></span><span class="section-option-range">${s.range}</span>`;
        btn.onclick = () => {
          app.currentSectionId = s.id;
          document.getElementById('current-section-title').innerText = s.title;
          document.querySelectorAll('.course-section-divider').forEach(node => node.classList.toggle('is-current', node.id === `course-section-${s.id}`));
          app.renderSectionsModal();
          app.closeModal('modal-sections');
          const targetNode = document.getElementById(s.id === 1 ? `node-lesson-${s.start}` : `course-section-${s.id}`);
          if (targetNode) targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        c.appendChild(btn);
      });
    },

    openSectionPicker() { AudioKit.play('tap'); this.renderSectionsModal(); document.getElementById('modal-sections').classList.add('active'); },
    openMenuModal() { AudioKit.play('tap'); document.getElementById('modal-menu').classList.add('active'); },
    openAiDrawer() { AudioKit.play('tap'); document.getElementById('modal-ai').classList.add('active'); },
    closeModal(id) { AudioKit.play('tap'); document.getElementById(id).classList.remove('active'); },

    toggleJuryDemo() {
      AudioKit.play('tap');
      this.demoMode = !this.demoMode;
      this.returnToMap();
      this.closeModal('modal-menu');
      this.showToast(this.demoMode ? 'Демо-режим: уроки открыты, прогресс не меняется.' : 'Обычный режим: путь продолжается с вашего прогресса.');
    },

    resetProgress() {
      this.showConfirm({
        title: 'Сбросить прогресс?',
        desc: 'Сбросятся уроки, очки, награды, история чата и режим демо. После сброса снова откроется приветствие.',
        okText: 'СБРОСИТЬ',
        cancelText: 'ОТМЕНА',
        onOk: () => {
          this.completedIds.clear(); this.claimedChests.clear(); this.lessonProgressMap = {};
          this.taskRevision++;
          this.codeRunId++;
          this.xp = 0; this.gems = 50; this.hearts = 5; this.streak = 0;
          this.currLessonId = 1; this.currentSectionId = 1; this.currentTaskIndex = 0;
          this.demoMode = false; this.isChecked = false; this.userOutput = '';
          this.evaluationFailed = false;
          AudioKit.muted = false;
          document.getElementById('sound-icon').style.opacity = '1';
          document.getElementById('current-section-title').textContent = SECTIONS[0].title;
          this.selectedChoice = null; this.selectedToken = null; this.selectedBugLineIndex = null;
          this.selectedSimVal = null; this.reorderBlocks = []; this.selectedSwapIndex = null;
          this.hideDrawer();
          storage.removeItem('algospark_cycles_v3_streak_day');
          storage.removeItem('algospark_cycles_v3_intro_seen');
          clearTutorHistory();
          const chatBox = document.getElementById('ai-chat-box');
          if (chatBox) {
            chatBox.innerHTML = '';
            const greeting = document.createElement('div');
            greeting.className = 'ai-message ai-message-assistant';
            greeting.textContent = 'Привет! Я Спарк, твой наставник по коду. Подскажу следующий шаг, чтобы ты сам нашёл решение.';
            chatBox.appendChild(greeting);
          }
          document.getElementById('ai-input').value = '';
          this.save(); this.updateStats(); this.renderMap();
          this.closeModal('modal-menu');
          this.showScreen('screen-map');
          this.openWelcome();
        }
      });
    },

    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(id);
      if (target) target.classList.add('active');

      if (id !== 'screen-lesson' || this.currentTaskIndex === 0) {
        this.hideDrawer();
      }
    },

    async sendAi() {
      if (this.aiPending) return;
      const inp = document.getElementById('ai-input'), val = inp.value.trim();
      if (!val) return;
      this.aiPending = true;
      inp.value = '';
      const box = document.getElementById('ai-chat-box');
      const userBubble = document.createElement('div');
      userBubble.className = 'ai-message ai-message-user';
      userBubble.textContent = val;
      userBubble.setAttribute('aria-label', `Вы: ${val}`);
      box.appendChild(userBubble);
      const loading = document.createElement('div');
      loading.className = 'ai-message ai-message-assistant ai-message-loading';
      loading.textContent = 'Спарк разбирает вопрос…';
      loading.setAttribute('role', 'status');
      box.appendChild(loading);
      box.scrollTop = box.scrollHeight;
      const sendButton = document.querySelector('#modal-ai .ai-send-button');
      if (sendButton) sendButton.disabled = true;
      try {
        const lesson = ALL_LESSONS[this.currLessonId - 1];
        const task = lesson?.tasks[this.currentTaskIndex - 1];
        let attempt = '';
        if (task?.f === 'choice' && this.selectedChoice !== null) attempt = task.opts[this.selectedChoice]?.t || '';
        else if (task?.f === 'sim') attempt = this.selectedSimVal ? `Выбран вариант ${this.selectedSimVal}` : '';
        else if (task?.f === 'bug' && this.selectedBugLineIndex !== null) attempt = task.lines[this.selectedBugLineIndex]?.t || '';
        else if (task?.f === 'reorder') attempt = this.reorderBlocks.join('\n');
        else if (task?.f === 'fill') attempt = this.selectedToken || '';
        else if (task?.f === 'write') attempt = document.getElementById('user-code-input')?.value || '';
        const reply = await askTutor({
          message: val,
          lessonId: this.currLessonId,
          lessonTitle: lesson?.title,
          taskIndex: this.currentTaskIndex,
          taskCount: lesson?.tasks.length,
          lessonCount: ALL_LESSONS.length,
          completedLessons: this.completedIds.size,
          concept: lesson?.theoryRule,
          taskQuestion: task?.q || '',
          attempt
        });
        loading.classList.remove('ai-message-loading');
        loading.textContent = reply;
        loading.setAttribute('aria-label', `Спарк: ${reply}`);
        AudioKit.play('tap');
      } catch (error) {
        loading.classList.remove('ai-message-loading');
        loading.classList.add('ai-message-error');
        loading.textContent = error.message || 'Не удалось связаться с наставником.';
        loading.setAttribute('aria-label', `Ошибка: ${loading.textContent}`);
      } finally {
        this.aiPending = false;
        if (sendButton) sendButton.disabled = false;
        box.scrollTop = box.scrollHeight;
      }
    }
  };
export { app };
