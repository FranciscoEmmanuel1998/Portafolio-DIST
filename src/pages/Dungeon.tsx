// AIRoguelike.tsx — Ciclo 5  (≈ 835 líneas)
// /* @jsxRuntime automatic @jsxImportSource react */
import { useEffect, useReducer, useState, useRef } from 'react'
import { categorizeLogMessage, playCategory, primeAudio } from '../lib/sound'
import { useFx } from './useFX'

/*──────────────── CONSTANTES & TIPOS ────────────────*/
const MAP_W = 40, MAP_H = 22
type Tile = '#' | '.' | '>' | 'C' | 'A'
interface Pos { x: number; y: number }
interface Enemy { kind: 'zombie' | 'orc' | 'demon' | 'ranged' | 'shaman' | 'wraith' | 'brute'; pos: Pos; hp: number; dmg: number; speed: number; aggro: boolean }
interface Player extends Pos { hp: number; maxHp: number; atk: number; vision: number; score: number 
  ammo?: number;
  ammoMax?: number;}
interface Ally extends Pos {
  id: string
  emoji: string
  name: string
  hp: number
  maxHp: number
  atk: number
  behavior: 'follow' | 'guard' | 'aggressive'
  lastAction: number
  target?: string // enemy ID
  // --- CICLO 8: Sistema de habilidades ---
  abilities?: AllyAbility[]
  cooldowns?: Record<string, number>
  energy?: number
  maxEnergy?: number
  spawnFloor?: number
}
// Definición de habilidad de aliado
interface AllyAbility {
  id: string
  name: string
  type: 'active' | 'passive'
  cooldown: number
  range: number
  area?: number // radio AOE
  power?: number // daño base o impacto
  kind: 'nuke' | 'heal' | 'shield' | 'buff' | 'dot' | 'control'
  aiUsage: 'opener' | 'finisher' | 'reactive' | 'support'
  description: string
  // Condición para uso inteligente
  shouldUse?: (ctx: { ally: Ally; state: GameState; enemies: Enemy[]; player: Player }) => boolean
  // Ejecutor
  execute: (ctx: { ally: Ally; state: GameState; enemies: Enemy[]; player: Player; log: string[] }) => Partial<GameState>
}
interface Stats { kills: number; chests: number; turnsSinceDamage: number }
interface Achievement { 
  id: string; 
  name: string; 
  description: string; 
  condition: (state: GameState, stats: Stats) => boolean;
  unlocked: boolean;
  timestamp?: number;
}
interface RunRecord {
  id: string;
  floor: number;
  kills: number;
  turns: number;
  timestamp: number;
  seed?: string;
  isDailyRun?: boolean;
}
interface GameState {
  map: Tile[][]
  seen: boolean[][]
  player: Player
  enemies: Enemy[]
  allies: Ally[]
  maxAllies: number
  currentPhase: TurnPhase
  log: string[]
  status: 'RUN' | 'WIN' | 'DEAD' | 'VICTORY'
  turn: number
  stats: Stats
  overlay: boolean
  overlayType?: 'death' | 'achievements' | 'leaderboard' | 'victory'
  showContinue?: boolean
  floor: number
  traps: Set<string>
  revealedTraps: Set<string>
  achievements: Achievement[]
  runHistory: RunRecord[]
  // Opcionales de seed/carrera diaria
  currentSeed?: string
  isDailyRun?: boolean
  startTime?: number
  // --- CICLO 8: efectos temporales ---
  effects?: {
    shield?: { amount: number; expires: number }
    buff?: { atkBonus: number; expires: number }
  paceBoost?: { amount: number; expires: number }
  }
  abilityHighlights?: Record<string, number>
  // --- CICLO 9: progresión ---
  xp?: number
  level?: number
  nextLevelXp?: number
  progressionPoints?: number
  unlockedAllies?: string[]
  // --- CICLO EXTRA: racha de asesinatos y upgrades ---
  killStreak?: number
  bestKillStreak?: number
  pendingUpgradeChoices?: UpgradeChoice[]
  upgradesTaken?: string[]
}
// Tipado para nuevas mejoras rápidas entre pisos
interface UpgradeChoice {
  id: string
  label: string
  apply: (s: GameState) => GameState
  weight?: number
  kind?: 'atk' | 'hp' | 'vision' | 'cooldown' | 'sustain'
}

const BASE_UPGRADES: UpgradeChoice[] = [
  { id: 'atk+1', label: '+1 ATQ', kind: 'atk', apply: (s) => ({ ...s, player: { ...s.player, atk: s.player.atk + 1 } }) },
  { id: 'hp+3', label: '+3 Vida Máx', kind: 'hp', apply: (s) => ({ ...s, player: { ...s.player, maxHp: s.player.maxHp + 3, hp: s.player.hp + 3 } }) },
  { id: 'vision+1', label: '+1 Visión (temporal)', kind: 'vision', apply: (s) => ({ ...s, effects: { ...s.effects, buffVision: { amount: 1, expires: s.turn + 120 } as any } }) },
  { id: 'sustain-heal', label: 'Cura por kill +1 (run)', kind: 'sustain', apply: (s) => ({ ...s, player: { ...s.player, metaHealPerKill: (s.player as any).metaHealPerKill ? (s.player as any).metaHealPerKill + 1 : 1 } as any }) },
  { id: 'ammo+3', label: '+3 balas (máx 9)', kind: 'sustain', apply: (s) => ({ ...s, player: { ...s.player, ammoMax: (s.player.ammoMax ?? 9), ammo: Math.min((s.player.ammoMax ?? 9), (s.player.ammo ?? 0) + 3) } }) }
]
// Removed UpgradeOption interface - no longer using level up choices
type Action =
  | { type: 'MOVE'; dx: number; dy: number }
  | { type: 'WAIT' }
  
  | { type: 'SHOOT' } | { type: 'NEW_GAME'; seed?: string; isDaily?: boolean }
  | { type: 'CONTINUE_GAME' }
  | { type: 'DISMISS_CONTINUE' }
  | { type: 'TOGGLE_ACHIEVEMENTS' }
  | { type: 'TOGGLE_LEADERBOARD' }
  | { type: 'ALLY_TURN' }
  | { type: 'ENEMY_TURN' }
  | { type: 'APPLY_UPGRADE'; id: string }

// 🎯 SISTEMA DE TURNOS - Fases de combate
enum TurnPhase {
  PLAYER = 'player',
  ALLIES = 'allies', 
  ENEMIES = 'enemies'
}

const clamp = (v: number, mi: number, ma: number) => Math.max(mi, Math.min(ma, v))
const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H
const DIRS = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }] as const
const BASE_VISION = 6 // visión base (reemplaza VISION)
const MAX_VISION = 10
const ATK_SOFT_CAP = 6 // Por encima de esto, subir ATQ es menos eficiente (sugerencia visual)
const ATK_HARD_CAP = 9 // Límite absoluto
// Removed level XP factor - no longer using levels

// 🧙‍♂️ SISTEMA DE ALIADOS - Modular
const ALLY_TYPES: Record<string, any> = {
  mage:    { emoji:'🧙‍♂️', name:'Mago', baseHp:8,  baseAtk:3, behavior:'follow',    unlock:5, abil:['heal','fireball'] },
  warrior: { emoji:'⚔️',   name:'Guerrero', baseHp:15, baseAtk:2, behavior:'aggressive', unlock:7, abil:['cleave','shield'] },
  archer:  { emoji:'🏹',   name:'Arquero',  baseHp:10, baseAtk:4, behavior:'guard',     unlock:10, abil:['volley','inspire'] },
  paladin: { emoji:'🛡️',   name:'Paladín',  baseHp:18, baseAtk:3, behavior:'follow',    unlock:12, abil:['smite','guard_aura'] },
  rogue:   { emoji:'🗡️',   name:'Pícaro',   baseHp:9,  baseAtk:5, behavior:'aggressive', unlock:15, abil:['backstab','volley'] },
  druid:   { emoji:'🌿',   name:'Druida',   baseHp:11, baseAtk:3, behavior:'follow',    unlock:18, abil:['heal','poison'] },
  necromancer:{emoji:'💀', name:'Nigromante',baseHp:12, baseAtk:4, behavior:'guard',     unlock:20, abil:['raise','poison'] },
  berserker:{emoji:'🩸',  name:'Rabioso',  baseHp:14, baseAtk:6, behavior:'aggressive', unlock:22, abil:['frenzy','cleave'] },
}

const allyOrder = ['mage','warrior','archer','paladin','rogue','druid','necromancer','berserker']
const availableAllies = (floor:number) => allyOrder.filter(k => floor >= ALLY_TYPES[k].unlock)

function scaleAlly(baseHp:number, baseAtk:number, floor:number, spawn:number) {
  const delta = Math.max(0, floor - spawn)
  const hp = baseHp + Math.floor(delta * 0.9) + Math.floor(Math.sqrt(delta)*1.2) + Math.floor(delta/25)
  const atk = baseAtk + Math.floor(delta * 0.25) + (delta>40?1:0) + Math.floor(delta/60)
  return { hp, atk }
}

function spawnAlly(state: GameState, type: string, floor: number): Ally | null {
  // Busca posición libre cerca del jugador
  const { player, map, enemies, allies } = state
  for (let radius = 1; radius <= 3; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
        const x = player.x + dx, y = player.y + dy
        if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue
        if (map[y]?.[x] !== '.') continue
        if (enemies.some(e => e.pos.x === x && e.pos.y === y)) continue
        if (allies.some(a => a.x === x && a.y === y)) continue
        // Crear aliado
        const t = ALLY_TYPES[type]
        const id = `ally_${Date.now()}_${Math.random().toString(36).substr(2,6)}`
        const scaled = scaleAlly(t.baseHp, t.baseAtk, floor, floor)
        return {
          id,
          emoji: t.emoji,
          name: t.name,
          x, y,
          hp: scaled.hp,
          maxHp: scaled.hp,
          atk: scaled.atk,
          behavior: t.behavior,
          lastAction: 0,
          abilities: (t.abil || []).map((id:string) => ABILITIES[id]).filter(Boolean),
          cooldowns: {},
          energy: 0,
          maxEnergy: 0,
          spawnFloor: floor
        }
      }
    }
  }
  return null
}

function useAbilityIfAny(ally: Ally, state: GameState, enemies: Enemy[], player: Player, log: string[]): {used:boolean, newEnemies:Enemy[], newPlayer:Player, newState:GameState} {
  let used = false
  let newEnemies = enemies
  let newPlayer = player
  let newState = state
  const cooldowns = { ...(ally.cooldowns||{}) }
  const abilities = (ally.abilities ?? []).map(resolveAbility).filter((a): a is AllyAbility => !!a)
if (abilities.length) {
  // Prioridad táctica: reactive > finisher > opener > support
  const priority: Record<string, number> = { reactive:0, finisher:1, opener:2, support:3 }
  const sorted = abilities.sort((a,b)=> (priority[a.aiUsage||'support']??99) - (priority[b.aiUsage||'support']??99))
  for (const ab of sorted) {
      if ((cooldowns[ab.id]||0) > 0) continue
      const canUse = !ab.shouldUse || ab.shouldUse({ ally, state: newState, enemies: newEnemies, player: newState.player })
      if (!canUse) continue
      const partial = ab.execute({ ally, state: newState, enemies: newEnemies, player: newState.player, log }) || {}
      if (partial.player) newPlayer = partial.player as Player
      if (partial.effects) newState.effects = { ...newState.effects, ...partial.effects }
      if (partial.abilityHighlights) newState.abilityHighlights = { ...newState.abilityHighlights, ...partial.abilityHighlights }
      if (partial.enemies) newEnemies = partial.enemies as Enemy[]
      cooldowns[ab.id] = ab.cooldown
      used = true
      break
    }
  }
  return {used, newEnemies, newPlayer, newState}
}

function chooseAllyMove(ally: Ally, state: GameState): { newPos?: Pos, target?: Enemy } {
  const { player, enemies } = state
  // ...existing code for follow/aggressive/guard (see previous implementation)...
  switch (ally.behavior) {
    case 'follow': {
      const playerDist = Math.abs(ally.x - player.x) + Math.abs(ally.y - player.y)
      const nearestEnemy = enemies.filter(e=>e.hp>0).sort((a,b)=>{
        const da = Math.abs(a.pos.x-ally.x)+Math.abs(a.pos.y-ally.y)
        const db = Math.abs(b.pos.x-ally.x)+Math.abs(b.pos.y-ally.y)
        return da-db
      })[0]
      if (nearestEnemy && Math.abs(nearestEnemy.pos.x-ally.x)+Math.abs(nearestEnemy.pos.y-ally.y)<=1) {
        return { target: nearestEnemy }
      }
      if (playerDist > 3) {
        // Acercarse al jugador
        const dx = Math.sign(player.x-ally.x), dy = Math.sign(player.y-ally.y)
        const nx = ally.x+dx, ny = ally.y+dy
        if (inBounds(nx,ny) && state.map[ny][nx]==='.' && !state.allies.some(a=>a.x===nx&&a.y===ny) && !state.enemies.some(e=>e.pos.x===nx&&e.pos.y===ny))
          return { newPos: {x:nx,y:ny} }
      }
      if (nearestEnemy && Math.abs(nearestEnemy.pos.x-ally.x)+Math.abs(nearestEnemy.pos.y-ally.y)<=3) {
        // Ir hacia enemigo
        const dx = Math.sign(nearestEnemy.pos.x-ally.x), dy = Math.sign(nearestEnemy.pos.y-ally.y)
        const nx = ally.x+dx, ny = ally.y+dy
        if (inBounds(nx,ny) && state.map[ny][nx]==='.' && !state.allies.some(a=>a.x===nx&&a.y===ny) && !state.enemies.some(e=>e.pos.x===nx&&e.pos.y===ny))
          return { newPos: {x:nx,y:ny} }
      }
// Proactivo: si no hay enemigo en <=3, avanza hacia el enemigo más cercano
if (!nearestEnemy || Math.abs(nearestEnemy.pos.x-ally.x)+Math.abs(nearestEnemy.pos.y-ally.y) > 3) {
  const movePos = findBestMoveTowards(ally, nearestEnemy ? nearestEnemy.pos : player, state)
  if (movePos) return { newPos: movePos }
}
// Si está pegado al jugador y bloqueando, orbitar/retroceder 1 casilla
if (playerDist < 2) {
  const back = { x: ally.x - Math.sign(player.x-ally.x), y: ally.y - Math.sign(player.y-ally.y) }
  if (inBounds(back.x, back.y) && state.map[back.y][back.x]==='.' 
      && !state.allies.some(a=>a!==ally && a.x===back.x && a.y===back.y)
      && !state.enemies.some(e=>e.pos.x===back.x && e.pos.y===back.y)) {
    return { newPos: back }
  }
}

      return { newPos: ally }
    }
    case 'aggressive': {
      const nearestEnemy = enemies.filter(e=>e.hp>0).sort((a,b)=>{
        const da = Math.abs(a.pos.x-ally.x)+Math.abs(a.pos.y-ally.y)
        const db = Math.abs(b.pos.x-ally.x)+Math.abs(b.pos.y-ally.y)
        return da-db
      })[0]
      if (!nearestEnemy) return { newPos: ally }
      const dist = Math.abs(nearestEnemy.pos.x-ally.x)+Math.abs(nearestEnemy.pos.y-ally.y)
      if (dist<=1) return { target: nearestEnemy }
      const dx = Math.sign(nearestEnemy.pos.x-ally.x), dy = Math.sign(nearestEnemy.pos.y-ally.y)
      const nx = ally.x+dx, ny = ally.y+dy
      if (inBounds(nx,ny) && state.map[ny][nx]==='.' && !state.allies.some(a=>a.x===nx&&a.y===ny) && !state.enemies.some(e=>e.pos.x===nx&&e.pos.y===ny))
        return { newPos: {x:nx,y:ny} }
      return { newPos: ally }
    }
    case 'guard': {
      const threats = enemies.filter(e=>e.hp>0 && Math.abs(e.pos.x-player.x)+Math.abs(e.pos.y-player.y)<=2)
      if (threats.length) {
        const target = threats[0]
        const dist = Math.abs(target.pos.x-ally.x)+Math.abs(target.pos.y-ally.y)
        if (dist<=1) return { target }
        const dx = Math.sign(target.pos.x-ally.x), dy = Math.sign(target.pos.y-ally.y)
        const nx = ally.x+dx, ny = ally.y+dy
        if (inBounds(nx,ny) && state.map[ny][nx]==='.' && !state.allies.some(a=>a.x===nx&&a.y===ny) && !state.enemies.some(e=>e.pos.x===nx&&e.pos.y===ny))
          return { newPos: {x:nx,y:ny} }
      }
      const playerDist = Math.abs(ally.x-player.x)+Math.abs(ally.y-player.y)
      if (playerDist>2) {
        const dx = Math.sign(player.x-ally.x), dy = Math.sign(player.y-ally.y)
        const nx = ally.x+dx, ny = ally.y+dy
        if (inBounds(nx,ny) && state.map[ny][nx]==='.' && !state.allies.some(a=>a.x===nx&&a.y===ny) && !state.enemies.some(e=>e.pos.x===nx&&e.pos.y===ny))
          return { newPos: {x:nx,y:ny} }
      }
      

return { newPos: ally }
    }
    default:
      return { newPos: ally }
  }
}

