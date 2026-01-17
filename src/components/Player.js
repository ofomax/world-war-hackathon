export default class Player {
  constructor(x, y, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.width = 64;
    this.height = 80;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Movement
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 5;
    this.jumpPower = -15;
    this.isGrounded = true;
    this.isDucking = false;
    this.duckTimer = 0;
    this.maxDuckTime = 180; // 3 seconds at 60fps
    
    // Shooting
    this.shootCooldown = 0;
    this.shootCooldownMax = 10;
    this.lastShootDirection = { x: 1, y: 0 };
    this.weaponUpgraded = false;
    this.minigunCooldown = 0;
    this.hasGrenades = false;
    this.grenadeCount = 0; // Number of grenades available
    this.grenadeCooldown = 0;
    this.grenadeCooldownMax = 120; // 2 seconds at 60fps
    this.hasMachineGun = false;
    this.machineGunCooldown = 0;
    
    // Health
    this.health = 100;
    this.maxHealth = 100;
    
    // Animation
    this.walkFrame = 0;
    this.walkFrameTime = 0;
    this.facingRight = true;
    this.isShooting = false;
    this.isThrowingGrenade = false;
    this.grenadeThrowFrame = 0;
  }

  update(keys, mousePos, mouseDown, dt, groundY, gravity) {
    // Update minigun cooldown
    if (this.weaponUpgraded && this.minigunCooldown > 0) {
      this.minigunCooldown -= dt;
    }
    
    // Update grenade cooldown
    if (this.grenadeCooldown > 0) {
      this.grenadeCooldown -= dt;
    }
    
    // Update machine gun cooldown
    if (this.hasMachineGun && this.machineGunCooldown > 0) {
      this.machineGunCooldown -= dt;
    }
    
    // Update grenade throwing animation
    if (this.isThrowingGrenade) {
      this.grenadeThrowFrame += dt;
      if (this.grenadeThrowFrame >= 20) { // Animation lasts ~0.33 seconds
        this.isThrowingGrenade = false;
        this.grenadeThrowFrame = 0;
      }
    }
    
    // Update duck timer
    if (this.isDucking) {
      this.duckTimer += dt;
      if (this.duckTimer >= this.maxDuckTime) {
        // Force stop ducking after 3 seconds
        this.isDucking = false;
        this.duckTimer = 0;
      }
    } else {
      // Reset timer when not ducking
      this.duckTimer = 0;
    }
    
    // Reset ducking (will be set below if key is pressed and timer allows)
    const wasDucking = this.isDucking;
    this.isDucking = false;
    
    // Horizontal movement
    this.velocityX = 0;
    if (keys['a']) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    }
    if (keys['d']) {
      this.velocityX = this.speed;
      this.facingRight = true;
    }
    
    // Ducking (only if timer allows)
    if (keys['s'] && this.isGrounded && this.duckTimer < this.maxDuckTime) {
      this.isDucking = true;
      this.velocityX *= 0.5; // Slow down while ducking
    } else if (this.duckTimer >= this.maxDuckTime) {
      // Can't duck if timer exceeded
      this.isDucking = false;
    }
    
    // Jumping
    if (keys['w'] && this.isGrounded && !this.isDucking) {
      this.velocityY = this.jumpPower;
      this.isGrounded = false;
    }
    
    // Apply gravity
    if (!this.isGrounded) {
      this.velocityY += gravity * dt;
    }
    
    // Update position
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    
    // Ground collision
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    }
    
    // Boundary check - only prevent going off left edge, allow unlimited forward movement
    this.x = Math.max(this.width / 2, this.x);
    
    // Update shooting direction based on mouse
    if (mousePos) {
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        this.lastShootDirection = { x: dx / length, y: dy / length };
      }
    }
    
    // Update cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
    
    // Animation
    if (Math.abs(this.velocityX) > 0.1) {
      this.walkFrameTime += dt;
      if (this.walkFrameTime > 0.15) {
        this.walkFrame = (this.walkFrame + 1) % 4; // 4-frame walking cycle
        this.walkFrameTime = 0;
      }
    } else {
      this.walkFrame = 0;
    }
    
    // Track shooting state
    this.isShooting = mouseDown && this.canShoot();
  }

  canShoot() {
    return this.shootCooldown <= 0;
  }

  shoot(mousePos) {
    if (this.hasMachineGun) {
      // Machine gun - very rapid fire
      if (this.machineGunCooldown <= 0) {
        this.machineGunCooldown = 2; // Very fast fire rate
        
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = length > 0 ? dx / length : 1;
        const dirY = length > 0 ? dy / length : 0;
        
        return {
          x: this.x,
          y: this.y - 20,
          velocityX: dirX * 12,
          velocityY: dirY * 12,
          isPlayerBullet: true,
          damage: 10,
          width: 8,
          height: 8
        };
      }
      return null;
    } else if (this.weaponUpgraded) {
      // Minigun - rapid fire burst
      if (this.minigunCooldown <= 0) {
        this.minigunCooldown = 3; // Very fast fire rate
        
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = length > 0 ? dx / length : 1;
        const dirY = length > 0 ? dy / length : 0;
        
        // Minigun fires multiple bullets in a spread
        const bullets = [];
        for (let i = 0; i < 3; i++) {
          const spread = (i - 1) * 0.05; // Small spread
          const angle = Math.atan2(dirY, dirX) + spread;
          bullets.push({
            x: this.x,
            y: this.y - 20,
            velocityX: Math.cos(angle) * 12,
            velocityY: Math.sin(angle) * 12,
            isPlayerBullet: true,
            damage: 10,
            width: 8,
            height: 8
          });
        }
        return bullets;
      }
      return null;
    } else {
      // Normal shooting
      if (!this.canShoot()) return null;
      
      this.shootCooldown = this.shootCooldownMax;
      
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const dirX = length > 0 ? dx / length : 1;
      const dirY = length > 0 ? dy / length : 0;
      
      return {
        x: this.x,
        y: this.y - 20,
        velocityX: dirX * 12,
        velocityY: dirY * 12,
        isPlayerBullet: true,
        damage: 10,
        width: 8,
        height: 8
      };
    }
  }
  
  throwGrenade(targetPos) {
    if (!this.hasGrenades || this.grenadeCount <= 0 || this.grenadeCooldown > 0 || this.isThrowingGrenade) return null;
    
    // Start throwing animation
    this.isThrowingGrenade = true;
    this.grenadeThrowFrame = 0;
    
    // Use a grenade
    this.grenadeCount--;
    this.grenadeCooldown = this.grenadeCooldownMax;
    
    // Throw forward (toward target position)
    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = length > 0 ? dx / length : (this.facingRight ? 1 : -1);
    const dirY = length > 0 ? dy / length : -0.2; // Slight upward arc
    
    // Fixed throw power (no charging)
    const throwPower = 8;
    
    return {
      x: this.x + (this.facingRight ? 20 : -20), // Start from hand position
      y: this.y - 15, // Start from hand height
      velocityX: dirX * throwPower,
      velocityY: dirY * throwPower - 5, // Upward arc
      isPlayerBullet: true,
      damage: 30,
      width: 10,
      height: 10,
      isGrenade: true,
      gravity: 0.3,
      explosionRadius: 100,
      rotation: 0, // For spinning animation
      rotationSpeed: 0.3
    };
  }

  checkBulletHit(bullet) {
    // When ducking, player is lower and smaller hitbox - bullets aimed at standing height will miss
    if (this.isDucking) {
      // Ducking hitbox - much lower position, smaller target
      // When ducking, character head is at y - 10 (much lower than standing y - 60)
      // Hitbox should be at ground/feet level: around y - 5 to y - 15
      // Bullets aimed at standing height (y - 40 to y - 60) will pass over
      const duckY = this.y - 10; // Very low hitbox when ducking (near ground level)
      const duckHeight = 15; // Very small hitbox - only lower legs/feet area when ducking
      const dx = this.x - bullet.x;
      const dy = duckY - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Only hit if bullet is in the very low ducking hitbox area
      // Bullets at torso/head level (y - 20 and above) will pass over
      const hitRadius = (this.width / 2 + bullet.width / 2);
      // Check if bullet is within horizontal bounds AND vertical bounds of ducking hitbox
      if (distance < hitRadius) {
        // Bullet must be within the vertical range of the ducking hitbox (very low)
        // Bullets at y - 20 or above will pass over the ducking player
        return bullet.y >= duckY - duckHeight / 2 && bullet.y <= duckY + duckHeight / 2;
      }
      return false;
    } else {
      // Normal standing hitbox - full body height
      // Standing: head is at y - 60, center is at y - 40, feet at y
      const centerY = this.y - 40; // Center of body when standing
      const dx = this.x - bullet.x;
      const dy = centerY - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = (this.width / 2 + bullet.width / 2);
      // Standing: bullet can hit anywhere on the body (head to feet)
      return distance < hitRadius;
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }
    
    const isMoving = Math.abs(this.velocityX) > 0.1 && this.isGrounded;
    const isShootingNow = this.isShooting || (this.shootCooldown > this.shootCooldownMax - 3);
    const showRifle = isMoving || isShootingNow;
    const isCrouched = this.isDucking; // Crouch when ducking (S key)
    
    // Character dimensions (matching sprite proportions)
    const charWidth = 64;
    const charHeight = 80;
    const centerX = 0;
    // When crouching, move character DOWN (closer to ground) and make shorter
    // In canvas, Y increases downward, so to move DOWN we ADD to Y positions (make less negative)
    // Standing: head at y - 60, center at y - 40
    // Ducking: should move down ~50px and be ~40px shorter
    const crouchDownOffset = isCrouched ? 50 : 0; // Move character down 50px when crouched (closer to ground)
    const heightReduction = isCrouched ? 40 : 0; // Reduce height by 40px when crouched
    // Add crouchDownOffset to move DOWN (closer to ground), subtract heightReduction to make shorter
    // Result: head moves from y-60 to y-50 (10px lower), but also 40px shorter, so effectively head at y-50
    const headY = -charHeight + 20 + crouchDownOffset - heightReduction;
    const torsoY = -charHeight + 45 + crouchDownOffset - heightReduction;
    const waistY = -charHeight + 60 + crouchDownOffset - heightReduction;
    const legStartY = -charHeight + 60 + crouchDownOffset - heightReduction;
    const footY = -20 + crouchDownOffset;
    
    // === HEAD ===
    // Head (dark skin - African American)
    ctx.fillStyle = '#6B4423'; // Dark brown skin
    ctx.beginPath();
    ctx.arc(centerX, headY, 16, 0, Math.PI * 2);
    ctx.fill();
    // Face shading
    ctx.fillStyle = '#5A3A1F';
    ctx.beginPath();
    ctx.arc(centerX - 4, headY + 2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Blue curly hair (curly texture)
    ctx.fillStyle = '#4169E1'; // Royal blue
    ctx.beginPath();
    ctx.arc(centerX, headY - 8, 18, 0, Math.PI * 2);
    ctx.fill();
    // Curly hair texture - multiple curls
    ctx.fillStyle = '#1E90FF'; // Lighter blue
    ctx.beginPath();
    ctx.arc(centerX - 6, headY - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 5, headY - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX - 3, headY - 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 7, headY - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Red bandana
    ctx.fillStyle = '#DC143C'; // Crimson red
    ctx.fillRect(centerX - 18, headY - 3, 36, 10);
    // Bandana knot
    ctx.fillStyle = '#8B0000'; // Dark red
    ctx.fillRect(centerX + 12, headY - 1, 8, 6);
    
    // Beard/goatee
    ctx.fillStyle = '#4A2C1A'; // Dark brown beard
    ctx.beginPath();
    ctx.arc(centerX, headY + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(centerX - 8, headY + 6, 16, 8);
    
    // === TORSO ===
    // Orange shirt
    ctx.fillStyle = '#FF8C00'; // Dark orange
    ctx.fillRect(centerX - 24, torsoY, 48, 25);
    // Shirt shading
    ctx.fillStyle = '#FF7F00';
    ctx.fillRect(centerX - 24, torsoY, 48, 8);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(centerX - 24, torsoY + 17, 48, 8);
    
    // Light grey tactical vest
    ctx.fillStyle = '#D3D3D3'; // Light grey
    ctx.fillRect(centerX - 22, torsoY + 2, 44, 21);
    // Vest pockets
    ctx.fillStyle = '#C0C0C0'; // Silver grey
    // Left pocket
    ctx.fillRect(centerX - 20, torsoY + 5, 12, 8);
    ctx.strokeStyle = '#A0A0A0';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - 20, torsoY + 5, 12, 8);
    // Right pocket
    ctx.fillRect(centerX + 8, torsoY + 5, 12, 8);
    ctx.strokeRect(centerX + 8, torsoY + 5, 12, 8);
    // Center zipper/closure
    ctx.fillStyle = '#808080';
    ctx.fillRect(centerX - 1, torsoY + 2, 2, 21);
    
    // Circular emblem on left shoulder
    ctx.fillStyle = '#2C2C2C'; // Dark emblem
    ctx.beginPath();
    ctx.arc(centerX - 18, torsoY + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // === ARMS ===
    // Left arm (orange shirt sleeve)
    ctx.fillStyle = '#FF8C00';
    if (showRifle) {
      // Arm holding rifle - bent upward
      ctx.save();
      ctx.translate(centerX - 18, torsoY + 6);
      ctx.rotate(0.4);
      ctx.fillRect(-5, -6, 10, 22);
      ctx.restore();
    } else {
      // Idle - arm at side, bent slightly
      ctx.save();
      ctx.translate(centerX - 26, torsoY + 2);
      ctx.rotate(0.1);
      ctx.fillRect(-6, 0, 12, 28);
      ctx.restore();
    }
    
    // Right arm (orange shirt sleeve)
    ctx.fillStyle = '#FF8C00';
    if (this.isThrowingGrenade) {
      // Throwing animation - arm raised and extended backward
      const throwProgress = Math.min(this.grenadeThrowFrame / 20, 1);
      const throwAngle = -0.8 - (throwProgress * 1.2); // Start at -0.8, end at -2.0 (overhead throw)
      ctx.save();
      ctx.translate(centerX + 18, torsoY + 6);
      ctx.rotate(throwAngle);
      ctx.fillRect(-5, -6, 10, 22);
      ctx.restore();
    } else if (showRifle) {
      // Arm holding rifle - bent forward
      ctx.save();
      ctx.translate(centerX + 18, torsoY + 6);
      ctx.rotate(-0.3);
      ctx.fillRect(-5, -6, 10, 22);
      ctx.restore();
    } else {
      // Idle - arm at side, bent slightly
      ctx.save();
      ctx.translate(centerX + 26, torsoY + 2);
      ctx.rotate(-0.1);
      ctx.fillRect(-6, 0, 12, 28);
      ctx.restore();
    }
    
    // Green gloves
    ctx.fillStyle = '#228B22'; // Forest green
    if (showRifle) {
      // Left hand supporting rifle
      ctx.save();
      ctx.translate(centerX - 16, torsoY + 24);
      ctx.rotate(0.4);
      ctx.fillRect(-6, -5, 12, 10);
      ctx.restore();
      // Right hand on rifle trigger
      ctx.save();
      ctx.translate(centerX + 20, torsoY + 24);
      ctx.rotate(-0.3);
      ctx.fillRect(-6, -5, 12, 10);
      ctx.restore();
    } else {
      // Idle - hands at sides (clenched fists)
      ctx.save();
      ctx.translate(centerX - 28, torsoY + 28);
      ctx.rotate(0.1);
      ctx.fillRect(-7, -6, 14, 12);
      ctx.restore();
      ctx.save();
      ctx.translate(centerX + 28, torsoY + 28);
      ctx.rotate(-0.1);
      ctx.fillRect(-7, -6, 14, 12);
      ctx.restore();
    }
    
    // === WAIST & BELT ===
    // Belt
    ctx.fillStyle = '#654321'; // Brown belt
    ctx.fillRect(centerX - 24, waistY, 48, 4);
    
    // Bag hanging from belt (on right side)
    ctx.fillStyle = '#8B4513'; // Brown bag
    ctx.fillRect(centerX + 20, waistY + 4, 14, 18);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX + 20, waistY + 4, 14, 18);
    // Bag strap connecting to belt
    ctx.fillStyle = '#654321';
    ctx.fillRect(centerX + 22, waistY, 10, 4);
    // Bag flap
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(centerX + 20, waistY + 4, 14, 5);
    // Bag buckle/clasp
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(centerX + 24, waistY + 6, 6, 3);
    
    // === LEGS ===
    // Legs (blue pants)
    ctx.fillStyle = '#0000CD'; // Medium blue
    const isWalking = isMoving && this.isGrounded;

    if (isCrouched) {
      // Crouched legs
      ctx.fillRect(centerX - 20, legStartY + 10, 15, 20); // Left thigh
      ctx.fillRect(centerX + 5, legStartY + 10, 15, 20); // Right thigh
      ctx.fillRect(centerX - 15, legStartY + 30, 10, 15); // Left shin
      ctx.fillRect(centerX + 5, legStartY + 30, 10, 15); // Right shin
    } else if (isWalking) {
      // Walking animation - alternate leg positions
      const leftForward = this.walkFrame === 0 || this.walkFrame === 2;
      const rightForward = this.walkFrame === 1 || this.walkFrame === 3;
      
      // Left leg
      if (leftForward) {
        ctx.save();
        ctx.translate(centerX - 10, legStartY);
        ctx.rotate(0.2);
        ctx.fillRect(-6, 0, 12, 40);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(centerX - 10, legStartY);
        ctx.rotate(-0.15);
        ctx.fillRect(-6, 0, 12, 40);
        ctx.restore();
      }
      
      // Right leg
      if (rightForward) {
        ctx.save();
        ctx.translate(centerX + 10, legStartY);
        ctx.rotate(0.2);
        ctx.fillRect(-6, 0, 12, 40);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(centerX + 10, legStartY);
        ctx.rotate(-0.15);
        ctx.fillRect(-6, 0, 12, 40);
        ctx.restore();
      }
    } else {
      // Standing - feet spread apart
      ctx.fillRect(centerX - 12, legStartY, 12, 40);
      ctx.fillRect(centerX + 2, legStartY, 12, 40);
    }

    // Boots (brown camo)
    ctx.fillStyle = '#8B4513'; // Base brown
    if (isCrouched) {
      ctx.fillRect(centerX - 15, footY + 25, 10, 10); // Left boot
      ctx.fillRect(centerX + 5, footY + 25, 10, 10); // Right boot
    } else if (isWalking) {
      const leftForward = this.walkFrame === 0 || this.walkFrame === 2;
      const rightForward = this.walkFrame === 1 || this.walkFrame === 3;
      
      if (leftForward) {
        ctx.fillRect(centerX - 16, footY, 14, 10);
      } else {
        ctx.fillRect(centerX - 14, footY + 2, 14, 10);
      }
      
      if (rightForward) {
        ctx.fillRect(centerX + 4, footY, 14, 10);
      } else {
        ctx.fillRect(centerX + 2, footY + 2, 14, 10);
      }
    } else {
      // Standing - left foot slightly forward
      ctx.fillRect(centerX - 14, footY, 14, 10);
      ctx.fillRect(centerX + 4, footY, 14, 10);
    }
    
    // Camo pattern on boots
    ctx.fillStyle = '#654321'; // Darker brown
    ctx.fillRect(centerX - 12, footY + 2, 4, 3);
    ctx.fillRect(centerX - 8, footY + 6, 3, 2);
    ctx.fillRect(centerX + 6, footY + 3, 4, 3);
    ctx.fillRect(centerX + 10, footY + 7, 3, 2);
    
    // Boot soles
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(centerX - 14, footY + 10, 14, 2);
    ctx.fillRect(centerX + 4, footY + 10, 14, 2);
    
    // === WEAPON ===
    if (showRifle) {
      // Dark grey assault rifle
      ctx.fillStyle = '#2C2C2C';
      ctx.fillRect(centerX + 8, torsoY + 10, 35, 4);
      ctx.fillRect(centerX + 43, torsoY + 11, 15, 3);
      
      // Muzzle flash when firing
      if (isShootingNow) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX + 58, torsoY + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(centerX + 58, torsoY + 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
}
