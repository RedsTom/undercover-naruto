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
- Modes : Classic / Double Infiltration + toggle Mr. White
- Tailwind v4 : opacités en multiples de 5 uniquement (`/5`, `/10`, `/15`…)
- Pas de classes CSS custom — tout via utility classes Tailwind inline
- Composants plats dans `components/` (pas de sous-dossiers, évite les auto-imports préfixés)
- Formulaires : `<form @submit.prevent>` + `type="submit"` pour la touche Entrée

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

### Format des entrées JSON (7 champs uniquement)
```json
{
  "id": "naruto-uzumaki",
  "name": "Naruto Uzumaki",
  "category": "character",
  "era": ["naruto", "shippuden"],
  "tags": ["protagoniste", "konoha", "hokage"],
  "summary": "Description courte",
  "details": ["Point 1", "Point 2"]
}
```

Pour ajouter un anime : créer `data/<slug>/manifest.json` + des sous-dossiers de catégories avec des fichiers JSON. Le DataService charge dynamiquement tous les dossiers.

## Flux du Jeu

### Phases
`waiting` → `discussion` → `voting` → `reveal` → (`continue` | `backToLobby`)

### Logique de vote
- **Majorité stricte** requise (>50% des votes totaux, neutres inclus) pour éliminer
- Égalité ou absence de majorité → personne n'est éliminé, on continue
- Vote neutre comptabilisé dans le total

### Conditions de victoire
- Tous les undercover/mrWhite éliminés → civils gagnent
- 2 joueurs ou moins avec undercover vivant → undercover gagnent

### Entre les tours
- L'hôte peut **Continuer** (passe directement au tour suivant) ou **Retour au lobby** (change les options)
- Le lobby entre les tours affiche les scores, les joueurs éliminés restent éliminés
- Seuls les joueurs vivants reçoivent de nouveaux mots

## Architecture

```
undercover-naruto/
├── server/
│   ├── api/              # Endpoints REST (+ SSE stream)
│   ├── models/            # Room, Player
│   └── services/          # GameService, VoteService, WordService, DataService
├── components/            # Composants Vue plats (pas de sous-dossiers)
│   ├── GameButton.vue     # Bouton 3D style Duolingo
│   ├── GameCard.vue        # Carte avec glow
│   ├── GameInput.vue
│   ├── GameSelect.vue      # Headless UI Listbox
│   ├── GameSwitch.vue      # Headless UI Switch
│   ├── GameTimer.vue       # Timer SVG cercle
│   ├── GameSettings.vue    # Config partie
│   ├── InviteLink.vue
│   ├── PlayerList.vue
│   ├── VotePanel.vue       # Grille de vote (neutre inclus)
│   └── WordDisplay.vue     # Révélation mot + infos anime
├── composables/
│   ├── useRoom.ts
│   ├── useGameAPI.ts
│   └── useSSE.ts
├── pages/
│   ├── index.vue           # Accueil + sélection anime
│   ├── room/[code].vue     # Lobby + scores entre tours
│   └── game/[code].vue     # Plateau de jeu
├── types/
│   ├── game.ts             # GameConfig (avec anime), GameState, Vote, etc.
│   ├── room.ts             # RoomState, PlayerPublic
│   └── anime.ts            # AnimeManifest, AnimeEntry
├── data/
│   └── <slug>/             # Un dossier par anime
│       ├── manifest.json
│       └── <category>/*.json
├── utils/
│   ├── animeData.ts        # Chargement client des entrées par anime
│   └── wordInfo.ts         # Lookup mots + labels catégories
└── server/utils/game.ts    # Fonctions métier rooms/salles
```

## Types Clés

### GameConfig
```typescript
interface GameConfig {
  mode: GameMode;           // 'classic' | 'doubleInfiltration'
  discussionTime: number;   // secondes
  voteTime: number;         // secondes
  maxPlayers: number;
  minPlayers: number;
  eras: string[];            // filtres d'époques
  anime: string;             // slug de l'anime (ex: 'naruto')
  hideRole: boolean;
  mrWhite: boolean;
}
```

### AnimeEntry
```typescript
interface AnimeEntry {
  id: string;
  name: string;
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
| `POST /api/rooms/next` | Retour au lobby |
| `POST /api/rooms/continue` | Continuer le tour suivant |
| `POST /api/rooms/reset` | Reset complet |
| `POST /api/rooms/kick` | Expulser un joueur |
| `GET /api/anime` | Liste des anime disponibles |
| `GET /api/anime/:slug` | Manifest d'un anime |

## Points Critiques

- `nuxt.config.ts` : `@tailwindcss/vite` plugin, modules: `@pinia/nuxt` seulement
- `@import "tailwindcss"` doit être première ligne dans `main.css`
- Tailwind v4 : opacités en `/5`, `/10`, `/15` uniquement
- Composants DOIVENT être plats dans `components/`
- `AnimeEntry` : 7 champs uniquement (id, name, category, era, tags, summary, details)
- `VotePanel.vue` : grille incluant le bouton Neutre, exclude le joueur courant
- `GameButton.vue` : passe `$attrs` (incluant `type="submit"`)
- SSE : endpoint `/api/rooms/[id]/stream`, broadcast `{ event, data }`
- DataService côte serveur : scan dynamique des dossiers anime
- animeData côte client : `import.meta.glob` pour charger les JSON
- Tag matching : overlap ≥3 = paire valide, fallback à 2 puis 1