// (EOF)

// CICLO 8: Habilidades (catálogo principal)
const ABILITIES: Record<string, AllyAbility> = {
  fireball: { id:'fireball', name:'Bola de Fuego', type:'active', cooldown:5, range:6, area:1, power:4, kind:'nuke', aiUsage:'opener', description:'Daño AOE',
    shouldUse: ({ally, enemies}) => enemies.some(e => Math.abs(e.pos.x - ally.x) + Math.abs(e.pos.y - ally.y) <= 6),
    execute: ({ally,state,enemies,log}) => { let best:null|{hits:Enemy[]} = null; for(const e of enemies){const d=Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y); if(d<=6){const hits=enemies.filter(o=>Math.abs(o.pos.x-e.pos.x)+Math.abs(o.pos.y-e.pos.y)<=1); if(!best||hits.length>best.hits.length) best={hits};}} if(!best) return {}; log.push(`${ally.emoji} lanza 🔥 Bola de Fuego`); return { enemies: state.enemies.map(en=> best!.hits.includes(en)?{...en,hp:en.hp-4}:en) } }
  },
  heal: { id:'heal', name:'Curación', type:'active', cooldown:8, range:6, power:5, kind:'heal', aiUsage:'reactive', description:'Sana jugador',
    shouldUse: ({player}) => player.hp < player.maxHp*0.6,
    execute: ({ally,player,log}) => { log.push(`${ally.emoji} canaliza ✨ Curación (+5)`); return { player:{...player,hp:Math.min(player.maxHp, player.hp+5)} } }
  },
  shield: { id:'shield', name:'Escudo', type:'active', cooldown:10, range:0, kind:'shield', aiUsage:'reactive', description:'Mitiga daño',
    shouldUse: ({player}) => player.hp < player.maxHp*0.4,
    execute: ({ally,state,log}) => { log.push(`${ally.emoji} invoca 🛡️ Escudo (5)`); return { effects:{ ...state.effects, shield:{ amount:5, expires: state.turn+5 } } } }
  },
  cleave: { id:'cleave', name:'Golpe Amplio', type:'active', cooldown:4, range:1, area:1, power:3, kind:'nuke', aiUsage:'opener', description:'AOE cercano',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=1),
    execute: ({ally,state,enemies,log}) => { const hits=enemies.filter(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=1); if(!hits.length) return {}; log.push(`${ally.emoji} ejecuta 🗡️ Golpe Amplio`); return { enemies: state.enemies.map(e=> hits.includes(e)?{...e,hp:e.hp-3}:e) } }
  },
  volley: { id:'volley', name:'Lluvia de Flechas', type:'active', cooldown:7, range:7, area:2, power:2, kind:'dot', aiUsage:'opener', description:'AOE distancia',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=7),
    execute: ({ally,state,enemies,log}) => { log.push(`${ally.emoji} desata ☄️ Lluvia de Flechas`); if(!enemies.length) return {}; let target:Enemy|undefined; let bd=Infinity; for(const e of enemies){const d=Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y); if(d<bd){bd=d; target=e}} if(!target) return {}; const hits=enemies.filter(e=>Math.abs(e.pos.x-target.pos.x)+Math.abs(e.pos.y-target.pos.y)<=2); return { enemies: state.enemies.map(e=> hits.includes(e)?{...e,hp:e.hp-2}:e), abilityHighlights: hits.reduce<Record<string,number>>((acc,h)=>{acc[`${h.pos.x},${h.pos.y}`]=state.turn+1;return acc;}, {}) } }
  },
  inspire: { id:'inspire', name:'Inspirar', type:'active', cooldown:12, range:0, kind:'buff', aiUsage:'support', description:'Buff ATK',
    shouldUse: ({player}) => player.hp >= 0,
    execute: ({ally,state,log}) => { log.push(`${ally.emoji} entona 🎺 Inspirar (+ATK)`); return { effects:{ ...state.effects, buff:{ atkBonus:2, expires: state.turn+8 } } } }
  },
  smite: { id:'smite', name:'Rayo Divino', type:'active', cooldown:6, range:5, power:5, kind:'nuke', aiUsage:'opener', description:'Golpe sagrado',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=5),
    execute: ({ally,state,enemies,log}) => { const target = enemies.find(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=5); if(!target) return {}; log.push(`${ally.emoji} invoca ⚡ Rayo Divino`); return { enemies: state.enemies.map(e=> e===target?{...e,hp:e.hp-5}:e), abilityHighlights:{ [`${target.pos.x},${target.pos.y}`]: state.turn+1 } } }
  },
  guard_aura: { id:'guard_aura', name:'Aura Guardián', type:'active', cooldown:10, range:0, kind:'shield', aiUsage:'support', description:'Escudo grupal menor',
    shouldUse: ({state}) => !(state.effects?.shield && state.effects.shield.expires>=state.turn && state.effects.shield.amount>2),
    execute: ({ally,state,log}) => { log.push(`${ally.emoji} proyecta 🛡️ Aura Guardián`); const cur = state.effects?.shield?.amount||0; return { effects:{ ...state.effects, shield:{ amount: cur+4, expires: state.turn+6 } } } }
  },
  backstab: { id:'backstab', name:'Puñalada', type:'active', cooldown:5, range:1, power:7, kind:'nuke', aiUsage:'finisher', description:'Gran daño cercano',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=1 && e.hp<=7),
    execute: ({ally,state,enemies,log}) => { const target = enemies.find(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=1); if(!target) return {}; log.push(`${ally.emoji} ejecuta 🗡️ Puñalada`); return { enemies: state.enemies.map(e=> e===target?{...e,hp:e.hp-7}:e) } }
  },
  poison: { id:'poison', name:'Nube Venenosa', type:'active', cooldown:9, range:5, area:1, power:1, kind:'dot', aiUsage:'opener', description:'Daño persistente ligero',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=5),
    execute: ({ally,state,enemies,log}) => { let target = enemies.find(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=5); if(!target) return {}; const hits = enemies.filter(e=>Math.abs(e.pos.x-target.pos.x)+Math.abs(e.pos.y-target.pos.y)<=1); log.push(`${ally.emoji} libera ☠️ Nube Venenosa`); return { enemies: state.enemies.map(e=> hits.includes(e)?{...e,hp:e.hp-1}:e), abilityHighlights: hits.reduce<Record<string,number>>((a,h)=>{a[`${h.pos.x},${h.pos.y}`]=state.turn+1;return a;}, {}) } }
  },
  raise: { id:'raise', name:'Alzar Espectro', type:'active', cooldown:12, range:4, power:3, kind:'nuke', aiUsage:'opener', description:'Daño necrótico a área',
    shouldUse: ({ally,enemies}) => enemies.some(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=4),
    execute: ({ally,state,enemies,log}) => { const hits = enemies.filter(e=>Math.abs(e.pos.x-ally.x)+Math.abs(e.pos.y-ally.y)<=4); if(!hits.length) return {}; log.push(`${ally.emoji} invoca 💀 Alzar Espectro`); return { enemies: state.enemies.map(e=> hits.includes(e)?{...e,hp:e.hp-3}:e), abilityHighlights: hits.reduce<Record<string,number>>((a,h)=>{a[`${h.pos.x},${h.pos.y}`]=state.turn+1;return a;}, {}) } }
  },
  frenzy: { id:'frenzy', name:'Frenesí', type:'active', cooldown:8, range:0, kind:'buff', aiUsage:'support', description:'Aumenta ATK temporal',
    shouldUse: ({state}) => !(state.effects?.buff && state.effects.buff.expires>=state.turn),
    execute: ({ally,state,log}) => { log.push(`${ally.emoji} entra en 🔥 Frenesí`); const cur = state.effects?.buff?.atkBonus||0; return { effects:{ ...state.effects, buff:{ atkBonus: cur+2, expires: state.turn+6 } } } }
  }
}

// -- Helper: resolver habilidad por ID o devolver objeto validado
function resolveAbility(a: string | AllyAbility): AllyAbility | null {
  const ab = typeof a === 'string' ? ABILITIES[a] : a as AllyAbility
  if (!ab || typeof (ab as any).execute !== 'function') return null
  return ab
}


const ALLY_ABILITIES: Record<string,string[]> = { 
  mage:['fireball','heal'], 
  warrior:['cleave','shield'], 
  archer:['volley','inspire'],
  paladin:['smite','guard_aura'],
  rogue:['backstab','volley'],
  druid:['heal','poison'],
  necromancer:['raise','poison'],
  berserker:['frenzy','cleave']
}

// hpBar mini (si no existe)
const hpBar = (hp:number, max:number) => { const len=10; const fill=Math.max(0, Math.min(len, Math.round((hp/max)*len))); const bar='█'.repeat(fill)+'░'.repeat(len-fill); const ratio=hp/max; const cls = ratio>0.6?'text-green-400': ratio>0.3?'text-yellow-400':'text-red-400'; return { bar, cls } }

// 🎯 SISTEMA DE SPAWN DE ALIADOS
function shouldSpawnAlly(state: GameState): boolean {
  // Permite aparición progresiva hasta maxAllies (por defecto 5) en pisos múltiplos de 5 >=20
  return state.floor >= 5 && state.floor % 5 === 0 && (state.allies?.length || 0) < (state.maxAllies || 5)
}

const scaleAllyStats = (baseHp:number, baseAtk:number, currentFloor:number, spawnFloor:number) => {
  const delta = Math.max(0, currentFloor - spawnFloor)
  // Escalado: lineal moderado + raíz para picos suaves + pequeño bonus cada 25 pisos
  const hp = baseHp + Math.floor(delta * 0.9) + Math.floor(Math.sqrt(delta)*1.2) + Math.floor(delta/25)
  const atk = baseAtk + Math.floor(delta * 0.25) + (delta>40?1:0) + Math.floor(delta/60)
  return { hp, atk }
}

