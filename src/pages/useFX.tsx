// fx.tsx — Hook + Canvas + FX components (React + Framer Motion)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============== TIPOS =============== */
export type FxKind =
  | "projectile"   // proyectil de A → B (flecha/disparo)
  | "ring"         // anillo AOE (explosión, ping)
  | "beam"         // rayo vertical (smite)
  | "aura"         // aura/buff persistente
  | "shieldHit"    // absorción de escudo
  | "cloud"        // nube (veneno)
  | "impact"       // chispa de impacto puntual
  | "arc";         // barrido (cleave)

export type GridPoint = { x: number; y: number };

export interface FxEvent {
  id?: string;
  kind: FxKind;
  // posición base (celda de grid)
  x: number;
  y: number;
  // destino (solo projectile / opcional para arc)
  toX?: number;
  toY?: number;
  // radio en celdas (ring/cloud/arc)
  radius?: number;       // por defecto 1.2
  // duración ms
  duration?: number;     // por defecto: depende del tipo
  // visual
  color?: string;        // opcional, usa CSS variables por defecto
  intensity?: number;    // 0..1 sugerido
  // control de borrado
  persist?: boolean;     // si true, se debe limpiar manualmente
  // metadatos	(opcional)
  meta?: Record<string, any>;
}

export interface UseFxOptions {
  tileSize: number;      // px por celda
  gridW: number;         // ancho en celdas
  gridH: number;         // alto en celdas
  containerRef?: React.RefObject<HTMLElement>; // opcional (para shake futuro)
  zIndex?: number;       // z-index del canvas
}

type InternalFx = FxEvent & { _id: string; _born: number };

/* =============== HOOK PRINCIPAL =============== */
export function useFx(opts: UseFxOptions) {
  const { tileSize, gridW, gridH, zIndex = 30 } = opts;
  const [fxList, setFxList] = useState<InternalFx[]>([]);

  const toPx = useCallback(
    (p: GridPoint) => ({ left: p.x * tileSize, top: p.y * tileSize }),
    [tileSize]
  );

  const add = useCallback((e: FxEvent) => {
    const _id = e.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = e.duration ?? (
      e.kind === "projectile" ? 220 :
      e.kind === "beam" ? 260 :
      e.kind === "ring" ? 360 :
      e.kind === "cloud" ? 600 :
      e.kind === "arc" ? 220 :
      e.kind === "shieldHit" ? 220 : 200
    );
    const item: InternalFx = { ...e, _id, _born: performance.now(), duration };
    setFxList((prev) => [...prev, item]);

    if (!e.persist) {
      // auto-remove cuando termine
      window.setTimeout(() => {
        setFxList((prev) => prev.filter((x) => x._id !== _id));
      }, duration + 40);
    }
    return _id;
  }, []);

  const clear = useCallback(() => setFxList([]), []);

  // Utilidad: sincronizar desde estado de juego (abilityHighlights, logs breves)
  const syncFromState = useCallback((params: {
    abilityHighlights?: Record<string, number> | null | undefined;
    player?: GridPoint;
    enemies?: GridPoint[];
    allies?: GridPoint[];
    logLast?: string; // última línea de log (para disparos/escudo)
    turn?: number;
  }) => {
    const { abilityHighlights, player, logLast } = params;

    // 1) Pings de AOE marcados en state (volley/poison/raise/smite, etc.)
    if (abilityHighlights) {
      Object.keys(abilityHighlights).forEach((key) => {
        const [sx, sy] = key.split(",").map((n) => parseInt(n, 10));
        if (Number.isFinite(sx) && Number.isFinite(sy)) {
          add({ kind: "ring", x: sx, y: sy, radius: 1.2, duration: 300 });
          add({ kind: "impact", x: sx, y: sy, duration: 160, intensity: 0.9 });
        }
      });
    }

    // 2) Señal de absorción de escudo desde el log
    if (player && logLast && /Escudo absorbe/i.test(logLast)) {
      add({ kind: "shieldHit", x: player.x, y: player.y, duration: 240 });
    }

    // 3) Señal genérica de disparo (enemigo ranged) desde el log
    if (player && logLast && /dispara/i.test(logLast)) {
      // Proyectil desde "algún" hostigador hacia el jugador (aprox)
      // Para precisión absoluta, dispara manualmente con x,y de ese enemigo.
      add({
        kind: "projectile",
        x: player.x, y: player.y, // invertimos para el efecto de entrada: llega al jugador
        toX: player.x, toY: player.y,
        duration: 180, intensity: 0.7
      });
      add({ kind: "impact", x: player.x, y: player.y, duration: 140 });
    }
  }, [add]);

  /* =============== CANVAS =============== */
  const FXCanvas: React.FC = useCallback(() => {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex, width: gridW * tileSize, height: gridH * tileSize }}
      >
        <AnimatePresence>
          {fxList.map((e) => {
            const key = e._id;
            switch (e.kind) {
              case "projectile":
                return <FXProjectile key={key} e={e} tileSize={tileSize} />;
              case "ring":
                return <FXRing key={key} e={e} tileSize={tileSize} />;
              case "beam":
                return <FXBeam key={key} e={e} tileSize={tileSize} />;
              case "aura":
                return <FXAura key={key} e={e} tileSize={tileSize} />;
              case "shieldHit":
                return <FXShieldHit key={key} e={e} tileSize={tileSize} />;
              case "cloud":
                return <FXCloud key={key} e={e} tileSize={tileSize} />;
              case "arc":
                return <FXArc key={key} e={e} tileSize={tileSize} />;
              case "impact":
              default:
                return <FXImpact key={key} e={e} tileSize={tileSize} />;
            }
          })}
        </AnimatePresence>
      </div>
    );
  }, [fxList, gridW, tileSize, zIndex]);

  return {
    FXCanvas,
    fx: {
      trigger: add,        // <<< dispara FX programáticamente
      clear,
      syncFromState,       // <<< consume abilityHighlights/logs para FX automáticos
    },
  };
}

