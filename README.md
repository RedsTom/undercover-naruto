# Undercover Naruto

Jeu de société Undercover multijoueur en ligne sur le thème Naruto, avec support multi-anime.

## Stack

- **Nuxt 3** (Vue 3 + TypeScript)
- **UI** : Headless UI + Tailwind CSS v4
- **État** : Composables Vue (`useState`) — pas de Pinia
- **Temps réel** : SSE (Server-Sent Events) — pas de Socket.io
- **Base de données** : Aucune (état en mémoire uniquement)
- **Paquet** : Bun

## Prérequis

- [Bun](https://bun.sh) >= 1.0

## Installation

```bash
bun install
```

## Développement

```bash
bun run dev
```

Ouvre `http://localhost:3000`.

## Production

```bash
bun run build
bun run preview
```

## Structure

```
undercover-naruto/
├── server/              # Backend (Nitro)
│   ├── api/            # Endpoints REST + SSE
│   ├── models/         # Room, Player
│   └── services/       # GameService, VoteService, WordService, DataService
├── components/         # Composants Vue (plats, pas de sous-dossiers)
├── composables/        # Hooks réutilisables (useRoomAPI, useGameAPI, useSSE)
├── pages/             # Routes Nuxt (file-based)
├── types/             # Types TypeScript (game, room, anime)
├── data/              # Données par anime
│   └── <slug>/        # Un dossier par anime
│       ├── manifest.json
│       └── <category>/*.json
├── utils/             # Fonctions utilitaires (animeData, wordInfo)
└── public/            # Fichiers statiques (favicon, icon, robots.txt)
```

## Ajouter un anime

1. Créer `data/<slug>/manifest.json` (nom, couleur, époques, catégories)
2. Pour chaque catégorie, créer `data/<slug>/<category>/*.json` (7 champs : `id`, `name`, `category`, `era`, `tags`, `summary`, `details`)
3. Aucune modification de code nécessaire — le chargement est dynamique

## Règles du jeu

### Joueurs
- 3 à 8 joueurs par partie

### Modes
- **Classique** — 1 Undercover se cache parmi les civils
- **Mr. White** — 1 Mr. White sans mot cherche à se fondre
- **Classique + Mr. White** — 1 Undercover + 1 Mr. White sans mot
- **Double Infiltration** — 2 Undercover (6+ joueurs) qui ne se connaissent pas
- **Double Infiltration + Mr. White** — 2 Undercover + 1 Mr. White (6+ joueurs)

### Difficulté
Les paires de mots sont classées par similarité (nombre de tags en commun) :
- **Facile** — mots très similaires
- **Moyen** — mots modérément similaires
- **Difficile** — mots peu similaires
- **Mixte** — toutes difficultés mélangées

### Déroulement
1. **Discussion** — les joueurs discutent à tour de rôle pour trouver l'intrus
2. **Vote** — chacun vote pour le joueur suspect (ou neutre)
3. **Révélation** — le joueur éliminé révèle son rôle et son mot
4. **Tour suivant** ou **Retour au salon** — l'hôte décide

### Conditions de victoire
- L'Undercover/Mr. White est éliminé → les civils gagnent
- Il reste ≤ 2 joueurs dont l'Undercover → l'Undercover gagne
- Majorité stricte requise (>50% des votes) pour éliminer
- Pas de majorité → personne n'est éliminé

### Options
- **Masquer les rôles** — les rôles ne sont pas affichés aux joueurs
- **Filtres** — choisir les époques et catégories pour les paires de mots

## API

### Endpoints REST
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/rooms` | Créer une salle |
| POST | `/api/rooms/join` | Rejoindre une salle |
| GET | `/api/rooms/[id]` | Infos d'une salle |
| GET | `/api/rooms/code/[code]` | Trouver une salle par code |
| POST | `/api/rooms/start` | Lancer la partie |
| POST | `/api/rooms/turn/next` | Tour de parole suivant |
| POST | `/api/rooms/start-vote` | Démarrer le vote |
| POST | `/api/rooms/vote` | Voter pour un joueur |
| POST | `/api/rooms/continue` | Continuer au round suivant |
| POST | `/api/rooms/next` | Retour au salon |
| POST | `/api/rooms/reset` | Réinitialiser la partie |
| POST | `/api/rooms/kick` | Expulser un joueur |
| GET | `/api/rooms/[id]/me` | Mon mot et mon rôle |
| GET | `/api/anime` | Liste des animes disponibles |
| GET | `/api/anime/[slug]` | Manifest d'un anime |
| POST | `/api/word-pairs` | Générer des paires de mots |

### SSE (temps réel)
| Route | Événement |
|-------|-----------|
| GET | `/api/rooms/[id]/stream` | `game:started`, `phase:changed`, `turn:changed`, `room:updated`, `player:kicked`, `game:continued`, `game:reset` |