function createAlly(type: keyof typeof ALLY_TYPES, x: number, y: number, floor: number): Ally {
  const template = ALLY_TYPES[type]
  const id = `ally_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  const scaled = scaleAllyStats(template.baseHp, template.baseAtk, floor, floor)
  return {
    id,
    emoji: template.emoji,
    name: template.name,
    x, y,
    hp: scaled.hp,
    maxHp: scaled.hp,
    atk: scaled.atk,
    behavior: template.behavior,
    lastAction: 0,
    abilities: ((ALLY_ABILITIES[type] || []).map(id => ABILITIES[id]).filter(Boolean) as AllyAbility[]),
    cooldowns: {},
    energy: 0,
    maxEnergy: 0,
    spawnFloor: floor
  }
}

function findSpawnPosition(state: GameState): Pos | null {
  const { player, map, enemies, allies } = state
  
  // Buscar posición vacía cerca del jugador
  for (let radius = 1; radius <= 3; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
        
        const x = player.x + dx
        const y = player.y + dy
        
        // Verificar límites
        if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue
        
        // Verificar que sea piso
        if (map[y]?.[x] !== '.') continue
        
        // Verificar que no haya enemigos
        if (enemies.some(e => e.pos.x === x && e.pos.y === y)) continue
        
        // Verificar que no haya otros aliados
        if (allies.some(a => a.x === x && a.y === y)) continue
        
        return { x, y }
      }
    }
  }
  
  return null
}

// 🤖 IA DE ALIADOS - Funciones de comportamiento inteligente
function distance(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function findNearestEnemy(ally: Ally, enemies: Enemy[]): Enemy | null {
  const aliveEnemies = enemies.filter(e => e.hp > 0)
  if (aliveEnemies.length === 0) return null
  
  return aliveEnemies.reduce((nearest, current) => {
    const nearestDist = distance(ally, nearest.pos)
    const currentDist = distance(ally, current.pos)
    return currentDist < nearestDist ? current : nearest
  })
}

function findBestMoveTowards(from: Pos, target: Pos, state: GameState): Pos | null {
  const { map, enemies, allies, player } = state
  const dx = target.x - from.x
  const dy = target.y - from.y
  
  // Posibles movimientos priorizados por dirección hacia el objetivo
  const moves = [
    { x: from.x + Math.sign(dx), y: from.y }, // horizontal hacia objetivo
    { x: from.x, y: from.y + Math.sign(dy) }, // vertical hacia objetivo
    { x: from.x + Math.sign(dx), y: from.y + Math.sign(dy) }, // diagonal
    { x: from.x - Math.sign(dx), y: from.y }, // horizontal opuesta
    { x: from.x, y: from.y - Math.sign(dy) }, // vertical opuesta
  ].filter(pos => {
    // Verificar límites
    if (pos.x < 0 || pos.x >= MAP_W || pos.y < 0 || pos.y >= MAP_H) return false
    
    // Verificar que sea piso
    if (map[pos.y]?.[pos.x] !== '.') return false
    
    // Verificar que no esté ocupado por jugador
    if (pos.x === player.x && pos.y === player.y) return false
    
    // Verificar que no esté ocupado por otros aliados
    if (allies.some(a => a.x === pos.x && a.y === pos.y)) return false
    
    // Verificar que no esté ocupado por enemigos
    if (enemies.some(e => e.pos.x === pos.x && e.pos.y === pos.y && e.hp > 0)) return false
    
    return true
  })
  
  return moves[0] || null
}

function executeAllyBehavior(ally: Ally, state: GameState): { newPos?: Pos, target?: Enemy } {
  const { player, enemies } = state
  
  switch (ally.behavior) {
        
    
    case 'follow': {
      // Mantenerse cerca del jugador (2-3 casillas) pero atacar enemigos cercanos
      const playerDist = distance(ally, player)
      const nearestEnemy = findNearestEnemy(ally, enemies)
      
      // Si hay enemigo muy cerca, atacar
      if (nearestEnemy && distance(ally, nearestEnemy.pos) <= 1) {
        return { target: nearestEnemy }
      }
      
      // Si está muy lejos del jugador, acercarse
      if (playerDist > 3) {
        const movePos = findBestMoveTowards(ally, player, state)
        return { newPos: movePos || ally }
      }
      
      // Si está muy cerca del jugador, buscar enemigos
      if (playerDist < 2 && nearestEnemy) {
        const movePos = findBestMoveTowards(ally, nearestEnemy.pos, state)
        return { newPos: movePos || ally }
      }
      
      // Si hay enemigo en rango medio, ir hacia él
      if (nearestEnemy && distance(ally, nearestEnemy.pos) <= 3) {
        const movePos = findBestMoveTowards(ally, nearestEnemy.pos, state)
        return { newPos: movePos || ally }
      }
      
      return { newPos: ally } // No moverse
    }
    
    case 'aggressive': {
      // Ir directo al enemigo más cercano
      const nearestEnemy = findNearestEnemy(ally, enemies)
      if (!nearestEnemy) return { newPos: ally }
      
      const enemyDist = distance(ally, nearestEnemy.pos)
      if (enemyDist <= 1) {
        return { target: nearestEnemy }
      }
      
      const movePos = findBestMoveTowards(ally, nearestEnemy.pos, state)
      return { newPos: movePos || ally }
    }
    
    case 'guard': {
      // Proteger al jugador, priorizar enemigos que amenacen al jugador
      const threateningEnemies = enemies.filter(e => 
        e.hp > 0 && distance(e.pos, player) <= 2
      )
      
      if (threateningEnemies.length > 0) {
        const target = threateningEnemies[0]
        if (target) {
          const targetDist = distance(ally, target.pos)
          
          if (targetDist <= 1) {
            return { target }
          }
          
          const movePos = findBestMoveTowards(ally, target.pos, state)
          return { newPos: movePos || ally }
        }
      }
      
      // Si no hay amenazas, mantenerse cerca del jugador
      const playerDist = distance(ally, player)
      if (playerDist > 2) {
        const movePos = findBestMoveTowards(ally, player, state)
        return { newPos: movePos || ally }
      }
      
      
      // Fallback: reposicionamiento ofensivo si no hay amenaza inmediata
      {
        const nearestEnemyG = enemies.filter(e=>e.hp>0).sort((a,b)=>{
          const da = Math.abs(a.pos.x-ally.x)+Math.abs(a.pos.y-ally.y);
          const db = Math.abs(b.pos.x-ally.x)+Math.abs(b.pos.y-ally.y);
          return da - db;
        })[0];
        if (nearestEnemyG) {
          const gmove = findBestMoveTowards(ally, nearestEnemyG.pos, state);
          if (gmove) return { newPos: gmove };
        }
      }
return { newPos: ally }
    }
    
    default:
      return { newPos: ally }
  }
}

// ⚔️ SISTEMA DE COMBATE COOPERATIVO
function allyAttackEnemy(ally: Ally, enemy: Enemy, log: string[]): Enemy {
  const damage = Math.max(1, ally.atk)
  const newHp = Math.max(0, enemy.hp - damage)
  const glyph = enemy.kind === 'zombie' ? '🧟' : enemy.kind === 'orc' ? '👹' : enemy.kind === 'demon' ? '👺' : enemy.kind === 'ranged' ? '🏹' : enemy.kind === 'shaman' ? '🔮' : enemy.kind === 'wraith' ? '👻' : enemy.kind === 'brute' ? '🦍' : '❓'
  log.push(`${ally.emoji} ${ally.name} ataca ${glyph} por ${damage} daño`)
  return { ...enemy, hp: newHp }
}

function processAlliesActions(state: GameState): GameState {
  if ((state.allies?.length || 0) === 0) return { ...state, currentPhase: TurnPhase.ENEMIES }
  let newState = { ...state }
  let newAllies = [...state.allies]
  let newEnemies = [...state.enemies]
  let log = [...state.log]
  for (let i = 0; i < newAllies.length; i++) {
    const ally = newAllies[i]
    if (!ally || ally.hp <= 0) continue
    const cooldowns: Record<string, number> = { ...(ally.cooldowns ?? {}) }
    for (const cid of Object.keys(cooldowns)) {
      const v = cooldowns[cid]
      if (typeof v === 'number' && v > 0) cooldowns[cid] = v - 1
    }
    // Telemetría aliada mínima
try { log.push(`${ally.emoji||'🤝'} CD:${JSON.stringify(cooldowns)} pos:${ally.x},${ally.y}`) } catch {}
    let usedAbility = false
    
if (ally.abilities?.length) {
  const priority: Record<string, number> = { reactive:0, finisher:1, opener:2, support:3 }
  const abilitiesSorted = [...ally.abilities].sort((a,b)=> (priority[a.aiUsage||'support']??99) - (priority[b.aiUsage||'support']??99))
  for (const ability of abilitiesSorted) {

        if ((cooldowns[ability.id] || 0) > 0) continue
        const canUse = !ability.shouldUse || ability.shouldUse({ ally, state: newState, enemies: newEnemies, player: newState.player })
        if (!canUse) continue
        const before = newEnemies.map(e => ({ id: `${e.pos.x},${e.pos.y}`, hp: e.hp }))
        const partial = ability.execute({ ally, state: newState, enemies: newEnemies, player: newState.player, log }) || {}
        if (partial.player) newState.player = partial.player as Player
        if (partial.effects) newState.effects = { ...newState.effects, ...partial.effects }
        if (partial.abilityHighlights) newState.abilityHighlights = { ...newState.abilityHighlights, ...partial.abilityHighlights }
        if (partial.enemies) newEnemies = partial.enemies as Enemy[]
        const afterMap = new Map(newEnemies.map(e => [ `${e.pos.x},${e.pos.y}`, e.hp ]))
        let kills = 0
        for (const b of before) { const hpNow = afterMap.get(b.id); if (hpNow === 0 && b.hp > 0) kills++ }
        if (kills) {
          const gainedXpPerKill = 5 + Math.floor(newState.floor / 5)
          let xpTotal = (newState.xp || 0) + gainedXpPerKill * kills
            let level = newState.level || 1
            let next = newState.nextLevelXp || 20
            let points = newState.progressionPoints || 0
            while (xpTotal >= next) { level++; points++; next = Math.round(next * 1.4) }
            newState = { ...newState, stats: { ...newState.stats, kills: newState.stats.kills + kills }, xp: xpTotal, level, nextLevelXp: next, progressionPoints: points }
        }
        cooldowns[ability.id] = ability.cooldown
        usedAbility = true
        break
      }
    }
    const action = usedAbility ? { newPos: ally } : executeAllyBehavior(ally, { ...newState, allies: newAllies, enemies: newEnemies })
    if (action.target) {
      const idx = newEnemies.findIndex(e => e.pos.x === action.target!.pos.x && e.pos.y === action.target!.pos.y && e.hp > 0)
      if (idx !== -1) {
        const targetEnemy = newEnemies[idx]
        if (targetEnemy) {
        const updated = allyAttackEnemy(ally, targetEnemy, log)
        newEnemies[idx] = updated
        if (updated.hp === 0) {
          newState.stats = { ...newState.stats, kills: newState.stats.kills + 1 }
          const gained = 5 + Math.floor(newState.floor / 5)
          let xpTotal = (newState.xp || 0) + gained
          let level = newState.level || 1
          let next = newState.nextLevelXp || 20
          let points = newState.progressionPoints || 0
          while (xpTotal >= next) { level++; points++; next = Math.round(next * 1.4) }
          newState = { ...newState, xp: xpTotal, level, nextLevelXp: next, progressionPoints: points }
        }
        }
      }
    } else if (action.newPos && (action.newPos.x !== ally.x || action.newPos.y !== ally.y)) {
      newAllies[i] = { ...ally, x: action.newPos.x, y: action.newPos.y }
      try { log.push(`${ally.emoji||'🤝'} se reposiciona a ${action.newPos.x},${action.newPos.y}`) } catch {}
    }
    // Asegurar que id existe (si createAlly siempre lo asigna). Forzar non-null id.
    const current = newAllies[i]
    newAllies[i] = { ...(current as Ally), lastAction: state.turn, cooldowns }
  }
  newEnemies = newEnemies.filter(e => e.hp > 0)
  newAllies = newAllies.filter(a => a.hp > 0)
  while (log.length > 6) log.shift()
  return { ...newState, allies: newAllies, enemies: newEnemies, log, currentPhase: TurnPhase.ENEMIES }
}

// Removed xpNeeded function - no longer using levels

/*───────────── CICLO 5: LOGROS & SISTEMA DE DATOS ───────────────*/

// Función para generar semilla diaria
const getDailySeed = (): string => {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `daily-${dateStr}`
}

// Función para generar semilla aleatoria
const generateRandomSeed = (): string => {
  return `random-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Sistema de logros
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_floor_5',
    name: 'Aventurero Valiente',
    description: 'Alcanza el piso 5 por primera vez',
    condition: (state) => state.floor >= 5,
    unlocked: false
  },
  {
    id: 'killer_10',
    name: 'Cazador Experto',
    description: 'Elimina 10 enemigos en una sola partida',
    condition: (state) => state.stats.kills >= 10,
    unlocked: false
  },
  {
    id: 'no_damage_20_turns',
    name: 'Intocable',
    description: 'Sobrevive 20 turnos sin recibir daño',
    condition: (state) => state.stats.turnsSinceDamage >= 20,
    unlocked: false
  },
  {
    id: 'floor_10',
    name: 'Explorador Maestro',
    description: 'Alcanza el piso 10',
    condition: (state) => state.floor >= 10,
    unlocked: false
  },
  {
    id: 'speed_runner',
    name: 'Corredor Veloz',
    description: 'Alcanza el piso 5 en menos de 100 turnos',
    condition: (state) => state.floor >= 5 && state.turn <= 100,
    unlocked: false
  },
  {
    id: 'treasure_hunter',
    name: 'Cazatesoros',
    description: 'Abre 15 cofres en una sola partida',
    condition: (state) => state.stats.chests >= 15,
    unlocked: false
  }
]

// Gestión de localStorage
const STORAGE_KEYS = {
  ACHIEVEMENTS: 'dungeon_achievements',
  RUN_HISTORY: 'dungeon_run_history',
  SAVE_GAME: 'dungeon_save'
}

const loadAchievements = (): Achievement[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
    if (stored) {
      const savedAchievements = JSON.parse(stored)
      return ACHIEVEMENTS.map(achievement => {
        const saved = savedAchievements.find((s: Achievement) => s.id === achievement.id)
        return saved ? { ...achievement, unlocked: saved.unlocked, timestamp: saved.timestamp } : achievement
      })
    }
  } catch (error) {
    console.warn('Error loading achievements:', error)
  }
  return [...ACHIEVEMENTS]
}

const saveAchievements = (achievements: Achievement[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
  } catch (error) {
    console.warn('Error saving achievements:', error)
  }
}

const loadRunHistory = (): RunRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RUN_HISTORY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Error loading run history:', error)
    return []
  }
}

const saveRunHistory = (history: RunRecord[]) => {
  try {
    // Mantener solo los últimos 50 runs
    const limitedHistory = history.slice(-50)
    localStorage.setItem(STORAGE_KEYS.RUN_HISTORY, JSON.stringify(limitedHistory))
  } catch (error) {
    console.warn('Error saving run history:', error)
  }
}

const checkAchievements = (state: GameState): Achievement[] => {
  return state.achievements.map(achievement => {
    if (!achievement.unlocked && achievement.condition(state, state.stats)) {
      return { ...achievement, unlocked: true, timestamp: Date.now() }
    }
    return achievement
  })
}

const saveRunRecord = (state: GameState) => {
  const newRecord: RunRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    floor: state.floor,
    kills: state.stats.kills,
    turns: state.turn,
    timestamp: Date.now(),
    seed: state.currentSeed,
    isDailyRun: state.isDailyRun
  }
  
  const history = loadRunHistory()
  history.push(newRecord)
  saveRunHistory(history)
  
  return newRecord
}

/*───────────── LOOT & UPGRADES ───────────────*/
interface LootResult { player: Player; msg: string }

function applyChestLoot(p: Player): LootResult {
  // Tabla de botín con pesos simples
  type Entry = { weight: number; fn: (p: Player) => LootResult }
  const table: Entry[] = [
    { weight: 30, fn: (p) => { const heal = 3; const nhp = Math.min(p.maxHp, p.hp + heal); return { player: { ...p, hp: nhp }, msg: `Poción +${nhp - p.hp} HP` } } },
    { weight: 22, fn: (p) => { if (p.atk >= ATK_HARD_CAP) return { player: p, msg: 'El arma ya no mejora' }; const inc = 1; return { player: { ...p, atk: Math.min(ATK_HARD_CAP, p.atk + inc) }, msg: `Filo mejorado +${inc} ATQ` } } },
    { weight: 22, fn: (p) => { const inc = 2; return { player: { ...p, maxHp: p.maxHp + inc, hp: p.hp + inc }, msg: `Amuleto vital +${inc} MAXHP` } } },
    { weight: 16, fn: (p) => { if (p.vision >= MAX_VISION) return { player: p, msg: 'Cristal sin efecto' }; return { player: { ...p, vision: Math.min(MAX_VISION, p.vision + 1) }, msg: 'Cristal de visión +1' } } },
    { weight: 10, fn: (p) => { const gain = 2; return { player: { ...p, score: p.score + gain }, msg: `Pergamino de experiencia +${gain} Score` } } },
  ]
  const total = table.reduce((a, e) => a + e.weight, 0)
  let r = Math.random() * total
  for (const e of table) { if ((r -= e.weight) <= 0) return e.fn(p) }
  return table[0]!.fn(p)
}

// Auto-mejoras por piso (reemplaza sistema de level-up)
function applyAutoUpgrade(player: Player, floor: number): { player: Player; msg?: string } {
  // Auto-mejoras cada ciertos pisos
  if (floor % 3 === 0 && floor > 1) {
    // Cada 3 pisos: +1 ATK y curación parcial
    const newAtk = Math.min(ATK_HARD_CAP, player.atk + 1)
    const healAmount = Math.floor(player.maxHp * 0.5)
    const newHp = Math.min(player.maxHp, player.hp + healAmount)
    return {
      player: { ...player, atk: newAtk, hp: newHp },
      msg: `⬆️ Piso ${floor}: +1 ATK, curación parcial`
    }
  }
  
  if (floor % 5 === 0 && floor > 1) {
    // Cada 5 pisos: +2 MAXHP y curación completa  
    const newMaxHp = player.maxHp + 2
    return {
      player: { ...player, maxHp: newMaxHp, hp: newMaxHp },
      msg: `🏥 Piso ${floor}: +2 MAXHP, curación completa`
    }
  }
  
  return { player }
}

