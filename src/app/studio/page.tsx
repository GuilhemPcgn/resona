"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Share2, 
  MessageSquare,
  Upload,
  Music,
  
  Clock,
  User
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

export default function Studio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalTime = 240; // 4 minutes

  const audioFiles = [
    {
      id: 1,
      name: "Track_01_Vocals_v3.wav",
      duration: "3:24",
      size: "34.2 MB",
      version: "v3",
      uploadedBy: "Sophie Martin",
      uploadDate: "Il y a 2h",
      status: "approved",
      comments: 3
    },
    {
      id: 2,
      name: "Track_02_Guitar_Lead_v2.wav", 
      duration: "2:45",
      size: "28.1 MB",
      version: "v2",
      uploadedBy: "Alex Rivera",
      uploadDate: "Il y a 5h",
      status: "revision",
      comments: 1
    },
    {
      id: 3,
      name: "Master_Mix_Final.wav",
      duration: "4:12",
      size: "42.8 MB",
      version: "Final",
      uploadedBy: "Emma Dubois",
      uploadDate: "Hier",
      status: "final",
      comments: 0
    }
  ];

  const statusColors = {
    approved: "bg-success text-success-foreground",
    revision: "bg-warning text-warning-foreground",
    final: "bg-accent text-accent-foreground",
    draft: "bg-muted text-muted-foreground"
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Studio</h1>
                <p className="text-muted-foreground">Lecteur audio et gestion des fichiers</p>
              </div>
              
              <Button className="bg-gradient-hero shadow-glow">
                <Upload className="w-4 h-4 mr-2" />
                Upload fichier
              </Button>
            </div>

            {/* Audio Player */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Lecteur Audio</CardTitle>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    En lecture: Track_01_Vocals_v3.wav
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Waveform Visualization */}
                <div className="relative h-20 bg-audio-track rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-full w-full px-4">
                      {Array.from({ length: 100 }, (_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm transition-all duration-200 ${
                            i < (currentTime / totalTime) * 100 
                              ? 'bg-audio-progress' 
                              : 'bg-audio-waveform'
                          }`}
                          style={{
                            height: `${20 + Math.random() * 60}%`,
                            minHeight: '20%'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Time indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-glow"
                    style={{ left: `${(currentTime / totalTime) * 100}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 bg-primary hover:bg-primary-glow shadow-glow"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <div className="w-20 h-1 bg-muted rounded-full">
                        <div className="w-3/4 h-full bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(totalTime)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-border/50">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Commenter
                    </Button>
                    <Button variant="outline" size="sm" className="border-border/50">
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                    <Button variant="outline" size="sm" className="border-border/50">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Fichiers audio</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border/50">
                    Filtrer
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/50">
                    Trier
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {audioFiles.map((file) => (
                  <Card key={file.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-10 h-10 border-border/50 hover:border-primary/30 hover:bg-primary/10"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{file.name}</div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {file.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {file.size}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {file.uploadedBy}
                              </div>
                              <span>{file.uploadDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[file.status as keyof typeof statusColors]}>
                            {file.status === 'approved' && 'Approuvé'}
                            {file.status === 'revision' && 'Révision'}
                            {file.status === 'final' && 'Final'}
                            {file.status === 'draft' && 'Brouillon'}
                          </Badge>
                          
                          {file.comments > 0 && (
                            <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {file.comments}
                            </Button>
                          )}
                          
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Share2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
