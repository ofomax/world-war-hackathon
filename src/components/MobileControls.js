import React from 'react';
import './MobileControls.css';

export function MobileControls({ 
  onKeyDown, 
  onKeyUp, 
  onShootDown, 
  onShootUp,
  onGrenade,
  onPause,
  hasGrenades,
  grenadeCount
}) {
  // Detect if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   (window.innerWidth <= 768);

  if (!isMobile) {
    return null;
  }

  const handleTouchStart = (key) => (e) => {
    e.preventDefault();
    if (onKeyDown) {
      onKeyDown(key);
    }
  };

  const handleTouchEnd = (key) => (e) => {
    e.preventDefault();
    if (onKeyUp) {
      onKeyUp(key);
    }
  };

  const handleShootStart = (e) => {
    e.preventDefault();
    if (onShootDown) {
      onShootDown();
    }
  };

  const handleShootEnd = (e) => {
    e.preventDefault();
    if (onShootUp) {
      onShootUp();
    }
  };

  const handleGrenade = (e) => {
    e.preventDefault();
    if (onGrenade && hasGrenades && grenadeCount > 0) {
      onGrenade();
    }
  };

  const handlePause = (e) => {
    e.preventDefault();
    if (onPause) {
      onPause();
    }
  };

  return (
    <div className="mobile-controls">
      <div className="mobile-controls-left">
        {/* Movement controls */}
        <div className="mobile-controls-movement">
          <button
            className="mobile-btn mobile-btn-jump"
            onTouchStart={handleTouchStart('w')}
            onTouchEnd={handleTouchEnd('w')}
            onMouseDown={handleTouchStart('w')}
            onMouseUp={handleTouchEnd('w')}
          >
            W
          </button>
          <div className="mobile-controls-horizontal">
            <button
              className="mobile-btn mobile-btn-left"
              onTouchStart={handleTouchStart('a')}
              onTouchEnd={handleTouchEnd('a')}
              onMouseDown={handleTouchStart('a')}
              onMouseUp={handleTouchEnd('a')}
            >
              A
            </button>
            <button
              className="mobile-btn mobile-btn-duck"
              onTouchStart={handleTouchStart('s')}
              onTouchEnd={handleTouchEnd('s')}
              onMouseDown={handleTouchStart('s')}
              onMouseUp={handleTouchEnd('s')}
            >
              S
            </button>
            <button
              className="mobile-btn mobile-btn-right"
              onTouchStart={handleTouchStart('d')}
              onTouchEnd={handleTouchEnd('d')}
              onMouseDown={handleTouchStart('d')}
              onMouseUp={handleTouchEnd('d')}
            >
              D
            </button>
          </div>
        </div>
      </div>
      
      <div className="mobile-controls-right">
        {/* Action controls */}
        <button
          className="mobile-btn mobile-btn-shoot"
          onTouchStart={handleShootStart}
          onTouchEnd={handleShootEnd}
          onMouseDown={handleShootStart}
          onMouseUp={handleShootEnd}
        >
          🔫
        </button>
        {hasGrenades && grenadeCount > 0 && (
          <button
            className="mobile-btn mobile-btn-grenade"
            onTouchStart={handleGrenade}
            onTouchEnd={(e) => e.preventDefault()}
            onMouseDown={handleGrenade}
          >
            💣
          </button>
        )}
        <button
          className="mobile-btn mobile-btn-pause"
          onTouchStart={handlePause}
          onTouchEnd={(e) => e.preventDefault()}
          onMouseDown={handlePause}
        >
          ⏸
        </button>
      </div>
    </div>
  );
}
