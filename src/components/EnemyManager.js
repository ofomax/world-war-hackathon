import { GruntSoldier, CoverSoldier, Grenadier, HeavySoldier, AttackHelicopter, HeavyGunner } from './Enemies';
import { AudioManager } from './AudioManager';

export class EnemyManager {
  constructor(canvasWidth, canvasHeight, stage) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.stage = stage;
    this.enemies = [];
    this.bullets = [];
    this.enemiesKilled = 0;
    this.stageComplete = false;
    
    // ===== STAGE STRUCTURE =====
    this.stageTimer = 0;
    this.stagePhase = 'warmup'; // warmup, pressure, helicopter, boss, recovery
    this.phaseTimer = 0;
    
    // ===== SPAWN BUDGET SYSTEM =====
    this.spawnBudget = 5; // Start with some budget
    this.maxBudget = 12; // Increased max budget for more enemies
    this.budgetRefillRate = 0.6; // Points per second (faster refill)
    this.enemyCosts = {
      grunt: 1,
      cover: 2,
      grenadier: 3
    };
    
    // ===== ADAPTIVE DIFFICULTY =====
    this.lastHitTime = 0;
    this.killSpeed = 0; // Enemies killed per second
    this.killHistory = [];
    this.adaptiveMultiplier = 1.0;
    
    // ===== BOSS TRACKING =====
    this.bossKillCount = 0;
    this.currentBossCycle = 0; // 0, 1, 2 (resets after 3)
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossSpawnCooldown = 0; // Cooldown between boss spawns (in frames)
    this.minBossCooldown = 600; // 10 seconds at 60fps - minimum time between bosses
    
    // ===== HELICOPTER TRACKING =====
    this.helicopterDefeatCount = 0;
    this.helicopterSpawned = false;
    this.helicopterDefeated = false;
    
    // ===== REWARDS & DROPS =====
    this.itemDropped = false;
    this.itemX = 0;
    this.itemY = 0;
    this.itemType = null; // 'weapon', 'health', 'grenade', 'buff'
    this.healthItemDropped = false;
    this.healthItemX = 0;
    this.healthItemY = 0;
    this.healthItemVelocityY = 0;
    this.itemExpireTimer = 0;
    
    // ===== GRENADE PICKUPS =====
    this.grenadePickups = []; // Array of grenade pickup items on the ground
    
    // ===== SPAWN TRACKING =====
    this.spawnTimer = 0;
    this.lastSpawnX = canvasWidth + 200;
    this.waveType = 'single'; // single, cover, grenade, mixed
    this.waveTimer = 0;
    
    // ===== ANTI-FRUSTRATION =====
    this.damageGracePeriod = 0;
    this.criticalHealthMode = false;
    
