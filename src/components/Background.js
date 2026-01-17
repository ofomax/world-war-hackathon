// src/components/Background.js

export class Background {
  static initialized = false;

  // ================= FILE PATHS =================
  static skyPath = "/backgrounds/level1/sky.png";
  static baseTilePath = "/backgrounds/level1/base_tile.png";

  static chunkSets = {
    walk: [
      "/backgrounds/level1/chunk_walk_1.png",
      "/backgrounds/level1/chunk_walk_2.png",
      "/backgrounds/level1/chunk_walk_3.png",
    ],
    run: [
      "/backgrounds/level1/chunk_run_1.png",
      "/backgrounds/level1/chunk_run_2.png",
      "/backgrounds/level1/chunk_run_3.png",
    ],
    fast: [
      "/backgrounds/level1/chunk_fast_1.png",
      "/backgrounds/level1/chunk_fast_2.png",
      "/backgrounds/level1/chunk_fast_3.png",
    ],
  };

  // ================= TUNING =================
  static skyParallax = 0.08; // slowest
  static baseParallax = 0.30;
  static chunkParallax = 0.34;

  static speedWalk = 4;
  static speedRun = 9;

  // Smooth tier transitions (kept from your current file)
  static currentTier = "walk";
  static tierTransitionTime = 0;
  static tierTransitionDuration = 60;
  static lastCameraSpeed = 0;

  // ================= IMAGE STATE =================
  static skyImg = null;
  static skyReady = false;

  static baseImg = null;
  static baseReady = false;

  static chunkImgs = { walk: [], run: [], fast: [] };
  static chunkReady = { walk: false, run: false, fast: false };

  // ================= CACHE =================
  static cacheHeight = null;

  static skyScaledCanvas = null;
  static skyPattern = null;

  static baseScaledCanvas = null;
  static basePattern = null;

  static chunkScaled = { walk: [], run: [], fast: [] };

  // Per-tier segment width (derived from actual image widths)
  static segmentWorldWidthByTier = { walk: 900, run: 900, fast: 900 };

  // ================= INIT =================
  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // ----- Sky -----
    this.skyImg = new Image();
    this.skyImg.src = (process.env.PUBLIC_URL || "") + this.skyPath;

    this.skyImg.onload = () => {
      this.skyReady = true;
      this.cacheHeight = null;
    };

    this.skyImg.onerror = () => {
      console.error("❌ Failed to load sky:", this.skyImg.src);
    };

    // ----- Base tile -----
    this.baseImg = new Image();
    this.baseImg.src = (process.env.PUBLIC_URL || "") + this.baseTilePath;

    this.baseImg.onload = () => {
      this.baseReady = true;
      this.cacheHeight = null;
    };

    this.baseImg.onerror = () => {
      console.error("❌ Failed to load base tile:", this.baseImg.src);
    };

    // ----- Chunk sets -----
    const loadSet = (tier) => {
      const paths = this.chunkSets[tier];
      let loaded = 0;

      this.chunkImgs[tier] = paths.map((p) => {
        const img = new Image();
        img.src = (process.env.PUBLIC_URL || "") + p;

        img.onload = () => {
          loaded++;
          if (loaded === paths.length) {
            this.chunkReady[tier] = true;
            this.cacheHeight = null;
          }
        };

        img.onerror = () => {
          console.error("❌ Failed to load chunk:", img.src);
        };

        return img;
      });
    };

