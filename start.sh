#!/bin/bash

# Script de démarrage pour Resona Sound Studio Hub
echo "🚀 Démarrage de Resona Sound Studio Hub..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Le fichier .env n'existe pas. Copie du fichier d'exemple..."
    cp env.example .env
    echo "📝 Veuillez configurer les variables d'environnement dans le fichier .env"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_ANON_KEY"
    exit 1
fi

# Construire et démarrer les services
echo "🔨 Construction des images Docker..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d

echo "✅ Services démarrés avec succès!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  Supabase: http://localhost:5432"
echo ""
echo "Pour arrêter les services: docker-compose down"
echo "Pour voir les logs: docker-compose logs -f"
