#!/bin/bash

echo "🧹 Nettoyage complet de l'application..."

# Arrêter tous les conteneurs
echo "🛑 Arrêt des conteneurs..."
docker-compose down -v

# Supprimer les images
echo "🗑️  Suppression des images..."
docker-compose rm -f
docker rmi resona-frontend:latest resona-backend:latest 2>/dev/null || true

# Nettoyer les caches Next.js
echo "🗑️  Nettoyage des caches Next.js..."
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

# Nettoyer les caches NestJS
echo "🗑️  Nettoyage des caches NestJS..."
rm -rf backend/dist
rm -rf backend/node_modules/.cache

# Reconstruire et démarrer
echo "🔨 Reconstruction des images..."
docker-compose build --no-cache

echo "🚀 Démarrage de l'application..."
docker-compose up -d

echo "✅ Nettoyage et reconstruction terminés !"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Pour voir les logs:"
echo "docker-compose logs -f"

