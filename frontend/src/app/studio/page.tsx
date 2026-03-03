"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/studio/FileUploader";
import { FileList } from "@/components/studio/FileList";

export default function StudioPage() {
  // Projet actif partagé entre FileUploader et FileList
  const [selectedProjectId, setSelectedProjectId] = useState("");

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

        {/* Liste des fichiers — lecture via le GlobalPlayer */}
        <FileList
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
        />
      </div>
    </AppLayout>
  );
}
