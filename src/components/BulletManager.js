export class BulletManager {
  constructor() {
    this.bullets = [];
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }

  removeBullet(bullet) {
    const index = this.bullets.indexOf(bullet);
    if (index > -1) {
      this.bullets.splice(index, 1);
    }
  }

  update(dt, cameraX) {
    this.bullets = this.bullets.filter(bullet => {
      // Update position
      bullet.x += bullet.velocityX * dt;
      bullet.y += bullet.velocityY * dt;
      
      // Apply gravity for grenades
      if (bullet.isGrenade) {
        bullet.velocityY += bullet.gravity * dt;
        // Rotate grenade as it flies
        if (bullet.rotation !== undefined) {
          bullet.rotation += (bullet.rotationSpeed || 0.3) * dt;
        } else {
          bullet.rotation = 0;
          bullet.rotationSpeed = 0.3;
        }
      }
      
      // Remove if off screen or hit ground (for grenades)
      if (bullet.x < cameraX - 100 || bullet.x > cameraX + 2000) {
        return false;
      }
      // Don't remove grenades here - let App.js handle explosion
      if (bullet.y > 720 && !bullet.isGrenade) {
        return false;
      }
      
      return true;
    });
  }

  getBullets() {
    return this.bullets;
  }

  draw(ctx, cameraX) {
    this.bullets.forEach(bullet => {
      const screenX = bullet.x - cameraX;
      
      if (screenX < -50 || screenX > 1500) return;
      
      ctx.save();
      
      if (bullet.isGrenade) {
        // Draw grenade with rotation
        ctx.translate(screenX, bullet.y);
        if (bullet.rotation !== undefined) {
          ctx.rotate(bullet.rotation);
        }
        
        // Grenade body (oval shape)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, 0, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Grenade segments
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fuse (sparkling)
        const fuseTime = Date.now() * 0.01;
        ctx.fillStyle = `hsl(${fuseTime * 10 % 360}, 100%, 50%)`;
        ctx.fillRect(-2, -bullet.height / 2 - 4, 4, 6);
        
        // Sparkle effect
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-2 + Math.sin(fuseTime) * 2, -bullet.height / 2 - 2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      } else {
        // Draw bullet
        ctx.fillStyle = bullet.isPlayerBullet ? '#FFFF00' : '#FF0000';
        ctx.beginPath();
        ctx.arc(screenX, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.fillStyle = bullet.isPlayerBullet ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX - bullet.velocityX * 2, bullet.y - bullet.velocityY * 2, bullet.width / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }
}
