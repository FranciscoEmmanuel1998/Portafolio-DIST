import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Settings, Brain, Zap, Eye, Lightbulb } from 'lucide-react';

// Temas visuales avanzados
export const advancedThemes = {
  'quantum-void': {
    name: 'Vacío Cuántico',
    description: 'Inspirado en el espacio cuántico y las fluctuaciones del vacío',
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#e2e8f0'
    },
    effects: {
      particleSystem: true,
      quantumFluctuations: true,
      synapticFiring: true
    }
  },
  'neural-network': {
    name: 'Red Neuronal',
    description: 'Basado en las conexiones neuronales y patrones sinápticos',
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#f43f5e',
      background: '#111827',
      surface: '#1f2937',
      text: '#f3f4f6'
    },
    effects: {
      neuralConnections: true,
      synapticPulses: true,
      brainwaveAnimation: true
    }
  },
  'consciousness-stream': {
    name: 'Flujo de Conciencia',
    description: 'Representa el flujo continuo de pensamientos y ideas',
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: '#1e1b4b',
      surface: '#312e81',
      text: '#e0e7ff'
    },
    effects: {
      thoughtBubbles: true,
      consciousnessFlow: true,
      ideaConnections: true
    }
  }
};

// Configuraciones de personalización
export const PersonalizationSettings = ({ userPreferences, onUpdatePreferences }) => {
  const [activeTab, setActiveTab] = useState('visual');
  const [previewTheme, setPreviewTheme] = useState(null);

  const tabs = [
    { id: 'visual', name: 'Visual', icon: Eye },
    { id: 'learning', name: 'Aprendizaje', icon: Brain },
    { id: 'interaction', name: 'Interacción', icon: Zap },
    { id: 'advanced', name: 'Avanzado', icon: Settings }
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <Palette className="w-5 h-5 mr-2 text-purple-400" />
        Personalización Avanzada
      </h3>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-700/50 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Configuraciones Visuales */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-semibold mb-3">Temas Avanzados</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(advancedThemes).map(([key, theme]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    userPreferences.theme === key
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => onUpdatePreferences({ theme: key })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-white font-medium">{theme.name}</h5>
                    <div className="flex space-x-1">
                      {Object.values(theme.colors).slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{theme.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Efectos Visuales</h4>
            <div className="space-y-3">
              {[
                { key: 'particleSystem', label: 'Sistema de Partículas', desc: 'Efectos de partículas en el fondo' },
                { key: 'animations', label: 'Animaciones Avanzadas', desc: 'Transiciones suaves y efectos de movimiento' },
                { key: 'glowEffects', label: 'Efectos de Brillo', desc: 'Resplandor en elementos interactivos' },
                { key: 'neuralConnections', label: 'Conexiones Neurales', desc: 'Visualización de conexiones entre fragmentos' }
              ].map(effect => (
                <div key={effect.key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{effect.label}</div>
                    <div className="text-gray-400 text-sm">{effect.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPreferences.visualEffects?.[effect.key] || false}
                      onChange={(e) => onUpdatePreferences({
                        visualEffects: {
                          ...userPreferences.visualEffects,
                          [effect.key]: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuraciones de Aprendizaje */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-semibold mb-3">Estilo de Aprendizaje</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'visual', label: 'Visual', icon: Eye, desc: 'Aprendizaje a través de diagramas y visualizaciones' },
                { key: 'analytical', label: 'Analítico', icon: Brain, desc: 'Enfoque lógico y estructurado' },
                { key: 'intuitive', label: 'Intuitivo', icon: Lightbulb, desc: 'Aprendizaje basado en patrones y conexiones' },
                { key: 'experimental', label: 'Experimental', icon: Zap, desc: 'Aprendizaje activo y exploratorio' }
              ].map(style => (
                <div
                  key={style.key}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    userPreferences.learningStyle === style.key
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => onUpdatePreferences({ learningStyle: style.key })}
                >
                  <div className="flex items-center mb-2">
                    <style.icon className="w-5 h-5 mr-2 text-purple-400" />
                    <h5 className="text-white font-medium">{style.label}</h5>
                  </div>
                  <p className="text-gray-400 text-sm">{style.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Preferencias de Contenido</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-white font-medium">Complejidad Preferida</div>
                  <div className="text-gray-400 text-sm">Nivel de dificultad de los fragmentos sugeridos</div>
                </div>
                <select 
                  value={userPreferences.preferredComplexity || 3}
                  onChange={(e) => onUpdatePreferences({ preferredComplexity: parseInt(e.target.value) })}
                  className="bg-slate-600 text-white rounded px-3 py-1 border border-slate-500"
                >
                  <option value={1}>Básico (1)</option>
                  <option value={2}>Intermedio (2)</option>
                  <option value={3}>Avanzado (3)</option>
                  <option value={4}>Experto (4)</option>
                  <option value={5}>Maestro (5)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-white font-medium">Velocidad de Aprendizaje</div>
                  <div className="text-gray-400 text-sm">Ritmo de presentación de nuevo contenido</div>
                </div>
                <select 
                  value={userPreferences.learningSpeed || 'moderate'}
                  onChange={(e) => onUpdatePreferences({ learningSpeed: e.target.value })}
                  className="bg-slate-600 text-white rounded px-3 py-1 border border-slate-500"
                >
                  <option value="slow">Pausado</option>
                  <option value="moderate">Moderado</option>
                  <option value="fast">Rápido</option>
                  <option value="intensive">Intensivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuraciones de Interacción */}
      {activeTab === 'interaction' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-semibold mb-3">Controles de Interacción</h4>
            <div className="space-y-3">
              {[
                { key: 'autoSave', label: 'Guardado Automático', desc: 'Guarda el progreso automáticamente' },
                { key: 'notifications', label: 'Notificaciones', desc: 'Recibe notificaciones sobre nuevos fragmentos' },
                { key: 'soundEffects', label: 'Efectos de Sonido', desc: 'Sonidos para interacciones y logros' },
                { key: 'hapticFeedback', label: 'Retroalimentación Háptica', desc: 'Vibración en dispositivos móviles' }
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{setting.label}</div>
                    <div className="text-gray-400 text-sm">{setting.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPreferences.interaction?.[setting.key] || false}
                      onChange={(e) => onUpdatePreferences({
                        interaction: {
                          ...userPreferences.interaction,
                          [setting.key]: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuraciones Avanzadas */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-semibold mb-3">Configuración Avanzada</h4>
            <div className="space-y-3">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-yellow-500/50">
                <h5 className="text-yellow-400 font-medium mb-2">⚠️ Zona de Peligro</h5>
                <p className="text-gray-300 text-sm mb-3">
                  Estas configuraciones son para usuarios avanzados y pueden afectar el rendimiento del sistema.
                </p>
                <div className="space-y-2">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Resetear Progreso Completo
                  </button>
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Exportar Datos de Usuario
                  </button>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Importar Configuración
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationSettings;
