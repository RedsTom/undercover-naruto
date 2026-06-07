# PROJECT.md - État du Projet

Pour le contexte complet du projet (stack, conventions, architecture, style), voir [AGENTS.md](./AGENTS.md).

## Vue d'ensemble

Jeu web multijoueur Undercover à thème anime. Les joueurs reçoivent des mots similaires mais pas identiques et doivent identifier l'intrus par la discussion et le vote. Architecture Nuxt 3 fullstack (REST + SSE, pas de Socket.io).

## Stack Technique

- **Framework** : Nuxt.js 3 (Vue 3 + TypeScript)
- **UI** : Headless UI + Tailwind v4 (`@tailwindcss/vite`) — pas de Nuxt UI
- **État** : Composables (`useState`) — pas de Pinia
- **Temps réel** : SSE (Server-Sent Events), pas de Socket.io
- **Langage** : TypeScript strict
- **Paquet** : Bun

## Contraintes & Préférences

- Pas de stockage persistant — état éphémère en mémoire uniquement
- Min 3 / max 8 joueurs
- **5 modes** : Classique, Mr. White Only, Classique + Mr. White, Double Infiltration, Double Infiltration + Mr. White
- Difficultés : Facile / Moyen / Difficile / Mixte — filtrent les entrées par tags
- Catégories sélectionnables dans le lobby (filtre les paires de mots)
- Tailwind v4 : opacités en multiples de 5 uniquement (`/5`, `/10`, `/15`…)
- Pas de classes CSS custom — tout via utility classes Tailwind inline
- Composants plats dans `components/` (pas de sous-dossiers, évite les auto-imports préfixés)
- Formulaires : `<form @submit.prevent>` + `type="submit"` pour la touche Entrée
- **hideRole** : option pour masquer le rôle (`myRole: null`) — VotePanel toujours visible

## Système Multi-Anime

Les données sont organisées par anime dans `data/<slug>/`. Chaque dossier anime contient :
- `manifest.json` — nom, slug, couleur, époques, catégories
- Des sous-dossiers de catégories avec des fichiers JSON individuels

### Format manifest.json
```json
{
  "name": "Naruto",
  "slug": "naruto",
  "color": "#f97316",
  "eras": [
    { "id": "naruto", "label": "Naruto Original" },
    { "id": "shippuden", "label": "Shippuden" }
  ],
  "categories": {
    "character": "Personnage",
    "technique": "Technique"
  }
}
```

### Format des entrées JSON (8 champs)
```json
{
  "id": "naruto-uzumaki",
  "name": "Naruto Uzumaki",
  "image": "/images/naruto/character/naruto-uzumaki.png",
  "category": "character",
  "era": ["naruto", "shippuden"],
  "tags": ["protagoniste", "konoha", "hokage"],
  "summary": "Description courte",
  "details": ["Point 1", "Point 2"]
}
```

Le champ `image` est optionnel — chemin relatif vers `public/images/<slug>/<category>/<id>.png`.

Pour ajouter un anime :
1. Créer `data/<slug>/manifest.json`
2. Créer des sous-dossiers de catégories avec des fichiers JSON
3. Ajouter les images dans `public/images/<slug>/<category>/<id>.png`
4. Le DataService charge dynamiquement tous les dossiers

Images téléchargeables en masse via `scripts/download-images.ts` (interroge le wiki via API MediaWiki).

## Flux du Jeu

### Phases
`waiting` → `discussion` (tour par tour) → `voting` → `reveal` → (`continueRound` | `returnToLobby`)

### Logique de vote
- **Majorité simple** (≥50% des joueurs vivants) pour éliminer
- Neutre compté dans le total mais ne change pas le seuil
- Égalité ou absence de majorité → personne n'est éliminé

### Fin de partie
- **Pas de phase `finished`** — le jeu ne se termine jamais automatiquement
- **Score tracking** : civils++ quand un imposteur est éliminé, undercover++ quand ≤2 joueurs vivants
- La phase `reveal` affiche tous les rôles/mots exposés
- L'hôte choisit "Retour au lobby" pour lancer une nouvelle partie