/*───────────── GENERACIÓN DEL DUNGEON ───────────────*/
function generateDungeon(floor = 1, attempt = 0): { map: Tile[][]; start: Pos; enemies: Enemy[]; traps: Set<string> } {
  const map: Tile[][] = Array.from({ length: MAP_H }, () => Array<Tile>(MAP_W).fill('#'))
  const carve = (x: number, y: number) => {
    if (inBounds(x, y) && map[y] && map[y][x] !== undefined) {
      map[y]![x] = '.';
    }
  }
  let cx = MAP_W >> 1, cy = MAP_H >> 1
  carve(cx, cy)
  let floors = 1, target = MAP_W * MAP_H * 0.35
  while (floors < target) {
    const d = DIRS[(Math.random() * 4) | 0];
    if (d) {
      cx = clamp(cx + d.dx, 1, MAP_W - 2);
      cy = clamp(cy + d.dy, 1, MAP_H - 2);
      if (map[cy] !== undefined && map[cy]![cx] === '#') {
        map[cy]![cx] = '.';
        floors++;
      }
    }
  }
  // escalera (GARANTIZAR COLOCACIÓN ÚNICA)
  let sx = 0, sy = 0, placed = false
  let attempts = 0
  while (!placed && attempts < 100) {
    sx = Math.random() * MAP_W | 0
    sy = Math.random() * MAP_H | 0
    if (map[sy] !== undefined && map[sy]![sx] === '.' && Math.abs(sx - cx) + Math.abs(sy - cy) >= 15) {
      map[sy]![sx] = '>'
      placed = true
    }
    attempts++
  }
  // Fallback si no se puede colocar lejos
  if (!placed) {
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (map[y]?.[x] === '.' && (x !== cx || y !== cy)) {
          map[y]![x] = '>'
          placed = true
          break
        }
      }
      if (placed) break
    }
  }
  
  // cofres (EVITAR SOBRESCRIBIR ELEMENTOS EXISTENTES)
  const chestN = 2 + (Math.random() * 3 | 0)
  for (let i = 0; i < chestN; i++) {
    let x = 0, y = 0, tries = 0
    do { 
      x = Math.random() * MAP_W | 0
      y = Math.random() * MAP_H | 0
      tries++
    } while (tries < 100 && (map[y] === undefined || map[y]![x] !== '.'))
    if (map[y] !== undefined && map[y]![x] === '.') {
      map[y]![x] = 'C'
    }
  }

  // Altar raro (5% por piso) - COLOCACIÓN SEGURA
  if (Math.random() < 0.05) {
    let ax = 0, ay = 0, tries = 0
    do { 
      ax = Math.random() * MAP_W | 0
      ay = Math.random() * MAP_H | 0
      tries++
    } while (tries < 200 && (map[ay] === undefined || map[ay]![ax] !== '.'))
    if (map[ay] !== undefined && map[ay]![ax] === '.') {
      map[ay]![ax] = 'A'
    }
  }

  // enemigos (escalado por piso con mayor dificultad)
  const enemies: Enemy[] = []
  const baseMultiplier = Math.min(2.5, 1 + floor * 0.02) // Escalado gradual hasta 2.5x
  const gobN = Math.floor((3 + floor + (Math.random() * 2 | 0)) * baseMultiplier)
  const orcN = Math.floor((1 + Math.floor(floor / 2) + (Math.random() * 2 | 0)) * baseMultiplier)
  const demonN = floor >= 5 ? Math.floor((1 + Math.floor((floor - 5) / 3) + (Math.random() < 0.5 ? 1 : 0)) * baseMultiplier) : 0
  const rangedN = floor >= 3 ? Math.floor((Math.floor(floor / 3)) * baseMultiplier) : 0
  const shamanN = floor >= 7 ? Math.floor((Math.floor((floor - 7) / 4)) * baseMultiplier) : 0
  const wraithN = floor >= 10 ? Math.floor((Math.floor((floor - 10) / 5)) * baseMultiplier) : 0
  const bruteN = floor >= 15 ? Math.floor((Math.floor((floor - 15) / 6)) * baseMultiplier) : 0
  const place = (kind: 'zombie' | 'orc' | 'demon' | 'ranged' | 'shaman' | 'wraith' | 'brute') => {
    let x = 0, y = 0
    do { x = Math.random() * MAP_W | 0; y = Math.random() * MAP_H | 0 }
    while (map[y]?.[x] !== '.')
    // Escalado por piso con curva exponencial suave para mayor desafío
    const bonus = floor - 1
    const exponentialBonus = Math.floor(Math.pow(floor, 1.2) * 0.15) // Escalado exponencial suave
    const stats = kind === 'zombie'
      ? { hp: 4 + bonus + exponentialBonus, dmg: 1 + Math.floor(bonus / 3) + Math.floor(exponentialBonus / 4), speed: 2 }
      : kind === 'orc'
      ? { hp: 7 + bonus * 2 + exponentialBonus * 1.5, dmg: 2 + Math.floor(bonus / 2) + Math.floor(exponentialBonus / 2), speed: 1 }
      : kind === 'ranged'
      ? { hp: 5 + Math.floor(bonus * 1.5) + exponentialBonus, dmg: 2 + Math.floor(bonus / 2) + Math.floor(exponentialBonus / 3), speed: 2 }
      : kind === 'shaman'
      ? { hp: 6 + bonus + exponentialBonus, dmg: 1 + Math.floor(bonus / 4) + Math.floor(exponentialBonus / 5), speed: 2 } // cura enemigos
      : kind === 'wraith'
      ? { hp: 3 + bonus + Math.floor(exponentialBonus * 0.8), dmg: 3 + Math.floor(bonus / 2) + Math.floor(exponentialBonus / 2), speed: 1 } // alta evasión
      : kind === 'brute'
      ? { hp: 20 + bonus * 4 + exponentialBonus * 3, dmg: 4 + Math.floor(bonus / 2) + exponentialBonus, speed: 3 } // lento pero tanque
      : { hp: 12 + bonus * 3 + exponentialBonus * 2, dmg: 3 + Math.floor(bonus / 2) + Math.floor(exponentialBonus / 2), speed: 1 } // demon: muy fuerte
    enemies.push({ kind, pos: { x, y }, hp: stats.hp, dmg: stats.dmg, speed: stats.speed, aggro: false })
  }
  for (let i = 0; i < gobN; i++) place('zombie')
  for (let i = 0; i < orcN; i++) place('orc')
  for (let i = 0; i < demonN; i++) place('demon')
  for (let i = 0; i < rangedN; i++) place('ranged')
  for (let i = 0; i < shamanN; i++) place('shaman')
  for (let i = 0; i < wraithN; i++) place('wraith')
  for (let i = 0; i < bruteN; i++) place('brute')
  
  // JEFES ESPECIALES cada 10 pisos para mayor desafío
  if (floor % 10 === 0 && floor >= 10) {
    const bossType = floor >= 50 ? 'brute' : floor >= 30 ? 'demon' : 'orc'
    let bossX = 0, bossY = 0
    do { 
      bossX = Math.random() * MAP_W | 0
      bossY = Math.random() * MAP_H | 0
    } while (map[bossY]?.[bossX] !== '.')
    
    // Stats de jefe: 3x HP, 1.5x daño, siempre speed 1
    const bossBonus = Math.floor(Math.pow(floor, 1.2) * 0.15)
    const bossStats = bossType === 'brute'
      ? { hp: (20 + (floor-1) * 4 + bossBonus * 3) * 3, dmg: Math.floor((4 + Math.floor((floor-1) / 2) + bossBonus) * 1.5), speed: 1 }
      : bossType === 'demon'
      ? { hp: (12 + (floor-1) * 3 + bossBonus * 2) * 3, dmg: Math.floor((3 + Math.floor((floor-1) / 2) + Math.floor(bossBonus / 2)) * 1.5), speed: 1 }
      : { hp: (7 + (floor-1) * 2 + bossBonus * 1.5) * 3, dmg: Math.floor((1 + Math.floor((floor-1) / 3) + Math.floor(bossBonus / 3)) * 1.5), speed: 1 }
    
    enemies.push({ 
      kind: bossType, 
      pos: { x: bossX, y: bossY }, 
      hp: bossStats.hp, 
      dmg: bossStats.dmg, 
      speed: bossStats.speed, 
      aggro: true 
    })
  }

  // Trampas ocultas en corredores
  const traps: Set<string> = new Set()
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (map[y]?.[x] !== '.') continue
      // Detectar corredor (exactamente 2 direcciones caminables)
      const walkable = DIRS.filter(d => map[y + d.dy]?.[x + d.dx] && map[y + d.dy]![x + d.dx] !== '#')
      if (walkable.length === 2) {
        // Probabilidad creciente por piso
        if (Math.random() < 0.015 + floor * 0.003) {
          // No muy cerca del spawn
          if (Math.abs(x - cx) + Math.abs(y - cy) > 4) {
            traps.add(`${x},${y}`)
          }
        }
      }
    }
  }

  // Verificar conectividad básica con BFS
  const freeTiles = map.flat().filter(t => t !== '#').length
  const reachable = bfsCount(map, cx, cy)
  if (reachable < freeTiles * 0.6 && attempt < 5) {
    // Regenerar si está muy fragmentado
    return generateDungeon(floor, attempt + 1)
  }

  // VERIFICACIÓN CRÍTICA: Garantizar que existe una escalera
  const hasExit = map.some(row => row.some(tile => tile === '>'))
  if (!hasExit) {
    console.warn(`⚠️ Piso ${floor}: No se encontró escalera, forzando colocación`)
    // Colocación forzada en cualquier celda libre
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (map[y]?.[x] === '.') {
          map[y]![x] = '>'
          console.log(`✅ Escalera colocada forzadamente en (${x}, ${y})`)
          break
        }
      }
      if (map.some(row => row.some(tile => tile === '>'))) break
    }
  }

  return { map, start: { x: cx, y: cy }, enemies, traps }
}

