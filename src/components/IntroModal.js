import React, { useState, useEffect } from 'react';
import './IntroModal.css';
import { AudioManager } from './AudioManager';

export function IntroModal({ onStart }) {
  const [playerName, setPlayerName] = useState('');
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [effectsVolume, setEffectsVolume] = useState(0.3);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [highScores, setHighScores] = useState([]);

  useEffect(() => {
    // Initialize audio manager
    AudioManager.init();
    // Load saved volumes from localStorage
    const savedMaster = localStorage.getItem('masterVolume');
    const savedMusic = localStorage.getItem('musicVolume');
    const savedEffects = localStorage.getItem('effectsVolume');
    
    if (savedMaster) {
      const vol = parseFloat(savedMaster);
      setMasterVolume(vol);
      AudioManager.setMasterVolume(vol);
    }
    if (savedMusic) {
      const vol = parseFloat(savedMusic);
      setMusicVolume(vol);
      AudioManager.setMusicVolume(vol);
    }
    if (savedEffects) {
      const vol = parseFloat(savedEffects);
      setEffectsVolume(vol);
      AudioManager.setEffectsVolume(vol);
    }
    
    // Start theme music immediately on intro modal (plays throughout)
    AudioManager.enableAudio();
    AudioManager.playTheme();
    
    // Load high scores (top 3)
    const scores = JSON.parse(localStorage.getItem('highScores') || '[]');
    setHighScores(scores.sort((a, b) => b.score - a.score).slice(0, 3));
  }, []);

  const handleMasterVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMasterVolume(vol);
    AudioManager.setMasterVolume(vol);
    localStorage.setItem('masterVolume', vol);
    handleVolumeChange();
  };

  const handleMusicVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    AudioManager.setMusicVolume(vol);
    localStorage.setItem('musicVolume', vol);
    handleVolumeChange();
  };

  const handleEffectsVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setEffectsVolume(vol);
    AudioManager.setEffectsVolume(vol);
    localStorage.setItem('effectsVolume', vol);
    handleVolumeChange();
  };

  const handleStart = () => {
    if (playerName.trim()) {
      // Enable audio on user interaction (required for autoplay)
      AudioManager.enableAudio();
      // Start theme music immediately on user click
      setTimeout(() => {
        AudioManager.playTheme();
      }, 100);
      onStart(playerName.trim());
    }
  };
  
  const handleVolumeChange = () => {
    // Any volume change triggers audio enable (user interaction)
    AudioManager.enableAudio();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="intro-modal-overlay">
      <div className="intro-modal">
        <img 
          src={`${process.env.PUBLIC_URL || ''}/backgrounds/war.png`} 
          alt="World War Hackathon" 
          className="intro-logo"
        />
        <div className="intro-content">
          <p className="intro-subtitle">Enter Your Name, Soldier</p>
          <input
            type="text"
            className="intro-input"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            maxLength={20}
          />
          <div className="controls-scores-row">
            <div className="volume-controls">
              <label className="volume-label">
                Master Volume: {Math.round(masterVolume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={masterVolume}
                  onChange={handleMasterVolumeChange}
                  className="volume-slider"
                />
              </label>
              <label className="volume-label">
                Music Volume: {Math.round(musicVolume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={handleMusicVolumeChange}
                  className="volume-slider"
                />
              </label>
              <label className="volume-label">
                Effects Volume: {Math.round(effectsVolume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effectsVolume}
                  onChange={handleEffectsVolumeChange}
                  className="volume-slider"
                />
              </label>
            </div>
            {highScores.length > 0 && (
              <div className="high-scores">
                <h3>Top 3 Scores</h3>
                <ol className="high-scores-list">
                  {highScores.map((entry, index) => (
                    <li key={index}>
                      <span className="score-name">{entry.name}</span>
                      <span className="score-value">{entry.score.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <div className="intro-buttons">
            <button
              className="intro-button"
              onClick={handleStart}
              disabled={!playerName.trim()}
            >
              START MISSION
            </button>
            <button
              className="intro-button secondary"
              onClick={() => setShowHowToPlay(true)}
            >
              How to Play
            </button>
          </div>
        </div>
      </div>
      
      {showHowToPlay && (
        <div className="how-to-play-overlay" onClick={() => setShowHowToPlay(false)}>
          <div className="how-to-play-modal" onClick={(e) => e.stopPropagation()}>
            <h2>How to Play</h2>
            <div className="how-to-play-content">
              <h3>Controls:</h3>
              <ul>
                <li><strong>W</strong> - Jump</li>
                <li><strong>A</strong> - Move Left</li>
                <li><strong>D</strong> - Move Right</li>
                <li><strong>S</strong> - Duck (reduces height to avoid bullets, max 3 seconds)</li>
                <li><strong>Mouse Click</strong> - Shoot (aim with mouse)</li>
                <li><strong>Q</strong> - Throw Grenade Forward (collect grenades from pickups on the ground)</li>
                <li><strong>P</strong> - Pause</li>
              </ul>
              <h3>Gameplay:</h3>
              <ul>
                <li>Defeat enemies to earn points</li>
                <li><strong>Boss spawns every 100 points</strong> - Defeat first boss to unlock grenades (5 grenades)</li>
                <li><strong>Helicopter spawns every 1000 points</strong> - Defeat helicopters to get weapon upgrades and +5 grenades</li>
                <li><strong>Soldiers spawn every 5 seconds</strong> (except during boss fights)</li>
                <li><strong>5 soldiers spawn when fighting helicopters</strong></li>
                <li>After defeating helicopters, you get weapon upgrades (minigun, machine gun)</li>
                <li>Game gets progressively harder with more enemies</li>
                <li>Survive as long as possible!</li>
              </ul>
              <button className="intro-button" onClick={() => setShowHowToPlay(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