### Bouton "Continuer"
- **Visible uniquement si** : un civil a été éliminé **ET** >2 joueurs vivants
- Garde les **mêmes mots** (pas de réattribution)
- **Réanime tous les joueurs éliminés**
- Dans tous les autres cas : révélation complète (tous les rôles + mots exposés) + "Retour au lobby" seulement

### Nouveaux mots
- **Uniquement** via lobby → l'hôte clique "Lancer" (`returnToLobby` puis `startGame`)
- `continueRound` ne réattribue jamais les mots

### Retour au lobby
- `returnToLobby()` réanime tous les joueurs

## Architecture

```
undercover-naruto/
├── server/
│   ├── api/              # Endpoints REST (+ SSE stream)
│   ├── models/            # Room, Player
│   ├── services/          # GameService, VoteService, WordService, DataService
│   └── utils/             # rooms.ts, sse.ts, game.ts (séparés)
├── components/            # Composants Vue plats (pas de sous-dossiers)
│   ├── GameButton.vue     # Bouton 3D style Duolingo
│   ├── GameCard.vue        # Carte avec glow
│   ├── GameInput.vue
│   ├── GameSelect.vue      # Headless UI Listbox + slot #item
│   ├── GameSwitch.vue      # Headless UI Switch + disabled prop
│   ├── GameTimer.vue       # Timer SVG cercle
│   ├── GameSettings.vue    # Config partie (visible tous, disabled non-host)
│   ├── InviteLink.vue
│   ├── PlayerList.vue
│   ├── VotePanel.vue       # Grille de vote (neutre inclus)
│   └── WordDisplay.vue     # Révélation mot + image + infos anime
├── composables/
│   ├── useRoom.ts
│   ├── useGameAPI.ts
│   └── useSSE.ts
├── pages/
│   ├── index.vue           # Accueil + grille sélection anime
│   ├── room/[code].vue     # Lobby + scores entre tours
│   ├── game/[code].vue     # Plateau de jeu (discussion/vote/reveal)
│   └── test/word-pairs.vue # Testeur d'appariement de paires
├── types/
│   ├── game.ts             # GameConfig (anime, difficulty, categories), GameState, Vote, GameRound
│   ├── room.ts             # RoomState, PlayerPublic
│   └── anime.ts            # AnimeManifest, AnimeEntry (8 champs)
├── data/
│   └── <slug>/             # Un dossier par anime
│       ├── manifest.json
│       └── <category>/*.json    # 8 champs
├── public/images/         # Images servies à la racine
│   └── <slug>/             # Un dossier par anime
│       └── <category>/*.png
├── scripts/
│   └── download-images.ts  # Téléchargement masse depuis wiki
├── utils/
│   ├── animeData.ts        # Chargement client des entrées par anime
│   └── wordInfo.ts         # Lookup mots + labels catégories
└── server/utils/           # rooms.ts, sse.ts, game.ts
```

## Types Clés

### GameConfig
```typescript
interface GameConfig {
  mode: GameMode;           // 'classic' | 'doubleInfiltration' | 'mrWhiteOnly' | 'classicMrWhite' | 'doubleMrWhite'
  discussionTime: number;   // secondes
  voteTime: number;         // secondes
  maxPlayers: number;
  minPlayers: number;
  eras: string[];            // filtres d'époques
  anime: string;             // slug de l'anime (ex: 'naruto')
  hideRole: boolean;
  difficulty: string;        // 'easy' | 'medium' | 'hard' | 'mixed'
  categories: string[];      // filtres de catégories (ex: ['character', 'technique'])
}
```

### AnimeEntry
```typescript
interface AnimeEntry {
  id: string;
  name: string;
  image?: string;            // chemin relatif /images/<slug>/<category>/<id>.png
  category: string;
  era: string[];
  tags: string[];
  summary: string;
  details: string[];
}
```

