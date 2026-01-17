// src/App.js
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Player from "./components/Player";
import { EnemyManager } from "./components/EnemyManager";
import { BulletManager } from "./components/BulletManager";
import { Background } from "./components/Background";
import { GameUI } from "./components/GameUI";
import { IntroModal } from "./components/IntroModal";
import { AudioManager } from "./components/AudioManager";
import { MobileControls } from "./components/MobileControls";

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GRAVITY = 0.8;
const GROUND_Y = CANVAS_HEIGHT - 100;

function App() {
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState({
    stage: 1,
    score: 0,
    gameOver: false,
    paused: false,
    started: false,
    playerName: '',
    health: 100, // Track health in state for UI updates
    grenadeCount: 0, // Track grenade count for UI
  });

  // ---- REFS to stop loop restarts ----
  const gameStateRef = useRef(gameState);
  const keysRef = useRef({});
  const mousePosRef = useRef({ x: 0, y: 0 });
  const mouseDownRef = useRef(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const playerRef = useRef(null);
  const enemyManagerRef = useRef(null);
  const bulletManagerRef = useRef(null);

  const cameraXRef = useRef(0);
  const lastCameraXRef = useRef(0);

  // Initialize audio
  useEffect(() => {
    AudioManager.init();
    return () => {
      AudioManager.stopTheme();
    };
  }, []);
  
  // Initialize player
  useEffect(() => {
    playerRef.current = new Player(100, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    bulletManagerRef.current = new BulletManager();
  }, []);

  // Initialize enemy manager per stage and when game starts
  useEffect(() => {
    if (gameState.started) {
      enemyManagerRef.current = new EnemyManager(
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        gameState.stage
      );
    }
  }, [gameState.stage, gameState.started]);

  // Keyboard input (write to ref, only update React state when toggling pause)
  const qPressedRef = useRef(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      
      // Handle Q key for grenades (single press to throw forward)
      if (k === "q" && !qPressedRef.current && playerRef.current?.hasGrenades && (playerRef.current?.grenadeCount || 0) > 0) {
        qPressedRef.current = true;
        // Throw grenade forward immediately
        const worldMouseX = playerRef.current.x + (playerRef.current.facingRight ? 200 : -200); // Throw forward
        const worldMouseY = playerRef.current.y - 20; // Slight upward angle
        const grenade = playerRef.current.throwGrenade({ x: worldMouseX, y: worldMouseY });
        if (grenade && bulletManagerRef.current) {
          bulletManagerRef.current.addBullet(grenade);
        }
      }

      if (k === "p") {
        setGameState((prev) => ({ ...prev, paused: !prev.paused }));
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      
      // Reset Q key flag
      if (k === "q") {
        qPressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse and touch input (write to refs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseDown = () => (mouseDownRef.current = true);
    const handleMouseUp = () => (mouseDownRef.current = false);

    // Touch events for mobile
    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        mousePosRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        mousePosRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        mouseDownRef.current = true;
      }
    };

    const handleTouchEnd = () => {
      mouseDownRef.current = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Game loop (RUN ONCE)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let lastTime = 0;

    lastCameraXRef.current = cameraXRef.current;

    const gameLoop = (currentTime) => {
      const gs = gameStateRef.current;

      // Start theme music when game starts
      if (gs.started && !gs.paused && !gs.gameOver) {
        AudioManager.playTheme();
      } else if (gs.paused || gs.gameOver) {
        // Don't stop theme on pause, just keep it playing
        // AudioManager.stopTheme();
      }

      if (!gs.started || gs.paused || gs.gameOver) {
        // Still clear and show background even when paused/not started
        if (gs.started) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          // Draw background even when paused
          if (gs.paused || gs.gameOver) {
            Background.draw(ctx, cameraXRef.current, CANVAS_WIDTH, CANVAS_HEIGHT, 0);
          }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const dt = Math.min(deltaTime / 16, 2);

      // Clear
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update camera
      if (playerRef.current) {
        cameraXRef.current = playerRef.current.x - CANVAS_WIDTH / 3;
        cameraXRef.current = Math.max(0, cameraXRef.current);
      }

      // cameraSpeed (clamped to avoid tier flicker)
      const rawSpeed =
        (cameraXRef.current - lastCameraXRef.current) / Math.max(dt, 0.0001);
      const cameraSpeed = Math.max(-20, Math.min(20, rawSpeed));
      lastCameraXRef.current = cameraXRef.current;

      // Background (tile + chunks)
      Background.draw(ctx, cameraXRef.current, CANVAS_WIDTH, CANVAS_HEIGHT, cameraSpeed);

      // Update/draw player
      if (playerRef.current) {
        playerRef.current.update(
          keysRef.current,
          mousePosRef.current,
          mouseDownRef.current,
          dt,
          GROUND_Y,
          GRAVITY
        );
        playerRef.current.draw(ctx, cameraXRef.current);
        
        // Update health and grenade count in state periodically for UI (every frame to ensure it's always current)
        if (playerRef.current.health !== gameStateRef.current.health || 
            (playerRef.current.grenadeCount || 0) !== gameStateRef.current.grenadeCount) {
          setGameState((prev) => ({ 
            ...prev, 
            health: playerRef.current.health,
            grenadeCount: playerRef.current.grenadeCount || 0
          }));
        }

        // Handle shooting
        if (mouseDownRef.current && (playerRef.current.canShoot() || playerRef.current.weaponUpgraded || playerRef.current.hasMachineGun)) {
          // Check if mobile
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
          let worldMouseX, worldMouseY;
          
          if (isMobile) {
            // Mobile: Calculate aim direction based on active movement keys
            const keys = keysRef.current;
            const playerX = playerRef.current.x;
            const playerY = playerRef.current.y;
            const offset = 200; // Distance to aim ahead
            
            let aimX = playerX;
            let aimY = playerY;
            
            // Determine horizontal direction
            if (keys['d']) {
              aimX = playerX + offset; // Shoot right/forward
            } else if (keys['a']) {
              aimX = playerX - offset; // Shoot left
            }
            
            // Determine vertical direction
            if (keys['w']) {
              aimY = playerY - offset; // Shoot up
            }
            
            worldMouseX = aimX;
            worldMouseY = aimY;
          } else {
            // Desktop: convert screen coordinates to world coordinates
            worldMouseX = mousePosRef.current.x + cameraXRef.current;
            worldMouseY = mousePosRef.current.y;
          }
          
          const bullets = playerRef.current.shoot({ x: worldMouseX, y: worldMouseY });
          if (bullets && bulletManagerRef.current) {
            // Handle both single bullet and array of bullets
            if (Array.isArray(bullets)) {
              bullets.forEach(bullet => bulletManagerRef.current.addBullet(bullet));
              AudioManager.playHeroShot(); // Play sound for minigun burst
            } else {
              bulletManagerRef.current.addBullet(bullets);
              AudioManager.playHeroShot(); // Play sound for single shot
            }
          }
        }
        
      }

      // Enemies
      if (enemyManagerRef.current) {
        enemyManagerRef.current.update(dt, playerRef.current, cameraXRef.current, gameStateRef.current.score);
        enemyManagerRef.current.draw(ctx, cameraXRef.current);

        const enemyBullets = enemyManagerRef.current.getBullets();
        enemyBullets.forEach((b) => bulletManagerRef.current?.addBullet(b));
      }

      // Bullets
      if (bulletManagerRef.current) {
        bulletManagerRef.current.update(dt, cameraXRef.current);
        bulletManagerRef.current.draw(ctx, cameraXRef.current);

        const bullets = bulletManagerRef.current.getBullets();
        bullets.forEach((bullet) => {
          // Handle grenade explosions (check in bullet update or here)
          if (bullet.isGrenade) {
            // Check if grenade hit ground or enemy
            if (bullet.y >= GROUND_Y - 20) {
              // Create explosion effect
              const explosionX = bullet.x;
              const explosionY = bullet.y;
              
              // Play explosion sound immediately when grenade hits
              AudioManager.playGrenadeSfx();
              
              // Explode grenade - damage all enemies in radius
              if (enemyManagerRef.current) {
                const enemies = enemyManagerRef.current.getEnemies();
                enemies.forEach(enemy => {
                  if (!enemy.isDead) {
                    const dx = enemy.x - explosionX;
                    const dy = enemy.y - explosionY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < bullet.explosionRadius) {
                      enemy.takeDamage(bullet.damage);
                    }
                  }
                });
              }
              
              // Draw explosion (one frame before removal)
              ctx.save();
              const screenX = explosionX - cameraXRef.current;
              const screenY = explosionY;
              
              // Explosion rings
              const time = Date.now() * 0.02;
              for (let i = 0; i < 3; i++) {
                const radius = 30 + i * 20;
                const alpha = 0.8 - i * 0.2;
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
                gradient.addColorStop(0, `rgba(255, ${100 + i * 50}, 0, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 69, 0, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
                ctx.fill();
              }
              
              // Fire particles
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dist = 40 + Math.sin(time + i) * 10;
                const px = screenX + Math.cos(angle) * dist;
                const py = screenY + Math.sin(angle) * dist;
                ctx.fillStyle = `hsl(${30 + i * 5}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(px, py, 4 + Math.sin(time + i) * 2, 0, Math.PI * 2);
                ctx.fill();
              }
              
              // Smoke cloud
              const smokeGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 60);
              smokeGradient.addColorStop(0, 'rgba(100, 100, 100, 0.6)');
              smokeGradient.addColorStop(0.5, 'rgba(80, 80, 80, 0.3)');
              smokeGradient.addColorStop(1, 'rgba(60, 60, 60, 0)');
              ctx.fillStyle = smokeGradient;
              ctx.beginPath();
              ctx.arc(screenX, screenY - 20, 60, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.restore();
              
              bulletManagerRef.current.removeBullet(bullet);
              return;
            }
          }
          
          if (bullet.isPlayerBullet && enemyManagerRef.current) {
            const hit = enemyManagerRef.current.checkBulletHit(bullet);
            if (hit) {
              bulletManagerRef.current.removeBullet(bullet);
              setGameState((prev) => ({ ...prev, score: prev.score + 10 }));
            }
              } else if (!bullet.isPlayerBullet && playerRef.current) {
            if (playerRef.current.checkBulletHit(bullet)) {
              bulletManagerRef.current.removeBullet(bullet);
              playerRef.current.takeDamage(bullet.damage || 10);
              
              // Update health in state for UI
              setGameState((prev) => ({ ...prev, health: playerRef.current.health }));

              if (playerRef.current.health <= 0) {
                AudioManager.playDeadSong();
                // Save high score
                const scores = JSON.parse(localStorage.getItem('highScores') || '[]');
                scores.push({ 
                  name: gameStateRef.current.playerName, 
                  score: gameStateRef.current.score,
                  date: new Date().toISOString()
                });
                const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 3);
                localStorage.setItem('highScores', JSON.stringify(sorted));
                setGameState((prev) => ({ ...prev, gameOver: true }));
              }
            }
          }
        });
      }

      // Stage progression
      if (enemyManagerRef.current && enemyManagerRef.current.isStageComplete()) {
        setGameState((prev) => {
          if (prev.stage < 5) return { ...prev, stage: prev.stage + 1 };
          return { ...prev, gameOver: true };
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleStartGame = (name) => {
    setGameState(prev => ({ ...prev, started: true, playerName: name, gameOver: false, paused: false, score: 0, stage: 1, health: 100, grenadeCount: 0 }));
    // Reset player and enemy manager when starting
    playerRef.current = new Player(100, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    bulletManagerRef.current = new BulletManager();
    enemyManagerRef.current = new EnemyManager(CANVAS_WIDTH, CANVAS_HEIGHT, 1);
    cameraXRef.current = 0;
    AudioManager.playTheme();
  };
  
  const handleRestart = () => {
    setGameState(prev => ({ ...prev, started: false, gameOver: false, paused: false, score: 0, stage: 1, playerName: '', health: 100, grenadeCount: 0 }));
    playerRef.current = new Player(100, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
    bulletManagerRef.current = new BulletManager();
    enemyManagerRef.current = null;
    cameraXRef.current = 0;
  };

  // Mobile control handlers
  const handleMobileKeyDown = (key) => {
    keysRef.current[key] = true;
  };

  const handleMobileKeyUp = (key) => {
    keysRef.current[key] = false;
  };

  const handleMobileShootDown = () => {
    // Just set shooting flag - direction will be calculated in game loop based on active keys
    mouseDownRef.current = true;
  };

  const handleMobileShootUp = () => {
    mouseDownRef.current = false;
  };

  const handleMobileGrenade = () => {
    if (playerRef.current?.hasGrenades && (playerRef.current?.grenadeCount || 0) > 0) {
      const worldMouseX = playerRef.current.x + (playerRef.current.facingRight ? 200 : -200);
      const worldMouseY = playerRef.current.y - 20;
      const grenade = playerRef.current.throwGrenade({ x: worldMouseX, y: worldMouseY });
      if (grenade && bulletManagerRef.current) {
        bulletManagerRef.current.addBullet(grenade);
      }
    }
  };

  const handleMobilePause = () => {
    setGameState((prev) => ({ ...prev, paused: !prev.paused }));
  };

  return (
    <div className="App">
      {!gameState.started && (
        <IntroModal onStart={handleStartGame} />
      )}
      
      <GameUI
        health={gameState.health}
        score={gameState.score}
        stage={gameState.stage}
        gameOver={gameState.gameOver}
        paused={gameState.paused}
        playerName={gameState.playerName}
        grenadeCount={gameState.grenadeCount}
        onRestart={handleRestart}
      />

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ 
          border: "none", 
          display: "block", 
          margin: "0 auto",
          marginTop: "80px",
          visibility: gameState.started ? "visible" : "hidden"
        }}
      />

      {gameState.started && (
        <MobileControls
          onKeyDown={handleMobileKeyDown}
          onKeyUp={handleMobileKeyUp}
          onShootDown={handleMobileShootDown}
          onShootUp={handleMobileShootUp}
          onGrenade={handleMobileGrenade}
          onPause={handleMobilePause}
          hasGrenades={playerRef.current?.hasGrenades || false}
          grenadeCount={gameState.grenadeCount}
        />
      )}
    </div>
  );
}

export default App;
