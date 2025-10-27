#!/bin/bash

# Script de développement local pour Resona Sound Studio Hub
echo "🚀 Démarrage du développement local..."

# Nettoyer les processus existants avant de démarrer
echo "🧹 Nettoyage des processus existants..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "node.*nest" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Libérer les ports si nécessaire
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Vérifier si les dossiers existent
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Dossiers frontend ou backend manquants!"
    exit 1
fi

# Vérifier si les dépendances sont installées
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installation des dépendances backend..."
    cd backend && npm install && cd ..
fi

echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "⏳ Démarrage en cours..."
echo ""

# Fonction pour arrêter proprement les processus
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    
    # Tuer les processus par PID
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    
    # Attendre un peu puis forcer l'arrêt
    sleep 2
    kill -9 $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    
    # Nettoyage supplémentaire pour WSL
    pkill -f "node.*next" 2>/dev/null || true
    pkill -f "node.*nest" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    
    # Sur WSL, utiliser taskkill pour Windows
    if grep -q Microsoft /proc/version 2>/dev/null; then
        echo "🪟 Nettoyage WSL..."
        taskkill //F //IM node.exe 2>/dev/null || true
        taskkill //F //IM npm.exe 2>/dev/null || true
    fi
    
    echo "✅ Services arrêtés!"
    exit 0
}

# Capturer Ctrl+C et autres signaux
trap cleanup SIGINT SIGTERM

# Démarrer le frontend en arrière-plan
echo "🖥️  Démarrage du frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Attendre un peu que le frontend démarre
sleep 2

# Démarrer le backend en arrière-plan
echo "🔧 Démarrage du backend..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

echo "✅ Services démarrés!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"

# Attendre que les processus se terminent
wait
