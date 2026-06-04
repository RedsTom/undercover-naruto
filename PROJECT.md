# Undercover Naruto - Spécification du Projet

## Vue d'ensemble

Jeu web multijoueur en temps réel basé sur le jeu de société Undercover, thématique Naruto. Les joueurs reçoivent des mots similaires mais pas identiques et doivent identifier l'intrus par la discussion et le vote.

## Caractéristiques Principales

- **4-8 joueurs** par partie
- **3 modes de jeu** : Classique, Mr. White, Double Infiltration
- **Communication temps réel** via Socket.io
- **Thématique Naruto** : techniques, villages, personnages
- **Pas de stockage utilisateur** : sessions éphémères en mémoire
- **Score par salon** : conservé pendant la durée de la partie

## Modes de Jeu

### 1. Mode Classique
- **Configuration** : 1 intrus (ou 2 pour 6-8 joueurs)
- **Distribution** : Civils reçoivent le mot A, intrus reçoivent le mot B (similaire mais différent)
- **Objectif civils** : Identifier et éliminer l'intrus
- **Objectif intrus** : Rester en jeu ou faire éliminer un civil

### 2. Mode Mr. White
- **Configuration** : 1 Mr. White
- **Distribution** : Civils reçoivent le mot A, Mr. White ne reçoit aucun mot
- **Objectif civils** : Identifier Mr. White
- **Objectif Mr. White** : Bluffer et deviner le mot des civils s'il n'est pas éliminé

### 3. Mode Double Infiltration
- **Configuration** : 2 intrus (requis pour 6-8 joueurs)
- **Distribution** : Civils reçoivent le mot A, intrus reçoivent le mot B
- **Objectif civils** : Éliminer les 2 intrus
- **Objectif intrus** : Collaborer pour survivre

## Architecture Technique

### Stack Technologique
```
Frontend :
- Nuxt.js 3 (Vue 3 + TypeScript)
- Nuxt UI (composants UI basés sur Tailwind CSS)
- Pinia (gestion d'état)
- Socket.io-client

Backend :
- Nuxt Server (Node.js)
- Socket.io (communication temps réel)
- En mémoire (pas de base de données)
```

### Structure des Dossiers
```
undercover-naruto/
├── server/              # Backend Nuxt
│   ├── api/            # API REST (création salle)
│   ├── socket/         # Handlers Socket.io
│   ├── models/         # Modèles de données
│   └── services/       # Logique métier
├── components/         # Composants Vue
│   ├── game/          # Composants de jeu
│   ├── lobby/         # Composants de salon
│   └── ui/            # Composants UI personnalisés
├── composables/        # Hooks Vue réutilisables
├── pages/             # Routes Nuxt
├── stores/            # Stores Pinia
├── types/             # Types TypeScript
├── data/              # Données statiques (Naruto)
└── utils/             # Fonctions utilitaires
```

## Flux du Jeu

### 1. Création de Salle
```
POST /api/rooms
→ Retourne { roomId, hostId }
```

### 2. Rejointe de Salle
```
Socket.io: 'room:join' { roomId, playerName }
→ Broadcast aux joueurs existants
→ Envoie état de la salle au nouveau joueur
```

### 3. Configuration
- Hôte choisit le mode de jeu
- Hôte choisit le nombre d'intrus (si applicable)
- Hôte lance la partie

### 4. Distribution des Mots
```
Service: WordService.assignWords(room)
- Sélectionne une paire de mots aléatoire
- Attribue le mot A aux civils
- Attribue le mot B aux intrus (ou rien pour Mr. White)
- Émet 'game:wordAssigned' à chaque joueur (mot personnel)
```

### 5. Phase de Discussion
- Tour par tour dans l'ordre des joueurs
- Chronomètre de 60 secondes par tour (configurable)
- Chaque joueur décrit son mot en 1 phrase
- Chat textuel autorisé pendant la discussion

### 6. Phase de Vote
- Tous les joueurs votent simultanément
- Chaque joueur vote pour qui il pense être l'intrus
- Timer de 30 secondes pour voter
- Le joueur avec le plus de votes est éliminé
- En cas d'égalité : nouveau vote

### 7. Résolution
```
Service: GameService.checkWinCondition(room)
- Si tous les intrus éliminés → Victoire des civils
- Si intrus = civils (ou intrus = 1 et civils = 1) → Victoire des intrus
- Sinon → Nouvelle manche
```

