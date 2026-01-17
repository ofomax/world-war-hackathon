import React, { useState, useEffect } from 'react';
import { AudioManager } from './AudioManager';
import './Settings.css';

export function Settings({ isOpen, onClose }) {
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [effectsVolume, setEffectsVolume] = useState(0.3);

  useEffect(() => {
    if (isOpen) {
      setMasterVolume(AudioManager.getMasterVolume());
      setMusicVolume(AudioManager.getMusicVolume());
      setEffectsVolume(AudioManager.getEffectsVolume());
    }
  }, [isOpen]);

  const handleMasterVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMasterVolume(vol);
    AudioManager.setMasterVolume(vol);
    localStorage.setItem('masterVolume', vol);
    // Enable audio on user interaction
    AudioManager.enableAudio();
  };

  const handleMusicVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    AudioManager.setMusicVolume(vol);
    localStorage.setItem('musicVolume', vol);
    // Enable audio on user interaction
    AudioManager.enableAudio();
  };

  const handleEffectsVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setEffectsVolume(vol);
    AudioManager.setEffectsVolume(vol);
    localStorage.setItem('effectsVolume', vol);
    // Enable audio on user interaction
    AudioManager.enableAudio();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-title">Settings</h2>
        <button className="settings-close" onClick={onClose}>×</button>
        
        <div className="settings-content">
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
        </div>
      </div>
    </div>
  );
}
