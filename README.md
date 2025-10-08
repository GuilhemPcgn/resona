# Resona Sound Studio Hub

Une application complète pour la gestion de studio d'enregistrement avec frontend NextJS et backend NestJS, orchestrée avec Docker.

## 🏗️ Architecture

```
resona-sound-studio-hub/
├── frontend/          # Application NextJS
├── backend/           # API NestJS
├── supabase/          # Configuration Supabase
├── docker-compose.yml # Orchestration Docker
├── start.sh          # Script de démarrage
└── stop.sh           # Script d'arrêt
```

## 🚀 Démarrage rapide

### Prérequis

- Docker et Docker Compose installés (pour la production)
- Node.js 18 ou 20 (pour le développement)
- Variables d'environnement Supabase configurées

### Installation rapide

**Premier démarrage ?** Utilisez le script automatique :
```bash
./first-start.sh
```

### Installation manuelle

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd resona-sound-studio-hub
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp env.example .env
   # Éditer .env avec vos clés Supabase
   ```

3. **Démarrer l'application**
   
   **Avec Docker (Production) :**
   ```bash
   make start
   # ou
   ./start.sh
   ```
   
   **En développement :**
   ```bash
   make install    # Installer les dépendances
   make dev        # Démarrer frontend + backend
   ```

### Accès aux services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Supabase**: http://localhost:5432

## 🛠️ Développement

### Frontend (NextJS)

```bash
cd frontend
npm install
npm run dev
```

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

## 📦 Services Docker

### Frontend
- **Port**: 3000
- **Technologie**: NextJS 14
- **Build**: Mode standalone pour Docker

### Backend
- **Port**: 3001
- **Technologie**: NestJS
- **Base de données**: Supabase

### Base de données
- **Port**: 5432
- **Technologie**: PostgreSQL (Supabase)

## 🔧 Commandes utiles

### Avec Make (recommandé)

```bash
# Démarrage
make start              # Démarrer avec Docker
make dev                # Démarrer en développement
make stop               # Arrêter les services

# Installation
make install            # Installer les dépendances
make install-tools      # Installer les outils (concurrently)

# Nettoyage
make clean-cache        # Nettoyer les caches
make clean-docker       # Nettoyer et reconstruire Docker
make clean-all          # Nettoyage complet

# Développement
make dev-frontend       # Frontend uniquement
make dev-backend        # Backend uniquement
make logs               # Voir les logs

# Tests et qualité
make test               # Lancer les tests
make lint               # Lancer le linting
make format             # Formater le code

# Docker
make shell-frontend     # Accéder au shell du frontend
make shell-backend      # Accéder au shell du backend
make restart            # Redémarrer les services
```

### Commandes Docker directes

```bash
# Démarrer tous les services
./start.sh

# Arrêter tous les services
./stop.sh

# Voir les logs
docker-compose logs -f

# Reconstruire les images
docker-compose build --no-cache

# Accéder au shell
docker-compose exec frontend sh
docker-compose exec backend sh
```

## 📁 Structure des dossiers

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── app/           # Pages NextJS
│   ├── components/    # Composants React
│   ├── hooks/         # Hooks personnalisés
│   ├── integrations/  # Intégrations (Supabase)
│   └── lib/           # Utilitaires
├── public/            # Assets statiques
└── Dockerfile         # Configuration Docker
```

### Backend (`/backend`)
```
backend/
├── src/
│   ├── app/           # Modules NestJS
│   └── integrations/  # Intégrations (Supabase)
└── Dockerfile         # Configuration Docker
```

## 🔐 Variables d'environnement

Créez un fichier `.env` à la racine avec :

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🐛 Dépannage

### ⚠️ Problèmes après mise à jour ou installation

Si vous rencontrez des problèmes (404, CSS manquant, erreurs "missing required error components") :

```bash
# Nettoyer et reconstruire avec Docker
make clean-docker

# OU pour le développement local
make clean-cache
make dev
```

**📖 Guide complet :** Consultez [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour plus de détails.

### Problèmes courants

1. **Ports déjà utilisés**
   ```bash
   # Vérifier les ports utilisés
   lsof -i :3000
   lsof -i :3001
   lsof -i :5432
   ```

2. **Images Docker corrompues**
   ```bash
   # Nettoyer et reconstruire
   make clean-docker
   # ou manuellement:
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Variables d'environnement manquantes**
   ```bash
   # Vérifier le fichier .env
   cat .env
   ```

4. **Problèmes de cache (CSS ne charge pas, etc.)**
   ```bash
   # Développement local
   make clean-cache
   
   # Docker
   make clean-docker
   ```

## 📝 API Endpoints

### Backend (NestJS)

- `GET /` - Page d'accueil
- `GET /api/projects` - Liste des projets
- `GET /api/clients` - Liste des clients
- `GET /api/studio` - Données du studio

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
