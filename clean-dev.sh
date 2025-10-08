#!/bin/bash

echo "🧹 Nettoyage de l'environnement de développement..."

# Nettoyer le frontend
echo "🖥️  Nettoyage du frontend..."
cd frontend
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
echo "✅ Frontend nettoyé"
cd ..

# Nettoyer le backend
echo "🔧 Nettoyage du backend..."
cd backend
rm -rf dist
rm -rf node_modules/.cache
echo "✅ Backend nettoyé"
cd ..

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "Pour redémarrer en développement:"
echo "  make dev           # Démarrer frontend + backend"
echo "  make dev-frontend  # Démarrer seulement le frontend"
echo "  make dev-backend   # Démarrer seulement le backend"

