# 🚀 Guide de Démarrage Rapide - RÉSOLUTION DES PROBLÈMES

## ⚠️ Vous rencontrez des problèmes ? Lisez ceci en premier !

Si votre application affiche des erreurs (404, CSS manquant, "missing required error components"), suivez ces étapes simples :

## 🔧 Solution Rapide (5 minutes)

### Option 1 : Avec Docker (Recommandé)

```bash
# Étape 1 : Nettoyer et reconstruire
make clean-docker

# Étape 2 : Attendre que la construction se termine
# (Cela peut prendre 5-10 minutes)

# Étape 3 : Vérifier que tout fonctionne
# Ouvrir http://localhost:3000 dans votre navigateur
```

### Option 2 : Développement Local

```bash
# Étape 1 : Nettoyer les caches
make clean-cache

# Étape 2 : Réinstaller les dépendances (si nécessaire)
make install

# Étape 3 : Démarrer l'application
make dev

# Étape 4 : Vérifier que tout fonctionne
# Ouvrir http://localhost:3000 dans votre navigateur
```

## ✅ Comment vérifier que ça fonctionne ?

Après avoir suivi les étapes ci-dessus, vérifiez :

1. ✅ **Page d'accueil accessible** : http://localhost:3000 affiche la page d'accueil
2. ✅ **CSS chargé** : La page est stylée correctement (pas de texte brut)
3. ✅ **Navigation fonctionne** : Vous pouvez cliquer sur les liens du menu
4. ✅ **Pas d'erreur** : Aucun message d'erreur dans la console du navigateur

## 🎯 Qu'est-ce qui a été corrigé ?

Les problèmes suivants ont été résolus :

1. ✅ **Structure de dossiers** : Suppression du conflit entre `src/pages/` et `src/app/`
2. ✅ **Composants d'erreur** : Ajout des fichiers `error.tsx`, `loading.tsx`, et `global-error.tsx`
3. ✅ **Configuration** : Optimisation de `tailwind.config.ts` et `layout.tsx`
4. ✅ **Scripts de nettoyage** : Ajout de commandes pour nettoyer facilement

## 📚 Documentation Complète

- **[README.md](./README.md)** : Documentation principale du projet
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** : Guide de dépannage détaillé
- **[MODIFICATIONS.md](./MODIFICATIONS.md)** : Liste complète des modifications

## 🆘 Ça ne fonctionne toujours pas ?

Si après avoir suivi ces étapes le problème persiste :

### 1. Vérifier les logs

**Avec Docker :**
```bash
docker-compose logs -f
```

**En développement :**
Regardez les erreurs dans le terminal où vous avez lancé `make dev`

### 2. Vérifier les ports

Assurez-vous que les ports ne sont pas déjà utilisés :
```bash
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # Database
```

Si un port est utilisé, arrêtez le processus ou changez le port.

### 3. Nettoyage complet

Si vraiment rien ne fonctionne, nettoyage complet :

```bash
# Arrêter tout
make stop
docker-compose down -v

# Supprimer les caches
make clean-all

# Réinstaller
make install

# Redémarrer
make dev
# ou
make clean-docker  # Pour Docker
```

### 4. Vérifier les prérequis

**Pour le développement local :**
```bash
node --version    # Devrait être 18.x ou 20.x
npm --version     # Devrait être 9.x ou 10.x
```

**Pour Docker :**
```bash
docker --version          # Devrait être 20.x ou plus
docker-compose --version  # Devrait être 2.x ou plus
```

### 5. Vérifier les variables d'environnement

```bash
cat .env
```

Assurez-vous que le fichier `.env` existe et contient :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## 💡 Conseils Pro

1. **Après chaque `git pull`** : Lancez `make clean-cache` pour éviter les problèmes de cache
2. **Si vous modifiez `package.json`** : Relancez `make install`
3. **Si vous modifiez des fichiers de configuration** : Relancez `make clean-cache`
4. **Pour un nouveau démarrage** : Utilisez `./first-start.sh` qui vous guide étape par étape

## 📞 Besoin d'aide ?

1. Consultez [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour plus de solutions
2. Vérifiez la section "Dépannage" du [README.md](./README.md)
3. Vérifiez les logs : `docker-compose logs -f` ou regardez le terminal

---

**🎉 Bonne chance !** Votre application devrait maintenant fonctionner correctement.

