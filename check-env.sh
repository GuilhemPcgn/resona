#!/bin/bash

echo "🔍 Vérification de la configuration..."
echo ""

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env MANQUANT !"
    echo "   Créez-le avec: cp env.example .env"
    exit 1
else
    echo "✅ Fichier .env trouvé"
fi

# Vérifier si .env.local existe dans frontend
if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Fichier frontend/.env.local MANQUANT !"
    exit 1
else
    echo "✅ Fichier frontend/.env.local trouvé"
fi

# Vérifier si les valeurs par défaut sont toujours présentes
if grep -q "your_supabase_url_here" .env; then
    echo ""
    echo "⚠️  ATTENTION : Le fichier .env contient encore les valeurs par défaut !"
    echo ""
    echo "   Vous DEVEZ le configurer avec vos vraies clés Supabase."
    echo ""
    echo "   1. Ouvrez .env"
    echo "   2. Remplacez 'your_supabase_url_here' par votre URL Supabase"
    echo "   3. Remplacez les clés par vos vraies clés"
    echo ""
    echo "   Où trouver vos clés :"
    echo "   → https://supabase.com"
    echo "   → Votre projet → Settings → API"
    echo ""
    exit 1
fi

if grep -q "your_supabase_url_here" frontend/.env.local; then
    echo ""
    echo "⚠️  ATTENTION : Le fichier frontend/.env.local contient encore les valeurs par défaut !"
    echo ""
    echo "   Configurez-le avec vos vraies clés Supabase."
    echo ""
    exit 1
fi

echo ""
echo "✅ Configuration complète !"
echo ""
echo "Vous pouvez maintenant démarrer l'application avec :"
echo "  make dev"
echo ""

