"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/studio/FileUploader";
import { FileList } from "@/components/studio/FileList";
import { AudioPlayer } from "@/components/studio/AudioPlayer";

export default function StudioPage() {
  // Projet actif partagé entre FileUploader et FileList
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Fichier en cours de lecture
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const [playingFileName, setPlayingFileName] = useState("");

  const handlePlay = (fileId: string, fileName: string) => {
    setPlayingFileId(fileId);
    setPlayingFileName(fileName);
  };

  const handlePlayerClose = () => {
    setPlayingFileId(null);
    setPlayingFileName("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Studio</h1>
          <p className="text-muted-foreground">
            Lecteur audio et gestion des fichiers
          </p>
        </div>

        {/* Zone d'upload */}
        <FileUploader
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
        />

        {/* Lecteur — visible uniquement quand un fichier est sélectionné */}
        {playingFileId && (
          <AudioPlayer
            fileId={playingFileId}
            fileName={playingFileName}
            onClose={handlePlayerClose}
          />
        )}

        {/* Liste des fichiers */}
        <FileList
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
          onPlay={handlePlay}
          playingFileId={playingFileId}
        />
      </div>
    </AppLayout>
  );
}