/* =============== COMPONENTES FX (internos) =============== */
// Utilidades comunes
const px = (n: number) => `${n}px`;
const centerStyle = (x: number, y: number, t: number) => ({
  left: x * t + t / 2,
  top: y * t + t / 2,
  transform: "translate(-50%, -50%)",
  position: "absolute" as const,
});

// Chispa de impacto puntual
const FXImpact: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const size = (e.intensity ?? 1) * tileSize * 0.6;
  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.7 }}
      animate={{ opacity: 0, scale: 1.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: (e.duration ?? 180) / 1000, ease: "easeOut" }}
      style={{ ...centerStyle(e.x, e.y, tileSize), width: px(size), height: px(size),
        borderRadius: "9999px", background: "radial-gradient(circle, rgba(255,255,255,.9), rgba(255,255,255,0))",
        filter: "drop-shadow(0 0 6px rgba(255,255,255,.6))" }}
    />
  );
};

// Proyectil A → B
const FXProjectile: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const from = { x: e.x, y: e.y };
  const to = { x: e.toX ?? e.x, y: e.toY ?? e.y };
  const dur = (e.duration ?? 220) / 1000;
  const size = tileSize * 0.24;
  return (
    <motion.div
      initial={{ x: from.x * tileSize + tileSize / 2, y: from.y * tileSize + tileSize / 2, opacity: 0.95 }}
      animate={{ x: to.x * tileSize + tileSize / 2, y: to.y * tileSize + tileSize / 2, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "linear" }}
      className="pointer-events-none"
      style={{
        position: "absolute",
        width: px(size), height: px(size), borderRadius: "9999px",
        boxShadow: "0 0 8px 2px rgba(255,255,255,.7)",
        background:
          e.color ??
          "radial-gradient(circle at 30% 30%, rgba(255,255,255,.95), rgba(255,255,255,.1))",
      }}
    />
  );
};

// Anillo AOE (explosión / ping)
const FXRing: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const r = (e.radius ?? 1.2) * tileSize;
  const dur = (e.duration ?? 360) / 1000;
  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 0.4 }}
      animate={{ opacity: 0, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "easeOut" }}
      style={{
        ...centerStyle(e.x, e.y, tileSize),
        width: px(r * 2),
        height: px(r * 2),
        borderRadius: "9999px",
        background:
          e.color ??
          "radial-gradient(circle, rgba(255,255,255,.25) 30%, rgba(255,255,255,0) 70%)",
        outline: "2px solid rgba(255,255,255,.35)",
        boxShadow: "0 0 18px rgba(255,255,255,.5) inset",
      }}
    />
  );
};

