"use client";

import { useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { fetchWithAuth } from "@/lib/api-client";
import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  // ── Store selectors ────────────────────────────────────────────────────────
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const currentTime  = usePlayerStore((s) => s.currentTime);
  const duration     = usePlayerStore((s) => s.duration);
  const volume       = usePlayerStore((s) => s.volume);
  const isMuted      = usePlayerStore((s) => s.isMuted);
  const seekTarget   = usePlayerStore((s) => s.seekTarget);
  const queue        = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);

  const { toggle, next, prev, stop, clearSeek, setVolume, toggleMute } = usePlayerStore();

  // ── Audio event listeners (mount only — use getState() to avoid stale closures) ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
    };
    const onDurationChange = () => {
      const d = audio.duration;
      usePlayerStore.getState().setDuration(isFinite(d) ? d : 0);
    };
    const onEnded = () => {
      usePlayerStore.getState().next();
    };
    const onCanPlay = () => {
      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, []); // mount only

  // ── Fetch URL if current track has none ────────────────────────────────────
  useEffect(() => {
    const track = currentTrack;
    if (!track?.id || track?.url) return;

    const id = track.id;
    fetchWithAuth(`/files/${id}/url`)
      .then((r) => r.json())
      .then(
        ({
          signedUrl,
          duration: dur,
          peaks,
        }: {
          signedUrl: string;
          duration?: number | null;
          peaks?: number[][] | null;
        }) => {
          usePlayerStore.getState().updateTrackUrl(
            id,
            signedUrl,
            dur ?? undefined,
            peaks ?? undefined,
          );
        },
      )
      .catch(console.error);
  }, [currentTrack?.id, currentTrack?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop audio when track ID changes ──────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    usePlayerStore.getState().setCurrentTime(0);
    usePlayerStore.getState().setDuration(0);
  }, [currentTrack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load new source when URL becomes available ─────────────────────────────
  useEffect(() => {
    const url = currentTrack?.url;
    if (!url) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = url;
    audio.load();
    // canplay listener will call play() if isPlaying is true
  }, [currentTrack?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play / pause ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seek ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (seekTarget === undefined) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seekTarget;
    clearSeek();
  }, [seekTarget, clearSeek]);

  // ── Volume / mute ─────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  }, [volume, isMuted]);

  // ── Don't render if no track ───────────────────────────────────────────────
  if (!currentTrack) return <audio ref={audioRef} preload="metadata" />;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasNext  = currentIndex < queue.length - 1;
  const hasPrev  = currentIndex > 0 || currentTime > 3;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    usePlayerStore.getState().seek(Math.max(0, ratio * duration));
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-card/95 backdrop-blur-md",
          "border-t border-primary/25",
          "shadow-[0_-4px_30px_hsl(258_90%_66%/0.18)]",
        ].join(" ")}
      >
        {/* Thin progress bar at very top of bar */}
        <div
          className="h-[3px] bg-muted/40 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 h-[54px]">
          {/* Track info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {currentTrack.title}
              </p>
              {currentTrack.artist && (
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {currentTrack.artist}
                </p>
              )}
            </div>
          </div>

          {/* Transport controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={prev}
              disabled={!hasPrev}
              aria-label="Précédent"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground hover:text-primary"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
              onClick={next}
              disabled={!hasNext}
              aria-label="Suivant"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
            {fmtTime(currentTime)}{" "}
            <span className="opacity-50">/</span>{" "}
            {fmtTime(duration)}
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[isMuted ? 0 : volume]}
              onValueChange={([v]) => setVolume(v)}
              className="w-20"
            />
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={stop}
            aria-label="Arrêter"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
