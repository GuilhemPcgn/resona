#!/bin/bash

echo "🚀 Premier démarrage de Resona Sound Studio Hub"
echo "==============================================="
echo ""

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant!"
    echo "📋 Copie de env.example vers .env..."
    cp env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Veuillez éditer le fichier .env et y ajouter vos clés Supabase"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
    read -p "Appuyez sur Entrée une fois que vous avez configuré le fichier .env..."
fi

# Demander le mode de démarrage
echo "Comment voulez-vous démarrer l'application ?"
echo ""
echo "1) 🐳 Docker (Production) - Recommandé pour tester"
echo "2) 💻 Développement local - Recommandé pour développer"
echo ""
read -p "Votre choix (1 ou 2): " choice

case $choice in
    1)
        echo ""
        echo "🐳 Démarrage avec Docker..."
        echo ""
        
        # Vérifier que Docker est installé
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker n'est pas installé!"
            echo "   Installez Docker Desktop: https://www.docker.com/products/docker-desktop"
            exit 1
        fi
        
        echo "🔨 Construction des images Docker..."
        docker-compose build
        
        echo ""
        echo "🚀 Démarrage des services..."
        docker-compose up -d
        
        echo ""
        echo "✅ Application démarrée avec succès!"
        echo ""
        echo "📱 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:3001"
        echo ""
        echo "Pour voir les logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "Pour arrêter:"
        echo "   make stop"
        echo "   ou: docker-compose down"
        ;;
        
    2)
        echo ""
        echo "💻 Démarrage en mode développement..."
        echo ""
        
        # Vérifier que Node.js est installé
        if ! command -v node &> /dev/null; then
            echo "❌ Node.js n'est pas installé!"
            echo "   Installez Node.js 18 ou 20: https://nodejs.org/"
            exit 1
        fi
        
        echo "📦 Vérification des dépendances..."
        
        # Frontend
        if [ ! -d "frontend/node_modules" ]; then
            echo "📦 Installation des dépendances frontend..."
            cd frontend && npm install && cd ..
        fi
        
        # Backend
        if [ ! -d "backend/node_modules" ]; then
            echo "📦 Installation des dépendances backend..."
            cd backend && npm install && cd ..
        fi
        
        echo ""
        echo "✅ Dépendances installées!"
        echo ""
        echo "🚀 Démarrage de l'application..."
        echo ""
        echo "📱 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:3001"
        echo ""
        echo "💡 Pour arrêter: Ctrl+C"
        echo ""
        
        # Démarrer avec le script dev
        ./dev.sh
        ;;
        
    *)
        echo "❌ Choix invalide. Veuillez relancer le script."
        exit 1
        ;;
esac

