.PHONY: help start stop build logs clean dev-frontend dev-backend dev dev-concurrent install install-tools

help: ## Afficher l'aide
	@echo "Commandes disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Démarrer tous les services avec Docker
	@echo "🚀 Démarrage de Resona Sound Studio Hub..."
	@./start.sh

stop: ## Arrêter tous les services
	@echo "🛑 Arrêt des services..."
	@./stop.sh

build: ## Construire les images Docker
	@echo "🔨 Construction des images..."
	docker-compose build

logs: ## Afficher les logs des services
	@echo "📋 Affichage des logs..."
	docker-compose logs -f

clean: ## Nettoyer les conteneurs et images
	@echo "🧹 Nettoyage des conteneurs et images..."
	docker-compose down -v
	docker system prune -f

dev-frontend: ## Démarrer le frontend en mode développement
	@echo "🖥️  Démarrage du frontend en mode développement..."
	cd frontend && npm run dev

dev-backend: ## Démarrer le backend en mode développement
	@echo "🔧 Démarrage du backend en mode développement..."
	cd backend && npm run start:dev

dev: ## Démarrer frontend et backend en mode développement (concurrent)
	@echo "🚀 Démarrage du frontend et backend en mode développement..."
	@./dev.sh

dev-concurrent: ## Démarrer frontend et backend avec concurrently (si installé)
	@echo "🚀 Démarrage avec concurrently..."
	@if command -v concurrently > /dev/null; then \
		concurrently --names "frontend,backend" --prefix-colors "blue,green" \
		"cd frontend && npm run dev" \
		"cd backend && npm run start:dev"; \
	else \
		echo "❌ concurrently n'est pas installé. Utilisez 'make install-tools' ou 'make dev'"; \
	fi

install: ## Installer les dépendances pour le développement local
	@echo "📦 Installation des dépendances..."
	cd frontend && npm install
	cd backend && npm install

install-tools: ## Installer les outils de développement (concurrently, etc.)
	@echo "🔧 Installation des outils de développement..."
	npm install -g concurrently
	@echo "✅ Outils installés avec succès!"

test: ## Lancer les tests
	@echo "🧪 Lancement des tests..."
	cd frontend && npm test
	cd backend && npm test

lint: ## Lancer le linting
	@echo "🔍 Lancement du linting..."
	cd frontend && npm run lint
	cd backend && npm run lint

format: ## Formater le code
	@echo "✨ Formatage du code..."
	cd frontend && npm run format
	cd backend && npm run format

shell-frontend: ## Accéder au shell du conteneur frontend
	docker-compose exec frontend sh

shell-backend: ## Accéder au shell du conteneur backend
	docker-compose exec backend sh

restart: ## Redémarrer tous les services
	@echo "🔄 Redémarrage des services..."
	@./stop.sh
	@./start.sh

clean-docker: ## Nettoyer et reconstruire Docker
	@echo "🧹 Nettoyage complet Docker..."
	@./clean-rebuild.sh

clean-cache: ## Nettoyer les caches de développement
	@echo "🧹 Nettoyage des caches..."
	@./clean-dev.sh

clean-ports: ## Nettoyer les ports et processus (pour WSL)
	@echo "🧹 Nettoyage des ports et processus..."
	@./clean-ports.sh

clean-all: ## Nettoyer complètement le projet (cache + node_modules + ports)
	@echo "🧹 Nettoyage complet du projet..."
	@./clean-dev.sh
	@./clean-ports.sh
	@echo "🗑️  Suppression des node_modules..."
	@rm -rf frontend/node_modules
	@rm -rf backend/node_modules
	@echo "✅ Nettoyage complet terminé!"
	@echo "💡 N'oubliez pas de réinstaller les dépendances avec: make install"

check-env: ## Vérifier la configuration des variables d'environnement
	@./check-env.sh
