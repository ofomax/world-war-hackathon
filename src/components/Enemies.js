// src/components/Enemies.js
// FULL UPDATED FILE (drop-in replacement)

//
// Base Enemy Class
//
class BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight, type) {
    this.x = x;
    this.y = y; // ground baseline (feet at this y)
    this.width = 64;
    this.height = 64;

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.type = type;

    this.health = 30;
    this.maxHealth = 30;

    this.velocityX = 0;
    this.velocityY = 0;

    // State system: idle, alert, attack, recover, move
    this.state = "idle";
    this.stateTimer = 0;
    this.facingRight = false;

    // Shooting
    this.shootCooldown = 0;
    this.bullets = [];
    this.burstCount = 0;
    this.burstMax = 3;

    // Animation
    this.animFrame = 0;
    this.animTime = 0;

    // Death animation
    this.isDead = false;
    this.deathTimer = 0;
    this.deathRotation = 0;
  }

  update(dt, player, cameraX, canvasWidth) {
    // Handle death animation
    if (this.isDead) {
      this.deathTimer -= dt;

      // Rotate to horizontal (90 degrees)
      if (this.deathRotation < Math.PI / 2) {
        this.deathRotation += dt * 0.1;
        if (this.deathRotation > Math.PI / 2) {
          this.deathRotation = Math.PI / 2;
        }
      }
      return;
    }

    // Face player
    if (player) {
      this.facingRight = player.x > this.x;
    }

    // Check if enemy is visible on screen
    const screenX = this.x - cameraX;
    const isVisible = screenX > -100 && screenX < canvasWidth + 100;

    // State machine
    this.stateTimer += dt;

    // Check if player is in range
    const dx = player ? player.x - this.x : 0;
    const dy = player ? player.y - this.y : 0;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.state === "idle") {
      if (isVisible && distance < 400 && player) {
        this.state = "alert";
        this.stateTimer = 0;
      }
    } else if (this.state === "alert") {
      if (this.stateTimer > 30) {
        this.state = "attack";
        this.stateTimer = 0;
        this.burstCount = 0;
      }
    } else if (this.state === "attack") {
      if (this.shootCooldown <= 0 && this.burstCount < this.burstMax) {
        this.shoot(player);
        this.burstCount++;
        this.shootCooldown = 60;
      }
      if (this.burstCount >= this.burstMax && this.shootCooldown <= 0) {
        this.state = "recover";
        this.stateTimer = 0;
      }
    } else if (this.state === "recover") {
      if (this.stateTimer > 60) {
        this.state = "move";
        this.stateTimer = 0;
      }
    } else if (this.state === "move") {
      this.velocityX = (Math.random() - 0.5) * 2;
      if (this.stateTimer > 30) {
        this.state = "alert";
        this.stateTimer = 0;
      }
    }

    // Reset to idle if player is too far
    if (distance > 500 && this.state !== "idle") {
      this.state = "idle";
      this.stateTimer = 0;
    }

    // Update cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Update position
    this.x += this.velocityX * dt;
    this.velocityX *= 0.9;

    // Animation
    this.animTime += dt;
    if (this.animTime > 0.15) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTime = 0;
    }
  }

  // ✅ UPDATED: straight horizontal shot line (duck mechanic)
  shoot(player) {
    if (!player || !player.x || !player.y) return;

    // Shoot horizontally toward player
    const dirX = player.x >= this.x ? 1 : -1;

    // Fire line at standing head/upper torso height.
    // Player standing head ~ y-60, crouch head ~ y-38 => bullet at y-55 goes over crouched head.
    const gunY = this.y - 55;

    this.bullets.push({
      x: this.x + (dirX > 0 ? 30 : -30), // Spawn from gun position (offset from center)
      y: gunY,
      velocityX: dirX * 8,
      velocityY: 0,
      isPlayerBullet: false,
      damage: 5,
      width: 6,
      height: 6,
    });
  }

  getBullets() {
    const bullets = [...this.bullets];
    this.bullets = [];
    return bullets;
  }

  checkBulletHit(bullet) {
    // Check if bullet hits anywhere on the enemy body (not just center)
    const dx = this.x - bullet.x;
    const dy = this.y - this.height / 2 - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const hitRadius = Math.max(this.width / 2, this.height / 2) + bullet.width / 2;
    return distance < hitRadius;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    // Mark dead once; keep draw until death anim fades out
    if (this.health <= 0 && !this.isDead) {
      this.isDead = true;
      this.deathTimer = 60;
      this.deathRotation = 0;
    }
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    if (screenX < -100 || screenX > this.canvasWidth + 100) return;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Apply death rotation (fall horizontal)
    if (this.isDead) {
      ctx.rotate(this.deathRotation);
      const alpha = Math.max(0, this.deathTimer / 60);
      ctx.globalAlpha = alpha;
    }

    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    const isMoving = Math.abs(this.velocityX) > 0.1;
    const isShooting = this.state === "attack" && this.shootCooldown > 50;
    const walkFrame = isMoving ? this.animFrame : 0;

    // Align enemy to player baseline (feet at y=0)
    const centerX = 0;
    const headY = -60;
    const torsoY = -45;
    const waistY = -30;
    const legStartY = -30;
    const footY = 0;

    // === HEAD ===
    ctx.fillStyle = "#D2B48C";
    ctx.beginPath();
    ctx.arc(centerX, headY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#2C2C2C";
    ctx.beginPath();
    ctx.arc(centerX, headY - 6, 16, 0, Math.PI * 2);
    ctx.fill();

    // Beard
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(centerX - 8, headY + 6, 16, 8);
    ctx.beginPath();
    ctx.arc(centerX, headY + 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = "#6B8E23";
    ctx.beginPath();
    ctx.arc(centerX, headY - 4, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#556B2F";
    ctx.fillRect(centerX - 15, headY + 8, 30, 4);

    // === TORSO ===
    ctx.fillStyle = "#6B8E23";
    ctx.fillRect(centerX - 20, torsoY, 40, 20);

    // Belt
    ctx.fillStyle = "#654321";
    ctx.fillRect(centerX - 22, waistY, 44, 5);
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(centerX - 18, waistY - 2, 8, 6);
    ctx.fillRect(centerX - 6, waistY - 2, 8, 6);
    ctx.fillRect(centerX + 6, waistY - 2, 8, 6);
    ctx.fillRect(centerX + 18, waistY - 2, 8, 6);

    // === ARMS ===
    ctx.fillStyle = "#6B8E23";
    if (isMoving) {
      const armOffset = walkFrame % 2 === 0 ? -0.2 : 0.2;
      ctx.save();
      ctx.translate(centerX - 18, torsoY + 8);
      ctx.rotate(armOffset);
      ctx.fillRect(-5, -6, 10, 20);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(centerX - 18, torsoY + 6);
      ctx.rotate(0.3);
      ctx.fillRect(-5, -6, 10, 22);
      ctx.restore();
    }

    ctx.fillStyle = "#6B8E23";
    if (isMoving) {
      const armOffset = walkFrame % 2 === 0 ? 0.2 : -0.2;
      ctx.save();
      ctx.translate(centerX + 18, torsoY + 8);
      ctx.rotate(armOffset);
      ctx.fillRect(-5, -6, 10, 20);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(centerX + 18, torsoY + 6);
      ctx.rotate(-0.2);
      ctx.fillRect(-5, -6, 10, 22);
      ctx.restore();
    }

    // Gloves
    ctx.fillStyle = "#2F4F2F";
    if (isMoving) {
      ctx.save();
      ctx.translate(centerX - 18, torsoY + 22);
      const armOffset = walkFrame % 2 === 0 ? -0.2 : 0.2;
      ctx.rotate(armOffset);
      ctx.fillRect(-6, -4, 12, 8);
      ctx.restore();

      ctx.save();
      ctx.translate(centerX + 18, torsoY + 22);
      ctx.rotate(walkFrame % 2 === 0 ? 0.2 : -0.2);
      ctx.fillRect(-6, -4, 12, 8);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(centerX - 16, torsoY + 24);
      ctx.rotate(0.3);
      ctx.fillRect(-6, -5, 12, 10);
      ctx.restore();

      ctx.save();
      ctx.translate(centerX + 20, torsoY + 24);
      ctx.rotate(-0.2);
      ctx.fillRect(-6, -5, 12, 10);
      ctx.restore();
    }

    // === LEGS ===
    ctx.fillStyle = "#6B8E23";
    if (isMoving) {
      const leftForward = walkFrame === 0 || walkFrame === 2;
      const rightForward = walkFrame === 1 || walkFrame === 3;

      // Left leg
      ctx.save();
      ctx.translate(centerX - 8, legStartY);
      ctx.rotate(leftForward ? 0.2 : -0.15);
      ctx.fillRect(-6, 0, 12, 35);
      ctx.restore();

      // Right leg
      ctx.save();
      ctx.translate(centerX + 8, legStartY);
      ctx.rotate(rightForward ? 0.2 : -0.15);
      ctx.fillRect(-6, 0, 12, 35);
      ctx.restore();
    } else {
      ctx.fillRect(centerX - 10, legStartY, 12, 40);
      ctx.fillRect(centerX + 2, legStartY, 12, 40);
    }

    // === BOOTS ===
    ctx.fillStyle = "#8B4513";
    if (isMoving) {
      const leftForward = walkFrame === 0 || walkFrame === 2;
      const rightForward = walkFrame === 1 || walkFrame === 3;

      if (leftForward) {
        ctx.fillRect(centerX - 14, footY, 14, 8);
      } else {
        ctx.fillRect(centerX - 12, footY + 2, 14, 8);
      }

      if (rightForward) {
        ctx.fillRect(centerX + 2, footY, 14, 8);
      } else {
        ctx.fillRect(centerX + 4, footY + 2, 14, 8);
      }
    } else {
      ctx.fillRect(centerX - 12, footY, 14, 8);
      ctx.fillRect(centerX + 4, footY, 14, 8);
    }

    // Boot soles
    ctx.fillStyle = "#654321";
    ctx.fillRect(centerX - 12, footY + 8, 14, 2);
    ctx.fillRect(centerX + 4, footY + 8, 14, 2);

    // === WEAPON ===
    ctx.fillStyle = "#2C2C2C";
    const gunDrawY = isMoving ? torsoY + 8 : torsoY + 10;
    ctx.fillRect(centerX + 8, gunDrawY, 35, 4);
    ctx.fillRect(centerX + 43, gunDrawY + 1, 15, 3);

    // Muzzle flash when firing
    if (isShooting) {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(centerX + 58, gunDrawY + 2, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FF8C00";
      ctx.beginPath();
      ctx.arc(centerX + 58, gunDrawY + 2, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(centerX + 58, gunDrawY + 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Smoke wisps
      ctx.fillStyle = "rgba(169, 169, 169, 0.6)";
      ctx.beginPath();
      ctx.arc(centerX + 60, gunDrawY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 62, gunDrawY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar
    if (this.health < this.maxHealth && !this.isDead) {
      const barWidth = 40;
      const barHeight = 4;
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(screenX - barWidth / 2, screenY - this.height - 10, barWidth, barHeight);
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(
        screenX - barWidth / 2,
        screenY - this.height - 10,
        barWidth * (this.health / this.maxHealth),
        barHeight
      );
    }
  }
}

//
// Enemy Type A: Grunt Soldier
//
export class GruntSoldier extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "grunt");
    this.health = 20;
    this.maxHealth = 20;
    this.burstMax = 3;
  }

  update(dt, player, cameraX, canvasWidth) {
    // Walk in from the right - always move left when off-screen or in idle/move state
    const screenX = this.x - cameraX;
    if (screenX > canvasWidth || this.state === "idle" || this.state === "move") {
      this.velocityX = -2; // Walk left into frame
    }
    super.update(dt, player, cameraX, canvasWidth);
  }
}

//
// Enemy Type B: Cover Soldier
//
export class CoverSoldier extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "cover");
    this.health = 25;
    this.maxHealth = 25;
    this.coverX = x;
    this.inCover = true;
    this.coverTimer = 0;
  }

  update(dt, player, cameraX) {
    if (player) {
      const distance = Math.abs(player.x - this.x);

      // Pop out of cover
      if (this.inCover && this.state === "alert") {
        this.inCover = false;
        this.coverTimer = 0;
      }

      // Duck back into cover after shooting
      if (!this.inCover && this.state === "recover") {
        this.coverTimer += dt;
        if (this.coverTimer > 40) {
          this.inCover = true;
          this.coverTimer = 0;
        }
      }

      // Panic fire if close
      if (distance < 150 && !this.inCover) {
        this.burstMax = 5;
        this.shootCooldown = Math.max(0, this.shootCooldown - dt * 2);
      } else {
        this.burstMax = 2;
      }
    }

    super.update(dt, player, cameraX, this.canvasWidth);
  }

  draw(ctx, cameraX) {
    // Draw cover
    const screenX = this.coverX - cameraX;
    ctx.fillStyle = "#654321";
    ctx.fillRect(screenX - 20, this.canvasHeight - 100 - 40, 40, 40);

    if (!this.inCover) {
      super.draw(ctx, cameraX);
    } else {
      // Only show head when in cover
      const screenX2 = this.x - cameraX;
      ctx.fillStyle = "#FFDBAC";
      ctx.beginPath();
      ctx.arc(screenX2, this.y - 60, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

//
// Enemy Type C: Grenadier
//
export class Grenadier extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "grenadier");
    this.health = 40;
    this.maxHealth = 40;
    this.grenadeCooldown = 0;
  }

  update(dt, player, cameraX) {
    this.grenadeCooldown -= dt;

    if (this.state === "attack" && this.grenadeCooldown <= 0 && player) {
      this.throwGrenade(player);
      this.grenadeCooldown = 180;
      this.state = "recover";
      this.stateTimer = 0;
    }

    super.update(dt, player, cameraX, this.canvasWidth);
  }

  throwGrenade(player) {
    if (!player || !player.x || !player.y) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    const dirX = length > 0 ? dx / length : 1;
    const dirY = length > 0 ? dy / length : 0;

    // Arcing grenade
    this.bullets.push({
      x: this.x,
      y: this.y - 10,
      velocityX: dirX * 6,
      velocityY: dirY * 6 - 8,
      isPlayerBullet: false,
      damage: 20,
      width: 10,
      height: 10,
      isGrenade: true,
      gravity: 0.3,
      explosionRadius: 80,
    });
  }

  draw(ctx, cameraX) {
    super.draw(ctx, cameraX);

    // Draw grenade launcher
    const screenX = this.x - cameraX;
    ctx.save();
    ctx.translate(screenX, this.y - 30);
    if (!this.facingRight) ctx.scale(-1, 1);

    ctx.fillStyle = "#555";
    ctx.fillRect(30, -5, 20, 4);
    ctx.restore();
  }
}

//
// Enemy Type D: Heavy Soldier
//
export class HeavySoldier extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "heavy");
    this.health = 100;
    this.maxHealth = 100;
    this.burstMax = 5;
    this.armor = true;
  }

  update(dt, player, cameraX, canvasWidth) {
    // Slower movement
    this.velocityX *= 0.8;
    super.update(dt, player, cameraX, canvasWidth);
  }

  takeDamage(amount) {
    if (this.armor) {
      amount *= 0.5;
    }
    super.takeDamage(amount);
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    if (!this.facingRight) ctx.scale(-1, 1);

    const isShooting = this.state === "attack" && this.shootCooldown > 50;

    // Feet aligned to ground (y=0)
    const centerX = 0;
    const headY = -58;
    const torsoY = -40;
    const waistY = -22;
    const legStartY = -22;
    const footY = 0;

    // Head
    ctx.fillStyle = "#8B7355";
    ctx.beginPath();
    ctx.arc(centerX, headY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Beard
    ctx.fillStyle = "#654321";
    ctx.fillRect(centerX - 10, headY + 6, 20, 10);

    // Helmet
    ctx.fillStyle = "#2C2C2C";
    ctx.beginPath();
    ctx.arc(centerX, headY - 4, 16, 0, Math.PI * 2);
    ctx.fill();

    // Goggles
    ctx.fillStyle = "#8B0000";
    ctx.fillRect(centerX - 12, headY - 8, 24, 8);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 12, headY - 8, 24, 8);

    // Torso
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX - 28, torsoY, 56, 25);

    // Vest
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(centerX - 26, torsoY + 2, 52, 21);

    // Bandolier bullets
    ctx.fillStyle = "#FFD700";
    for (let i = 0; i < 8; i++) {
      const x = centerX + 15 - i * 4;
      const y = torsoY + 3 + i * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arms
    ctx.fillStyle = "#2C2C2C";
    ctx.save();
    ctx.translate(centerX - 24, torsoY + 8);
    ctx.rotate(0.4);
    ctx.fillRect(-6, -8, 12, 24);
    ctx.restore();

    ctx.save();
    ctx.translate(centerX + 24, torsoY + 8);
    ctx.rotate(-0.3);
    ctx.fillRect(-6, -8, 12, 24);
    ctx.restore();

    // Ammo belt around waist
    ctx.fillStyle = "#FFD700";
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(centerX - 24 + i * 4, waistY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX - 12, legStartY, 12, 45);
    ctx.fillRect(centerX + 2, legStartY, 12, 45);

    // Boots
    ctx.fillStyle = "#654321";
    ctx.fillRect(centerX - 12, footY, 12, 10);
    ctx.fillRect(centerX + 2, footY, 12, 10);

    // Weapon
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX + 30, torsoY + 8, 50, 10);

    // Muzzle flash
    if (isShooting) {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(centerX + 85, torsoY + 13, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar
    const barWidth = 60;
    const barHeight = 6;
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(screenX - barWidth / 2, screenY - 80, barWidth, barHeight);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(
      screenX - barWidth / 2,
      screenY - 80,
      barWidth * (this.health / this.maxHealth),
      barHeight
    );
  }
}

