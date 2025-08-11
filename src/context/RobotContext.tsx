import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioConfig {
  frequencies: number[];
  waveType: OscillatorType;
  effects: {
    reverb: number;
    attack: number;
    decay: number;
  };
  volume: number;
}

interface RobotPreset {
  name: string;
  description: string;
  theme: string;
  image: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  audioConfig: AudioConfig;
}

interface RobotConfig {
  currentPreset: string;
  preset: RobotPreset;
  soundEnabled: boolean;
  masterVolume: number;
}

interface RobotContextType {
  config: RobotConfig;
  updatePreset: (presetKey: string) => void;
  playPresetAudio: (preset: RobotPreset) => void;
  getPresets: () => Record<string, RobotPreset>;
  toggleSound: () => void;
  setMasterVolume: (volume: number) => void;
}

const ROBOT_PRESETS: Record<string, RobotPreset> = {
  cyberpunk_neon: {
    name: 'Cyberpunk Neón',
    description: 'Personalidad audaz y futurista, amante del resplandor neón',
    theme: 'dark',
    image: '/src/images/CyberPunk.png',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0a'
    },
    audioConfig: {
      frequencies: [800, 1200, 600, 1000],
      waveType: 'square',
      effects: {
        reverb: 0.7,
        attack: 0.1,
        decay: 0.3
      },
      volume: 0.6
    }
  },
  minimal_clean: {
    name: 'Dorado Imperial',
    description: 'Personalidad noble y elegante, maestra del lujo imperial',
    theme: 'luxury',
    image: '/src/images/Dorado imperial.png',
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      accent: '#FF8C00',
      background: '#1a1a1a'
    },
    audioConfig: {
      frequencies: [523, 659, 784, 1047, 1319],
      waveType: 'sawtooth',
      effects: {
        reverb: 0.8,
        attack: 0.4,
        decay: 1.2
      },
      volume: 0.7
    }
  },
  colorful_playful: {
    name: 'Arquetipo Carmesí',
    description: 'Carácter vibrante y efervescente, desbordando color.',
    theme: 'light',
    image: '/src/images/Arquetipo Carmesí.png',
    colors: {
      primary: '#e74c3c',
      secondary: '#f39c12',
      accent: '#2ecc71',
      background: '#f8f9fa'
    },
    audioConfig: {
      frequencies: [523, 659, 784, 1047],
      waveType: 'triangle',
      effects: {
        reverb: 0.4,
        attack: 0.2,
        decay: 0.5
      },
      volume: 0.5
    }
  }
};

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export const useRobotConfig = () => {
  const context = useContext(RobotContext);
  if (!context) {
    throw new Error('useRobotConfig must be used within a RobotProvider');
  }
  return context;
};

interface RobotProviderProps {
  children: ReactNode;
}

export const RobotProvider: React.FC<RobotProviderProps> = ({ children }) => {
  const [currentPreset, setCurrentPreset] = useState<string>('cyberpunk_neon');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [masterVolume, setMasterVolumeState] = useState<number>(0.5);

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedPreset = localStorage.getItem('robotPreset');
    if (savedPreset && ROBOT_PRESETS[savedPreset]) {
      setCurrentPreset(savedPreset);
    }
    
    const savedSoundSetting = localStorage.getItem('robotSoundEnabled');
    if (savedSoundSetting !== null) {
      setSoundEnabled(savedSoundSetting === 'true');
    }

    const savedMasterVolume = localStorage.getItem('robotMasterVolume');
    if (savedMasterVolume !== null) {
      setMasterVolumeState(parseFloat(savedMasterVolume));
    }
  }, []);

  const playPresetAudio = (preset: RobotPreset) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const { frequencies, waveType, effects, volume } = preset.audioConfig;
      
      frequencies.forEach((frequency, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = waveType;
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          
          // Aplicar volumen master al volumen del preset
          const finalVolume = volume * effects.attack * masterVolume;
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(finalVolume, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + effects.decay);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + effects.decay);
        }, index * 100);
      });
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  const updatePreset = (presetKey: string) => {
    if (ROBOT_PRESETS[presetKey]) {
      setCurrentPreset(presetKey);
      localStorage.setItem('robotPreset', presetKey);
      
      // Aplicar estilos CSS dinámicos
      const preset = ROBOT_PRESETS[presetKey];
      const root = document.documentElement;
      
      root.style.setProperty('--robot-primary', preset.colors.primary);
      root.style.setProperty('--robot-secondary', preset.colors.secondary);
      root.style.setProperty('--robot-accent', preset.colors.accent);
      root.style.setProperty('--robot-background', preset.colors.background);
      
      // Reproducir audio del preset
      playPresetAudio(preset);
    }
  };

  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('robotSoundEnabled', newSoundState.toString());
  };

  const setMasterVolume = (volume: number) => {
    setMasterVolumeState(volume);
    localStorage.setItem('robotMasterVolume', volume.toString());
  };

  const getPresets = () => ROBOT_PRESETS;

  const config: RobotConfig = {
    currentPreset,
    preset: ROBOT_PRESETS[currentPreset] as RobotPreset,
    soundEnabled,
    masterVolume
  };

  // Aplicar estilos iniciales
  useEffect(() => {
    const preset = (ROBOT_PRESETS[currentPreset] || ROBOT_PRESETS['cyberpunk_neon']) as RobotPreset;
    
    const root = document.documentElement;
    
    root.style.setProperty('--robot-primary', preset.colors.primary);
    root.style.setProperty('--robot-secondary', preset.colors.secondary);
    root.style.setProperty('--robot-accent', preset.colors.accent);
    root.style.setProperty('--robot-background', preset.colors.background);
  }, [currentPreset]);

  return (
    <RobotContext.Provider value={{
      config,
      updatePreset,
      playPresetAudio,
      getPresets,
      toggleSound,
      setMasterVolume
    }}>
      {children}
    </RobotContext.Provider>
  );
};

export default RobotContext;
