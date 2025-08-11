import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/context/TourContext';
import { useRobotConfig } from '@/context/RobotContext';
import CommandTerminal from '@/components/CommandTerminal';

const RobotAssistant = (): JSX.Element => {
  const context = useTour();
  if (!context) {
    return <div>Error: TourContext not available</div>;
  }
  
  const { tourMode, togglePanel } = context;
  const { config } = useRobotConfig();
  const terminalRef = useRef<{ executeFromButton: (cmd: string) => void } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Inyectar estilos personalizados basados en el preset actual
  useEffect(() => {
    const style = document.createElement('style');
    const { colors } = config.preset;
    
    // Detectar si es el tema dorado para efectos especiales
  const isGoldenTheme = config.preset.name === 'Dorado Imperial';
  const isCyberpunkTheme = config.preset.name === 'Cyberpunk Neón';
  const isColorfulTheme = config.preset.name === 'Colorido Juguetón';
  const isCrimsonTheme = config.preset.name === 'Arquetipo Carmesí';
    
    style.textContent = `
      .robot-assistant-button {
        width: 64px !important;
        height: 64px !important;
        background: ${isGoldenTheme 
          ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, #FFFF00, ${colors.primary})`
          : isCyberpunkTheme
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`
            : isCrimsonTheme
              ? `linear-gradient(135deg, ${colors.primary}, #a8002c, ${colors.accent}, #ff1744, ${colors.primary})`
              : isColorfulTheme
                ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`
                : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`
        } !important;
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 9999 !important;
        ${isGoldenTheme ? `
          animation: goldenPulse 3s ease-in-out infinite !important;
          box-shadow: 0 0 30px ${colors.primary}80, 0 0 60px ${colors.primary}40, inset 0 0 20px ${colors.primary}30 !important;
        ` : isCyberpunkTheme ? `
          animation: cyberpunkGlow 2.5s ease-in-out infinite !important;
          box-shadow: 0 0 25px ${colors.primary}70, 0 0 50px ${colors.secondary}30, inset 0 0 15px ${colors.primary}20 !important;
        ` : isCrimsonTheme ? `
          animation: crimsonPulse 2.2s cubic-bezier(.4,0,.2,1) infinite !important;
          box-shadow: 0 0 32px #a8002c80, 0 0 64px #ff174440, 0 0 24px ${colors.primary}50, inset 0 0 18px #ff174420 !important;
        ` : isColorfulTheme ? `
          animation: colorfulBounce 2s ease-in-out infinite !important;
          box-shadow: 0 0 20px ${colors.primary}60, 0 0 40px ${colors.secondary}40, 0 0 60px ${colors.accent}20 !important;
        ` : ''}
      }
      ${isGoldenTheme ? `
      @keyframes goldenPulse {
        0%, 100% { 
          box-shadow: 0 0 30px ${colors.primary}80, 0 0 60px ${colors.primary}40, inset 0 0 20px ${colors.primary}30;
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 40px ${colors.primary}90, 0 0 80px ${colors.primary}60, inset 0 0 30px ${colors.primary}50;
          transform: scale(1.05);
        }
      }
      ` : isCyberpunkTheme ? `
      @keyframes cyberpunkGlow {
        0%, 100% { 
          box-shadow: 0 0 25px ${colors.primary}70, 0 0 50px ${colors.secondary}30, inset 0 0 15px ${colors.primary}20;
          filter: hue-rotate(0deg);
        }
        33% { 
          box-shadow: 0 0 30px ${colors.secondary}80, 0 0 60px ${colors.primary}40, inset 0 0 20px ${colors.secondary}30;
          filter: hue-rotate(60deg);
        }
        66% { 
          box-shadow: 0 0 35px ${colors.accent}70, 0 0 70px ${colors.secondary}50, inset 0 0 25px ${colors.accent}20;
          filter: hue-rotate(120deg);
        }
      }
      ` : isCrimsonTheme ? `
      @keyframes crimsonPulse {
        0%, 100% {
          box-shadow: 0 0 32px #a8002c80, 0 0 64px #ff174440, 0 0 24px ${colors.primary}50, inset 0 0 18px #ff174420;
          filter: hue-rotate(0deg) brightness(1);
          transform: scale(1);
        }
        40% {
          box-shadow: 0 0 48px #ff1744cc, 0 0 80px #a8002c99, 0 0 36px #ff1744cc, inset 0 0 28px #a8002c60;
          filter: hue-rotate(-10deg) brightness(1.08);
          transform: scale(1.07);
        }
        70% {
          box-shadow: 0 0 40px #ff1744bb, 0 0 70px #a8002c88, 0 0 30px #ff1744bb, inset 0 0 22px #a8002c40;
          filter: hue-rotate(10deg) brightness(0.97);
          transform: scale(0.97);
        }
      }
      ` : isColorfulTheme ? `
      @keyframes colorfulBounce {
        0%, 100% { 
          box-shadow: 0 0 20px ${colors.primary}60, 0 0 40px ${colors.secondary}40, 0 0 60px ${colors.accent}20;
          transform: scale(1) rotate(0deg);
        }
        25% { 
          box-shadow: 0 0 25px ${colors.secondary}70, 0 0 45px ${colors.accent}50, 0 0 65px ${colors.primary}30;
          transform: scale(1.03) rotate(2deg);
        }
        50% { 
          box-shadow: 0 0 30px ${colors.accent}80, 0 0 50px ${colors.primary}60, 0 0 70px ${colors.secondary}40;
          transform: scale(1.06) rotate(0deg);
        }
        75% { 
          box-shadow: 0 0 25px ${colors.primary}70, 0 0 45px ${colors.secondary}50, 0 0 65px ${colors.accent}30;
          transform: scale(1.03) rotate(-2deg);
        }
      }
      ` : ''}
      .robot-assistant-panel {
        position: fixed !important;
        bottom: 24px !important;
        right: 100px !important;
        z-index: 99999 !important;
        width: 320px !important;
        height: 855px !important;
        max-height: calc(100vh - 48px) !important;
        overflow: hidden !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px ${colors.primary}40 !important;
        border-color: ${colors.primary}50 !important;
        ${isGoldenTheme ? `
          border: 2px solid ${colors.primary} !important;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.9), 
            0 0 40px ${colors.primary}60,
            0 0 80px ${colors.primary}30,
            inset 0 0 30px ${colors.primary}10 !important;
        ` : isCrimsonTheme ? `
          border: 2px solid #a8002c !important;
          box-shadow: 0 25px 50px -12px #a8002c99, 0 0 40px #ff1744cc, 0 0 80px #a8002c44, inset 0 0 30px #ff174420 !important;
        ` : ''}
      }
      .robot-assistant-terminal {
        height: calc(100% - 180px) !important;
        overflow-y: auto !important;
      }
      .robot-panel-header {
        background: ${isGoldenTheme 
          ? `linear-gradient(45deg, ${colors.primary}15, ${colors.secondary}15, ${colors.accent}10)`
          : isCyberpunkTheme
            ? `linear-gradient(45deg, ${colors.primary}12, ${colors.secondary}12, ${colors.accent}08)`
            : `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}10, ${colors.accent}08)`
        } !important;
        border-color: ${colors.primary}20 !important;
        background-size: 200% 200% !important;
        animation: ${isGoldenTheme 
          ? 'goldenShimmer'
          : isCyberpunkTheme
            ? 'cyberpunkShimmer'
            : 'colorfulShimmer'
        } 4s ease-in-out infinite !important;
      }
      ${isGoldenTheme ? `
      @keyframes goldenShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes cyberpunkShimmer {
        0%, 100% { 
          background-position: 0% 50%; 
          filter: hue-rotate(0deg);
        }
        50% { 
          background-position: 100% 50%; 
          filter: hue-rotate(180deg);
        }
      }
      @keyframes colorfulShimmer {
        0%, 100% { 
          background-position: 0% 50%; 
        }
        25% { 
          background-position: 25% 75%; 
        }
        50% { 
          background-position: 100% 50%; 
        }
        75% { 
          background-position: 75% 25%; 
        }
      }
      ` : ''}
      .robot-panel-commands {
        background: ${isGoldenTheme 
          ? `linear-gradient(135deg, ${colors.background}80, ${colors.primary}08, ${colors.secondary}05)`
          : isCyberpunkTheme
            ? `linear-gradient(135deg, ${colors.background}90, ${colors.primary}06, ${colors.secondary}04)`
            : `linear-gradient(135deg, ${colors.background}85, ${colors.primary}07, ${colors.secondary}05)`
        } !important;
        border-color: ${colors.primary}20 !important;
        backdrop-filter: blur(10px) !important;
        ${isGoldenTheme 
          ? `border-image: linear-gradient(45deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}) 1 !important;`
          : isCyberpunkTheme
            ? `border-image: linear-gradient(45deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}) 1 !important;`
            : `border-image: linear-gradient(45deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}) 1 !important;`
        }
      }
      .robot-command-button {
        background: ${isGoldenTheme 
          ? `linear-gradient(45deg, ${colors.primary}15, ${colors.secondary}10)`
          : `${colors.primary}10`
        } !important;
        border-color: ${colors.primary}30 !important;
        color: ${colors.primary} !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        position: relative !important;
        overflow: hidden !important;
      }
      .robot-command-button:hover {
        background: ${isGoldenTheme 
          ? `linear-gradient(45deg, ${colors.primary}25, ${colors.secondary}20)`
          : `${colors.primary}20`
        } !important;
        border-color: ${colors.primary}60 !important;
        ${isGoldenTheme ? `
          box-shadow: 0 5px 15px ${colors.primary}30 !important;
          transform: translateY(-2px) !important;
        ` : `
          box-shadow: 0 4px 12px ${colors.primary}25 !important;
          transform: translateY(-1px) !important;
        `}
      }
      .robot-command-button::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: -100% !important;
        width: 100% !important;
        height: 100% !important;
        background: ${isGoldenTheme 
          ? `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)`
          : config.preset.name === 'Cyberpunk Neón'
            ? `linear-gradient(90deg, transparent, ${colors.primary}50, ${colors.secondary}30, transparent)`
            : `linear-gradient(90deg, transparent, ${colors.primary}35, ${colors.secondary}25, ${colors.accent}20, transparent)`
        } !important;
        transition: left 0.5s !important;
        z-index: 1 !important;
      }
      .robot-command-button:hover::before {
        left: 100% !important;
      }
      .robot-command-button > * {
        position: relative !important;
        z-index: 2 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [config.preset]);

  // Audio context para sonidos sutiles basados en el preset actual
  const playSound = useCallback((type: 'open' | 'close' | 'command') => {
    if (!config.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const { audioConfig } = config.preset;
      
      // Usar las frecuencias del preset actual
      const frequencyIndex = type === 'open' ? 0 : type === 'close' ? 1 : 2;
      const frequency = audioConfig.frequencies[frequencyIndex] || audioConfig.frequencies[0] || 440;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = audioConfig.waveType;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioContext.currentTime + audioConfig.effects.decay);
      
      // Aplicar volumen master al volumen del preset
      const finalVolume = audioConfig.volume * audioConfig.effects.attack * config.masterVolume;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + audioConfig.effects.decay);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + audioConfig.effects.decay);
    } catch (error) {
      // Silenciosamente ignorar errores de audio
      console.debug('Audio not available:', error);
    }
  }, [config.soundEnabled, config.preset, config.masterVolume]);

  // Manejar shortcuts de teclado
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        togglePanel();
        playSound(tourMode ? 'close' : 'open');
      }
      if (event.key === 'Escape' && tourMode) {
        togglePanel();
        playSound('close');
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [togglePanel, tourMode, playSound]);

  useEffect(() => {
    document.body.style.overflow = tourMode ? 'hidden' : '';
  }, [tourMode]);

  const executeCommand = (cmd: string): void => {
    playSound('command');
    // Ejecutar comando y simular entrada en terminal
    if (terminalRef.current) {
      terminalRef.current.executeFromButton(cmd);
    }
  };

  const handleTogglePanel = () => {
    playSound(tourMode ? 'close' : 'open');
    togglePanel();
  };

  return (
    <>
      <div className="relative">
        <motion.button
          className="robot-assistant-button rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/40 hover:scale-110 transition-all duration-300 text-3xl border-2 border-white/20 backdrop-blur-sm relative overflow-hidden group"
          onClick={handleTogglePanel}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
          whileTap={{ scale: 0.9 }}
          title="Asistente Robot - Ctrl+Space para abrir/cerrar"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-transparent to-purple-500/20 group-hover:opacity-100 opacity-60 transition-opacity duration-300"></div>
          <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-colors duration-300"></div>
          <img 
            src={config.preset.image} 
            alt={`Robot ${config.preset.name}`}
            className="relative z-10 w-12 h-12 object-cover rounded-full filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
        </motion.button>
        
        {/* Tooltip informativo */}
        <AnimatePresence>
          {showTooltip && !tourMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="fixed bottom-24 right-[-10px] bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-xl border border-gray-700 z-40 max-w-xs"
            >
              <div className="text-sm font-medium mb-1">🤖 Asistente Robot</div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• <kbd className="bg-gray-700 px-1 rounded text-xs">Ctrl+Space</kbd> Abrir/Cerrar</div>
                <div>• <kbd className="bg-gray-700 px-1 rounded text-xs">Esc</kbd> Cerrar panel</div>
                <div>• Navegación rápida por comandos</div>
              </div>
              <div className="absolute bottom-0 right-8 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900/95 transform translate-y-full"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {tourMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999
              }}
              onClick={handleTogglePanel}
            />
            <motion.aside
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="robot-assistant-panel w-80 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-background/98 backdrop-blur-xl border-2 border-blue-500/30 rounded-xl shadow-xl shadow-blue-500/20 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b robot-panel-header flex items-center space-x-3">
                <span className="text-3xl animate-pulse">🤖</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold" style={{ color: config.preset.colors.primary }}>
                    {config.preset.name}
                  </h2>
                  <p className="text-xs opacity-70">
                    {config.preset.description}
                  </p>
                </div>
                <button
                  className="ml-auto hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-all duration-200"
                  style={{ color: config.preset.colors.primary }}
                  onClick={handleTogglePanel}
                  title="Cerrar (Esc)"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>
              <div className="p-3 text-sm border-b robot-panel-commands">
                <p className="mb-2 font-medium text-xs" style={{ color: config.preset.colors.primary }}>
                  ⚡ <b>Comandos rápidos:</b>
                </p>
                <div className="text-xs mb-2 p-2 rounded-md border" style={{ 
                  backgroundColor: `${config.preset.colors.primary}10`, 
                  borderColor: `${config.preset.colors.primary}20` 
                }}>
                  <div className="space-y-1 opacity-70">
                    <div>• <kbd className="px-1 rounded text-xs" style={{ backgroundColor: `${config.preset.colors.primary}20` }}>Ctrl+Space</kbd> Abrir/Cerrar • <kbd className="px-1 rounded text-xs" style={{ backgroundColor: `${config.preset.colors.primary}20` }}>Esc</kbd> Cerrar</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[
                    { cmd: 'bienvenida', label: 'inicio', desc: 'Página de bienvenida', icon: '🏠' },
                    { cmd: 'arquetipos', label: 'arquetipos', desc: 'Generador de arquetipos', icon: '👥' },
                    { cmd: 'consola', label: 'dungeon', desc: 'DUNGEON CRAWLER - Juego de mazmorras', icon: '⚔️' },
                    { cmd: 'aprendizaje', label: 'aprendizaje', desc: 'Módulo de aprendizaje', icon: '📚' },
                    { cmd: 'notas', label: 'notas', desc: 'Editor de notas', icon: '📝' },
                    { cmd: 'configuracion', label: 'config', desc: 'Configuración', icon: '⚙️' },
                    { cmd: 'animacion', label: 'animación', desc: 'Animación eterna', icon: '🌀' },
                    { cmd: 'trading', label: 'trading', desc: 'TradingVision Pro Dashboard', icon: '📈' }
                  ].map((button) => (
                    <button
                      key={button.cmd}
                      onClick={() => {
                        executeCommand(button.cmd);
                      }}
                      className="robot-command-button px-4 py-3 text-xs border rounded-md transition-all duration-200 font-mono flex items-center gap-2 hover:scale-105"
                      title={button.desc}
                    >
                      <span className="text-xs">{button.icon}</span>
                      <span className="truncate text-xs">{button.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-75 text-center" style={{ color: `${config.preset.colors.primary}60` }}>
                  💡 Escribe comandos en el terminal
                </p>
              </div>
              <div className="flex-1 robot-assistant-terminal" style={{ borderColor: `${config.preset.colors.primary}20` }}>
                <CommandTerminal ref={terminalRef} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default RobotAssistant;