//
// Attack Helicopter
//
export class AttackHelicopter extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "helicopter");
    this.health = 700;
    this.maxHealth = 700;

    this.width = 192;
    this.height = 96;

    this.hoverX = x;
    this.hoverRange = 200;
    this.hoverSpeed = 1;
    this.hoverDirection = 1;

    this.attackTimer = 0;
    this.rotorFrame = 0;
  }

  update(dt, player, cameraX, canvasWidth) {
    // Hover movement
    this.hoverX += this.hoverSpeed * this.hoverDirection * dt;
    if (this.hoverX > this.x + this.hoverRange) {
      this.hoverDirection = -1;
    } else if (this.hoverX < this.x - this.hoverRange) {
      this.hoverDirection = 1;
    }
    this.x = this.hoverX;

    // Face player
    if (player) {
      this.facingRight = player.x > this.x;
    }

    // Visible on screen?
    const screenX = this.x - cameraX;
    const isVisible = screenX > -200 && screenX < canvasWidth + 200;

    // Attack pattern - only if visible
    if (isVisible) {
      this.attackTimer += dt;
      if (this.attackTimer > 120 && player) {
        this.strafe(player);
        this.attackTimer = 0;
      }
    }

    // Rotor animation
    this.rotorFrame = (this.rotorFrame + dt * 0.5) % 2;
  }

  strafe(player) {
    // Shoot at player with spread pattern
    if (!player || !player.x || !player.y) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);

    // Burst fire - create bullets aimed at player with spread
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 0.1;
      const angle = baseAngle + spread;

      this.bullets.push({
        x: this.x,
        y: this.y,
        velocityX: Math.cos(angle) * 10,
        velocityY: Math.sin(angle) * 10,
        isPlayerBullet: false,
        damage: 8,
        width: 8,
        height: 8,
      });
    }
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    if (!this.facingRight) ctx.scale(-1, 1);

    // Rotor hub
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.arc(0, -20, 60, 0, Math.PI * 2);
    ctx.fill();

    // Rotor blades
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const angle = i * (Math.PI / 2) + this.rotorFrame * Math.PI;
      const x1 = Math.cos(angle) * 50;
      const y1 = Math.sin(angle) * 50;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(x1, -20 + y1);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Cockpit
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-40, -30, 80, 40);

    // Weapon pods
    ctx.fillStyle = "#444";
    ctx.fillRect(-this.width / 2 + 20, -10, 30, 15);
    ctx.fillRect(this.width / 2 - 50, -10, 30, 15);

    ctx.restore();

    // Health bar
    const barWidth = 100;
    const barHeight = 6;
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(
      screenX - barWidth / 2,
      screenY - this.height / 2 - 15,
      barWidth,
      barHeight
    );
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(
      screenX - barWidth / 2,
      screenY - this.height / 2 - 15,
      barWidth * (this.health / this.maxHealth),
      barHeight
    );
  }
}

