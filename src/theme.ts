export interface SettingsState {
  darkMode: boolean;
  greenMode: boolean;
  autoAdvance: boolean;
  showAnimations: boolean;
  compactMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  difficultyFilter: string;
}

export function getTheme(settings: SettingsState) {
  if (settings.greenMode) {
    return {
      bg: 'bg-neon-900',
      text: 'text-neon-300',
      header: 'bg-neon-900/90 text-neon-300',
      cardBg: 'bg-neon-800/60 border-neon-500',
      panelBg: 'bg-neon-900/50',
      button: 'bg-neon-500 text-black hover:bg-neon-400',
      gradient: 'bg-gradient-to-br from-neon-700 via-neon-600 to-neon-900'
    };
  }
  if (settings.darkMode) {
    return {
      bg: 'bg-slate-900',
      text: 'text-slate-100',
      header: 'bg-slate-900/98 text-slate-100',
      cardBg: 'bg-slate-800/60 border-slate-700',
      panelBg: 'bg-slate-800/50',
      button: 'bg-primary text-primary-foreground',
      gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    };
  }
  return {
    bg: 'bg-white',
    text: 'text-slate-900',
    header: 'bg-white text-slate-900',
    cardBg: 'bg-gray-100 border-gray-200',
    panelBg: 'bg-white',
    button: 'bg-primary text-primary-foreground',
    gradient: 'bg-gradient-to-br from-gray-100 via-gray-50 to-white'
  };
}
