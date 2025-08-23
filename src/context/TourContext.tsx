import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import script from '@/data/tourScript.json';
import useTourActions from '@/hooks/useTourActions';
import { TourContextValue } from '@/types/TourContext';
import { useRobotConfig } from './RobotContext';

export const TourContext = createContext<TourContextValue | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const actions = useTourActions();
  const robotConfig = useRobotConfig();
  const [tourMode, setTourMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('tourState');
    if (stored) {
      try {
        const state = JSON.parse(stored);
        setTourMode(state.tourMode);
        setCurrentStep(state.currentStep);
        setCompleted(state.completed || []);
      } catch {/* ignore */}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tourState', JSON.stringify({ tourMode, currentStep, completed }));
  }, [tourMode, currentStep, completed]);

  const togglePanel = () => setTourMode(t => !t);

  const completeStep = (id: string, badge: string) => {
    if (!completed.includes(badge)) setCompleted(c => [...c, badge]);
    const idx = script.findIndex(s => s.id === id);
    if (idx !== -1) setCurrentStep(idx + 1);
  };

  // Navigation command map (formas base sin acentos)
  const NAV_COMMANDS: Record<string, string> = {
    arquetipos: '/archetypes',
    consola: '/dungeon',
    aprendizaje: '/learning',
    prompts: '/prompts',
    notas: '/prompts',
    configuracion: '/settings',
    animacion: 'https://museo.animarex.xyz', // ahora URL externa
    trading: 'https://trading.animarex.xyz',
    oraculos: 'https://trading.animarex.xyz',
    bienvenida: '/welcome',
    archetype: '/archetypes',
    console: '/dungeon',
    nonlinear: '/learning',
    prompt: '/prompts',
    settings: '/settings',
    animation: 'https://museo.animarex.xyz', // alias inglés también externa
    oracle: '/professional',
    welcome: '/welcome'
  };

  // Aliases con acentos / variantes -> se normalizan a las claves base
  const COMMAND_ALIASES: Record<string, string> = {
    'animación': 'animacion',
    'configuración': 'configuracion',
    'oráculos': 'oraculos'
  };

  const normalize = (txt: string) => txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const runCommand = (raw: string): string => {
    const commandOriginal = raw.trim().toLowerCase();
    const commandNormalized = normalize(commandOriginal);
    const baseKey = COMMAND_ALIASES[commandOriginal] || COMMAND_ALIASES[commandNormalized] || commandNormalized;

    if (NAV_COMMANDS[baseKey]) {
      const target = NAV_COMMANDS[baseKey];
      if (/^https?:\/\//i.test(target)) {
        // Abrir recurso externo en nueva pestaña
        window.open(target, '_blank', 'noopener');
      } else {
        window.location.hash = '#' + target;
      }

      const preset = robotConfig.config.currentPreset;
      const responses: Record<string, Record<string, string>> = {
        cyberpunk_neon: {
          arquetipos: '🤖 Inicializando generador de arquetipos cibernéticos...',
          consola: '⚔️ Acceso concedido al DUNGEON CRAWLER neural...',
          aprendizaje: '🧠 Conectando con la matriz de aprendizaje...',
          prompts: '📝 Activando editor de fragmentos de código...',
          notas: '📝 Activando editor de fragmentos de código...',
          configuracion: '⚙️ Accediendo al panel de control central...',
          animacion: '🌀 Iniciando Animación Eterna procedimental...',
          trading: '📊 Interfaz TradingVision Pro en línea...',
          oraculos: '📊 Interfaz TradingVision Pro en línea...',
          bienvenida: '🏠 Retornando al hub principal...',
          archetype: '🤖 Inicializando generador de arquetipos cibernéticos...',
          console: '⚔️ Acceso concedido al DUNGEON CRAWLER neural...',
          nonlinear: '🧠 Conectando con la matriz de aprendizaje...',
          prompt: '📝 Activando editor de fragmentos de código...',
          settings: '⚙️ Accediendo al panel de control central...',
          animation: '🌀 Launching Eternal Procedural Animation...',
          oracle: '🔮 Conectando con Oráculos Cuánticos Nexus...',
          welcome: '🏠 Retornando al hub principal...'
        },
        minimal_clean: {
          arquetipos: '👑 Accediendo al salón imperial de arquetipos...',
            consola: '⚔️ Bienvenido al DUNGEON CRAWLER imperial...',
            aprendizaje: '📚 Iniciando sesión de aprendizaje de élite...',
            prompts: '🖋️ Abriendo el scriptorium imperial...',
            notas: '🖋️ Abriendo el scriptorium imperial...',
            configuracion: '🏛️ Entrando a la cámara de configuraciones...',
            animacion: '🌀 Desplegando tapiz visual infinito...',
            trading: '💰 TradingVision Pro - Versión Imperial activada...',
            oraculos: '💰 TradingVision Pro - Versión Imperial activada...',
            bienvenida: '🏰 Regresando al palacio principal...',
            archetype: '👑 Accediendo al salón imperial de arquetipos...',
            console: '⚔️ Bienvenido al DUNGEON CRAWLER imperial...',
            nonlinear: '📚 Iniciando sesión de aprendizaje de élite...',
            prompt: '🖋️ Abriendo el scriptorium imperial...',
            settings: '🏛️ Entrando a la cámara de configuraciones...',
            animation: '🌀 Un lienzo animado eterno se manifiesta...',
            oracle: '🔮 Conectando con Oráculos Imperiales...',
            welcome: '🏰 Regresando al palacio principal...'
        },
        colorful_playful: {
          arquetipos: '🎨 ¡Hora de crear arquetipos súper divertidos!',
          consola: '⚔️ ¡Bienvenido al DUNGEON CRAWLER más épico!',
          aprendizaje: '🎉 ¡Aprendamos de forma súper divertida!',
          prompts: '🎪 ¡Vamos a escribir cosas geniales!',
          notas: '🎪 ¡Vamos a escribir cosas geniales!',
          configuracion: '🛠️ ¡Ajustemos todo para que se vea increíble!',
          animacion: '🌀 ¡Activando animación infinita súper mágica!',
          trading: '🚀 ¡TradingVision Pro modo diversión activado!',
          oraculos: '🚀 ¡TradingVision Pro modo diversión activado!',
          bienvenida: '🏡 ¡De vuelta a nuestro hogar colorido!',
          archetype: '🎨 ¡Hora de crear arquetipos súper divertidos!',
          console: '⚔️ ¡Bienvenido al DUNGEON CRAWLER más épico!',
          nonlinear: '🎉 ¡Aprendamos de forma súper divertida!',
          prompt: '🎪 ¡Vamos a escribir cosas geniales!',
          settings: '🛠️ ¡Ajustemos todo para que se vea increíble!',
          animation: '🌀 ¡Eternal animation time, woohoo!',
          oracle: '🔮 ¡Conectando con Oráculos Mágicos!',
          welcome: '🏡 ¡De vuelta a nuestro hogar colorido!'
        }
      };
      const presetResponses = responses[preset] || responses['cyberpunk_neon'];
      return (presetResponses && presetResponses[baseKey]) ? presetResponses[baseKey] : `Navegando a ${target}`;
    }

    const step = script[currentStep];
    let response = 'Comando no reconocido. Usa: bienvenida, arquetipos, dungeon crawler, aprendizaje, notas, prompts, configuracion, animacion, trading';
    if (step && step.command === raw) {
      response = step.dialog;
      const { action, badge, id } = step;
      if (action?.scrollTo) actions.scrollTo(action.scrollTo);
      if (action?.loadModule) actions.loadModule(action.loadModule);
      if (action?.showCertificate) actions.showCertificate();
      if (badge) completeStep(id, badge);
    }
    return response;
  };

  const goTo = (idx: number) => setCurrentStep(idx);
  const finish = () => { setCurrentStep(-1); setTourMode(false); };

  return (
    <TourContext.Provider value={{
      steps: script || [],
      current: currentStep,
      currentStep,
      tourMode,
      completed,
      next: () => setCurrentStep(p => p + 1),
      prev: () => setCurrentStep(p => Math.max(0, p - 1)),
      startTour: () => { setTourMode(true); setCurrentStep(0); },
      endTour: () => { setTourMode(false); setCurrentStep(-1); },
      togglePanel,
      runCommand,
      completeStep,
      setTourMode,
      setCurrentStep,
      setCompleted,
      actions,
      script,
      goTo,
      finish
    }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
};

