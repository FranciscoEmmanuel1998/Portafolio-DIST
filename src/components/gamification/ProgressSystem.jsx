import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Brain, Target, Award, TrendingUp } from 'lucide-react';

// Sistema de logros y badges
export const achievementSystem = {
  badges: {
    'first-activation': {
      id: 'first-activation',
      name: 'Primer Despertar',
      description: 'Activa tu primer fragmento de conocimiento',
      icon: 'Zap',
      rarity: 'common',
      points: 10
    },
    'quantum-explorer': {
      id: 'quantum-explorer',
      name: 'Explorador Cuántico',
      description: 'Domina 3 fragmentos de Física Cuántica',
      icon: 'Brain',
      rarity: 'uncommon',
      points: 50
    },
    'philosopher-mind': {
      id: 'philosopher-mind',
      name: 'Mente Filosófica',
      description: 'Completa la ruta de Filosofía de la Mente',
      icon: 'Trophy',
      rarity: 'rare',
      points: 100
    },
    'reality-hacker': {
      id: 'reality-hacker',
      name: 'Hacker de la Realidad',
      description: 'Conecta fragmentos de diferentes disciplinas',
      icon: 'Star',
      rarity: 'epic',
      points: 200
    },
    'superintelligence-theorist': {
      id: 'superintelligence-theorist',
      name: 'Teórico de la Superinteligencia',
      description: 'Domina todos los fragmentos de IA Ética',
      icon: 'Award',
      rarity: 'legendary',
      points: 500
    }
  },

  progressMilestones: [
    { threshold: 100, title: 'Aprendiz', rewards: ['badge-slot', 'theme-unlock'] },
    { threshold: 500, title: 'Explorador', rewards: ['visualization-unlock', 'path-suggestions'] },
    { threshold: 1000, title: 'Sabio', rewards: ['custom-fragments', 'teaching-mode'] },
    { threshold: 2500, title: 'Maestro', rewards: ['fragment-creation', 'mentorship'] },
    { threshold: 5000, title: 'Visionario', rewards: ['reality-architect', 'dimension-access'] }
  ]
};

// Componente de Sistema de Progreso
export const ProgressSystem = ({ userProgress, totalFragments, userLevel }) => {
  const [currentXP, setCurrentXP] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [recentAchievements, setRecentAchievements] = useState([]);

  useEffect(() => {
    const xp = Object.values(userProgress).reduce((sum, progress) => sum + (progress * 100), 0);
    setCurrentXP(xp);
    
    const currentMilestone = achievementSystem.progressMilestones.find(m => xp < m.threshold);
    if (currentMilestone) {
      const prevMilestone = achievementSystem.progressMilestones[
        achievementSystem.progressMilestones.indexOf(currentMilestone) - 1
      ];
      const prevThreshold = prevMilestone ? prevMilestone.threshold : 0;
      const progress = (xp - prevThreshold) / (currentMilestone.threshold - prevThreshold);
      setLevelProgress(Math.min(progress, 1));
    }
  }, [userProgress]);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
          Progreso de Dominio
        </h3>
        <div className="text-purple-400 font-semibold">
          {currentXP} XP
        </div>
      </div>

      {/* Barra de progreso de nivel */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Nivel {userLevel}</span>
          <span>{(levelProgress * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {Object.keys(userProgress).length}
          </div>
          <div className="text-xs text-gray-400">Fragmentos Activados</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {(Object.values(userProgress).reduce((a, b) => a + b, 0) / Object.keys(userProgress).length * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Dominio Promedio</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Object.values(userProgress).filter(p => p > 0.8).length}
          </div>
          <div className="text-xs text-gray-400">Fragmentos Dominados</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {recentAchievements.length}
          </div>
          <div className="text-xs text-gray-400">Logros Recientes</div>
        </div>
      </div>

      {/* Logros recientes */}
      <AnimatePresence>
        {recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/50"
          >
            <h4 className="text-white font-semibold mb-2 flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Logros Desbloqueados
            </h4>
            <div className="space-y-2">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  <span className="text-white">{achievement.name}</span>
                  <span className="text-gray-400 ml-2">+{achievement.points} XP</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de Rutas de Aprendizaje Sugeridas
export const LearningPathSuggestions = ({ userProgress, userInterests, fragments }) => {
  const [suggestedPaths, setSuggestedPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

  useEffect(() => {
    // Algoritmo de recomendación basado en progreso e intereses
    const recommendations = generatePathRecommendations(userProgress, userInterests, fragments);
    setSuggestedPaths(recommendations);
  }, [userProgress, userInterests, fragments]);

  const generatePathRecommendations = (progress, interests, fragments) => {
    // Implementación del algoritmo de recomendación
    return [
      {
        id: 'quantum-consciousness',
        name: 'Conciencia Cuántica',
        description: 'Explora la intersección entre mecánica cuántica y conciencia',
        difficulty: 'Avanzado',
        estimatedTime: '4-6 horas',
        compatibility: 0.92,
        fragments: ['quantum-001', 'consciousness-001', 'quantum-002'],
        rewards: ['quantum-explorer', 'philosopher-mind']
      },
      {
        id: 'ai-reality',
        name: 'IA y Realidad',
        description: 'Comprende cómo la IA podría alterar nuestra percepción de la realidad',
        difficulty: 'Intermedio',
        estimatedTime: '3-4 horas',
        compatibility: 0.87,
        fragments: ['ai-ethics-001', 'simulation-001', 'consciousness-001'],
        rewards: ['reality-hacker', 'superintelligence-theorist']
      }
    ];
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-blue-400" />
        Rutas Recomendadas
      </h3>

      <div className="space-y-4">
        {suggestedPaths.map((path, index) => (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-blue-500/50 transition-all cursor-pointer"
            onClick={() => setSelectedPath(path)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-semibold">{path.name}</h4>
              <div className="flex items-center text-sm text-blue-400">
                <Star className="w-4 h-4 mr-1" />
                {(path.compatibility * 100).toFixed(0)}% match
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-3">{path.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex space-x-4 text-xs text-gray-400">
                <span>Dificultad: {path.difficulty}</span>
                <span>Tiempo: {path.estimatedTime}</span>
              </div>
              <div className="flex items-center text-xs text-purple-400">
                <Trophy className="w-3 h-3 mr-1" />
                {path.rewards.length} logros
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedPath && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-500/50"
        >
          <h4 className="text-white font-semibold mb-2">{selectedPath.name}</h4>
          <p className="text-gray-300 text-sm mb-3">{selectedPath.description}</p>
          <div className="flex justify-between items-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Comenzar Ruta
            </button>
            <button 
              onClick={() => setSelectedPath(null)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default { ProgressSystem, LearningPathSuggestions };
