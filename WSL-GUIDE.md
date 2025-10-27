# 🪟 Guide WSL - Résolution des problèmes de ports

## Problème rencontré

Sur WSL, les processus Node.js ne se terminent pas correctement, ce qui cause :
- Les ports 3000, 3001 restent occupés
- Le localhost affiche du HTML brut au lieu de l'application
- Les ports se décalent à chaque redémarrage

## Solutions implémentées

### 1. Scripts améliorés

**Nouveau script `clean-ports.sh`** :
```bash
./clean-ports.sh
# ou
make clean-ports
```

**Script `stop.sh` amélioré** :
- Détecte automatiquement WSL
- Tue tous les processus Node.js
- Libère les ports 3000, 3001, 5432
- Utilise `taskkill` pour Windows si nécessaire

**Script `dev.sh` amélioré** :
- Nettoie les processus avant de démarrer
- Gestion améliorée de l'arrêt (Ctrl+C)
- Détection WSL automatique

### 2. Commandes recommandées

**Pour arrêter proprement** :
```bash
make stop
# ou
./stop.sh
```

**Pour nettoyer les ports** :
```bash
make clean-ports
# ou
./clean-ports.sh
```

**Pour redémarrer** :
```bash
make dev
# ou
./dev.sh
```

**En cas de problème persistant** :
```bash
make clean-all
make install
make dev
```

### 3. Commandes manuelles (si nécessaire)

**Vérifier les ports occupés** :
```bash
lsof -i:3000
lsof -i:3001
lsof -i:5432
```

**Tuer manuellement les processus** :
```bash
# Dans WSL
pkill -f "node.*next"
pkill -f "node.*nest"
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Dans Windows (PowerShell)
taskkill //F //IM node.exe
taskkill //F //IM npm.exe
```

**Vérifier les processus Node.js** :
```bash
ps aux | grep node
# ou
tasklist | findstr node
```

### 4. Prévention

**Toujours utiliser** :
- `make stop` au lieu de Ctrl+C
- `make clean-ports` si les ports restent occupés
- `make dev` pour redémarrer

**Éviter** :
- Fermer brutalement le terminal
- Utiliser Ctrl+C plusieurs fois rapidement
- Laisser des processus Node.js en arrière-plan

### 5. Dépannage avancé

**Si le problème persiste** :

1. **Redémarrer WSL** :
   ```bash
   wsl --shutdown
   # Puis relancer WSL
   ```

2. **Vérifier les variables d'environnement** :
   ```bash
   make check-env
   ```

3. **Nettoyage complet** :
   ```bash
   make clean-all
   make install
   make dev
   ```

4. **Vérifier la configuration WSL** :
   - Assurez-vous d'utiliser WSL2
   - Vérifiez que les ports ne sont pas bloqués par Windows Defender

### 6. Commandes de diagnostic

**Vérifier l'état des services** :
```bash
# Vérifier les ports
netstat -tulpn | grep -E ":(3000|3001|5432)"

# Vérifier les processus Node.js
ps aux | grep -E "(node|npm|next|nest)"

# Vérifier l'espace disque
df -h
```

**Logs utiles** :
```bash
# Logs du frontend
cd frontend && npm run dev

# Logs du backend  
cd backend && npm run start:dev
```

## Résumé des commandes

| Action | Commande |
|--------|----------|
| Arrêter | `make stop` |
| Nettoyer les ports | `make clean-ports` |
| Démarrer | `make dev` |
| Nettoyage complet | `make clean-all` |
| Vérifier la config | `make check-env` |

---

**💡 Conseil** : Utilisez toujours `make stop` avant de redémarrer pour éviter les problèmes de ports occupés !
