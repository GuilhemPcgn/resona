#!/bin/bash

# Script d'arrêt pour Resona Sound Studio Hub
echo "🛑 Arrêt de Resona Sound Studio Hub..."

# Arrêter les services
docker-compose down

echo "✅ Services arrêtés avec succès!"
echo ""
echo "Pour redémarrer: ./start.sh"
echo "Pour supprimer les volumes: docker-compose down -v"