function bfsCount(map: Tile[][], sx: number, sy: number): number {
  const queue: Pos[] = [{ x: sx, y: sy }]
  const visited = new Set([`${sx},${sy}`])
  let count = 0
  
  while (queue.length > 0) {
    const pos = queue.shift()!
    if (map[pos.y]?.[pos.x] === '#') continue
    count++
    
    for (const dir of DIRS) {
      const nx = pos.x + dir.dx
      const ny = pos.y + dir.dy
      const key = `${nx},${ny}`
      
      if (!visited.has(key) && inBounds(nx, ny) && map[ny]?.[nx] !== '#') {
        visited.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
  }
  
  return count
}

/*───────────── FOV ───────────────*/
// Oclusión: pared '#' bloquea visión
const isOpaque = (map: Tile[][], x: number, y: number) => map[y]?.[x] === '#'

// Línea de visión (Bresenham). Devuelve true si no hay muro '#' entre origen y destino.
function hasLineOfSight(map: Tile[][], x0: number, y0: number, x1: number, y1: number): boolean {
  let dx = Math.abs(x1 - x0)
  let dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let cx = x0, cy = y0
  while (!(cx === x1 && cy === y1)) {
    // avanzar
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; cx += sx }
    if (e2 < dx) { err += dx; cy += sy }
    if (cx === x1 && cy === y1) break
    if (isOpaque(map, cx, cy)) return false
  }
  return true
}
// FOV bloqueante: ray casting discreto con radio dinámico (player.vision || BASE_VISION)
const computeFOV = (p: {x:number;y:number;vision?:number}, map: Tile[][]) => {
  const vis: boolean[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
  if (inBounds(p.x, p.y)) vis[p.y]![p.x] = true
  const maxR = p.vision ?? BASE_VISION
  for (let angle = 0; angle < 360; angle += 1) {
    const rad = angle * Math.PI / 180
    let x = p.x + 0.5, y = p.y + 0.5
    for (let r = 0; r <= maxR; r++) {
      const cx = Math.floor(x)
      const cy = Math.floor(y)
      if (!inBounds(cx, cy)) break
      if (vis[cy] && vis[cy]![cx] !== undefined) vis[cy]![cx] = true
      if (isOpaque(map, cx, cy) && !(cx === p.x && cy === p.y)) break
      x += Math.cos(rad)
      y += Math.sin(rad)
    }
  }
  return vis
}

function markSeenFromVis(seen: boolean[][], vis: boolean[][]) {
  for (let y = 0; y < vis.length; y++) {
    const row = vis[y]
    if (row && seen[y]) {
      for (let x = 0; x < row.length; x++) {
  if (row[x] && seen[y] && seen[y]![x] !== undefined) seen[y]![x] = true
      }
    }
  }
}

/*───────────── IA ENEMIGA ───────────────*/
function stepEnemies(st: GameState, out: string[]): { enemies: Enemy[]; player: Player; playerDied: boolean } {
  const next: Enemy[] = []
  const { player, map } = st
  const occupied = (x: number, y: number) => (x === player.x && y === player.y) || next.some(e => e.pos.x === x && e.pos.y === y)
  let newPlayer = { ...player }
  let playerDied = false
  for (const e of st.enemies) {
    if (e.hp <= 0) continue
    if (st.turn % e.speed !== 0) { next.push(e); continue }
    const dx = player.x - e.pos.x, dy = player.y - e.pos.y
    const dist = Math.abs(dx) + Math.abs(dy)
    let { x: nx, y: ny } = e.pos
    // línea de visión simple (podríamos mejorar con raycast; dist y ausencia de muro directo)
  const seesPlayer = dist <= (player.vision ?? BASE_VISION) && hasLineOfSight(map, e.pos.x, e.pos.y, player.x, player.y)
    let newAggro = e.aggro
    if (seesPlayer) newAggro = true
    if (e.kind === 'orc' && !seesPlayer && e.aggro && Math.random() < 0.2) newAggro = false
    const wantsChase = newAggro

    const enemyName = e.kind === 'zombie' ? 'Zombie' : e.kind === 'orc' ? 'Orco' : e.kind === 'ranged' ? 'Hostigador' : e.kind === 'shaman' ? 'Chamán' : e.kind === 'wraith' ? 'Espectro' : e.kind === 'brute' ? 'Bruto' : 'Demonio'

    // --- LÓGICA ESPECIAL PARA RANGED ---
    if (e.kind === 'ranged') {
      // Si está a distancia óptima (2-6) ataca
  if (dist >= 2 && dist <= 6 && hasLineOfSight(map, e.pos.x, e.pos.y, player.x, player.y)) {
        let dmg = e.dmg
        // aplicar escudo (mensaje simple, un solo ataque)
        if (st.effects?.shield && st.effects.shield.expires >= st.turn && st.effects.shield.amount > 0) {
          const absorb = Math.min(dmg, st.effects.shield.amount)
          dmg -= absorb
          st.effects.shield.amount -= absorb
          if (absorb > 0) {
            out.push(`🏹 ${enemyName} dispara (Escudo absorbe ${absorb}, -${dmg} HP)`)
          } else {
            out.push(`🏹 ${enemyName} dispara (-${dmg} HP)`)
          }
        } else {
          out.push(`🏹 ${enemyName} dispara (-${dmg} HP)`)
        }
        if (dmg > 0) {
          newPlayer = { ...newPlayer, hp: newPlayer.hp - dmg }
          st.killStreak = 0
          if (newPlayer.hp <= 0) { newPlayer = { ...newPlayer, hp: 0 }; playerDied = true }
        }
  } else if (dist <= 1) { // intento de huir si está pegado (no requiere LOS porque ya está adyacente)
        // Intenta alejarse (kite). Busca un tile que aumente distancia.
        let retreated = false
        const dirs = DIRS.slice().sort(() => Math.random() - 0.5)
        for (const d of dirs) {
          const tx = clamp(e.pos.x + d.dx, 0, MAP_W - 1)
          const ty = clamp(e.pos.y + d.dy, 0, MAP_H - 1)
          if (map[ty]?.[tx] === '.' && !occupied(tx, ty)) {
            const newDist = Math.abs(player.x - tx) + Math.abs(player.y - ty)
            if (newDist > dist) { nx = tx; ny = ty; retreated = true; out.push(`🏹 ${enemyName} se repliega`); break }
          }
        }
        if (!retreated) {
          // No pudo escapar: dispara a quemarropa con menor precisión (daño -1 mínimo 0)
          let dmg = Math.max(0, e.dmg - 1)
          if (st.effects?.shield && st.effects.shield.expires >= st.turn && st.effects.shield.amount > 0) {
            const absorb = Math.min(dmg, st.effects.shield.amount)
            dmg -= absorb
            st.effects.shield.amount -= absorb
            if (absorb > 0) {
              out.push(`🏹 ${enemyName} dispara de cerca (Escudo absorbe ${absorb}, -${dmg} HP)`)
            } else {
              out.push(`🏹 ${enemyName} dispara de cerca (-${dmg} HP)`)
            }
          } else {
            out.push(`🏹 ${enemyName} dispara de cerca (-${dmg} HP)`)
          }
          if (dmg > 0) {
            newPlayer = { ...newPlayer, hp: newPlayer.hp - dmg }
            st.killStreak = 0
            if (newPlayer.hp <= 0) { newPlayer = { ...newPlayer, hp: 0 }; playerDied = true }
          }
        }
      } else if (wantsChase) {
        // Acercarse hasta entrar en rango
        const stepDir = Math.abs(dx) > Math.abs(dy) ? { dx: Math.sign(dx), dy: 0 } : { dx: 0, dy: Math.sign(dy) }
        const tx = clamp(e.pos.x + stepDir.dx, 0, MAP_W - 1)
        const ty = clamp(e.pos.y + stepDir.dy, 0, MAP_H - 1)
        if (map[ty]?.[tx] === '.' && !occupied(tx, ty)) { nx = tx; ny = ty }
      } else if (Math.random() < 0.2) {
        // patrulla ligera
        const d = DIRS[(Math.random() * 4) | 0]
        if (d) {
          const tx = clamp(e.pos.x + d.dx, 0, MAP_W - 1)
          const ty = clamp(e.pos.y + d.dy, 0, MAP_H - 1)
          if (map[ty]?.[tx] === '.' && !occupied(tx, ty)) { nx = tx; ny = ty }
        }
      }
      next.push({ ...e, pos: { x: nx, y: ny }, aggro: newAggro })
      continue
    }

    // --- RESTO DE ENEMIGOS (MELEE / ESPECIALES) ---
    if (dist <= 1) {
      let dmg = e.dmg
      let shieldAbsorb = 0
      if (st.effects?.shield && st.effects.shield.expires >= st.turn && st.effects.shield.amount > 0) {
        shieldAbsorb = Math.min(dmg, st.effects.shield.amount)
        dmg -= shieldAbsorb
        st.effects.shield.amount -= shieldAbsorb
        // Para orco consolidamos el mensaje más abajo; otros conservan mensaje separado
        if (shieldAbsorb > 0 && e.kind !== 'orc') out.push(`🛡️ Escudo absorbe ${shieldAbsorb}`)
      }

      if (e.kind === 'wraith' && Math.random() < 0.3) {
        dmg = e.dmg // ignora shield
        shieldAbsorb = 0 // ignorado
        out.push(`👻 ${enemyName} atraviesa defensas (-${dmg} HP)`)
      } else if (e.kind === 'brute') {
        const nearbyAllies = st.allies.filter(a => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) <= 2)
        if (nearbyAllies.length > 0) {
          out.push(`🦍 ${enemyName} aplasta el área (-${dmg} HP + aliados heridos)`)
          st.allies.forEach(ally => {
            if (Math.abs(ally.x - player.x) + Math.abs(ally.y - player.y) <= 2) {
              ally.hp = Math.max(0, ally.hp - 2)
              if (ally.hp <= 0) out.push(`💀 ${ally.name} cae`)
            }
          })
        } else {
          out.push(`${enemyName} te golpea (-${dmg} HP)`)
        }
      } else if (e.kind === 'orc') {
        // Mensaje condensado para evitar confusión de "doble" ataque (escudo + golpe)
        if (shieldAbsorb > 0) {
          out.push(`👹 Orco golpea (Escudo absorbe ${shieldAbsorb}, -${dmg} HP)`)
        } else {
          out.push(`👹 Orco golpea (-${dmg} HP)`)
        }
      } else {
        out.push(`${enemyName} te golpea (-${dmg} HP)`)
      }

      if (dmg > 0) {
        newPlayer = { ...newPlayer, hp: newPlayer.hp - dmg }
        st.killStreak = 0
        if (newPlayer.hp <= 0) { newPlayer = { ...newPlayer, hp: 0 }; playerDied = true }
      }
    } else if (wantsChase) {
      // Habilidades especiales antes de moverse
      if (e.kind === 'shaman' && Math.random() < 0.3) {
        const nearbyEnemies = next.filter(other => other !== e && Math.abs(other.pos.x - e.pos.x) + Math.abs(other.pos.y - e.pos.y) <= 3)
        if (nearbyEnemies.length > 0) {
          nearbyEnemies.forEach(enemy => {
            const maxHp = enemy.kind === 'zombie' ? 4 + (st.floor - 1) : enemy.kind === 'orc' ? 7 + (st.floor - 1) * 2 : enemy.kind === 'demon' ? 12 + (st.floor - 1) * 3 : enemy.hp + 2
            enemy.hp = Math.min(maxHp, enemy.hp + 2)
          })
          out.push(`🔮 Chamán canaliza curación grupal`)
          nx = e.pos.x; ny = e.pos.y
        }
      } else if (e.kind === 'wraith' && dist > 1 && Math.random() < 0.2) {
        const possibleSpots: { x: number; y: number }[] = []
        for (let dx2 = -2; dx2 <= 2; dx2++) {
          for (let dy2 = -2; dy2 <= 2; dy2++) {
            const tx = player.x + dx2
            const ty = player.y + dy2
            if (inBounds(tx, ty) && map[ty]?.[tx] === '.' && !occupied(tx, ty) && (dx2 !== 0 || dy2 !== 0)) {
              possibleSpots.push({ x: tx, y: ty })
            }
          }
        }
        if (possibleSpots.length) {
          const idx = (Math.random() * possibleSpots.length) | 0
          const spot = possibleSpots[idx]
          if (spot) {
            nx = spot.x
            ny = spot.y
            out.push(`👻 Espectro se desvanece y reaparece`)
          }
        }
      }
      if (nx === e.pos.x && ny === e.pos.y) {
        const stepDir = Math.abs(dx) > Math.abs(dy) ? { dx: Math.sign(dx), dy: 0 } : { dx: 0, dy: Math.sign(dy) }
        const tx = clamp(e.pos.x + stepDir.dx, 0, MAP_W - 1)
        const ty = clamp(e.pos.y + stepDir.dy, 0, MAP_H - 1)
        if (map[ty]?.[tx] === '.' && !occupied(tx, ty)) { nx = tx; ny = ty }
      }
    } else {
      if (Math.random() < 0.25) {
        const dir = DIRS[(Math.random() * 4) | 0]
        if (dir) {
          const tx = clamp(e.pos.x + dir.dx, 0, MAP_W - 1)
          const ty = clamp(e.pos.y + dir.dy, 0, MAP_H - 1)
          if (map[ty]?.[tx] === '.' && !occupied(tx, ty)) { nx = tx; ny = ty }
        }
      }
    }
    next.push({ ...e, pos: { x: nx, y: ny }, aggro: newAggro })
  }
  return { enemies: next, player: newPlayer, playerDied }
}

/*───────────── AUTOGUARDADO ───────────────*/
const SAVE_KEY = 'roguelike_save_v1'

const saveGame = (state: GameState) => {
  try {
    // Convertir Sets a arrays para JSON
    const saveData = {
      ...state,
      seen: undefined, // No guardamos seen, se regenera
      traps: Array.from(state.traps ?? []),
      revealedTraps: Array.from(state.revealedTraps ?? [])
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  } catch (e) {
    console.warn('No se pudo guardar la partida:', e)
  }

}

const loadGame = (): GameState | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (!saved) return null
    
    const saveData = JSON.parse(saved)
    
    // 🛠️ VALIDACIÓN DE COMPATIBILIDAD - Verificar si el save tiene el sistema de aliados
    if (!saveData || !saveData.map || !saveData.player || !Array.isArray(saveData.map) || !Array.isArray(saveData.log)) {
      console.warn('Datos de guardado corruptos, se creará nueva partida')
      clearSave()
      return null
    }
    
    // Verificar compatibilidad con sistema de aliados (Ciclo 6+)
    if (!saveData.allies || !Array.isArray(saveData.allies) || typeof saveData.currentPhase === 'undefined') {
      console.warn('Save incompatible con sistema de aliados, se creará nueva partida')
      clearSave()
      return null
    }
    
    // Regenerar el array seen basado en la posición del jugador
    const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
    if (saveData.player && typeof saveData.player.x === 'number' && typeof saveData.player.y === 'number') {
      const vis = computeFOV(saveData.player, saveData.map || [])
      vis.forEach((r, y) => {
        if (seen[y]) {
          r.forEach((v, x) => {
            if (v && seen[y] && seen[y][x] !== undefined) {
              seen[y][x] = true;
            }
          });
        }
      });
    }
    
    // Restaurar Sets desde arrays
    const traps = new Set<string>(Array.isArray(saveData.traps) ? saveData.traps : [])
    const revealedTraps = new Set<string>(Array.isArray(saveData.revealedTraps) ? saveData.revealedTraps : [])
    
    return {
      ...saveData,
      floor: typeof saveData.floor === 'number' ? saveData.floor : 1,
      traps,
      revealedTraps,
      seen,
      log: Array.isArray(saveData.log) ? saveData.log : ['Partida cargada'],
      showContinue: false, // Se añadirá en initGame
      overlay: false,      // Se añadirá en initGame
      achievements: loadAchievements(),
      runHistory: loadRunHistory(),
      currentSeed: saveData.currentSeed || generateRandomSeed(),
      isDailyRun: saveData.isDailyRun || false,
      startTime: saveData.startTime || Date.now(),
      overlayType: undefined,
      stats: {
        kills: saveData.stats?.kills || 0,
        chests: saveData.stats?.chests || 0,
        turnsSinceDamage: saveData.stats?.turnsSinceDamage || 0
      }
    }
  } catch (e) {
    console.warn('No se pudo cargar la partida:', e)
    clearSave()
    return null
  }
}

const clearSave = () => {
  localStorage.removeItem(SAVE_KEY)
}

