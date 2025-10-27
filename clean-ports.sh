#!/bin/bash

# Script de nettoyage des ports pour WSL et développement local
echo "🧹 Nettoyage des ports et processus..."

# Fonction pour tuer les processus sur un port
kill_port() {
    local port=$1
    echo "🔪 Libération du port $port..."
    
    # Méthode 1: lsof + kill
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Méthode 2: netstat + kill (pour WSL)
    if command -v netstat >/dev/null 2>&1; then
        netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | xargs kill -9 2>/dev/null || true
    fi
    
    # Méthode 3: fuser (si disponible)
    if command -v fuser >/dev/null 2>&1; then
        fuser -k $port/tcp 2>/dev/null || true
    fi
}

# Tuer tous les processus Node.js
echo "🔪 Nettoyage des processus Node.js..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "node.*nest" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
pkill -f "nest.*start" 2>/dev/null || true

# Libérer les ports spécifiques
kill_port 3000
kill_port 3001
kill_port 5432

# Sur WSL, utiliser les commandes Windows
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "🪟 Détection WSL - Nettoyage Windows..."
    
    # Tuer les processus Node.js via Windows
    taskkill //F //IM node.exe 2>/dev/null || true
    taskkill //F //IM npm.exe 2>/dev/null || true
    taskkill //F //IM next.exe 2>/dev/null || true
    
    # Utiliser netstat Windows pour trouver et tuer les processus sur les ports
    for port in 3000 3001 5432; do
        echo "🔍 Recherche des processus sur le port $port..."
        # Trouver le PID du processus sur le port
        pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | head -1)
        if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
            echo "🔪 Tuer le processus $pid sur le port $port..."
            taskkill //F //PID $pid 2>/dev/null || true
        fi
    done
fi

# Attendre un peu pour que les processus se terminent
sleep 2

# Vérifier que les ports sont libres
echo "✅ Vérification des ports..."
for port in 3000 3001 5432; do
    if lsof -i:$port >/dev/null 2>&1; then
        echo "⚠️  Le port $port est encore occupé"
    else
        echo "✅ Le port $port est libre"
    fi
done

echo "🎉 Nettoyage terminé!"
echo ""
echo "Vous pouvez maintenant relancer:"
echo "  make dev"
echo "  ou"
echo "  ./dev.sh"
