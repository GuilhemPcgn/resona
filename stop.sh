#!/bin/bash

# Script d'arrêt pour Resona Sound Studio Hub
echo "🛑 Arrêt de Resona Sound Studio Hub..."

# Arrêter les services Docker
echo "🐳 Arrêt des conteneurs Docker..."
docker-compose down

# Tuer tous les processus Node.js (pour WSL et développement local)
echo "🔪 Nettoyage des processus Node.js..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "node.*nest" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Tuer les processus sur les ports spécifiques (plus agressif)
echo "🚪 Libération des ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true

# Sur WSL, utiliser netstat et taskkill pour Windows
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "🪟 Détection WSL - Nettoyage Windows..."
    # Tuer les processus Node.js via Windows
    taskkill //F //IM node.exe 2>/dev/null || true
    taskkill //F //IM npm.exe 2>/dev/null || true
fi

echo "✅ Services arrêtés avec succès!"
echo ""
echo "Pour redémarrer: ./start.sh ou make dev"
echo "Pour supprimer les volumes: docker-compose down -v"
