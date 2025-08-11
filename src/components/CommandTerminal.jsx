import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useTour } from '@/context/TourContext';
import { useRobotConfig } from '@/context/RobotContext';

const CommandTerminal = forwardRef((props, ref) => {
  const { runCommand } = useTour();
  const { config } = useRobotConfig();
  const [history, setHistory] = useState(() => {
    // Cargar historial desde localStorage al inicializar
    const saved = localStorage.getItem('robotAssistant_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  // Definir estilos según el preset del robot
  const getPresetStyles = () => {
    const preset = config.currentPreset;
    const colors = config.preset.colors;
    
    switch (preset) {
      case 'cyberpunk_neon':
        return {
          userTextColor: 'text-cyan-400',
          borderColor: 'border-cyan-400/30',
          hoverBorderColor: 'hover:border-cyan-400/50',
          primaryColor: 'text-cyan-400',
          bgColor: 'bg-cyan-400/10',
          hoverBgColor: 'hover:bg-cyan-400/20',
          clearBtnColor: 'text-red-400 border-red-400/30 hover:border-red-400/50 bg-red-400/10 hover:bg-red-400/20'
        };
      case 'minimal_clean':
        return {
          userTextColor: 'text-yellow-400',
          borderColor: 'border-yellow-400/30',
          hoverBorderColor: 'hover:border-yellow-400/50',
          primaryColor: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          hoverBgColor: 'hover:bg-yellow-400/20',
          clearBtnColor: 'text-red-400 border-red-400/30 hover:border-red-400/50 bg-red-400/10 hover:bg-red-400/20'
        };
      case 'colorful_playful':
        return {
          userTextColor: 'text-pink-400',
          borderColor: 'border-pink-400/30',
          hoverBorderColor: 'hover:border-pink-400/50',
          primaryColor: 'text-pink-400',
          bgColor: 'bg-pink-400/10',
          hoverBgColor: 'hover:bg-pink-400/20',
          clearBtnColor: 'text-red-400 border-red-400/30 hover:border-red-400/50 bg-red-400/10 hover:bg-red-400/20'
        };
      default:
        return {
          userTextColor: 'text-primary',
          borderColor: 'border-primary/30',
          hoverBorderColor: 'hover:border-primary/50',
          primaryColor: 'text-primary',
          bgColor: 'bg-primary/10',
          hoverBgColor: 'hover:bg-primary/20',
          clearBtnColor: 'text-destructive border-destructive/30 hover:border-destructive/50 bg-destructive/10 hover:bg-destructive/20'
        };
    }
  };

  const styles = getPresetStyles();

  // Guardar historial en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('robotAssistant_history', JSON.stringify(history));
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory((h) => [...h, { type: 'user', text: input }]);
    const res = runCommand(input.trim());
    setHistory((h) => [...h, { type: 'bot', text: res }]);
    setInput('');
  };

  // Función para ejecutar comandos desde botones
  const executeFromButton = (cmd) => {
    setHistory((h) => [...h, { type: 'user', text: cmd }]);
    const res = runCommand(cmd);
    setHistory((h) => [...h, { type: 'bot', text: res }]);
  };

  // Función para limpiar historial
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('robotAssistant_history');
  };

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    executeFromButton,
    clearHistory
  }));

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="h-full flex flex-col">
      {/* Header con botón de limpiar */}
      {history.length > 0 && (
        <div className={`flex justify-end p-1 border-b ${styles.borderColor}`}>
          <button
            onClick={clearHistory}
            className={`px-2 py-1 text-[10px] ${styles.clearBtnColor} border rounded transition-colors`}
            title="Limpiar historial"
          >
            🗑️ Limpiar
          </button>
        </div>
      )}
      <ul ref={listRef} className="flex-1 overflow-y-auto text-sm space-y-1 mb-2 px-2">
        {history.map((msg, i) => (
          <li key={i} className={msg.type === 'user' ? styles.userTextColor : 'text-foreground'}>
            {msg.type === 'user' ? `> ${msg.text}` : msg.text}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className={`w-full flex items-center p-2 border-t ${styles.borderColor} bg-background sticky bottom-0`}>
        <span className={`${styles.primaryColor} mr-2`}>&gt;</span>
        <input
          className={`flex-1 bg-background border ${styles.borderColor} ${styles.hoverBorderColor} rounded px-3 py-2 outline-none focus:ring-2 focus:ring-current text-foreground placeholder-muted-foreground text-sm`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="Escribe un comando y presiona Enter..."
        />
        <button type="submit" className={`ml-2 px-3 py-2 ${styles.bgColor} ${styles.hoverBgColor} ${styles.primaryColor} border ${styles.borderColor} ${styles.hoverBorderColor} rounded transition-colors text-xs`}>Enviar</button>
      </form>
    </div>
  );
});

export default CommandTerminal;