// Rayo vertical (Smite)
const FXBeam: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const dur = (e.duration ?? 260) / 1000;
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.2 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: e.x * tileSize + tileSize * 0.35,
        top: 0,
        width: px(tileSize * 0.3),
        height: px(tileSize * Math.max(1, e.meta?.gridH ?? 22)),
        background:
          e.color ??
          "linear-gradient(to bottom, rgba(255,255,255,.85), rgba(255,255,255,.15))",
        filter: "drop-shadow(0 0 12px rgba(255,255,255,.8))",
        mixBlendMode: "screen",
      }}
    />
  );
};

// Aura persistente (buff)
const FXAura: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const dur = (e.duration ?? 800) / 1000;
  return (
    <motion.div
      initial={{ opacity: 0.5, scale: 0.9 }}
      animate={{ opacity: [0.6, 0.85, 0.6], scale: [0.9, 1.06, 0.9] }}
      transition={{ duration: dur, ease: "easeInOut", repeat: Infinity }}
      style={{
        ...centerStyle(e.x, e.y, tileSize),
        width: px(tileSize * 1.4),
        height: px(tileSize * 1.4),
        borderRadius: "9999px",
        background:
          e.color ??
          "radial-gradient(circle, rgba(255,255,255,.18), rgba(255,255,255,0))",
        outline: "1px solid rgba(255,255,255,.25)",
        mixBlendMode: "screen",
      }}
    />
  );
};

// Impacto de escudo (absorción)
const FXShieldHit: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const dur = (e.duration ?? 220) / 1000;
  const r = tileSize * 0.9;
  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.4 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "easeOut" }}
      style={{
        ...centerStyle(e.x, e.y, tileSize),
        width: px(r * 1.8), height: px(r * 1.8), borderRadius: "9999px",
        border: "2px solid rgba(180,220,255,.9)",
        boxShadow: "0 0 14px rgba(120,180,255,.8)",
        background: "radial-gradient(circle, rgba(160,210,255,.35), rgba(160,210,255,0))",
        mixBlendMode: "screen",
      }}
    />
  );
};

// Nube (veneno)
const FXCloud: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const dur = (e.duration ?? 600) / 1000;
  const r = (e.radius ?? 1.2) * tileSize;
  return (
    <motion.div
      initial={{ opacity: 0.0, scale: 0.8 }}
      animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.9, 1.05, 0.9] }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "easeInOut", repeat: 2 }}
      style={{
        ...centerStyle(e.x, e.y, tileSize),
        width: px(r * 2), height: px(r * 2), borderRadius: "9999px",
        background:
          e.color ?? "radial-gradient(circle, rgba(120,255,140,.22), rgba(120,255,140,0))",
        filter: "blur(2px)",
        mixBlendMode: "screen",
      }}
    />
  );
};

// Barrido (cleave)
const FXArc: React.FC<{ e: InternalFx; tileSize: number }> = ({ e, tileSize }) => {
  const dur = (e.duration ?? 220) / 1000;
  const r = tileSize * 1.2 * (e.radius ?? 1.2);
  const angle = e.meta?.angle ?? 0; // grados
  return (
    <motion.div
      initial={{ opacity: 0.8, rotate: angle - 20, scale: 0.9 }}
      animate={{ opacity: 0, rotate: angle + 20, scale: 1.05 }}
      exit={{ opacity: 0 }}
      transition={{ duration: dur, ease: "easeOut" }}
      style={{
        ...centerStyle(e.x, e.y, tileSize),
        width: px(r * 2), height: px(r * 2), borderRadius: "9999px",
        background:
          "conic-gradient(from 0deg, rgba(255,255,255,.45), rgba(255,255,255,0) 60%)",
        maskImage: "radial-gradient(circle, black 55%, transparent 60%)",
        mixBlendMode: "screen",
      }}
    />
  );
};
