# Resona Sound Studio Hub

Un studio de production audio professionnel construit avec Next.js, React et Tailwind CSS.

## 🚀 Technologies

- **Framework**: Next.js 14 avec App Router
- **UI**: React avec Radix UI et shadcn/ui
- **Styling**: Tailwind CSS
- **Base de données**: Supabase
- **État**: TanStack Query
- **Formulaires**: React Hook Form avec Zod
- **Thèmes**: next-themes

## 📁 Structure du projet

```
src/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout racine
│   ├── page.tsx           # Page d'accueil
│   ├── projects/          # Pages des projets
│   ├── calendar/          # Pages du calendrier
│   ├── studio/            # Pages du studio
│   ├── clients/           # Pages des clients
│   └── billing/           # Pages de facturation
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants de mise en page
│   └── dashboard/        # Composants du tableau de bord
├── pages/                # Pages existantes (réutilisées)
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et configurations
└── integrations/         # Intégrations externes
```

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd resona-sound-studio-hub
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env.local
   ```
   Remplir les variables nécessaires dans `.env.local`

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

5. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 📝 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run start` - Lance l'application en mode production
- `npm run lint` - Lance ESLint

## 🎨 Fonctionnalités

- **Dashboard** - Vue d'ensemble des projets et activités
- **Gestion de projets** - Création et suivi des projets audio
- **Calendrier** - Planification des séances et rendez-vous
- **Studio** - Interface de contrôle audio
- **Gestion des clients** - Base de données clients
- **Facturation** - Gestion des factures et paiements
- **Interface responsive** - Optimisé pour tous les appareils
- **Thème sombre/clair** - Support des thèmes

## 🔧 Configuration

### Tailwind CSS
Le projet utilise Tailwind CSS avec une configuration personnalisée pour les couleurs et animations.

### Supabase
Configuration de la base de données dans `src/integrations/supabase/`.

### Composants UI
Utilisation de shadcn/ui avec des composants personnalisés dans `src/components/ui/`.

## 📦 Déploiement

Le projet est prêt pour le déploiement sur Vercel, Netlify ou tout autre plateforme supportant Next.js.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
