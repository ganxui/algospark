const AudioKit = {
    ctx: null, muted: false, activeClick: null,
    init() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(t) {
      if (this.muted) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.activeClick) this.activeClick.__algoSparkSoundPlayed = true;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        if (t === 'tap') {
          const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
          osc.connect(g); g.connect(this.ctx.destination);
          osc.frequency.setValueAtTime(440, now);
          g.gain.setValueAtTime(0.02, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.start(now); osc.stop(now + 0.04);
        }
        else if (t === 'ok') {
          // Мягкий перезвон калимбы/маримбы без пищания
          const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
          osc.type = 'sine';
          osc.connect(g); g.connect(this.ctx.destination);
          osc.frequency.setValueAtTime(392, now);
          osc.frequency.setValueAtTime(523.25, now + 0.08);
          g.gain.setValueAtTime(0.025, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now); osc.stop(now + 0.24);
        }
        else if (t === 'err') {
          const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.connect(g); g.connect(this.ctx.destination);
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(150, now + 0.09);
          g.gain.setValueAtTime(0.035, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
        }
        else if (t === 'victory') {
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + idx * 0.09);
            g.gain.setValueAtTime(0.035, now + idx * 0.09);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(now + idx * 0.09); o.stop(now + idx * 0.09 + 0.4);
          });
        }
        else if (t === 'flame') {
          const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(550, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(280, now + 0.3);
          g.gain.setValueAtTime(0.01, now);
          g.gain.linearRampToValueAtTime(0.035, now + 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(g); g.connect(this.ctx.destination);
          osc.start(now); osc.stop(now + 0.35);
        }
        else if (t === 'chest_soft') {
          [784, 988, 1174].forEach((freq, i) => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0.025, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.45);
          });
        }
      } catch(e){}
    }
  };

  /* 3. БАЗА ЮНИТОВ */
export { AudioKit };