## APIs

| Endpoint | Méthode | Description |
|---|---|---|
| `POST /api/rooms` | Créer une salle (body: `{playerName, anime}`) |
| `POST /api/rooms/join` | Rejoindre (body: `{roomCode, playerName}`) |
| `GET /api/rooms/:id` | État de la salle |
| `GET /api/rooms/code/:code` | Lookup par code |
| `GET /api/rooms/:id/me` | Infos privées (mot, rôle) |
| `GET /api/rooms/:id/stream` | SSE |
| `POST /api/rooms/start` | Lancer/continuer la partie |
| `POST /api/rooms/vote` | Voter |
| `POST /api/rooms/turn/next` | Tour suivant |
| `POST /api/rooms/start-vote` | Passer au vote |
| `POST /api/rooms/next` | Retour au lobby (`returnToLobby`, réanime tous) |
| `POST /api/rooms/continue` | Continuer le tour (`continueRound`, réanime tous, mêmes mots) |
| `POST /api/rooms/reset` | Reset complet |
| `POST /api/rooms/kick` | Expulser un joueur |
| `POST /api/rooms/return` | Retour au lobby depuis la partie |
| `POST /api/word-pairs` | Tester l'appariement de paires (body: filters) |
| `GET /api/anime` | Liste des anime disponibles |
| `GET /api/anime/:slug` | Manifest d'un anime |

## Points Critiques

- `nuxt.config.ts` : `@tailwindcss/vite` plugin, modules: `@pinia/nuxt` seulement
- `@import "tailwindcss"` doit être première ligne dans `main.css`
- Tailwind v4 : opacités en `/5`, `/10`, `/15` uniquement
- Composants DOIVENT être plats dans `components/`
- `AnimeEntry` : 8 champs (id, name, image?, category, era, tags, summary, details)
- `GameMode` : 5 modes (`'classic'`, `'doubleInfiltration'`, `'mrWhiteOnly'`, `'classicMrWhite'`, `'doubleMrWhite'`)
- `VotePanel.vue` : grille incluant le bouton Neutre, exclude le joueur courant ; **non-gaté par `myRole`**
- `WordDisplay.vue` : affiche l'image du mot quand révélé ; badge de rôle caché si `hideRole`
- `GameButton.vue` : passe `$attrs` (incluant `type="submit"`)
- `GameSelect.vue` : slot `#item` pour rendu personnalisé des options
- `GameSwitch.vue` : prop `disabled` avec état visuel grisé
- `GameSettings.vue` : **visible à tous les joueurs** du lobby ; contrôles `disabled` pour non-host
- SSE : endpoint `/api/rooms/[id]/stream`, broadcast `{ event, data }`, ping 5s, `try/catch` sur push/send
- `NITRO_BUN_IDLE_TIMEOUT=60` requis pour éviter la déconnexion SSE des connexions idle Bun
- DataService côte serveur : scan dynamique des dossiers anime, cache en mémoire
- animeData côte client : `import.meta.glob('~/data/**/*.json')` avec extraction du slug via `indexOf('/data/')`
- Tag matching : overlap ≥3 = paire valide, fallback à 2 puis 1
- `getInfiltratorCount` retourne 0 pour le mode `mrWhiteOnly`
- `WordService.assignWords(aliveOnly=true)` : n'assigne qu'aux joueurs vivants
- `continueRound` et `returnToLobby` réaniment tous les joueurs ; `continueRound` garde les mêmes mots
- **Pas de phase `finished`** : le jeu ne se termine jamais automatiquement ; scores trackés, phase `reveal` avec exposition complète
- **Bouton "Continuer"** : civil éliminé ET >2 vivants uniquement ; sinon révélation complète + "Retour au lobby"
- **Images** : `public/images/<slug>/<category>/<slugified-name>.png` ; champ `image` optionnel dans `AnimeEntry`
- **Routes serveur fines** : room lookup via `getRoom()`, `RoomModel` passé aux fonctions game, broadcast dans la route