/*───────────── INIT & REDUCER ───────────────*/
function initGame(): GameState {
  // Verificar si hay una partida guardada
  try {
    const savedGame = loadGame()
    if (savedGame && savedGame.map && savedGame.player) {
      // 🛠️ MIGRACIÓN: Agregar propiedades del sistema de aliados si no existen
      const migratedGame = {
        ...savedGame,
        allies: savedGame.allies || [],
        maxAllies: savedGame.maxAllies || 3,
        currentPhase: savedGame.currentPhase || TurnPhase.PLAYER,
        showContinue: true,
        overlay: true
      }
      return migratedGame
    }
  } catch (e) {
    console.warn('Error al cargar partida guardada:', e)
  }
  
  // Nueva partida
  const { map, start, enemies, traps } = generateDungeon(1)
  const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
  const player: Player = { ...start, hp: 10, maxHp: 10, atk: 3, vision: BASE_VISION, score: 0 , ammo: 0, ammoMax: 9}
  const initialVis = computeFOV(player, map)
  markSeenFromVis(seen, initialVis)
  return {
    map,
    player,
    enemies,
    allies: [],
  maxAllies: 5,
    currentPhase: TurnPhase.PLAYER,
    seen,
    log: ['Explora el dungeon — N reinicia'],
    status: 'RUN',
    overlay: false,
    showContinue: false,
    turn: 0,
    stats: { kills: 0, chests: 0, turnsSinceDamage: 0 },
    floor: 1,
    traps,
    revealedTraps: new Set(),
    achievements: loadAchievements(),
    runHistory: loadRunHistory(),
    currentSeed: generateRandomSeed(),
    isDailyRun: false,
  startTime: Date.now(),
  overlayType: undefined,
  xp: 0,
  level: 1,
  nextLevelXp: 20,
  progressionPoints: 0,
  unlockedAllies: [],
  }
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'NEW_GAME') {
    clearSave()
    const { map, start, enemies, traps } = generateDungeon(1)
    const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
  const player: Player = { ...start, hp: 10, maxHp: 10, atk: 3, vision: BASE_VISION, score: 0 , ammo: 0, ammoMax: 9}
    const initialVis = computeFOV(player, map)
    markSeenFromVis(seen, initialVis)
    return {
      map,
      player,
      enemies,
      allies: [],
  maxAllies: 5,
      seen,
      log: ['Explora el dungeon — N reinicia'],
      status: 'RUN',
      overlay: false,
      showContinue: false,
      turn: 0,
      stats: { kills: 0, chests: 0, turnsSinceDamage: 0 },
      currentPhase: TurnPhase.PLAYER,
      floor: 1,
      traps,
      revealedTraps: new Set(),
      achievements: loadAchievements(),
      runHistory: loadRunHistory(),
      currentSeed: action.seed || (action.isDaily ? getDailySeed() : generateRandomSeed()),
      isDailyRun: action.isDaily || false,
  startTime: Date.now(),
  overlayType: undefined,
  xp: 0,
  level: 1,
  nextLevelXp: 20,
  progressionPoints: 0,
  unlockedAllies: [],
  killStreak: 0,
  bestKillStreak: 0,
  pendingUpgradeChoices: undefined,
  upgradesTaken: [],
    }
  }  if (action.type === 'CONTINUE_GAME') {
    return { ...state, overlay: false, showContinue: false, log: Array.isArray(state.log) ? state.log : ['Partida continuada'] }
  }
  
  if (action.type === 'DISMISS_CONTINUE') {
    clearSave()
    const { map, start, enemies, traps } = generateDungeon(1)
    const seen = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
  const player: Player = { ...start, hp: 10, maxHp: 10, atk: 3, vision: BASE_VISION, score: 0 , ammo: 0, ammoMax: 9}
    const initialVis = computeFOV(player, map)
    markSeenFromVis(seen, initialVis)
    return {
      map,
      player,
      enemies,
      allies: [],
  maxAllies: 5,
      currentPhase: TurnPhase.PLAYER,
      seen,
      log: ['Explora el dungeon — N reinicia'],
      status: 'RUN',
      overlay: false,
      showContinue: false,
      turn: 0,
      stats: { kills: 0, chests: 0, turnsSinceDamage: 0 },
      floor: 1,
      traps,
      revealedTraps: new Set(),
      achievements: loadAchievements(),
      runHistory: loadRunHistory(),
      currentSeed: generateRandomSeed(),
      isDailyRun: false,
      startTime: Date.now(),
      overlayType: undefined,
  xp: 0,
  level: 1,
  nextLevelXp: 20,
  progressionPoints: 0,
  unlockedAllies: [],
  killStreak: 0,
  bestKillStreak: 0,
  pendingUpgradeChoices: undefined,
  upgradesTaken: [],
    }
  }
  if (state.status !== 'RUN') return state

  if (action.type === 'APPLY_UPGRADE') {
    if (!state.pendingUpgradeChoices) return state
    const choice = state.pendingUpgradeChoices.find(c=>c.id===action.id)
    if (!choice) return state
    const applied = choice.apply(state)
    applied.pendingUpgradeChoices = undefined
    applied.upgradesTaken = [ ...(state.upgradesTaken||[]), choice.id ]
    applied.log = [...(state.log||[]), `✨ Mejora: ${choice.label}`]
    return applied
  }

  // Nueva acción WAIT: enemigos actúan, jugador no se mueve
  if (action.type === 'WAIT') {
    const log = [...(state.log || [])]
    log.push('Esperas...')
    const { enemies, player, playerDied } = stepEnemies(state, log)
    const newState: GameState = {
      ...state,
      enemies,
      player,
      overlay: playerDied ? true : state.overlay,
      turn: state.turn + 1,
      log,
    }
    const vis = computeFOV(newState.player, newState.map)
    const newSeen = state.seen.map(r => [...r])
    markSeenFromVis(newSeen, vis)
    newState.seen = newSeen
    // (Auto-upgrade eliminada aquí; ahora solo se aplica al cambiar de piso)
    while (newState.log.length > 6) newState.log.shift()
    saveGame(newState)
    return newState
  }

  // 🔫 Disparo de pistola: consume 1 bala y daña al hostigador (ranged) más cercano con LOS (≤6)
  if (action.type === 'SHOOT') {
    // Defaults de munición
    const ammoMax = state.player.ammoMax ?? 9;
    const ammoCur = state.player.ammo ?? 0;
    if (ammoCur <= 0) {
      const log = [...(state.log || []), '🔫 No tienes balas.'];
      const ns: GameState = { ...state, log };
      saveGame(ns);
      return ns;
    }
    // Chequeo de línea de visión simple (bloquea con muros '#')
    const hasLOS = (ax:number, ay:number, bx:number, by:number) => {
      let x = ax, y = ay;
      const dx = bx - ax, dy = by - ay;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      if (steps === 0) return true;
      const sx = dx / steps, sy = dy / steps;
      for (let i = 1; i <= steps; i++) {
        x = Math.round(ax + sx * i);
        y = Math.round(ay + sy * i);
        if (x === bx && y === by) return true;
        const t = state.map[y]?.[x];
        if (t === '#') return false;
      }
      return true;
    };
    let best = -1, bestD = 1e9;
// Selección robusta de objetivo: cualquier enemigo en LOS ≤ SHOOT_RANGE, con prioridades de amenaza
const SHOOT_RANGE = BASE_VISION; // usa la misma visión base del juego
const threatPriority: Record<string, number> = {
  brute: 0,      // más peligroso
  shaman: 1,
  ranged: 2,
  orc: 3,
  wraith: 4,
  zombie: 5,     // menos peligroso
};

let bestScore = Infinity;

for (let i = 0; i < state.enemies.length; i++) {
  const e = state.enemies[i];
  if (!e || e.hp <= 0) continue;

  const d = Math.abs(e.pos.x - state.player.x) + Math.abs(e.pos.y - state.player.y);
  if (d > SHOOT_RANGE) continue;
  if (!hasLOS(state.player.x, state.player.y, e.pos.x, e.pos.y)) continue;

  const prio = threatPriority[e.kind] ?? 99;
  // score: menor es mejor → prioriza amenaza, luego distancia, luego HP (remates)
  const score = prio * 10000 + d * 100 + Math.max(0, e.hp);
  if (score < bestScore) {
    bestScore = score;
    best = i;
  }
}

    if (best === -1) {
      // No hay objetivo válido
      const log = [...(state.log || []), 'No hay enemigos en rango para disparar.'];
      return { ...state, log };
    }
    const target = state.enemies[best];
    const baseDmg = state.player.atk + 1;
    const newHp = Math.max(0, target.hp - baseDmg);
    const killed = target.hp > 0 && newHp <= 0;
    const enemies = state.enemies.map((e, idx) => idx === best ? { ...e, hp: newHp, aggro: true } : e);
    const log = [...(state.log || []), `🔫 Disparas a ${target.kind} por ${baseDmg} daño. (${Math.max(0, ammoCur-1)}/${ammoMax} balas)`];
    if (killed) log.push(`¡${target.kind} muerto!`);
    const newState: GameState = { 
      ...state, 
      enemies, 
      player: { ...state.player, ammo: Math.max(0, ammoCur - 1), ammoMax }, 
      turn: state.turn + 1, 
      log 
    };
    if (killed) {
      newState.stats = { ...newState.stats, kills: (newState.stats?.kills || 0) + 1, turnsSinceDamage: newState.stats?.turnsSinceDamage || 0 };
    }
    // Actualizar visión y vistos
    const vis = computeFOV(newState.player, newState.map);
    const seen2 = state.seen.map(r => [...r]);
    markSeenFromVis(seen2, vis);
    newState.seen = seen2;
    // Cambiar fase a aliados para procesar su turno
    newState.currentPhase = TurnPhase.ALLIES;
    saveGame(newState);
    return newState;
  }



  // 🎯 MANEJO DE TURNOS DE ALIADOS
  if (action.type === 'ALLY_TURN') {
    return processAlliesActions(state)
  }

  // 🎯 MANEJO DE TURNOS DE ENEMIGOS
  if (action.type === 'ENEMY_TURN') {
    const log = [...(state.log || [])]
    
    // Usar la función stepEnemies existente para procesar enemigos
    const { enemies, player, playerDied } = stepEnemies(state, log)
    
    // Al completar el turno enemigo, volver al jugador
    return {
      ...state,
      enemies,
      player,
      log,
      turn: state.turn + 1,
      currentPhase: TurnPhase.PLAYER,
      status: playerDied ? 'DEAD' : state.status,
      overlay: playerDied ? true : state.overlay,
      overlayType: playerDied ? 'death' : state.overlayType
    }
  }

  if (action.type === 'MOVE') {
    const tx = clamp(state.player.x + action.dx, 0, MAP_W - 1)
    const ty = clamp(state.player.y + action.dy, 0, MAP_H - 1)
    const foe = state.enemies.find(e => e.pos.x === tx && e.pos.y === ty && e.hp > 0)
    
    let newState: GameState = { ...state }
    const log = [...(state.log || [])]
    let playerMoved = false
    
    if (foe) {
      // Crítico: 15% prob => daño x2
      const isCrit = Math.random() < 0.15
      const dmg = state.player.atk * (isCrit ? 2 : 1)
      const newEnemies = state.enemies.map(e => 
        e === foe ? { ...e, hp: e.hp - dmg, aggro: true } : e
      )
      log.push(`${isCrit ? '‼️ Crítico! ' : ''}Golpeas al ${foe.kind} (-${dmg} HP)`) 
      if (foe.hp - dmg <= 0) {
        log.push(`¡${foe.kind} muerto!`)
        newState.stats = { ...newState.stats, kills: newState.stats.kills + 1, turnsSinceDamage: newState.stats.turnsSinceDamage }
        // Kill streak
        const ks = (newState.killStreak || 0) + 1
        const best = Math.max(newState.bestKillStreak || 0, ks)
        newState.killStreak = ks
        newState.bestKillStreak = best
        if (ks === 5) log.push('🔥 Racha x5: +1 curación')
        if (ks === 10) log.push('⚡ Racha x10: ATQ +1 temporal')
        if (ks === 10) {
          // Buff temporal de ATQ
          const tempBuff = { atkBonus: 1, expires: newState.turn + 25 }
          newState.effects = { ...newState.effects, buff: tempBuff }
        }
        // BONUS PROGRESIVO POR RACHAS ALTAS (nuevo): cada 15 kills sin recibir daño ⇒ micro loot
        if (ks > 0 && ks % 15 === 0) {
          const roll = Math.random()
          if (roll < 0.34) {
            const heal = 3
            newState.player = { ...newState.player, hp: Math.min(newState.player.maxHp, newState.player.hp + heal) }
            log.push('💖 Bonus racha: curación +3')
          } else if (roll < 0.67) {
            if (newState.player.atk < ATK_HARD_CAP) {
              newState.player = { ...newState.player, atk: Math.min(ATK_HARD_CAP, newState.player.atk + 1) }
              log.push('🗡️ Bonus racha: +1 ATQ temporal')
            } else {
              newState.player = { ...newState.player, hp: Math.min(newState.player.maxHp, newState.player.hp + 2) }
              log.push('💖 Bonus racha: curación +2')
            }
          } else {
            // micro escudo
            const shieldDur = 20
            const prev = newState.effects?.shield?.amount || 0
            newState.effects = { ...newState.effects, shield: { amount: Math.min(12, prev + 4), expires: newState.turn + shieldDur } }
            log.push('🛡️ Bonus racha: escudo +4')
          }
        }
        // XP por tipo - escala con piso para mayor progresión
        const baseGain = foe.kind === 'demon' ? 12 : foe.kind === 'orc' ? 8 : foe.kind === 'brute' ? 15 : foe.kind === 'shaman' ? 10 : foe.kind === 'wraith' ? 8 : foe.kind === 'ranged' ? 6 : 5
        const floorBonus = Math.floor(state.floor / 10) // Bonus cada 10 pisos
        const gain = baseGain + floorBonus
        // Score se mantiene también
        newState.player = { ...newState.player, score: newState.player.score + gain }
        // Aplicar a progresión global
        let xpTotal = (newState.xp || 0) + gain
        let level = newState.level || 1
        let next = newState.nextLevelXp || 20
        let points = newState.progressionPoints || 0
        const levelUps: number[] = []
        while (xpTotal >= next) {
          xpTotal -= next
            level += 1
            points += 1
            levelUps.push(level)
            next = Math.round(next * 1.45)
        }
        newState = { ...newState, xp: xpTotal, level, nextLevelXp: next, progressionPoints: points }
        if (levelUps.length && !newState.pendingUpgradeChoices) {
          const pool = [...BASE_UPGRADES]
          const picks: UpgradeChoice[] = []
          while (picks.length < 3 && pool.length) {
            const idx = Math.random()*pool.length|0
            const rem = pool.splice(idx,1)
            if (!rem.length) continue
            const opt = rem[0]
            if (opt && !picks.find(p=>p.id===opt.id)) picks.push(opt)
          }
          newState.pendingUpgradeChoices = picks
          log.push('🆙 Nivel: elige una mejora')
        }
        log.push(`+${gain} XP${levelUps.length ? ' 🔼 Nivel ' + levelUps[levelUps.length-1] : ''}`)
        // Recompensas por umbrales de kills - más frecuentes en pisos altos
        const totalKills = newState.stats.kills
        const atkThreshold = state.floor >= 50 ? 3 : 5 // Más frecuente en pisos altos
        const hpThreshold = state.floor >= 50 ? 5 : 8
        let atkUp = false, hpUp = false
        if (totalKills % atkThreshold === 0 && newState.player.atk < ATK_HARD_CAP) {
          newState.player = { ...newState.player, atk: Math.min(ATK_HARD_CAP, newState.player.atk + 1) }
          atkUp = true
        }
        if (totalKills % hpThreshold === 0) {
          const hpBoost = state.floor >= 70 ? 2 : 1 // Más HP en pisos muy altos
          const newMax = newState.player.maxHp + hpBoost
          newState.player = { ...newState.player, maxHp: newMax, hp: Math.min(newMax, newState.player.hp + hpBoost) }
          hpUp = true
        }
        if (atkUp) log.push('⚔️ +1 ATQ (muertes)')
        if (hpUp) log.push('💗 +1 MaxHP (muertes)')
        // Prob curación ligera en kill directa del jugador
        if (Math.random() < 0.12) {
          const heal = 2
          newState.player = { ...newState.player, hp: Math.min(newState.player.maxHp, newState.player.hp + heal) }
          log.push(`🩹 Recuperas ${heal} HP`)
        }
        // Posible drop extra de orco y demonio
        if (foe.kind === 'orc' && Math.random() < 0.15) {
          const loot = applyChestLoot(newState.player)
          newState.player = loot.player
          log.push(`Botín del orco: ${loot.msg}`)
        }
        if (foe.kind === 'demon' && Math.random() < 0.25) {
          const loot = applyChestLoot(newState.player)
          newState.player = loot.player
          log.push(`Tesoro demoníaco: ${loot.msg}`)
        }
      }
      newState.enemies = newEnemies
      playerMoved = true
    } else if (state.map[ty]?.[tx] !== '#') {
      // Mover jugador exitosamente
      newState.player = { ...state.player, x: tx, y: ty }
      const tile = state.map[ty]?.[tx]
      
      if (tile === '>') {
        // Progresión de piso en lugar de victoria inmediata
        const nextFloor = (state.floor ?? 1) + 1
        // DIFICULTAD DINÁMICA: si el jugador baja con HP >80% y killStreak >=10 ⇒ leve incremento spawn próximo piso
        const performanceBoost = (newState.player.hp / newState.player.maxHp >= 0.8 && (newState.killStreak||0) >= 10)
        if (performanceBoost) {
          // Guardar flag ligera (usamos effects para no ampliar tipos)
          newState.effects = { ...newState.effects, paceBoost: { amount: 1, expires: newState.turn + 200 } as any }
          log.push('⚙️ El dungeon reacciona a tu poder...')
        }
        
        // ¡VICTORIA EN PISO 100!
        if (nextFloor > 100) {
          log.push('🏆 ¡FELICITACIONES! ¡HAS CONQUISTADO LOS 100 PISOS!')
          log.push('🎉 ¡ERES UN VERDADERO MAESTRO DEL DUNGEON!')
          log.push('👑 Tu leyenda será recordada por siempre...')
          return {
            ...newState,
            status: 'VICTORY',
            overlay: true,
            overlayType: 'victory' as any,
            log
          }
        }
        
        log.push(`⬇️ Desciendes al piso ${nextFloor}`)
        
        // Notificación de jefe
        if (nextFloor % 10 === 0 && nextFloor >= 10) {
          log.push(`⚠️ PISO ${nextFloor}: ¡JEFE DETECTADO! ⚠️`)
          log.push(`🔥 Prepárate para un enemigo élite...`)
        }
        const gen = generateDungeon(nextFloor)
        const seen2 = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false))
        // Curación ligera al avanzar
        const healed = Math.min(newState.player.maxHp, newState.player.hp + 2)
        const player2: Player = { ...newState.player, x: gen.start.x, y: gen.start.y, hp: healed }
        const vis2 = computeFOV(player2, gen.map)
        markSeenFromVis(seen2, vis2)
        
        // 🧙‍♂️ SPAWN DE ALIADOS - Verificar si debemos spawnear un aliado
        let newAllies = [...state.allies]
        if (shouldSpawnAlly({ ...state, floor: nextFloor, allies: newAllies })) {
          const availableTypes = availableAllies(nextFloor)
          if (availableTypes.length > 0) {
            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)] as keyof typeof ALLY_TYPES
            const spawnPos = findSpawnPosition({ 
              ...state, 
              map: gen.map, 
              player: player2, 
              enemies: gen.enemies, 
              allies: newAllies 
            })
            
            if (spawnPos) {
              const newAlly = createAlly(randomType, spawnPos.x, spawnPos.y, nextFloor)
              newAllies.push(newAlly)
              log.push(`✨ ${newAlly.name} ${newAlly.emoji} se une a tu aventura!`)
            }
          }
        }
        
        newState = {
          ...newState,
          map: gen.map,
          enemies: gen.enemies,
          allies: newAllies,
          player: player2,
          seen: seen2,
          floor: nextFloor,
          traps: gen.traps,
          revealedTraps: new Set(),
        }
        // Si había paceBoost activo y no expirado: añadir 1 enemigo extra agresivo para mantener presión
        if (newState.effects?.paceBoost && newState.effects.paceBoost.expires > newState.turn) {
          const extra = gen.enemies[0]
          if (extra) {
            // Clonar con ligera mejora
            newState.enemies.push({ ...extra, pos: { ...extra.pos }, hp: Math.round(extra.hp*0.9), dmg: extra.dmg + 1, aggro: true })
            log.push('⚔️ Una patrulla adicional te detecta!')
          }
        }
        // Aplicar auto-mejora SOLO una vez al llegar a un nuevo piso
        const autoUp = applyAutoUpgrade(newState.player, newState.floor)
        newState.player = autoUp.player
        if (autoUp.msg) log.push(autoUp.msg)
        while (log.length > 6) log.shift()
        newState.log = log
        saveGame(newState)
        return newState
      }
      
      if (tile === 'A') {
        // Altar: buff potente + maldición
        log.push('☣️ Altar profano: +2 ATQ, -1 Visión')
        newState.player = { 
          ...newState.player, 
          atk: Math.min(ATK_HARD_CAP, newState.player.atk + 2), 
          vision: Math.max(2, newState.player.vision - 1) 
        }
        // Consumir el altar
        const newMap = state.map.map(r => [...r])
        newMap[ty]![tx] = '.'
        newState.map = newMap
      }
      
      if (tile === 'C') {
        // Crear nuevo mapa sin mutar el original
        const newMap = state.map.map(row => [...row])
        if (newMap[ty] && newMap[ty][tx] !== undefined) {
          newMap[ty][tx] = '.'
          newState.map = newMap
          newState.stats = { ...state.stats, chests: state.stats.chests + 1, turnsSinceDamage: state.stats.turnsSinceDamage }
          // Elección de recompensa: generar 3 opciones únicas
          const pool = [...BASE_UPGRADES,
            { id: 'heal_full', label: 'Curación Completa', apply: (s: GameState) => ({...s, player:{...s.player, hp: s.player.maxHp}}) },
            { id: 'atk+2', label: '+2 ATQ (cap)', apply: (s: GameState) => ({...s, player:{...s.player, atk: Math.min(ATK_HARD_CAP, s.player.atk + 2)}}) },
            { id: 'maxhp+5', label: '+5 Vida Máx', apply: (s: GameState) => ({...s, player:{...s.player, maxHp: s.player.maxHp + 5, hp: s.player.hp + 5}}) },
            { id: 'vision+2temp', label: '+2 Visión 100 turnos', apply: (s: GameState) => ({...s, effects:{...s.effects, buffVision:{ amount:2, expires: s.turn + 100 } as any}}) },
            { id: 'shield5', label: 'Escudo 5', apply: (s: GameState) => ({...s, effects:{...s.effects, shield:{ amount:5, expires: s.turn + 40 }}}) }
          ]
          const choices: UpgradeChoice[] = []
          while (choices.length < 3 && pool.length) {
            const idx = Math.random() * pool.length | 0
            const removed = pool.splice(idx,1)
            if (!removed.length) continue
            const pick = removed[0]
            if (pick && !choices.find(c=>c.id===pick.id)) choices.push(pick as UpgradeChoice)
          }
          newState.pendingUpgradeChoices = choices
          log.push('🗃️ Cofre: elige tu recompensa')
          // Ruido de cofre: aggro zona pequeña
          const noiseR = 6
          newState.enemies = newState.enemies.map(e => {
            const d = Math.abs(e.pos.x - newState.player.x) + Math.abs(e.pos.y - newState.player.y)
            return d <= noiseR ? { ...e, aggro: true } : e
          })
        }
      }
      playerMoved = true
    }
    
    // Trampas tras movimiento del jugador
    if (playerMoved) {
      const trapKey = `${newState.player.x},${newState.player.y}`
      if (state.traps?.has(trapKey) && !state.revealedTraps?.has(trapKey)) {
        const dmg = 2 + Math.floor((state.floor ?? 1) / 3)
        log.push(`💥 Trampa activada (-${dmg} HP)`) 
        newState.player = { ...newState.player, hp: Math.max(0, newState.player.hp - dmg) }
        const revealed = new Set(state.revealedTraps)
        revealed.add(trapKey)
        const remaining = new Set(state.traps)
        remaining.delete(trapKey)
        newState.revealedTraps = revealed
        newState.traps = remaining
        if (newState.player.hp <= 0) { 
          newState.status = 'DEAD'
          newState.overlay = true 
          newState.overlayType = 'death'
        }
      }
    }
    
    // Enemigos SIEMPRE actúan
    const originalPlayerHP = newState.player.hp
    const { enemies, player, playerDied } = stepEnemies(newState, log)
    newState.enemies = enemies
    newState.player = player
    
    // Actualizar turnsSinceDamage
    if (newState.player.hp < originalPlayerHP) {
      // El jugador recibió daño
      newState.stats = { ...newState.stats, turnsSinceDamage: 0 }
    } else {
      // El jugador no recibió daño
      newState.stats = { ...newState.stats, turnsSinceDamage: newState.stats.turnsSinceDamage + 1 }
    }
    
    // Verificar logros
    const updatedAchievements = checkAchievements(newState)
    const newAchievements = updatedAchievements.filter((ach, i) => 
      !newState.achievements[i]?.unlocked && ach.unlocked
    )
    if (newAchievements.length > 0) {
      newAchievements.forEach(ach => {
        log.push(`🏆 ¡${ach.name}!`)
      })
      saveAchievements(updatedAchievements)
    }
    newState.achievements = updatedAchievements
    
    if (playerDied) { 
      newState.status = 'DEAD'
      newState.overlay = true
      newState.overlayType = 'death'
      // Guardar record de partida
      saveRunRecord(newState)
    }
    if (playerMoved) {
      const vis = computeFOV(newState.player, newState.map)
      const newSeen = state.seen.map(r => [...r])
      markSeenFromVis(newSeen, vis)
      newState.seen = newSeen
    }
    newState.turn = state.turn + 1
    while (log.length > 6) log.shift() // ampliar a 6 entradas
    newState.log = log
    
  // (Auto-upgrade eliminada: ahora solo se aplica al cambiar de piso)
    
    // 🎯 CAMBIAR FASE A ALIADOS - Sistema de turnos cooperativo
    newState.currentPhase = TurnPhase.ALLIES
    
    saveGame(newState)
    return newState
  }
  // Removed level up choice handler - no longer needed
  
  if (action.type === 'TOGGLE_ACHIEVEMENTS') {
    return { 
      ...state, 
      overlay: !state.overlay || state.overlayType !== 'achievements', 
      overlayType: (!state.overlay || state.overlayType !== 'achievements') ? 'achievements' : undefined,
      showContinue: false 
    }
  }
  
  if (action.type === 'TOGGLE_LEADERBOARD') {
    return { 
      ...state, 
      overlay: !state.overlay || state.overlayType !== 'leaderboard', 
      overlayType: (!state.overlay || state.overlayType !== 'leaderboard') ? 'leaderboard' : undefined,
      showContinue: false 
    }
  }
  
  return state
}


