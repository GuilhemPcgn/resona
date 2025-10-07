#!/bin/bash

# Script de développement local pour Resona Sound Studio Hub
echo "🚀 Démarrage du développement local..."

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
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

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
