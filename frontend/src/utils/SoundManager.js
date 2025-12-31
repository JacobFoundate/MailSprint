/**
 * SoundManager - Procedural audio generation using Web Audio API
 * All sounds are synthesized - no external audio files needed!
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.musicNodes = [];
    this.musicInterval = null;
    
    // Initialize on first user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);
      
      // Separate gains for music and SFX
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
      
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // ============ SOUND EFFECTS ============

  /**
   * Mail throw - whoosh sound
   */
  playThrow() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // White noise burst for whoosh
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Filtered noise that fades out
      const envelope = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * envelope * envelope;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // Bandpass filter for whoosh character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
    filter.Q.value = 1;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Mailbox delivery - pleasant chime/ding
   */
  playDelivery() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Two-tone chime (major third interval)
    const frequencies = [880, 1108.73]; // A5 and C#6
    
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.audioContext.createGain();
      const startTime = now + (i * 0.08);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
    
    // Add a subtle shimmer
    const shimmer = this.audioContext.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 2217.46; // C#7
    
    const shimmerGain = this.audioContext.createGain();
    shimmerGain.gain.setValueAtTime(0, now + 0.1);
    shimmerGain.gain.linearRampToValueAtTime(0.1, now + 0.15);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);
    
    shimmer.start(now + 0.1);
    shimmer.stop(now + 0.5);
  }

  /**
   * Obstacle hit - thud sound
   */
  playThud() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Low frequency thump
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Add some distortion for impact
    const distortion = this.audioContext.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(50);
    
    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.3);
    
    // Add a noise burst for impact texture
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 500;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    noiseSource.start(now);
  }

  /**
   * Dog bark sound
   */
  playBark() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Create two short bark sounds
    for (let bark = 0; bark < 2; bark++) {
      const startTime = now + (bark * 0.15);
      
      // Main bark tone with frequency modulation
      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, startTime);
      osc.frequency.exponentialRampToValueAtTime(250, startTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(180, startTime + 0.1);
      
      // Formant filter for "vocal" quality
      const formant = this.audioContext.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(800, startTime);
      formant.frequency.exponentialRampToValueAtTime(400, startTime + 0.1);
      formant.Q.value = 5;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
      gain.gain.setValueAtTime(0.5, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
      
      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.12);
      
      // Add noise component for roughness
      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 600;
      noiseFilter.Q.value = 2;
      
      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(0, startTime);
      noiseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      
      noise.start(startTime);
      noise.stop(startTime + 0.1);
    }
  }

  /**
   * Baby cry sound
   */
  playBabyCry() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Create wavering cry sound
    for (let cry = 0; cry < 3; cry++) {
      const startTime = now + (cry * 0.2);
      
      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      // Wavering frequency for cry effect
      osc.frequency.setValueAtTime(600, startTime);
      osc.frequency.exponentialRampToValueAtTime(800, startTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(500, startTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(700, startTime + 0.15);
      
      const formant = this.audioContext.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = 1200;
      formant.Q.value = 3;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.setValueAtTime(0.25, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);
      
      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }

  /**
   * Car horn sound
   */
  playCarHorn() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Two-tone horn
    const frequencies = [350, 440];
    
    frequencies.forEach(freq => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.setValueAtTime(0.15, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  /**
   * Heal/pickup sound - pleasant ascending chime
   */
  playHeal() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.08);
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Jump sound - quick upward sweep
   */
  playJump() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // ============ BACKGROUND MUSIC ============

  /**
   * Play cheerful looping background music
   */
  startMusic() {
    if (!this.initialized || this.isMusicPlaying) return;
    this.resume();
    
    this.isMusicPlaying = true;
    
    // Musical notes (C major pentatonic scale)
    const notes = {
      C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
      C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
    };
    
    // Cheerful melody pattern (simplified game music)
    const melody = [
      { note: 'C5', duration: 0.2 },
      { note: 'E5', duration: 0.2 },
      { note: 'G5', duration: 0.2 },
      { note: 'E5', duration: 0.2 },
      { note: 'C5', duration: 0.4 },
      { note: 'D5', duration: 0.2 },
      { note: 'E5', duration: 0.2 },
      { note: 'C5', duration: 0.4 },
      { note: 'A4', duration: 0.2 },
      { note: 'C5', duration: 0.2 },
      { note: 'E5', duration: 0.4 },
      { note: 'D5', duration: 0.4 },
      { note: 'C5', duration: 0.2 },
      { note: 'G4', duration: 0.2 },
      { note: 'A4', duration: 0.2 },
      { note: 'C5', duration: 0.2 },
    ];
    
    // Bass line
    const bass = [
      { note: 'C4', duration: 0.8 },
      { note: 'G4', duration: 0.8 },
      { note: 'A4', duration: 0.8 },
      { note: 'G4', duration: 0.8 },
    ];
    
    let melodyIndex = 0;
    let bassIndex = 0;
    let melodyTime = 0;
    let bassTime = 0;
    const beatDuration = 0.15; // Tempo
    
    const playLoop = () => {
      if (!this.isMusicPlaying || !this.initialized) return;
      
      const now = this.audioContext.currentTime;
      
      // Play melody note
      if (melodyTime <= 0) {
        const melodyNote = melody[melodyIndex];
        this.playMusicNote(notes[melodyNote.note], melodyNote.duration * beatDuration * 4, 'sine', 0.15);
        melodyTime = melodyNote.duration;
        melodyIndex = (melodyIndex + 1) % melody.length;
      }
      melodyTime -= beatDuration;
      
      // Play bass note
      if (bassTime <= 0) {
        const bassNote = bass[bassIndex];
        this.playMusicNote(notes[bassNote.note] / 2, bassNote.duration * beatDuration * 4, 'triangle', 0.12);
        bassTime = bassNote.duration;
        bassIndex = (bassIndex + 1) % bass.length;
      }
      bassTime -= beatDuration;
    };
    
    // Start the loop
    playLoop();
    this.musicInterval = setInterval(playLoop, beatDuration * 1000);
  }

  playMusicNote(frequency, duration, type = 'sine', volume = 0.15) {
    if (!this.initialized) return;
    
    const now = this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.setValueAtTime(volume, now + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(now);
    osc.stop(now + duration);
    
    this.musicNodes.push({ osc, gain });
  }

  stopMusic() {
    this.isMusicPlaying = false;
    
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    
    // Clean up any remaining nodes
    this.musicNodes.forEach(node => {
      try {
        node.osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.musicNodes = [];
  }

  // ============ UTILITY ============

  makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.5;
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setSfxVolume(volume) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

// Singleton instance
const soundManager = new SoundManager();

export default soundManager;