// (Catálogo principal de habilidades definido más arriba)

/*───────────── COMPONENTE PRINCIPAL ───────────────*/
export default function AIRoguelike() {
  const [state, dispatch] = useReducer(reducer, null, initGame)
  // --- FX Visuales ---
  const tileSize = 22;
  const gridRef = useRef<HTMLDivElement>(null);
  const { FXCanvas, fx } = useFx({ tileSize, gridW: MAP_W, gridH: MAP_H, containerRef: gridRef });

  const [flash, setFlash] = useState(false)
  const lastLogIndexRef = useRef(0)
  // Sincroniza FX con estado de juego cada turno
  useEffect(() => {
    fx.syncFromState({
      abilityHighlights: state.abilityHighlights,
      player: state.player,
      logLast: state.log[state.log.length - 1],
      enemies: state.enemies.map(e => e.pos),
      allies: state.allies
    });
  }, [state.turn]);

  // Hover de habilidad de aliado para visualizar rango en el mapa
  const [hoverAbility, setHoverAbility] = useState<{ allyId: string; abilityId: string; range: number } | null>(null)

  // Guard clause para evitar errores si state no está inicializado
  if (!state) {
    return <div className="min-h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>
  }

  useEffect(() => {
    if (state.status === 'RUN' && state.log && state.log.length > 0) {
      const lastMessage = state.log[state.log.length - 1]
      if (lastMessage?.includes('golpea')) {
        setFlash(true); requestAnimationFrame(() => setFlash(false))
      }
    }
  }, [state.log])

  // Audio por nuevos mensajes del log
  useEffect(() => {
    if (!state?.log) return
    primeAudio()
    const prev = lastLogIndexRef.current
    const current = state.log.length
    if (current > prev) {
      for (let i = prev; i < current; i++) {
        const raw: any = state.log[i]
        const msg: string = typeof raw === 'string' ? raw : (raw ? String(raw) : '')
        if (!msg) continue
        const cat = categorizeLogMessage(msg)
        playCategory(cat)
      }
      lastLogIndexRef.current = current
    }
  }, [state.log])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key
      
      // Prevenir scroll de la página con las flechas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Controles para overlay de continuar
      if (state.showContinue) {
        if (k === 'c' || k === 'C') return dispatch({ type: 'CONTINUE_GAME' })
        if (k === 'n' || k === 'N') return dispatch({ type: 'DISMISS_CONTINUE' })
        return
      }
      
      // Controles normales del juego (removed level up handling)
      if (state.status === 'RUN') {
        // Comando de debug: verificar escalera
        if (k === 'x' || k === 'X') {
          const hasExit = state.map.some(row => row.some(tile => tile === '>'))
          console.log(`🔍 Debug Piso ${state.floor}: Escalera presente = ${hasExit}`)
          if (hasExit) {
            for (let y = 0; y < state.map.length; y++) {
              for (let x = 0; x < state.map[y]!.length; x++) {
                if (state.map[y]![x] === '>') {
                  console.log(`📍 Escalera en coordenadas: (${x}, ${y})`)
                }
              }
            }
          }
          return
        }
        if (k === 'ArrowUp' || k === 'w' || k === 'W') return dispatch({ type: 'MOVE', dx: 0, dy: -1 })
        if (k === 'ArrowDown' || k === 's' || k === 'S') return dispatch({ type: 'MOVE', dx: 0, dy: 1 })
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') return dispatch({ type: 'MOVE', dx: -1, dy: 0 })
        if (k === 'ArrowRight' || k === 'd' || k === 'D') return dispatch({ type: 'MOVE', dx: 1, dy: 0 })
        if (k === '.') return dispatch({ type: 'WAIT' }) // nueva acción esperar
        if (k === 'f' || k === 'F') return dispatch({ type: 'SHOOT' }) // disparar pistola
      }
      
      if (k === 'n' || k === 'N') dispatch({ type: 'NEW_GAME' })
      if (k === 'h' || k === 'H') dispatch({ type: 'TOGGLE_LEADERBOARD' })
      if (k === 'l' || k === 'L') dispatch({ type: 'TOGGLE_ACHIEVEMENTS' })
      if (k === 't' || k === 'T') dispatch({ type: 'NEW_GAME', isDaily: true })
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [state.status, state.showContinue])

  // 🤖 SISTEMA DE TURNOS AUTOMÁTICOS - Procesa aliados y enemigos tras acción del jugador
  useEffect(() => {
    if (state.status !== 'RUN') return

    if (state.currentPhase === TurnPhase.ALLIES) {
      // Pequeño delay para que se vea la acción del jugador
      const timer = setTimeout(() => {
        dispatch({ type: 'ALLY_TURN' })
      }, 200)
      return () => clearTimeout(timer)
    }

    if (state.currentPhase === TurnPhase.ENEMIES) {
      // Delay para las acciones de aliados
      const timer = setTimeout(() => {
        dispatch({ type: 'ENEMY_TURN' })
      }, 300)
      return () => clearTimeout(timer)
    }

    // Return undefined for other phases
    return undefined
  }, [state.currentPhase, state.status])

  // 🎮 SISTEMA DE SELECCIÓN DE RECOMPENSAS CON TECLADO
  useEffect(() => {
    if (!state.pendingUpgradeChoices) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (num >= 1 && num <= state.pendingUpgradeChoices!.length) {
        const upgrade = state.pendingUpgradeChoices![num - 1]
        if (upgrade) {
          dispatch({ type: 'APPLY_UPGRADE', id: upgrade.id })
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [state.pendingUpgradeChoices])

  const vis = computeFOV(state.player, state.map)
  /* Nueva representación: grid de celdas homogéneas
     Beneficios: alineación perfecta, estilos por estado, futuras animaciones por celda */
  interface TileRender { glyph: string; visible: boolean; seen: boolean; kind: string }
  const tileInfo = (x: number, y: number): TileRender => {
    // Fuera del mapa defensivamente
    if (!inBounds(x, y)) return { glyph: ' ', visible: false, seen: false, kind: 'void' }
    const isPlayer = x === state.player.x && y === state.player.y
    if (isPlayer) return { glyph: '🧝‍♂️', visible: true, seen: true, kind: 'player' }
    
    // 🧙‍♂️ RENDERIZADO DE ALIADOS - Prioridad alta después del jugador (con protección defensiva)
    const ally = state.allies?.find?.(a => a.x === x && a.y === y && a.hp > 0)
    if (ally) return { glyph: ally.emoji, visible: !!vis[y]?.[x], seen: !!state.seen[y]?.[x], kind: 'ally' }
    
    const enemy = state.enemies.find(e => e.pos.x === x && e.pos.y === y && e.hp > 0)
  if (enemy) return { glyph: enemy.kind === 'zombie' ? '🧟' : enemy.kind === 'orc' ? '👹' : enemy.kind === 'ranged' ? '🏹' : enemy.kind === 'shaman' ? '🔮' : enemy.kind === 'wraith' ? '👻' : enemy.kind === 'brute' ? '🦍' : enemy.kind === 'demon' ? '👺' : '❓', visible: !!vis[y]?.[x], seen: !!state.seen[y]?.[x], kind: enemy.kind }
    const base = state.map[y]?.[x]
    const wasSeen = !!state.seen[y]?.[x]
    const isVisible = !!vis[y]?.[x]
    if (!wasSeen) return { glyph: ' ', visible: false, seen: false, kind: 'unknown' }
    if (!isVisible) {
      // Celda explorada pero fuera de FOV actual – usamos glifos simples atenuados
      if (base === '#') return { glyph: '█', visible: false, seen: true, kind: 'wall' }
      return { glyph: '·', visible: false, seen: true, kind: 'memory' }
    }
    switch (base) {
      case '#': return { glyph: '█', visible: true, seen: true, kind: 'wall' }
      case '.': {
        // Mostrar trampas reveladas
        const key = `${x},${y}`
        // Highlight de habilidad reciente
        if (state.abilityHighlights && state.abilityHighlights[key] && state.abilityHighlights[key]! >= state.turn) {
          return { glyph: '✦', visible: true, seen: true, kind: 'highlight' }
        }
        if (state.revealedTraps?.has(key)) {
          return { glyph: '✱', visible: true, seen: true, kind: 'trap' }
        }
        return { glyph: '·', visible: true, seen: true, kind: 'floor' }
      }
      case '>': return { glyph: '🚪', visible: true, seen: true, kind: 'exit' }
      case 'C': return { glyph: '🗃️', visible: true, seen: true, kind: 'chest' }
      case 'A': return { glyph: '⛧', visible: true, seen: true, kind: 'altar' }
      default: return { glyph: ' ', visible: true, seen: true, kind: 'void' }
    }
  }

  const tiles: TileRender[][] = Array.from({ length: MAP_H }, (_, y) =>
    Array.from({ length: MAP_W }, (_, x) => tileInfo(x, y))
  )

  const { cls } = hpBar(state.player?.hp || 0, state.player?.maxHp || 1)
  const statusColor = state.status === 'WIN' ? 'text-green-400'
    : state.status === 'DEAD' ? 'text-red-400' : 'text-gray-300'

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col items-center justify-center p-4 overflow-hidden" tabIndex={0} style={{outline: 'none'}}>
      <div className="relative flex-1 flex flex-col items-center justify-center max-w-full max-h-full">
        {/* Header del juego */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
            ⚔️ DUNGEON CRAWLER ⚔️
          </h1>
          <div className="text-xs text-gray-400 space-x-4">
            <span>WASD/Flechas: Mover</span>
            <span>N: Nueva partida</span>
            {state.showContinue && <span>C: Continuar</span>}
            {state.status === 'RUN' && <span>X: Debug escalera</span>}
          <span>F: Pistola</span>
            </div>
        </div>

        {/* Panel principal del juego */}
        <div className={`bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 shadow-2xl ${flash ? 'ring-2 ring-red-500' : ''} transition-all duration-200`}>
          
          {/* Layout mapa + log lateral */}
          <div className="flex flex-row gap-4 mb-4 items-start">
            {/* Mapa del juego */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-md p-3 overflow-hidden">
              {/* Contenedor grid: usamos variable CSS para tamaño de celda */}
              <div className="relative" ref={gridRef}>
<div
                className="map-grid font-mono select-none"
                style={{
                  ['--tile' as any]: '22px',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${MAP_W}, var(--tile))`,
                  gridTemplateRows: `repeat(${MAP_H}, var(--tile))`,
                  lineHeight: 1,
                  fontSize: '14px',
                  userSelect: 'none'
                }}
              >
                {tiles.flatMap((row, y) => row.map((t, x) => {
                  const baseCls = 'w-[var(--tile)] h-[var(--tile)] flex items-center justify-center transition-colors duration-150'
                  const visibilityCls = !t.seen ? 'opacity-0' : t.visible ? 'opacity-100' : 'opacity-30'
                  const colorCls = t.kind === 'player' ? 'text-cyan-300'
                    : t.kind === 'ally' ? 'text-blue-400'
                    : t.kind === 'zombie' ? 'text-red-400'
                    : t.kind === 'orc' ? 'text-orange-500'
                    : t.kind === 'ranged' ? 'text-amber-300'
                    : t.kind === 'shaman' ? 'text-blue-400'
                    : t.kind === 'wraith' ? 'text-gray-300'
                    : t.kind === 'brute' ? 'text-red-600'
                    : t.kind === 'demon' ? 'text-purple-500'
                    : t.kind === 'highlight' ? 'text-pink-400 bg-pink-600/20 rounded-sm animate-pulse'
                    : t.kind === 'exit' ? 'text-yellow-400'
                    : t.kind === 'chest' ? 'text-amber-400'
                    : t.kind === 'wall' ? (t.visible ? 'text-green-400' : 'text-green-700')
                    : 'text-green-500'
                  // Resaltar rango de habilidad al hacer hover en la UI de aliados
                  let rangeHighlight = false
                  if (hoverAbility) {
                    const ally = state.allies.find(a => a.id === hoverAbility.allyId)
                    if (ally) {
                      const dist = Math.abs(ally.x - x) + Math.abs(ally.y - y)
                      rangeHighlight = dist <= hoverAbility.range && dist > 0 && t.seen // no resaltar la casilla del aliado mismo
                    }
                  }
                  const aggroPulse = (t.kind === 'zombie' || t.kind === 'orc' || t.kind === 'demon' || t.kind === 'ranged' || t.kind === 'shaman' || t.kind === 'wraith' || t.kind === 'brute') && state.enemies.find(e=> e.pos.x===x && e.pos.y===y && e.aggro)
                  return (
                    <span
                      key={y * MAP_W + x}
                      className={baseCls + ' ' + visibilityCls + ' ' + colorCls + (aggroPulse ? ' ring-1 ring-red-500/70 animate-pulse' : '') + (rangeHighlight && t.visible ? ' bg-indigo-600/25 ring-1 ring-indigo-500/40' : rangeHighlight ? ' bg-indigo-900/10' : '')}
                      style={{
                        fontSize: t.glyph.length > 1 && /\p{Extended_Pictographic}/u.test(t.glyph) ? '16px' : '14px',
                        filter: !t.visible && t.seen ? 'saturate(0.3)' : 'none'
                      }}
                    >
                      {t.glyph}
                    </span>
                  )
                }))}
              </div>
  <FXCanvas />
</div>
            </div>
            {/* Log lateral como panel separado */}
            <div className="bg-gray-900/60 border border-gray-600 rounded-md p-3 w-64 flex flex-col" style={{ maxHeight: `${22 * MAP_H}px` }}>
              <div className="text-xs text-gray-300 mb-2">📜 REGISTRO</div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-1 text-xs" aria-live="polite" role="log">
                {state.log?.map((m,i)=>(
                  <div key={i} className={`${i === (state.log?.length||0)-1 ? 'text-white' : 'text-gray-400'} transition-opacity`}>{m}</div>
                )) || <div className="text-gray-500">Sin mensajes</div>}
              </div>
            </div>
          </div>

          {/* Panel de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* HP Bar */}
            <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-300">❤️ SALUD</div>
                {/* Mostrar escudo activo */}
                {state.effects?.shield && state.effects.shield.expires >= state.turn && state.effects.shield.amount > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-600/30 border border-blue-500/40 rounded text-blue-300 font-medium text-[10px]" title="Escudo activo que absorbe daño enemigo">
                    🛡️ {state.effects.shield.amount}
                  </span>
                )}
              </div>
              <div className={`text-sm font-mono ${cls} mb-1`}>
                🧝‍♂️ {state.player?.hp || 0}/{state.player?.maxHp || 1}
              </div>
              <div className="bg-gray-800 border border-gray-600 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (state.player?.hp || 0) / (state.player?.maxHp || 1) > 0.6 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                    (state.player?.hp || 0) / (state.player?.maxHp || 1) > 0.3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, ((state.player?.hp || 0) / (state.player?.maxHp || 1)) * 100))}%`,
                    minWidth: state.player?.hp && state.player.hp > 0 ? '2px' : '0px'
                  }}
                />
              </div>
            </div>

      {/* Stats */}
            <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
              <div className="text-xs text-gray-300 mb-1">⚔️ COMBATE</div><div className="text-sm space-y-1">
        <div className="text-orange-400">ATQ: {state.player?.atk || 0}{state.player.atk >= ATK_SOFT_CAP ? '*' : ''}</div>
        <div className="text-emerald-400">🔫 Balas: {(state.player?.ammo ?? 0)}/{(state.player?.ammoMax ?? 9)}</div>
        <div className="text-red-400">Kills: {state.stats?.kills || 0}</div>
        <div className="text-cyan-400">Floor: {state.floor}</div>
        <div className="text-blue-400">Score: {state.player.score}</div>
              </div>
            </div>

            {/* Progresión */}
            <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
              <div className="text-xs text-gray-300 mb-1">📈 PROGRESIÓN</div>
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">Nivel {state.level || 1}</span>
                  <span className="text-[10px] text-gray-400">Pts {state.progressionPoints || 0}</span>
                </div>
                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, ((state.xp||0)/(state.nextLevelXp||20))*100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 text-right">{state.xp||0} / {state.nextLevelXp||20}</div>
                <div className="text-[11px] text-fuchsia-400">Racha: {state.killStreak||0} (Mejor {state.bestKillStreak||0})</div>
                {state.pendingUpgradeChoices && (
                  <div className="mt-2 border-t border-gray-600 pt-2">
                    <div className="text-[10px] text-gray-300 mb-1">Elige Mejora (presiona 1, 2 o 3):</div>
                    <div className="flex flex-col gap-1">
                      {state.pendingUpgradeChoices.map((u, index) => (
                        <button key={u.id} className="text-left text-[11px] px-2 py-1 bg-gray-700/60 hover:bg-gray-600 rounded border border-gray-500"
                          onClick={() => dispatch({ type: 'APPLY_UPGRADE', id: u.id })}>
                          <span className="text-yellow-400 font-bold">{index + 1}.</span> {u.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 🧙‍♂️ ALIADOS - Información táctica (HP, ATQ, cooldowns) */}
            {(state.allies?.length || 0) > 0 && (
              <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-300">👥 ALIADOS</div>
                  {/* Efectos globales activos sobre el grupo / jugador */}
                  <div className="flex gap-2 text-[10px]">
                    {state.effects?.buff && state.effects.buff.expires >= state.turn && (
                      <span className="px-1.5 py-0.5 bg-amber-600/30 border border-amber-500/40 rounded text-amber-300 font-medium" title="Impulso de ataque para aliados">
                        🔥 +{state.effects.buff.atkBonus} ATQ
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  {state.allies?.map?.(ally => (
                    <div key={ally.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-700/40 transition-colors">
                      <span className="text-lg shrink-0">{ally.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-blue-400 font-medium truncate mr-2">{ally.name}</div>
                          <div className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="text-green-400">{ally.hp}/{ally.maxHp}</span>
                            <span className="text-orange-400">⚔️{ally.atk}</span>
                          </div>
                        </div>
                        {/* HP bar */}
                        <div className="bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              ally.hp / ally.maxHp > 0.6 ? 'bg-green-500' :
                              ally.hp / ally.maxHp > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}
                          />
                        </div>
                        {/* Habilidades con cooldown */}
                        {ally.abilities && ally.abilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ally.abilities.map(ab => {
                              const cd = ally.cooldowns?.[ab.id] || 0
                              const ready = cd <= 0
                              return (
                                <span
                                  key={ab.id}
                                  title={`${ab.name} (${ab.description})`}
                                  className={`px-1.5 py-0.5 rounded text-[10px] border font-medium tracking-wide ${
                                    ready ? 'bg-gray-600/40 border-gray-400/50 text-gray-200' : 'bg-gray-900/40 border-gray-700/60 text-gray-500 line-through'
                                  }`}
                                  onMouseEnter={() => setHoverAbility({ allyId: ally.id, abilityId: ab.id, range: ab.range })}
                                  onMouseLeave={() => setHoverAbility(h => h && h.abilityId === ab.id ? null : h)}
                                >
                                  {ab.name}{!ready && ` (${cd})`}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

      {/* Progress */}
            <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
              <div className="text-xs text-gray-300 mb-1">📊 PROGRESO</div>
              <div className="text-sm space-y-1">
                <div className="text-amber-400">Cofres: {state.stats?.chests || 0}</div>
                <div className="text-blue-400">Turno: {state.turn || 0}</div>
                <div className="text-purple-400">Piso: {state.floor}</div>
                <div className={`text-sm ${(state.stats?.turnsSinceDamage || 0) >= 20 ? 'text-green-400' : 
                  (state.stats?.turnsSinceDamage || 0) >= 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  Sin daño: {state.stats?.turnsSinceDamage || 0} turnos
                </div>
              </div>
            </div>
          </div>

          {/* Estado del juego */}
          <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold ${statusColor}`}>
                {state.status === 'RUN' ? '🎮 En juego' : 
                 state.status === 'WIN' ? '🏆 ¡Victoria!' : '💀 Muerto'}
              </div>
              <div className="text-xs text-gray-400">
                Presiona N para reiniciar
              </div>
            </div>
          </div>

        </div>

        {/* Removed level up overlay - using automatic upgrades now */}

        {/* Overlay de victoria/muerte */}
        {state.overlay && state.overlayType === 'victory' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
            <div className="text-center p-8 bg-gradient-to-br from-yellow-900/90 to-orange-900/90 border border-yellow-500 rounded-lg shadow-2xl">
              <div className="text-6xl mb-6 animate-bounce">
                🏆👑🎉
              </div>
              <div className="text-4xl mb-4 text-yellow-300 font-bold">
                ¡VICTORIA ÉPICA!
              </div>
              <div className="text-2xl mb-4 text-yellow-400">
                ¡HAS CONQUISTADO LOS 100 PISOS!
              </div>
              <div className="text-lg mb-6 text-orange-300">
                🎊 ¡ERES UN VERDADERO MAESTRO DEL DUNGEON! 🎊
              </div>
              <div className="text-base mb-4 text-yellow-200 bg-black/30 p-4 rounded border border-yellow-600">
                <div>📊 Estadísticas Finales:</div>
                <div>🔥 Kills: {state.stats?.kills || 0}</div>
                <div>💎 Cofres: {state.stats?.chests || 0}</div>
                <div>⚔️ ATQ Final: {state.player?.atk || 0}</div>
                <div>💗 HP Final: {state.player?.hp || 0}/{state.player?.maxHp || 0}</div>
                <div>🏹 Mejor Racha: {state.bestKillStreak || 0}</div>
                <div>🎯 Nivel Final: {state.level || 1}</div>
              </div>
              <div className="text-lg mb-4 text-yellow-300">
                👑 Tu leyenda será recordada por siempre...
              </div>
              <div className="text-sm text-yellow-400 animate-pulse">
                Pulsa N para una nueva aventura
              </div>
            </div>
          </div>
        )}
        
        {state.overlay && state.overlayType === 'death' && !state.showContinue && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
            <div className="text-center p-8 bg-gray-800/90 border border-gray-600 rounded-lg shadow-2xl">
              <div className="text-4xl mb-4">
                {state.status === 'WIN' ? (
                  <div className="text-yellow-400">
                    🏆 ¡VICTORIA! 🎉
                  </div>
                ) : (
                  <div className="text-red-400">
                    💀 GAME OVER 💀
                  </div>
                )}
              </div>
              <div className="text-lg mb-6 text-gray-300">
                {state.status === 'WIN' ? 
                  '¡Has escapado de la mazmorra!' : 
                  'Has caído en batalla...'}
              </div>
              <div className="text-sm text-gray-400 animate-pulse">
                Pulsa N para reiniciar
              </div>
            </div>
          </div>
        )}

        {/* Overlay de continuar partida */}
  {state.showContinue && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
            <div className="text-center p-8 bg-gray-800/90 border border-gray-600 rounded-lg shadow-2xl">
              <div className="text-4xl mb-4 text-cyan-400">
                💾 PARTIDA GUARDADA
              </div>
              <div className="text-lg mb-6 text-gray-300">
                Se encontró una partida anterior
              </div>
              <div className="text-sm text-gray-400 space-y-2">
                <div>Turno: {state.turn || 0} | HP: {state.player?.hp || 0}/{state.player?.maxHp || 0}</div>
                <div>Kills: {state.stats?.kills || 0} | Cofres: {state.stats?.chests || 0}</div>
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="text-green-400 animate-pulse">C - Continuar partida</div>
                <div className="text-red-400">N - Nueva partida</div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay de Logros */}
        {state.overlay && state.overlayType === 'achievements' && !state.showContinue && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
            <div className="text-center p-8 bg-gray-800/90 border border-gray-600 rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="text-3xl mb-4 text-yellow-400">
                🏆 LOGROS
              </div>
              <div className="space-y-3 text-left">
                {state.achievements.map((achievement) => (
                  <div key={achievement.id} className={`p-3 rounded border ${
                    achievement.unlocked ? 'bg-green-900/30 border-green-500' : 'bg-gray-700/30 border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`font-semibold ${achievement.unlocked ? 'text-green-400' : 'text-gray-400'}`}>
                        {achievement.unlocked ? '✅' : '🔒'} {achievement.name}
                      </div>
                      {achievement.unlocked && achievement.timestamp && (
                        <div className="text-xs text-gray-500">
                          {new Date(achievement.timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {achievement.description}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-sm text-gray-400">
                Pulsa L para cerrar | H para historial
              </div>
            </div>
          </div>
        )}

        {/* Overlay de Historial */}
        {state.overlay && state.overlayType === 'leaderboard' && !state.showContinue && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
            <div className="text-center p-8 bg-gray-800/90 border border-gray-600 rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="text-3xl mb-4 text-blue-400">
                📊 MEJORES RUNS
              </div>
              <div className="space-y-2 text-left">
                {state.runHistory
                  .sort((a, b) => b.floor - a.floor || b.kills - a.kills)
                  .slice(0, 10)
                  .map((run, i) => (
                  <div key={run.id} className={`p-3 rounded border bg-gray-700/30 border-gray-600 ${
                    i === 0 ? 'border-yellow-500 bg-yellow-900/20' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {i === 0 && <span className="text-yellow-400">👑</span>}
                        <span className="font-semibold text-white">
                          #{i + 1} Piso {run.floor}
                        </span>
                        {run.isDailyRun && <span className="text-cyan-400 text-xs">📅 DAILY</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(run.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {run.kills} kills • {run.turns} turnos
                    </div>
                  </div>
                ))}
                {state.runHistory.length === 0 && (
                  <div className="text-gray-400 text-center py-8">
                    No hay runs registradas aún
                  </div>
                )}
              </div>
              <div className="mt-6 text-sm text-gray-400">
                Pulsa H para cerrar | L para logros
              </div>
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-4 text-xs text-gray-500 text-center space-x-6">
          <span><span className="text-cyan-400">🧝‍♂️</span> Héroe</span>
          <span><span className="text-red-400">🧟</span> Zombie (lento)</span>
          <span><span className="text-orange-500">👹</span> Orco (rápido)</span>
          <span><span className="text-purple-500">👺</span> Demonio (fuerte)</span>
          <span><span className="text-amber-400">🗃️</span> Cofre</span>
          <span><span className="text-fuchsia-400">⛧</span> Altar</span>
          <span><span className="text-yellow-400">🚪</span> Bajada</span>
          <span><span className="text-rose-400">✱</span> Trampa</span>
          <span className="text-red-400">◌ pulso = agresivo</span>
        </div>
        
        {/* Controles */}
        <div className="mt-2 text-xs text-gray-600 text-center space-x-4">
          <span>N - Nueva partida</span>
          <span>T - Partida diaria</span>
          <span>L - Logros</span>
          <span>H - Historial</span>
          <span>X - Debug</span>
          <span>F - Pistola</span>
        </div>
      </div>
    </div>
  )
}
