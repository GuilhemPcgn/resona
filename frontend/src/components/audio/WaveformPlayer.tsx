"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type WaveSurfer from "wavesurfer.js";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveformAnimatedOverlay } from "./WaveformAnimatedOverlay";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Ref API ──────────────────────────────────────────────────────────────────

/** API exposée via ref pour contrôler le player depuis un composant parent */
export interface WaveformPlayerRef {
  /** Positionne la lecture au timecode donné (en secondes) */
  seekTo: (time: number) => void;
  /** Retourne le timecode courant (en secondes) sans déclencher de re-render */
  getCurrentTime: () => number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WaveformPlayerProps {
  audioUrl: string;
  peaks?: number[][];
  duration?: number;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  volume?: number;
  /** BPM du morceau — alimente l'animation overlay */
  bpm?: number;
  /**
   * Appelé avec le timecode (secondes) lorsqu'un double-clic est détecté
   * sur la waveform. WaveSurfer positionne d'abord la lecture (clic simple
   * interne), puis ce callback est déclenché.
   */
  onDoubleClick?: (time: number) => void;
  /**
   * Positions (en secondes) auxquelles afficher des marqueurs visuels
   * sur la waveform (lignes verticales).
   */
  markerTimes?: number[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WaveformPlayer = forwardRef<WaveformPlayerRef, WaveformPlayerProps>(
  function WaveformPlayer(
    {
      audioUrl,
      peaks,
      duration,
      height = 100,
      waveColor,
      progressColor,
      volume = 1,
      bpm = 0,
      onDoubleClick,
      markerTimes = [],
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef        = useRef<WaveSurfer | null>(null);

    const [isPlaying,     setIsPlaying]     = useState(false);
    const [currentTime,   setCurrentTime]   = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration ?? 0);
    const [isLoading,     setIsLoading]     = useState(true);
    const [error,         setError]         = useState<string | null>(null);

    // Refs pour éviter les valeurs stales dans les callbacks DOM
    const totalDurationRef = useRef(duration ?? 0);
    const currentTimeRef   = useRef(0);

    // ── Ref API ─────────────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (!wsRef.current || totalDurationRef.current <= 0) return;
        wsRef.current.seekTo(
          Math.max(0, Math.min(1, time / totalDurationRef.current)),
        );
      },
      getCurrentTime: () => currentTimeRef.current,
    }));

    // ── Création / destruction WaveSurfer ────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current || !audioUrl) return;

      let destroyed = false;

      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      setIsPlaying(false);
      setTotalDuration(duration ?? 0);
      totalDurationRef.current = duration ?? 0;
      currentTimeRef.current = 0;

      (async () => {
        try {
          const { default: WaveSurfer } = await import("wavesurfer.js");
          if (destroyed || !containerRef.current) return;

          const ws = WaveSurfer.create({
            container:     containerRef.current,
            height,
            waveColor:     waveColor     ?? "rgba(139, 92, 246, 0.4)",
            progressColor: progressColor ?? "rgba(139, 92, 246, 1)",
            cursorColor:   "transparent",
            barWidth:      2,
            barGap:        1,
            barRadius:     2,
            normalize:     true,
            interact:      true,
            hideScrollbar: true,
          });

          wsRef.current = ws;

          ws.on("ready", () => {
            if (!destroyed) {
              const d = ws.getDuration();
              setIsLoading(false);
              setTotalDuration(d);
              totalDurationRef.current = d;
            }
          });
          ws.on("timeupdate", (t: number) => {
            if (!destroyed) {
              setCurrentTime(t);
              currentTimeRef.current = t;
            }
          });
          ws.on("play",   () => { if (!destroyed) setIsPlaying(true); });
          ws.on("pause",  () => { if (!destroyed) setIsPlaying(false); });
          ws.on("finish", () => { if (!destroyed) setIsPlaying(false); });
          ws.on("error",  (err: Error) => {
            if (!destroyed) {
              setError(err?.message ?? "Erreur de lecture");
              setIsLoading(false);
            }
          });

          if (peaks && peaks.length > 0 && duration) {
            await ws.load(audioUrl, peaks, duration);
          } else {
            await ws.load(audioUrl);
          }
        } catch (e) {
          if (!destroyed) {
            setError(
              e instanceof Error
                ? e.message
                : "Erreur d'initialisation du lecteur",
            );
            setIsLoading(false);
          }
        }
      })();

      return () => {
        destroyed = true;
        wsRef.current?.destroy();
        wsRef.current = null;
        setIsPlaying(false);
        setCurrentTime(0);
        setIsLoading(true);
        setError(null);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl]);

    // ── Volume ───────────────────────────────────────────────────────────────────
    useEffect(() => {
      if (!wsRef.current) return;
      wsRef.current.setVolume(volume);
      wsRef.current.setMuted(volume === 0);
    }, [volume]);

    // ── Double-clic → callback avec le timecode calculé ──────────────────────────
    useEffect(() => {
      const el = containerRef.current;
      if (!el || !onDoubleClick) return;

      const handler = (e: MouseEvent) => {
        if (totalDurationRef.current <= 0) return;
        const rect = el.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const time = Math.max(
          0,
          Math.min(totalDurationRef.current, ratio * totalDurationRef.current),
        );
        onDoubleClick(time);
      };

      el.addEventListener("dblclick", handler);
      return () => el.removeEventListener("dblclick", handler);
    }, [onDoubleClick]);

    // ── Contrôles ────────────────────────────────────────────────────────────────
    const togglePlay = useCallback(() => {
      if (!wsRef.current || isLoading) return;
      wsRef.current.playPause();
    }, [isLoading]);

    // ── Rendu ─────────────────────────────────────────────────────────────────────
    if (error) {
      return (
        <div className="flex items-center gap-2 py-4 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Waveform + overlay d'animation BPM + marqueurs */}
        <div
          className="relative rounded overflow-hidden"
          style={{ minHeight: height }}
          title={onDoubleClick ? "Double-clic pour ajouter un commentaire" : undefined}
        >
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: "rgba(0,0,0,0.12)" }}
            >
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}

          {/* Conteneur WaveSurfer */}
          <div ref={containerRef} style={{ minHeight: height }} />

          <WaveformAnimatedOverlay
            bpm={bpm > 0 ? bpm : 120}
            isPlaying={isPlaying}
            containerRef={containerRef}
          />

          {/* Marqueurs visuels des commentaires */}
          {!isLoading && totalDuration > 0 &&
            markerTimes.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
                style={{
                  left: `${(t / totalDuration) * 100}%`,
                  background: "rgba(251, 191, 36, 0.85)",
                  boxShadow: "0 0 4px rgba(251, 191, 36, 0.5)",
                }}
              />
            ))}
        </div>

        {/* Bouton play/pause + compteurs */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            onClick={togglePlay}
            disabled={isLoading}
            className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-glow shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <span className="text-xs text-muted-foreground tabular-nums select-none">
            {fmtTime(currentTime)}
            <span className="mx-1 opacity-40">/</span>
            {fmtTime(totalDuration)}
          </span>
        </div>
      </div>
    );
  },
);