### 8. Fin de Partie
- Affichage du mot des civils et des intrus
- Révélation des identités
- Score final (manches gagnées par chaque équipe)
- Option de rejouer

## Données Naruto

### Catégories de Mots
1. **Techniques** (jutsu)
2. **Villages** (sakura no sato, etc.)
3. **Personnages** (shinobi)

### Structure des Données
```typescript
interface WordPair {
  id: string;
  category: 'technique' | 'village' | 'character';
  wordA: string;
  wordB: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface WordInfo {
  name: string;
  description: string;
  image?: string;
  category: string;
}
```

## Interface Utilisateur

### Page d'Accueil
- Bouton "Créer une partie"
- Champ "Rejoindre avec un code"
- Règles du jeu (modal)
- Sélection de pseudo

### Salon d'Attente
- Liste des joueurs connectés
- Configuration du jeu (mode, nombre d'intrus)
- Lien d'invitation partageable
- Bouton "Lancer la partie" (hôte uniquement)

### Interface de Jeu
- **Phase de discussion** :
  - Affichage du mot personnel (cliquable pour voir)
  - Liste des joueurs avec indicateur de tour
  - Chronomètre
  - Chat textuel
- **Phase de vote** :
  - Liste des joueurs restants
  - Boutons de vote
  - Chronomètre
- **Phase de résultat** :
  - Joueur éliminé
  - Révélation de son identité
  - Condition de victoire vérifiée

### Écran de Fin
- Équipe gagnante
- Révélation des mots
- Score final
- Bouton "Rejouer" / "Quitter"

## Principes de Conception

### SOLID
- **Single Responsibility** : Chaque service a une responsabilité unique
- **Open/Closed** : Extension via héritage/interfaces, pas de modification
- **Liskov Substitution** : Les types sont interchangeables
- **Interface Segregation** : Interfaces spécifiques plutôt que générales
- **Dependency Inversion** : Dépendances vers abstractions, pas implémentations

### DRY
- Composants réutilisables
- Composables pour logique partagée
- Types centralisés
- Utilitaires communs

### Clean Code
- Nommage explicite
- Fonctions courtes (< 20 lignes)
- Commentaires uniquement si nécessaire
- Tests unitaires pour la logique critique

## Sécurité

### Protection des Salles
- Codes de salle aléatoires (6 caractères alphanumériques)
- Limite de joueurs par salle (4-8)
- Nettoyage automatique des salles inactives (timeout 10 min)

### Anti-Triche
- Mots envoyés individuellement via Socket.io (pas visibles par les autres)
- Validation côté serveur de toutes les actions
- Impossible de changer de pseudo en cours de partie

## Performance

### Optimisations
- Compression des messages Socket.io
- Debounce sur les événements de chat
- Lazy loading des composants
- Cache des données Naruto (statiques)

### Scalabilité
- Architecture stateless (salles en mémoire)
- Possibilité d'ajouter Redis pour multi-instance (futur)
- Limite de 1000 salles simultanées par instance

## Déploiement

### Requirements
- Node.js 18+
- NPM ou Yarn

### Commandes
```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Production
npm run preview
```

### Variables d'Environnement
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
```

## Roadmap

### Phase 1 - MVP
- [x] Spécification complète
- [ ] Initialisation projet Nuxt
- [ ] Structure de base (dossiers, types)
- [ ] Création de salle (API + Socket.io)
- [ ] Rejointe de salle
- [ ] Lobby avec liste des joueurs

### Phase 2 - Cœur du Jeu
- [ ] Distribution des mots
- [ ] Phase de discussion (timer, tour par tour)
- [ ] Phase de vote
- [ ] Logique de victoire
- [ ] Mode Classique fonctionnel

### Phase 3 - Modes Avancés
- [ ] Mode Mr. White
- [ ] Mode Double Infiltration
- [ ] Score par salon
- [ ] Historique des manches

### Phase 4 - Polish
- [ ] Animations et transitions
- [ ] Thème visuel Naruto
- [ ] Responsive mobile
- [ ] Tests et bugfix

### Phase 5 - Déploiement
- [ ] Configuration production
- [ ] Déploiement sur serveur
- [ ] Documentation utilisateur