    loadSet("walk");
    loadSet("run");
    loadSet("fast");
  }

  // ================= UTILS =================
  static hash(n) {
    const s = Math.sin(n * 9999.123 + 0.12345) * 10000;
    return s - Math.floor(s);
  }

  static getTier(speedAbs) {
    if (speedAbs >= this.speedRun) return "fast";
    if (speedAbs >= this.speedWalk) return "run";
    return "walk";
  }

  static getSmoothTier(speedAbs) {
    const targetTier = this.getTier(speedAbs);

    if (targetTier !== this.currentTier && this.tierTransitionTime === 0) {
      this.tierTransitionTime = 1;
    }

    if (
      this.tierTransitionTime > 0 &&
      this.tierTransitionTime < this.tierTransitionDuration
    ) {
      this.tierTransitionTime++;
      const progress = this.tierTransitionTime / this.tierTransitionDuration;

      if (progress < 0.7) {
        return this.currentTier;
      } else {
        this.currentTier = targetTier;
        this.tierTransitionTime = 0;
        return targetTier;
      }
    }

    if (this.tierTransitionTime === 0) {
      this.currentTier = targetTier;
    }

    return this.currentTier;
  }

  // ================= SCALE + OPTIONAL FEATHER =================
  static scaleToHeight(img, targetHeight, featherEdges = false) {
    const scale = targetHeight / img.height;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(targetHeight));

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;

    const cctx = c.getContext("2d");
    cctx.imageSmoothingEnabled = true;
    cctx.drawImage(img, 0, 0, w, h);

    if (featherEdges) {
      const fade = Math.min(80, Math.floor(w * 0.12));
      if (fade > 0) {
        cctx.globalCompositeOperation = "destination-in";

        const g = cctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(fade / w, "rgba(0,0,0,1)");
        g.addColorStop(1 - fade / w, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");

        cctx.fillStyle = g;
        cctx.fillRect(0, 0, w, h);

        cctx.globalCompositeOperation = "source-over";
      }
    }

    return c;
  }

  // ================= CACHE BUILDER =================
  static ensureCache(ctx, canvasHeight) {
    const skyNeedsBuild =
      this.skyReady && (!this.skyPattern || !this.skyScaledCanvas);

    const baseNeedsBuild =
      this.baseReady && (!this.basePattern || !this.baseScaledCanvas);

    const walkNeedsBuild =
      this.chunkReady.walk && this.chunkScaled.walk.length === 0;
    const runNeedsBuild =
      this.chunkReady.run && this.chunkScaled.run.length === 0;
    const fastNeedsBuild =
      this.chunkReady.fast && this.chunkScaled.fast.length === 0;

    if (
      this.cacheHeight === canvasHeight &&
      !skyNeedsBuild &&
      !baseNeedsBuild &&
      !walkNeedsBuild &&
      !runNeedsBuild &&
      !fastNeedsBuild
    ) {
      return;
    }

    this.cacheHeight = canvasHeight;

    // ---- Sky ----
    this.skyPattern = null;
    this.skyScaledCanvas = null;
    if (this.skyReady && this.skyImg) {
      this.skyScaledCanvas = this.scaleToHeight(this.skyImg, canvasHeight, false);
      this.skyPattern = ctx.createPattern(this.skyScaledCanvas, "repeat");
    }

    // ---- Base tile ----
    this.basePattern = null;
    this.baseScaledCanvas = null;
    if (this.baseReady && this.baseImg) {
      this.baseScaledCanvas = this.scaleToHeight(this.baseImg, canvasHeight, false);
      this.basePattern = ctx.createPattern(this.baseScaledCanvas, "repeat");
    }

    // ---- Chunks + segment width ----
    for (const tier of ["walk", "run", "fast"]) {
      this.chunkScaled[tier] = [];

      if (!this.chunkReady[tier]) continue;

      for (let i = 0; i < this.chunkImgs[tier].length; i++) {
        const img = this.chunkImgs[tier][i];
        this.chunkScaled[tier][i] = this.scaleToHeight(img, canvasHeight, true);
      }

      const widths = this.chunkScaled[tier].map((c) => c.width);
      const minW = Math.min(...widths);

      this.segmentWorldWidthByTier[tier] = Math.floor(minW / this.chunkParallax);
    }
  }

  // ================= DRAW =================
  static draw(ctx, cameraX, canvasWidth, canvasHeight, cameraSpeed = 0) {
    this.init();
    this.ensureCache(ctx, canvasHeight);

    // Smooth speed to prevent flicker
    const speedAbs = Math.abs(cameraSpeed);
    const smoothedSpeed = this.lastCameraSpeed * 0.7 + speedAbs * 0.3;
    this.lastCameraSpeed = smoothedSpeed;

    // ---------- 0) SKY (always behind everything) ----------
    if (this.skyPattern && this.skyScaledCanvas) {
      ctx.save();

      const tileW = this.skyScaledCanvas.width;
      let offsetX = -Math.floor(cameraX * this.skyParallax) % tileW;
      if (offsetX > 0) offsetX -= tileW;

      ctx.translate(offsetX, 0);
      ctx.fillStyle = this.skyPattern;
      ctx.fillRect(-tileW, 0, canvasWidth + tileW * 2, canvasHeight);

      ctx.restore();
    } else {
      // fallback sky if missing
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // ---------- 1) BASE TILE ----------
    if (this.basePattern && this.baseScaledCanvas) {
      ctx.save();

      const tileW = this.baseScaledCanvas.width;
      let offsetX = -Math.floor(cameraX * this.baseParallax) % tileW;
      if (offsetX > 0) offsetX -= tileW;

      ctx.translate(offsetX, 0);
      ctx.fillStyle = this.basePattern;

      ctx.fillRect(-tileW, 0, canvasWidth + tileW * 2, canvasHeight);

      ctx.restore();
    }

    // ---------- 2) CHUNK OVERLAYS ----------
    // Your current file draws ALL tiers for depth. Keep that behavior.
    const tiers = ["walk", "run", "fast"];

    for (const tier of tiers) {
      const chunks = this.chunkScaled[tier];
      if (!chunks || chunks.length === 0) continue;

      const segW = this.segmentWorldWidthByTier[tier];
      const worldLeft = cameraX;
      const worldRight = cameraX + canvasWidth;

      const segStart = Math.floor(worldLeft / segW) - 1;
      const segEnd = Math.floor(worldRight / segW) + 1;

      const opacity = tier === "walk" ? 1.0 : tier === "run" ? 0.8 : 0.6;

      for (let seg = segStart; seg <= segEnd; seg++) {
        const pick = Math.floor(
          this.hash(seg * 31.7 + tier.charCodeAt(0) * 100) * chunks.length
        );
        const chunkCanvas = chunks[pick];
        if (!chunkCanvas) continue;

        const worldX = seg * segW;
        const screenX = (worldX - cameraX) * this.chunkParallax;

        if (
          screenX > -chunkCanvas.width &&
          screenX < canvasWidth + chunkCanvas.width
        ) {
          ctx.globalAlpha = opacity;
          ctx.drawImage(chunkCanvas, Math.floor(screenX), 0);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }
}
