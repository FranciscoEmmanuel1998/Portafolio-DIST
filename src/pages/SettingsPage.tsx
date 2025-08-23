import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Palette, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useRobotConfig } from '../context/RobotContext';

const SettingsPage: React.FC = () => {
  const { config, updatePreset, getPresets, toggleSound, setMasterVolume } = useRobotConfig();
  const { toast } = useToast();
  const presets = getPresets();
  
  // Referencias para controlar las notificaciones
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastCountRef = useRef<number>(0);

  const limitedToast = useCallback((toastConfig: any) => {
    // Incrementar contador de toasts
    toastCountRef.current += 1;
    
    // Si hay más de 3 toasts, no mostrar más hasta que disminuya
    if (toastCountRef.current <= 3) {
      toast(toastConfig);
    }
    
    // Decrementar contador después de 4 segundos (duración típica del toast)
    setTimeout(() => {
      toastCountRef.current = Math.max(0, toastCountRef.current - 1);
    }, 4000);
  }, [toast]);

  const handlePresetChange = (presetKey: string) => {
    updatePreset(presetKey);
    
    const preset = presets[presetKey];
    if (preset) {
      limitedToast({
        title: '✨ Estilo aplicado',
        description: `Has seleccionado el estilo "${preset.name}"`
      });
    }
  };

  const handleSoundToggle = () => {
    toggleSound();
    limitedToast({
      title: config.soundEnabled ? '🔇 Sonido desactivado' : '🔊 Sonido activado',
      description: config.soundEnabled 
        ? 'Los efectos de sonido han sido desactivados' 
        : 'Los efectos de sonido han sido activados'
    });
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setMasterVolume(newVolume);
    
    // Limpiar timeout anterior si existe
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    // Establecer nuevo timeout para mostrar notificación después de 500ms de inactividad
    volumeTimeoutRef.current = setTimeout(() => {
      limitedToast({
        title: '🔊 Volumen ajustado',
        description: `Volumen master establecido al ${Math.round(newVolume * 100)}%`
      });
    }, 500);
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-primary mb-4">
            🤖 Personalización del Asistente
          </h1>
          <p className="text-xl text-muted-foreground">
            Elige el estilo visual para tu asistente robot
          </p>
        </motion.div>

        <motion.div 
          className="p-6 border border-primary/50 rounded-xl bg-background/30 backdrop-blur-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
            <Palette className="w-6 h-6" /> Estilos Predefinidos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(presets).map(([key, preset]) => (
              <motion.div
                key={key}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  config.currentPreset === key
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border hover:border-primary/50 bg-background/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetChange(key)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={preset.image} 
                    alt={`Robot ${preset.name}`}
                    className="object-cover rounded-full border-2"
                    style={{  width: '100px', height: '100px',borderColor: preset.colors.primary }}
                  />
                  <h4 style={{padding: '0.7rem' }} className="font-semibold text-xl">{preset.name}</h4>
                </div>
                
                <p className="text-lg text-muted-foreground mb-3">
                  {preset.description}
                </p>
                
                <div className="flex gap-2 mb-3">
                  {Object.values(preset.colors).slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  🎵 Audio: tonos únicos
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Configuración de Sonido */}
        <motion.div 
          className="p-6 border border-primary/50 rounded-xl bg-background/30 backdrop-blur-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
            {config.soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            Configuración de Audio
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold mb-2">Efectos de Sonido</h4>
                <p className="text-sm text-muted-foreground">
                  {config.soundEnabled 
                    ? 'Los efectos de sonido están activados. Escucharás audio al cambiar estilos y usar el asistente.'
                    : 'Los efectos de sonido están desactivados. No se reproducirá audio alguno.'
                  }
                </p>
              </div>
              
              <motion.button
                onClick={handleSoundToggle}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  config.soundEnabled
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-muted-foreground'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {config.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 inline mr-2" />
                    Activado
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 inline mr-2" />
                    Desactivado
                  </>
                )}
              </motion.button>
            </div>

            {/* Control de Volumen Master */}
            {config.soundEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Volumen Master</h4>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(config.masterVolume * 100)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.masterVolume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${config.masterVolume * 100}%, hsl(var(--muted)) ${config.masterVolume * 100}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Silencio</span>
                    <span>Máximo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Controla la intensidad de todos los efectos de audio. 
                    {config.masterVolume < 0.3 && " ¡Perfecto para el Dorado Imperial!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="p-6 border border-primary/50 rounded-xl bg-background/30 backdrop-blur-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="mb-2">
            💡 <strong>Tip:</strong> Cada estilo incluye efectos de sonido únicos que se reproducen al seleccionarlo
          </p>
          <p>
            La configuración se guarda automáticamente y se aplicará a tu asistente robot
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;

