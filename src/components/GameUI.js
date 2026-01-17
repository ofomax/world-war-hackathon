import React, { useState } from 'react';
import './GameUI.css';
import { Settings } from './Settings';

export function GameUI({ health, score, stage, gameOver, paused, playerName, grenadeCount, onRestart }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="game-ui">
      <div className="ui-top">
        {playerName && (
          <div className="ui-section">
            <span className="ui-label">Soldier:</span>
            <span className="ui-value">{playerName}</span>
          </div>
        )}
        <div className="ui-section">
          <span className="ui-label">Stage:</span>
          <span className="ui-value">{stage}/5</span>
        </div>
        <div className="ui-section">
          <span className="ui-label">Score:</span>
          <span className="ui-value">{score.toLocaleString()}</span>
        </div>
        <div className="ui-section health-section">
          <span className="ui-label">Health:</span>
          <div className="health-bar-container">
            <div 
              className="health-bar"
              style={{ width: `${Math.max(0, health)}%` }}
            />
            <span className="health-text">{Math.max(0, Math.round(health))}/100</span>
          </div>
          {grenadeCount > 0 && (
            <div className="grenade-indicator">
              <span className="grenade-icon">💣</span>
              <span className="grenade-count">{grenadeCount}</span>
            </div>
          )}
        </div>
        <div className="ui-section">
          <button 
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {(gameOver || paused) && (
        <div className="overlay">
          <div className="overlay-content">
            {gameOver ? (
              <>
                <h1>Game Over</h1>
                <p>Final Score: {score.toLocaleString()}</p>
                <p>Stage Reached: {stage}</p>
                <button className="intro-button" onClick={onRestart}>
                  Restart Game
                </button>
              </>
            ) : (
              <>
                <h1>Paused</h1>
                <p>Press P to resume</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
