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

- Docker et Docker Compose installés
- Variables d'environnement Supabase configurées

### Installation

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
   ```bash
   ./start.sh
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

```bash
# Démarrer tous les services
./start.sh

# Arrêter tous les services
./stop.sh

# Voir les logs
docker-compose logs -f

# Reconstruire les images
docker-compose build --no-cache

# Accéder au shell du frontend
docker-compose exec frontend sh

# Accéder au shell du backend
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

### Problèmes courants

1. **Ports déjà utilisés**
   ```bash
   # Vérifier les ports utilisés
   lsof -i :3000
   lsof -i :3001
   ```

2. **Images Docker corrompues**
   ```bash
   # Nettoyer et reconstruire
   docker-compose down
   docker system prune -a
   ./start.sh
   ```

3. **Variables d'environnement manquantes**
   ```bash
   # Vérifier le fichier .env
   cat .env
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