    // ===== SPAWN TRACKING FOR BOSS/HELICOPTER =====
    this.lastBossScore = -1; // Initialize to -1 so first boss spawns at 50
    this.lastHelicopterScore = -1; // Initialize to -1 so first helicopter spawns at 500
  }

  update(dt, player, cameraX, score) {
    this.bullets = [];
    
    if (!player) return;
    
    // Update timers
    this.stageTimer += dt;
    this.phaseTimer += dt;
    this.spawnTimer += dt;
    this.waveTimer += dt;
    
    // Update damage grace period
    if (this.damageGracePeriod > 0) {
      this.damageGracePeriod -= dt;
    }
    
    // Update adaptive difficulty
    this.updateAdaptiveDifficulty(dt, player);
    
    // Refill spawn budget
    this.spawnBudget = Math.min(this.maxBudget, this.spawnBudget + this.budgetRefillRate * dt);
    
    // Check enemy states
    const bossAlive = this.enemies.some(e => e.type === 'boss');
    const helicopterAlive = this.enemies.some(e => e.type === 'helicopter');
    
    // ===== STAGE PHASE MANAGEMENT =====
    this.updateStagePhase(dt, bossAlive, helicopterAlive, player, cameraX, score);
    
    // ===== SPAWNING LOGIC =====
    if (!bossAlive && !helicopterAlive) {
      this.handleSpawning(dt, player, cameraX);
    }
    
    // ===== BOSS LOGIC =====
    if (this.bossSpawned && !bossAlive && !this.bossDefeated) {
      this.handleBossDefeat(player, cameraX);
    }
    
    // ===== HELICOPTER LOGIC =====
    if (this.helicopterSpawned && !helicopterAlive && !this.helicopterDefeated) {
      this.handleHelicopterDefeat(player, cameraX);
    }
    
    // ===== UPDATE ENEMIES =====
    this.updateEnemies(dt, player, cameraX);
    
    // ===== UPDATE ITEMS =====
    this.updateItems(dt, player);
  }
  
  updateAdaptiveDifficulty(dt, player) {
    // Track kill speed (last 5 seconds)
    const now = Date.now() / 1000;
    this.killHistory = this.killHistory.filter(time => now - time < 5);
    this.killSpeed = this.killHistory.length / 5;
    
    // Track time since last hit
    if (player.health < player.maxHealth) {
      this.lastHitTime = this.stageTimer;
    }
    
    // Adjust difficulty
    const timeSinceHit = this.stageTimer - this.lastHitTime;
    const isDominating = this.killSpeed > 2 && timeSinceHit > 10 && player.health > 70;
    const isStruggling = player.health < 30 || (this.killSpeed < 0.5 && timeSinceHit < 5);
    
    if (isDominating) {
      this.adaptiveMultiplier = Math.min(1.5, this.adaptiveMultiplier + dt * 0.1);
      this.budgetRefillRate = 0.7;
    } else if (isStruggling) {
      this.adaptiveMultiplier = Math.max(0.7, this.adaptiveMultiplier - dt * 0.1);
      this.budgetRefillRate = 0.3;
      this.criticalHealthMode = true;
    } else {
      this.adaptiveMultiplier = 1.0;
      this.budgetRefillRate = 0.5;
      this.criticalHealthMode = false;
    }
  }
  
  updateStagePhase(dt, bossAlive, helicopterAlive, player, cameraX, score) {
    // Update boss spawn cooldown
    if (this.bossSpawnCooldown > 0) {
      this.bossSpawnCooldown -= dt;
    }
    
    // Spawn helicopter FIRST (higher priority) - every 500 points
    const helicopterSpawnThreshold = Math.floor(score / 500) * 500;
    if (helicopterSpawnThreshold >= 500 && helicopterSpawnThreshold !== this.lastHelicopterScore && !helicopterAlive && !this.helicopterSpawned) {
      this.spawnHelicopter(cameraX);
      this.lastHelicopterScore = helicopterSpawnThreshold;
      this.helicopterSpawned = true;
      this.helicopterDefeated = false;
      // Reset boss cooldown when helicopter spawns to prevent immediate boss after
      this.bossSpawnCooldown = this.minBossCooldown;
    }
    
    // Spawn boss based on score/distance (every 200 points - less frequent)
    // Only spawn if cooldown is ready and no helicopter is active
    const bossSpawnThreshold = Math.floor(score / 200) * 200;
    if (bossSpawnThreshold >= 200 && 
        bossSpawnThreshold !== this.lastBossScore && 
        !bossAlive && 
        !this.bossSpawned && 
        !helicopterAlive &&
        this.bossSpawnCooldown <= 0) {
      this.spawnBoss(cameraX);
      this.lastBossScore = bossSpawnThreshold;
      this.bossSpawned = true;
      this.bossDefeated = false;
      // Set cooldown after spawning boss
      this.bossSpawnCooldown = this.minBossCooldown;
    }
    
    // Determine current phase based on game state
    if (bossAlive) {
      this.stagePhase = 'boss';
      this.phaseTimer = 0;
    } else if (helicopterAlive) {
      this.stagePhase = 'helicopter';
      this.phaseTimer = 0;
    } else {
      // Continue phase timer when no special enemies
      if (this.phaseTimer < 15) {
        // Warm-up stretch (15-25s)
        this.stagePhase = 'warmup';
      } else if (this.phaseTimer < 45) {
        // Pressure stretch (25-45s)
        this.stagePhase = 'pressure';
      } else if (this.phaseTimer < 60) {
        // Recovery window
        this.stagePhase = 'recovery';
      } else {
        // Reset to warmup
        this.phaseTimer = 0;
        this.stagePhase = 'warmup';
      }
    }
  }
  
  handleSpawning(dt, player, cameraX) {
    const spawnInterval = this.getSpawnInterval();
    
    if (this.spawnTimer >= spawnInterval && this.spawnBudget >= 1) {
      // Determine wave type based on phase
      let waveType = this.getWaveTypeForPhase();
      
      // Spawn wave
      this.spawnWave(waveType, player, cameraX);
      
      this.spawnTimer = 0;
      this.waveTimer = 0;
    }
  }
  
  getSpawnInterval() {
    let baseInterval = 240; // 4 seconds (more challenging)
    
    if (this.stagePhase === 'warmup') {
      baseInterval = 300; // Slightly slower in warmup
    } else if (this.stagePhase === 'pressure') {
      baseInterval = 180; // Faster in pressure (3 seconds)
    } else if (this.stagePhase === 'recovery') {
      baseInterval = 450; // Slower in recovery
    }
    
    // Apply adaptive difficulty
    return baseInterval / this.adaptiveMultiplier;
  }
  
  getWaveTypeForPhase() {
    if (this.stagePhase === 'warmup') {
      // Teaching moments: single-lane fire
      const types = ['single', 'single', 'cover'];
      return types[Math.floor(Math.random() * types.length)];
    } else if (this.stagePhase === 'pressure') {
      // Mixed challenges
      const types = ['cover', 'grenade', 'mixed', 'mixed'];
      return types[Math.floor(Math.random() * types.length)];
    } else {
      // Recovery: lighter waves
      return 'single';
    }
  }
  
  spawnWave(waveType, player, cameraX) {
    let budgetUsed = 0;
    
    switch (waveType) {
      case 'single':
        // 1 shooter + 1 mover
        if (this.spawnBudget >= this.enemyCosts.grunts) {
          this.spawnGrunt(cameraX);
          budgetUsed += this.enemyCosts.grunt;
        }
          if (this.spawnBudget - budgetUsed >= this.enemyCosts.grunt) {
          this.spawnGrunt(cameraX);
          budgetUsed += this.enemyCosts.grunt;
        }
        break;
        
      case 'cover':
        // 1 cover soldier + 2 grunts
        if (this.spawnBudget >= this.enemyCosts.cover) {
          this.spawnCoverSoldier(cameraX);
          budgetUsed += this.enemyCosts.cover;
        }
        for (let i = 0; i < 2 && this.spawnBudget - budgetUsed >= this.enemyCosts.grunt; i++) {
          this.spawnGrunt(cameraX);
          budgetUsed += this.enemyCosts.grunt;
        }
        break;
        
      case 'grenade':
        // Grenadier + 1 shooter
        if (this.spawnBudget >= this.enemyCosts.grenadier) {
          this.spawnGrenadier(cameraX);
          budgetUsed += this.enemyCosts.grenadier;
        }
          if (this.spawnBudget - budgetUsed >= this.enemyCosts.grunt) {
          this.spawnGrunt(cameraX);
          budgetUsed += this.enemyCosts.grunt;
        }
        break;
        
      case 'mixed':
        // Variety mix
        const mixTypes = ['grunt', 'cover', 'grunt'];
        for (const type of mixTypes) {
          if (type === 'grunt' && this.spawnBudget - budgetUsed >= this.enemyCosts.grunt) {
            this.spawnGrunt(cameraX);
            budgetUsed += this.enemyCosts.grunt;
          } else if (type === 'cover' && this.spawnBudget - budgetUsed >= this.enemyCosts.cover) {
            this.spawnCoverSoldier(cameraX);
            budgetUsed += this.enemyCosts.cover;
          }
        }
        break;
    }
    
    this.spawnBudget -= budgetUsed;
  }
  
  handleBossDefeat(player, cameraX) {
    this.bossDefeated = true;
    this.bossKillCount++;
    this.currentBossCycle = (this.currentBossCycle + 1) % 3;
    
    // Drop health item every 3 bosses
    if (this.currentBossCycle === 0) {
      this.dropHealthItem(cameraX);
    }
    
    // Spawn grenade pickups after first boss (if not already unlocked)
    if (this.bossKillCount === 1 && player && !player.hasGrenades) {
      player.hasGrenades = true;
      // Spawn 5 grenade pickups
      const boss = this.enemies.find(e => e.type === 'boss');
      const dropX = boss ? boss.x : cameraX + this.canvasWidth / 2;
      for (let i = 0; i < 5; i++) {
        this.spawnGrenadePickup(dropX + (i - 2) * 30, cameraX);
      }
    }
    
    // Enter recovery phase
    this.phaseTimer = 0;
    this.stagePhase = 'recovery';
    
    // Reset boss flags for next spawn
    this.bossSpawned = false;
  }
  
  handleHelicopterDefeat(player, cameraX) {
    this.helicopterDefeated = true;
    this.helicopterDefeatCount++;
    
    // Always drop reward from helicopter
    this.dropHelicopterReward(cameraX);
    
    // Drop grenade pickups after every 2 helicopters (5 grenades as pickups)
    if (this.helicopterDefeatCount % 2 === 0 && player) {
      if (!player.hasGrenades) {
        player.hasGrenades = true;
      }
      // Spawn 5 grenade pickups
      const heli = this.enemies.find(e => e.type === 'helicopter');
      const dropX = heli ? heli.x : cameraX + this.canvasWidth / 2;
      for (let i = 0; i < 5; i++) {
        this.spawnGrenadePickup(dropX + (i - 2) * 30, cameraX);
      }
    }
    
    // Increase difficulty
    this.difficultyMultiplier += 0.2;
    
    // Reset helicopter flags for next spawn
    this.helicopterSpawned = false;
  }
  
  updateEnemies(dt, player, cameraX) {
    this.enemies = this.enemies.filter(enemy => {
      enemy.update(dt, player, cameraX, this.canvasWidth);
      
      // Get bullets from enemy
      const enemyBullets = enemy.getBullets();
      if (enemyBullets.length > 0) {
        if (typeof AudioManager !== 'undefined') {
          if (enemy.type === 'helicopter') {
            AudioManager.playHelicopterShot();
          } else {
            AudioManager.playEnemyShoot();
          }
        }
      }
      this.bullets.push(...enemyBullets);
      
      // Handle enemy death
      if (enemy.health <= 0) {
        if (!enemy.isDead) {
          this.enemiesKilled++;
          this.killHistory.push(Date.now() / 1000);
          
          if (typeof AudioManager !== 'undefined') {
            if (enemy.type === 'helicopter') {
              AudioManager.playExplosionHeli();
            }
          }
          
          enemy.isDead = true;
          enemy.deathTimer = 60;
        }
        
        enemy.deathTimer -= dt;
        if (enemy.deathTimer <= 0) {
          return false;
        }
        return true;
      }
      
      if (enemy.x < cameraX - 200) {
        return false;
      }
      return true;
    });
  }
  
  updateItems(dt, player) {
    // Update health item
    if (this.healthItemDropped) {
      this.healthItemVelocityY += 0.3 * dt;
      this.healthItemY += this.healthItemVelocityY * dt;
      
      const groundY = this.canvasHeight - 100;
      if (this.healthItemY >= groundY) {
        this.healthItemY = groundY;
        this.healthItemVelocityY = 0;
      }
      
      if (player && player.x && player.y) {
        const dx = player.x - this.healthItemX;
        const dy = (player.y - 20) - this.healthItemY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 50) {
          if (player.health !== undefined && player.maxHealth !== undefined) {
            player.health = player.maxHealth;
          }
          this.healthItemDropped = false;
        }
      }
    }
    
    // Update helicopter reward
    if (this.itemDropped) {
      this.itemExpireTimer += dt;
      if (this.itemExpireTimer > 300) { // Expire after 5 seconds
        this.itemDropped = false;
        this.itemExpireTimer = 0;
      }
      
      if (player && player.x && player.y) {
        const dx = player.x - this.itemX;
        const dy = (player.y - 20) - this.itemY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 50) {
          this.collectItem(player);
          this.itemDropped = false;
          this.itemExpireTimer = 0;
        }
      }
    }
    
    // Update grenade pickups
    this.grenadePickups = this.grenadePickups.filter(pickup => {
      // Check collision with player
      if (player && player.x && player.y) {
        const dx = player.x - pickup.x;
        const dy = (player.y - 20) - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 40) {
          // Collect grenade
          if (player.hasGrenades) {
            player.grenadeCount = (player.grenadeCount || 0) + 1;
          }
          return false; // Remove pickup
        }
      }
      return true; // Keep pickup
    });
  }
  
  spawnGrenadePickup(x, cameraX) {
    const spawnX = Math.max(x, cameraX + 50);
    const groundY = this.canvasHeight - 100;
    this.grenadePickups.push({
      x: spawnX,
      y: groundY,
      collected: false
    });
  }
  
  collectItem(player) {
    // Item collection handled by type
    // This is a placeholder - actual rewards handled in App.js
  }
  
  spawnGrunt(cameraX) {
    const spawnX = Math.max(cameraX + this.canvasWidth + 100, this.lastSpawnX + 150);
    this.lastSpawnX = spawnX;
    const groundY = this.canvasHeight - 100;
    const enemy = new GruntSoldier(spawnX, groundY, this.canvasWidth, this.canvasHeight);
    this.enemies.push(enemy);
  }
  
  spawnCoverSoldier(cameraX) {
    const spawnX = Math.max(cameraX + this.canvasWidth + 100, this.lastSpawnX + 150);
    this.lastSpawnX = spawnX;
    const groundY = this.canvasHeight - 100;
    const enemy = new CoverSoldier(spawnX, groundY, this.canvasWidth, this.canvasHeight);
    this.enemies.push(enemy);
  }
  
  spawnGrenadier(cameraX) {
    const spawnX = Math.max(cameraX + this.canvasWidth + 100, this.lastSpawnX + 150);
    this.lastSpawnX = spawnX;
    const groundY = this.canvasHeight - 100;
    const enemy = new Grenadier(spawnX, groundY, this.canvasWidth, this.canvasHeight);
    this.enemies.push(enemy);
  }
  
  spawnBoss(cameraX) {
    const spawnX = Math.max(cameraX + this.canvasWidth + 200, this.lastSpawnX + 300);
    this.lastSpawnX = spawnX;
    const groundY = this.canvasHeight - 100;
    const boss = new HeavyGunner(spawnX, groundY, this.canvasWidth, this.canvasHeight);
    boss.type = 'boss';
    this.enemies.push(boss);
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playBossAlarm();
    }
  }
  
  spawnHelicopter(cameraX) {
    const spawnX = Math.max(cameraX + this.canvasWidth + 200, this.lastSpawnX + 300);
    this.lastSpawnX = spawnX;
    const heli = new AttackHelicopter(spawnX, 150, this.canvasWidth, this.canvasHeight);
    heli.type = 'helicopter';
    this.enemies.push(heli);
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playHelicopterAlarm();
    }
  }
  
  dropHelicopterReward(cameraX) {
    const heli = this.enemies.find(e => e.type === 'helicopter');
    if (heli) {
      this.itemX = heli.x;
      this.itemY = heli.y;
    } else {
      this.itemX = cameraX + this.canvasWidth / 2;
      this.itemY = this.canvasHeight - 100;
    }
    this.itemDropped = true;
    this.itemType = 'weapon'; // Rotate: weapon, buff, ammo
    this.itemExpireTimer = 0;
  }
  
  dropHealthItem(cameraX) {
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss) {
      this.healthItemX = boss.x;
      this.healthItemY = 100;
    } else {
      this.healthItemX = cameraX + this.canvasWidth / 2;
      this.healthItemY = 100;
    }
    this.healthItemDropped = true;
    this.healthItemVelocityY = 0;
  }
  
  checkBulletHit(bullet) {
    for (let enemy of this.enemies) {
      if (enemy.checkBulletHit(bullet)) {
        enemy.takeDamage(bullet.damage);
        return true;
      }
    }
    return false;
  }

  getBullets() {
    return this.bullets;
  }
  
  getEnemies() {
    return this.enemies;
  }

  isStageComplete() {
    return this.stageComplete;
  }

  draw(ctx, cameraX) {
    this.enemies.forEach(enemy => {
      // Ensure all enemies have a draw method and proper properties
      if (enemy && typeof enemy.draw === 'function') {
        try {
          // Ensure enemy has required properties for drawing
          if (!enemy.canvasWidth) enemy.canvasWidth = this.canvasWidth;
          if (!enemy.canvasHeight) enemy.canvasHeight = this.canvasHeight;
          if (enemy.x === undefined) return; // Skip if no position
          if (enemy.y === undefined) enemy.y = this.canvasHeight - 100;
          
          enemy.draw(ctx, cameraX);
        } catch (e) {
          console.error('Error drawing enemy:', e, enemy);
          // Fallback: draw a simple placeholder
          const screenX = (enemy.x || 0) - cameraX;
          const screenY = enemy.y || this.canvasHeight - 100;
          if (screenX > -100 && screenX < this.canvasWidth + 100) {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(screenX - 20, screenY - 40, 40, 40);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText('ENEMY', screenX - 20, screenY - 45);
          }
        }
      } else if (enemy) {
        console.warn('Enemy missing draw method:', enemy.type || 'unknown', enemy);
        // Draw fallback for enemies without draw method
        const screenX = (enemy.x || 0) - cameraX;
        const screenY = enemy.y || this.canvasHeight - 100;
        if (screenX > -100 && screenX < this.canvasWidth + 100) {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(screenX - 20, screenY - 40, 40, 40);
        }
      }
    });
    
    // Draw health item (heart)
    if (this.healthItemDropped) {
      const screenX = this.healthItemX - cameraX;
      const screenY = this.healthItemY;
      
      if (screenX > -50 && screenX < this.canvasWidth + 50) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        const time = Date.now() * 0.005;
        const glowSize = 25 + Math.sin(time) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 100, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(-8, -5, 8, 0, Math.PI * 2);
        ctx.arc(8, -5, 8, 0, Math.PI * 2);
        ctx.moveTo(0, 15);
        ctx.lineTo(-12, -2);
        ctx.lineTo(0, 8);
        ctx.lineTo(12, -2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.arc(-6, -7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -7, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }
    
    // Draw helicopter reward
    if (this.itemDropped) {
      const screenX = this.itemX - cameraX;
      const screenY = this.itemY;
      
      if (screenX > -50 && screenX < this.canvasWidth + 50) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        const time = Date.now() * 0.005;
        const glowSize = 20 + Math.sin(time) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(-20, -10, 40, 20);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(-20, -10, 40, 20);
        
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-15 + i * 8, -8, 4, 16);
        }
        
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(-12 + i * 4, 12, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
    }
    
    // Draw grenade pickups
    this.grenadePickups.forEach(pickup => {
      const screenX = pickup.x - cameraX;
      const screenY = pickup.y;
      
      if (screenX > -50 && screenX < this.canvasWidth + 50) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Pulsing glow effect
        const time = Date.now() * 0.005;
        const glowSize = 15 + Math.sin(time) * 3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.8)');
        gradient.addColorStop(0.5, 'rgba(160, 82, 45, 0.4)');
        gradient.addColorStop(1, 'rgba(160, 82, 45, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Grenade body (oval)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Grenade segments
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fuse
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-2, -14, 4, 6);
        
        // Sparkle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-2 + Math.sin(time * 2) * 1, -12, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    });
  }
}
