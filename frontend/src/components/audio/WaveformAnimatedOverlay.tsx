"use client";

import { useRef, useEffect } from "react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WaveformAnimatedOverlayProps {
  /** BPM du morceau — pilote directement la vitesse de l'animation */
  bpm: number;
  /** Lance / arrête l'animation */
  isPlaying: boolean;
  /** Ref sur le div conteneur de la waveform (pour dimensionner le canvas) */
  containerRef: React.RefObject<HTMLDivElement>;
}

// ─── Courbes — fréquence, déphasage, opacité, épaisseur ──────────────────────

const WAVES = [
  { freq: 2.0, phaseOff: 0,                    opacity: 0.28, lw: 2.0 },
  { freq: 3.0, phaseOff: (2 * Math.PI) / 3,    opacity: 0.18, lw: 1.5 },
  { freq: 1.5, phaseOff: (4 * Math.PI) / 3,    opacity: 0.12, lw: 1.2 },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function WaveformAnimatedOverlay({
  bpm,
  isPlaying,
  containerRef,
}: WaveformAnimatedOverlayProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const phaseRef     = useRef(0);
  const alphaRef     = useRef(0);   // fondu entrée/sortie [0, 1]
  const hueRef       = useRef(265); // dérive lente de teinte
  const lastTsRef    = useRef<number | null>(null);

  // Refs miroirs pour que la boucle lise toujours les valeurs à jour
  const isPlayingRef = useRef(isPlaying);
  const bpmRef       = useRef(bpm > 0 ? bpm : 120);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { bpmRef.current = bpm > 0 ? bpm : 120; }, [bpm]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Synchroniser la surface de dessin avec le conteneur
    const syncSize = () => {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);

    // ── Boucle d'animation ──────────────────────────────────────────────────
    const draw = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      // Plafonner delta à 50 ms pour éviter les sauts au retour d'onglet
      const dt = Math.min(ts - lastTsRef.current, 50);
      lastTsRef.current = ts;

      const playing = isPlayingRef.current;
      const bpmNow  = bpmRef.current;

      // Fondu entrée (~200 ms) / sortie (~500 ms)
      if (playing) {
        alphaRef.current = Math.min(1, alphaRef.current + dt / 200);
      } else {
        alphaRef.current = Math.max(0, alphaRef.current - dt / 500);
      }

      // Avance de phase : 1 cycle complet = 1 beat = 60 / bpm secondes
      if (playing) {
        phaseRef.current += (Math.PI * bpmNow / 60) * (dt / 1000);
      }

      // Dérive de teinte : ~30 s pour un tour complet
      hueRef.current = (hueRef.current + dt * 0.012) % 360;

      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const masterAlpha = alphaRef.current;
      if (masterAlpha > 0.005) {
        const W   = canvas.width;
        const H   = canvas.height;
        const hue = hueRef.current;

        // Légère pulsation de l'amplitude calée sur le beat (0.82 → 1.0)
        const beatPhase = phaseRef.current % (2 * Math.PI);
        const pulse     = 0.82 + 0.18 * Math.abs(Math.cos(beatPhase / 2));
        const amp       = H * 0.20 * pulse;

        for (const wave of WAVES) {
          ctx.save();
          ctx.beginPath();

          for (let x = 0; x <= W; x += 2) {
            const t = x / W;
            const y =
              H / 2 +
              Math.sin(t * Math.PI * 2 * wave.freq + phaseRef.current + wave.phaseOff) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = `hsla(${hue}, 90%, 72%, ${wave.opacity * masterAlpha})`;
          ctx.lineWidth   = wave.lw;
          ctx.shadowBlur  = 4;
          ctx.shadowColor = `hsla(${hue}, 100%, 80%, ${wave.opacity * masterAlpha * 0.5})`;
          ctx.stroke();
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      lastTsRef.current = null;
    };
  }, [containerRef]); // relancer uniquement si le conteneur change

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "absolute",
        inset:         0,
        pointerEvents: "none",
        mixBlendMode:  "screen",
      }}
    />
  );
}
