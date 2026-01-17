export class AudioManager {
  static sounds = {};
  static themeMusic = null;
  static themeMusic2 = null;
  static currentTheme = 1;
  static musicPlaying = false;
  static volumes = {
    master: 1.0,
    music: 0.5,
    effects: 0.3
  };
  
  static init() {
    try {
      // Create audio elements with correct file names
      const basePath = process.env.PUBLIC_URL || '';
      this.sounds.heroShot = new Audio(basePath + '/sounds/hero_shot.wav');
      this.sounds.helicopterShot = new Audio(basePath + '/sounds/helicopter_shot.wav');
      this.sounds.enemyShoot = new Audio(basePath + '/sounds/shot_sound.mp3');
      this.sounds.helicopterAlarm = new Audio(basePath + '/sounds/helicopter_alarm.wav');
      this.sounds.bossAlarm = new Audio(basePath + '/sounds/boss_alarm.wav');
      this.sounds.deadSong = new Audio(basePath + '/sounds/dead_song.wav');
      this.sounds.explosionHeli = new Audio(basePath + '/sounds/explosion_heli.mp3');
      this.sounds.grenadeSfx = new Audio(basePath + '/sounds/grenade_sfx.mp3');
      this.sounds.theme = new Audio(basePath + '/sounds/theme_music.mp3');
      this.sounds.theme2 = new Audio(basePath + '/sounds/them_song2.mp3');
      
      // Set initial volume levels
      this.updateVolumes();
      
      // Setup theme music looping between two tracks
      this.sounds.theme.addEventListener('ended', () => {
        this.currentTheme = 2;
        if (this.sounds.theme2 && this.musicPlaying) {
          this.sounds.theme2.currentTime = 0;
          this.sounds.theme2.play().catch(() => {});
        }
      });
      
      this.sounds.theme2.addEventListener('ended', () => {
        this.currentTheme = 1;
        if (this.sounds.theme && this.musicPlaying) {
          this.sounds.theme.currentTime = 0;
          this.sounds.theme.play().catch(() => {});
        }
      });
      
      // Handle errors gracefully
      this.sounds.heroShot.onerror = () => console.log('Hero shot sound not found');
      this.sounds.helicopterShot.onerror = () => console.log('Helicopter shot sound not found');
      this.sounds.enemyShoot.onerror = () => console.log('Enemy shoot sound not found');
      this.sounds.helicopterAlarm.onerror = () => console.log('Helicopter alarm not found');
      this.sounds.bossAlarm.onerror = () => console.log('Boss alarm not found');
      this.sounds.deadSong.onerror = () => console.log('Dead song not found');
      this.sounds.explosionHeli.onerror = () => console.log('Helicopter explosion not found');
      this.sounds.grenadeSfx.onerror = () => console.log('Grenade sound not found');
      this.sounds.theme.onerror = () => console.log('Theme music not found');
      this.sounds.theme2.onerror = () => console.log('Theme music 2 not found');
      
      // Preload
      this.sounds.heroShot.load();
      this.sounds.helicopterShot.load();
      this.sounds.enemyShoot.load();
      this.sounds.helicopterAlarm.load();
      this.sounds.bossAlarm.load();
      this.sounds.deadSong.load();
      this.sounds.explosionHeli.load();
      this.sounds.grenadeSfx.load();
      this.sounds.theme.load();
      this.sounds.theme2.load();
    } catch (e) {
      console.log('Audio initialization failed:', e);
    }
  }
  
  static updateVolumes() {
    if (this.sounds.heroShot) {
      this.sounds.heroShot.volume = this.volumes.master * this.volumes.effects;
    }
    if (this.sounds.helicopterShot) {
      this.sounds.helicopterShot.volume = this.volumes.master * this.volumes.effects;
    }
    if (this.sounds.enemyShoot) {
      this.sounds.enemyShoot.volume = this.volumes.master * this.volumes.effects;
    }
    if (this.sounds.helicopterAlarm) {
      this.sounds.helicopterAlarm.volume = this.volumes.master * this.volumes.music;
    }
    if (this.sounds.bossAlarm) {
      this.sounds.bossAlarm.volume = this.volumes.master * this.volumes.music;
    }
    if (this.sounds.deadSong) {
      this.sounds.deadSong.volume = this.volumes.master * this.volumes.music;
    }
    if (this.sounds.explosionHeli) {
      this.sounds.explosionHeli.volume = this.volumes.master * this.volumes.effects;
    }
    if (this.sounds.grenadeSfx) {
      this.sounds.grenadeSfx.volume = this.volumes.master * this.volumes.effects;
    }
    if (this.sounds.theme) {
      this.sounds.theme.volume = this.volumes.master * this.volumes.music;
    }
    if (this.sounds.theme2) {
      this.sounds.theme2.volume = this.volumes.master * this.volumes.music;
    }
  }
  
  static setMasterVolume(volume) {
    this.volumes.master = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  static setMusicVolume(volume) {
    this.volumes.music = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  static setEffectsVolume(volume) {
    this.volumes.effects = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  static getMasterVolume() {
    return this.volumes.master;
  }
  
  static getMusicVolume() {
    return this.volumes.music;
  }
  
  static getEffectsVolume() {
    return this.volumes.effects;
  }
  
  static playHeroShot() {
    if (this.sounds.heroShot) {
      try {
        // Clone audio to allow overlapping sounds
        const sound = this.sounds.heroShot.cloneNode();
        sound.volume = this.volumes.master * this.volumes.effects;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playHelicopterShot() {
    if (this.sounds.helicopterShot) {
      try {
        // Clone audio to allow overlapping sounds
        const sound = this.sounds.helicopterShot.cloneNode();
        sound.volume = this.volumes.master * this.volumes.effects;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playEnemyShoot() {
    if (this.sounds.enemyShoot) {
      try {
        // Clone audio to allow overlapping sounds
        const sound = this.sounds.enemyShoot.cloneNode();
        sound.volume = this.volumes.master * this.volumes.effects;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playHelicopterAlarm() {
    if (this.sounds.helicopterAlarm) {
      try {
        this.sounds.helicopterAlarm.currentTime = 0;
        this.sounds.helicopterAlarm.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playBossAlarm() {
    if (this.sounds.bossAlarm) {
      try {
        this.sounds.bossAlarm.currentTime = 0;
        this.sounds.bossAlarm.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playDeadSong() {
    if (this.sounds.deadSong) {
      try {
        // Stop theme music when hero dies
        this.stopTheme();
        this.sounds.deadSong.currentTime = 0;
        this.sounds.deadSong.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playExplosionHeli() {
    if (this.sounds.explosionHeli) {
      try {
        const sound = this.sounds.explosionHeli.cloneNode();
        sound.volume = this.volumes.master * this.volumes.effects;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playGrenadeSfx() {
    if (this.sounds.grenadeSfx) {
      try {
        const sound = this.sounds.grenadeSfx.cloneNode();
        sound.volume = this.volumes.master * this.volumes.effects;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (e) {}
    }
  }
  
  static playTheme() {
    if (this.sounds.theme && this.sounds.theme2) {
      try {
        if (!this.musicPlaying) {
          this.currentTheme = 1;
          this.sounds.theme.play().then(() => {
            this.musicPlaying = true;
          }).catch(() => {
            console.log('Theme music requires user interaction to play');
          });
        } else if (this.currentTheme === 1 && this.sounds.theme.paused) {
          this.sounds.theme.play();
        } else if (this.currentTheme === 2 && this.sounds.theme2.paused) {
          this.sounds.theme2.play();
        }
      } catch (e) {}
    }
  }
  
  static enableAudio() {
    // Try to enable audio after user interaction
    if (this.sounds.theme) {
      this.sounds.theme.play().then(() => {
        this.musicPlaying = true;
        this.currentTheme = 1;
      }).catch((e) => {
        console.log('Audio enable failed:', e);
      });
    }
    // Also enable sound effects
    if (this.sounds.heroShot) {
      this.sounds.heroShot.play().then(() => {
        this.sounds.heroShot.pause();
        this.sounds.heroShot.currentTime = 0;
      }).catch(() => {});
    }
  }
  
  static stopTheme() {
    if (this.sounds.theme && this.musicPlaying) {
      this.sounds.theme.pause();
      this.sounds.theme.currentTime = 0;
    }
    if (this.sounds.theme2 && this.musicPlaying) {
      this.sounds.theme2.pause();
      this.sounds.theme2.currentTime = 0;
    }
    this.musicPlaying = false;
  }
}
