// Simple synthesized sound system mapping gameplay log categories to distinct tones
// Generates tones via Web Audio API to avoid adding multiple asset files.

export type SoundCategory =
  | 'player_attack'
  | 'enemy_attack'
  | 'ally_ability'
  | 'kill'
  | 'death'
  | 'loot'
  | 'upgrade'
  | 'floor'
  | 'trap'
  | 'buff'
  | 'shield'
  | 'heal'
  | 'victory'
  | 'streak'
  | 'generic'

let audioCtx: AudioContext | null = null

function ensureCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { /* ignore */ }
  } else if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{})
  }
  return audioCtx
}

interface Pattern { freqs: number[]; dur: number; type?: OscillatorType; volume?: number }

const CATEGORY_PATTERNS: Record<SoundCategory, Pattern> = {
  player_attack: { freqs: [440], dur: 0.12, type: 'square' },
  enemy_attack: { freqs: [220], dur: 0.12, type: 'sawtooth', volume: 0.35 },
  ally_ability: { freqs: [660, 880], dur: 0.18, type: 'triangle' },
  kill: { freqs: [330, 494], dur: 0.25, type: 'square' },
  death: { freqs: [160, 120, 90], dur: 0.5, type: 'sawtooth', volume: 0.5 },
  loot: { freqs: [880, 1320], dur: 0.3, type: 'sine' },
  upgrade: { freqs: [520, 620, 780], dur: 0.35, type: 'triangle' },
  floor: { freqs: [400, 300, 500], dur: 0.35, type: 'sine' },
  trap: { freqs: [1200, 300], dur: 0.25, type: 'sawtooth' },
  buff: { freqs: [600, 760], dur: 0.28, type: 'sine' },
  shield: { freqs: [520], dur: 0.4, type: 'sine' },
  heal: { freqs: [440, 660], dur: 0.3, type: 'sine' },
  victory: { freqs: [660, 880, 990, 1320], dur: 0.8, type: 'triangle' },
  streak: { freqs: [700, 900], dur: 0.25, type: 'square' },
  generic: { freqs: [500], dur: 0.1, type: 'sine' }
}

export function categorizeLogMessage(msg: string): SoundCategory {
  const m = msg.toLowerCase()
  if (/(bola de fuego|golpe amplio|lluvia de flechas|inspirar|rayo divino|aura guardi|puñalada|nube venenosa|alzar espectro|frenesí)/i.test(msg)) return 'ally_ability'
  if (/trampa activada/.test(m)) return 'trap'
  if (/escudo/.test(m)) return 'shield'
  if (/(curación|cura)/.test(m)) return 'heal'
  if (/(inspirar|frenesí|buff|aura)/.test(m)) return 'buff'
  if (/(botín|tesoro|cofre)/.test(m)) return 'loot'
  if (/(⬆️ piso|atq|maxhp|mejora|\+1 atq|\+1 atk|\+2 maxhp)/i.test(msg)) return 'upgrade'
  if (/(desciendes al piso|piso \d+)/i.test(msg)) return 'floor'
  if (/(victoria|¡victoria|conquistado)/.test(m)) return 'victory'
  if (/(game over|muerto|has caído|derrotado)/.test(m)) return 'death'
  if (/racha/.test(m)) return 'streak'
  if (/(lanza|ejecuta|invoca|libera)/.test(m)) return 'ally_ability'
  if (/ataca/.test(m)) return 'player_attack'
  if (/golpea|hiere/.test(m)) return 'enemy_attack'
  if (/\+\d+ xp|xp/.test(m)) return 'kill'
  return 'generic'
}

export function playCategory(cat: SoundCategory) {
  const ctx = ensureCtx()
  if (!ctx) return
  const pattern = CATEGORY_PATTERNS[cat] || CATEGORY_PATTERNS.generic
  const now = ctx.currentTime
  const total = pattern.dur
  const step = total / pattern.freqs.length
  pattern.freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = pattern.type || 'sine'
    osc.frequency.value = f
    const start = now + i * step
    const end = start + step * 0.9
    const vol = (pattern.volume ?? 0.25)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.01)
    gain.gain.linearRampToValueAtTime(0.0001, end)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(end + 0.02)
  })
}

export function primeAudio() { ensureCtx() }

