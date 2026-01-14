/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute() {
    this.muted = !this.muted;
  }

  public playAttack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playBlock() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // New Ultimate Sound
  public playUltimate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    
    // Low boom
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, t);
    osc1.frequency.exponentialRampToValueAtTime(10, t + 1.0);
    gain1.gain.setValueAtTime(0.5, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    osc1.start(t);
    osc1.stop(t + 1.0);

    // High shimmer
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, t);
    osc2.frequency.linearRampToValueAtTime(1200, t + 0.5);
    gain2.gain.setValueAtTime(0.1, t);
    gain2.gain.linearRampToValueAtTime(0, t + 0.5);
    osc2.start(t);
    osc2.stop(t + 0.5);
  }

  public playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    
    notes.forEach((freq, i) => {
        const t = now + i * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.5);
    });
  }

  public playLose() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const notes = [392.00, 369.99, 349.23, 311.13]; // Descending
    
    notes.forEach((freq, i) => {
        const t = now + i * 0.3;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.6);
    });
  }
}

export const audio = new AudioService();