//
// Final Boss: Heavy Gunner
//
export class HeavyGunner extends BaseEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight, "boss");

    this.health = 500;
    this.maxHealth = 500;

    this.width = 128;
    this.height = 160;

    this.phase = 1;
    this.phaseTimer = 0;

    this.burstMax = 10;
  }

  update(dt, player, cameraX, canvasWidth) {
    const screenX = this.x - cameraX;
    const isVisible = screenX > -200 && screenX < canvasWidth + 200;

    // Phase transitions
    this.phaseTimer += dt;
    if (this.health < this.maxHealth * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.phaseTimer = 0;
    } else if (this.health < this.maxHealth * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.phaseTimer = 0;
    }

    // Boss behavior when visible
    if (isVisible && player) {
      if (this.state === "idle") {
        this.state = "alert";
        this.stateTimer = 0;
      } else if (this.state === "alert" && this.stateTimer > 30) {
        this.state = "attack";
        this.stateTimer = 0;
        this.burstCount = 0;
      }

      if (this.phase === 1) {
        if (
          this.state === "attack" &&
          this.shootCooldown <= 0 &&
          this.burstCount < this.burstMax
        ) {
          this.bossShoot(player);
          this.burstCount++;
          this.shootCooldown = 40;
        }
        if (this.burstCount >= this.burstMax && this.shootCooldown <= 0) {
          this.state = "recover";
          this.stateTimer = 0;
        }
      } else if (this.phase === 2) {
        if (this.state === "attack" && this.shootCooldown <= 0) {
          this.sweepFire(player);
          this.shootCooldown = 60;
          this.state = "recover";
          this.stateTimer = 0;
        }
      } else if (this.phase === 3) {
        if (this.state === "attack" && this.shootCooldown <= 0) {
          this.aggressiveFire(player);
          this.shootCooldown = 20;
        }
      }

      if (this.state === "recover" && this.stateTimer > 60) {
        this.state = "attack";
        this.stateTimer = 0;
        this.burstCount = 0;
      }
    }

    // Minimal base-update pieces (boss overrides movement/state)
    if (player) this.facingRight = player.x > this.x;

    this.stateTimer += dt;

    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    this.x += this.velocityX * dt;
    this.velocityX *= 0.9;

    this.animTime += dt;
    if (this.animTime > 0.15) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTime = 0;
    }
  }

  checkBulletHit(bullet) {
    const dx = this.x - bullet.x;
    const dy = this.y - this.height / 2 - bullet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = Math.max(this.width / 2, this.height / 2) + bullet.width / 2;
    return distance < hitRadius;
  }

  bossShoot(player) {
    if (!player || !player.x || !player.y) return;
    
    // Get gun barrel position (from draw method: centerX + 105, torsoY + 18)
    const centerX = this.x;
    const torsoY = this.y - this.height + 40;
    const gunBarrelX = centerX + (this.facingRight ? 105 : -105);
    const gunBarrelY = torsoY + 18;
    
    // Shoot horizontally toward player
    const dirX = player.x >= this.x ? 1 : -1;

    this.bullets.push({
      x: gunBarrelX,
      y: gunBarrelY,
      velocityX: dirX * 8,
      velocityY: 0,
      isPlayerBullet: false,
      damage: 5,
      width: 6,
      height: 6,
    });
  }

  sweepFire(player) {
    if (!player || !player.x || !player.y) return;
    
    // Get gun barrel position
    const centerX = this.x;
    const torsoY = this.y - this.height + 40;
    const gunBarrelX = centerX + (this.facingRight ? 105 : -105);
    const gunBarrelY = torsoY + 18;
    
    const baseAngle = Math.atan2(player.y - gunBarrelY, player.x - gunBarrelX);
    for (let i = -2; i <= 2; i++) {
      const angle = baseAngle + i * 0.3;
      this.bullets.push({
        x: gunBarrelX,
        y: gunBarrelY,
        velocityX: Math.cos(angle) * 10,
        velocityY: Math.sin(angle) * 10,
        isPlayerBullet: false,
        damage: 10,
        width: 8,
        height: 8,
      });
    }
  }

  aggressiveFire(player) {
    if (!player || !player.x || !player.y) return;
    
    // Get gun barrel position
    const centerX = this.x;
    const torsoY = this.y - this.height + 40;
    const gunBarrelX = centerX + (this.facingRight ? 105 : -105);
    const gunBarrelY = torsoY + 18;
    
    this.bossShoot(player);

    const base = Math.atan2(player.y - gunBarrelY, player.x - gunBarrelX);
    const angle1 = base - 0.5;
    const angle2 = base + 0.5;

    this.bullets.push({
      x: gunBarrelX,
      y: gunBarrelY,
      velocityX: Math.cos(angle1) * 10,
      velocityY: Math.sin(angle1) * 10,
      isPlayerBullet: false,
      damage: 10,
      width: 8,
      height: 8,
    });

    this.bullets.push({
      x: gunBarrelX,
      y: gunBarrelY,
      velocityX: Math.cos(angle2) * 10,
      velocityY: Math.sin(angle2) * 10,
      isPlayerBullet: false,
      damage: 10,
      width: 8,
      height: 8,
    });
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();
    ctx.translate(screenX, screenY);
    if (!this.facingRight) ctx.scale(-1, 1);

    const isShooting = this.state === "attack" && this.shootCooldown > 15;

    const centerX = 0;
    const headY = -this.height + 18;
    const torsoY = -this.height + 40;
    const waistY = -this.height + 65;
    const legStartY = -this.height + 65;
    const footY = 0;

    // Head
    ctx.fillStyle = "#8B7355";
    ctx.beginPath();
    ctx.arc(centerX, headY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = "#2C2C2C";
    ctx.beginPath();
    ctx.arc(centerX, headY - 6, 19, 0, Math.PI * 2);
    ctx.fill();

    // Balaclava
    ctx.fillStyle = "#556B2F";
    ctx.fillRect(centerX - 12, headY + 4, 24, 16);

    // Torso
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX - 35, torsoY, 70, 30);

    // Vest
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(centerX - 32, torsoY + 3, 64, 25);

    // Bandolier bullets
    ctx.fillStyle = "#FFD700";
    for (let i = 0; i < 10; i++) {
      const x = centerX + 20 - i * 4;
      const y = torsoY + 5 + i * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Waist belt bullets
    ctx.fillStyle = "#FFD700";
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(centerX - 30 + i * 4, waistY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX - 14, legStartY, 14, 50);
    ctx.fillRect(centerX + 2, legStartY, 14, 50);

    // Boots
    ctx.fillStyle = "#654321";
    ctx.fillRect(centerX - 14, footY, 14, 12);
    ctx.fillRect(centerX + 2, footY, 14, 12);

    // Minigun
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(centerX + 35, torsoY + 12, 70, 12);

    if (isShooting) {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(centerX + 105, torsoY + 18, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Boss health bar
    const barWidth = 150;
    const barHeight = 10;
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(screenX - barWidth / 2, screenY - this.height - 20, barWidth, barHeight);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(
      screenX - barWidth / 2,
      screenY - this.height - 20,
      barWidth * (this.health / this.maxHealth),
      barHeight
    );

    // Phase indicator
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    ctx.fillText(`BOSS - Phase ${this.phase}`, screenX - 60, screenY - this.height - 25);
  }
}
