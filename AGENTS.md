# AGENTS.md - Conventions pour les IA

> Pour l'état actuel du projet, la stack, le flux du jeu et les APIs, voir [PROJECT.md](./PROJECT.md).

## Vue d'ensemble

Ce document définit les conventions de code et les bonnes pratiques pour le projet Undercover. Suivez ces directives lors de toute modification du code.

## Stack Technique

- **Framework** : Nuxt.js 3 (Vue 3 + TypeScript)
- **UI** : Headless UI + Tailwind CSS v4 (`@tailwindcss/vite`) — pas de Nuxt UI
- **État** : Composables Vue (`useState`) — pas de Pinia
- **Temps réel** : SSE (Server-Sent Events) — pas de Socket.io
- **Langage** : TypeScript strict
- **Paquet** : Bun

## Structure du Projet

```
undercover-naruto/
├── server/              # Backend Nuxt (Node.js)
│   ├── api/            # Endpoints REST + SSE
│   ├── models/         # Room, Player
│   ├── services/       # GameService, VoteService, WordService, DataService
│   └── utils/          # rooms.ts, sse.ts, game.ts (séparés)
├── components/         # Composants Vue PLATS (pas de sous-dossiers)
├── composables/        # Hooks Vue réutilisables (useRoomAPI, useGameAPI, useSSE)
├── pages/             # Routes Nuxt (file-based routing)
├── types/             # Types TypeScript (game, room, anime)
├── data/              # Données statiques par anime
│   └── <slug>/        # Un dossier par anime (naruto, ...)
│       ├── manifest.json
│       └── <category>/*.json    # 8 champs (inclut image)
├── public/images/     # Images statiques servies à la racine
│   └── <slug>/        # Un dossier par anime (naruto, ...)
│       └── <category>/*.png
├── scripts/            # Scripts utilitaires (download-images.ts)
└── utils/             # Fonctions utilitaires pures (animeData, wordInfo)
```

## Conventions Critiques

### Tailwind v4
- **Pas de CSS custom** dans `assets/css/main.css` sauf `@import "tailwindcss"`, `@theme` et `@keyframes`
- Opacités : multiples de 5 uniquement (`/5`, `/10`, `/15`…) — `/6`, `/8`, `/12` sont **invalides**
- Pas de classes custom — tout via utility classes inline dans les templates

### Composants
- **Tous plats** dans `components/` — pas de sous-dossiers (sinon Nuxt auto-importe avec préfixe)
- `<script setup lang="ts">` obligatoire
- Props typées avec `defineProps<T>()`, emits avec `defineEmits<T>()`
- Maximum 200 lignes par composant

### Formulaires
- `<form @submit.prevent>` + `type="submit"` sur les boutons pour la touche Entrée
- `GameButton` passe `$attrs` au `<button>` natif (incluant `type="submit"`)

### Types
- `types/anime.ts` : `AnimeEntry` (8 champs : id, name, image?, category, era, tags, summary, details) + `AnimeManifest`
- `types/game.ts` : `GameConfig` (contient `anime: string`, `difficulty`, `categories`), `GameState`, `Vote`, `GameRound` (avec `eliminatedRole`, `eliminatedWord`)
- `types/room.ts` : `RoomState` (contient `anime?: string`)
- `GameMode` inclut `'mrWhiteOnly'` (5 modes au total)

### Données Anime
- Chaque anime dans `data/<slug>/manifest.json` avec nom, couleur, époques, catégories
- Fichiers JSON : 8 champs (`id`, `name`, `image`, `category`, `era`, `tags`, `summary`, `details`)
- `image` : chemin relatif vers `/images/<slug>/<category>/<id>.png` (stocké dans `public/images/`)
- Pour ajouter un anime : créer le dossier + manifest + fichiers catégorie + images dans `public/images/<slug>/`
- DataService (serveur) : scan dynamique des dossiers, cache en mémoire
- animeData (client) : `import.meta.glob` pour charger les JSON
- Images téléchargées via `scripts/download-images.ts` (wiki → `public/images/`), slugify du nom pour le nom de fichier

## Principes SOLID

### Single Responsibility
- Un service = une fonctionnalité (`GameService` = flux du jeu, `VoteService` = votes, `WordService` = mots, `DataService` = données)

### Open/Closed
- Ajout d'anime = nouveau dossier sans modifier le code
- Interfaces pour l'extension

## Conventions de Nommage

### Fichiers
- **Composants** : PascalCase (`PlayerCard.vue`) — plats dans `components/`
- **Composables** : camelCase avec préfixe `use` (`useRoomAPI.ts`)
- **Services** : PascalCase avec suffixe `Service` (`GameService.ts`)
- **Types** : PascalCase (`game.ts`, `anime.ts`)
- **Utils** : camelCase (`animeData.ts`, `wordInfo.ts`)

### Variables et Fonctions
- **camelCase** pour variables et fonctions
- Nommage explicite, éviter les abréviations (sauf `id`, `url`, `api`)
- Constantes globales : **UPPER_SNAKE_CASE**

## Architecture Serveur

### Services (méthodes statiques)
```typescript
// server/services/DataService.ts
static loadAllEntries(anime: string): AnimeEntry[]
static getRandomWordPair(anime: string, eras: string[], ...): WordPairCandidate | null
```

### Utilitaires serveur
- `server/utils/rooms.ts` : Room Map + CRUD (`getRoom`, `getRoomByCode`, `createRoom`, `joinRoom`, `kickPlayer`, `deleteRoom`, cleanup interval)
- `server/utils/sse.ts` : SSE streams management (`addSSEStream`, `removeSSEStream`, `broadcastToRoom`)
- `server/utils/game.ts` : Pure game orchestration (`startGame`, `castVote`, `nextTurn`, `startVoting`, `nextRound`, `continueRound`, `resetGame`) — pas de room lookup, pas de broadcast

### API Endpoints
- Les routes sont **fines** : room lookup via `getRoom()`, passage de `RoomModel` aux fonctions game, broadcast géré dans la route
- Validation côté serveur de toutes les entrées
- SSE pour le temps réel (`/api/rooms/[id]/stream`) avec ping 5s + `try/catch` + `NITRO_BUN_IDLE_TIMEOUT=60`

## Architecture Client

### Composables
```typescript
// composables/useGameAPI.ts
export const useGameAPI = () => {
  // Actions de jeu : startGame, vote, nextTurn, continueRound, backToLobby, returnToLobby
}

// composables/useRoomAPI.ts
export const useRoomAPI = () => {
  // Gestion de salle : createRoom(anime), joinRoom, kickPlayer, fetchRoom
}
```

### Pages
- Logique minimale dans les pages
- Déléguez aux composables et composants
- Redirections : `waiting` → lobby

## Gestion des Erreurs

- Serveur : `throw createError({ statusCode, message })`
- Client : `try/catch` + messages d'erreur dans le template

## Commentaires

- **Pas de commentaires** sauf si absolument nécessaire
- Le code doit être auto-documenté par le nommage
- Commentez le "pourquoi" pas le "quoi"

## Checklist avant Commit

- [ ] Code compile sans erreurs (`npx nuxi build`)
- [ ] Pas de `console.log` de debug
- [ ] Composants < 200 lignes
- [ ] Pas de classes CSS custom
- [ ] Types à jour si structure changée
- [ ] Pas d'opacités Tailwind invalides (`/6`, `/8`, `/12`)

## Ressources

- [Nuxt 3 Docs](https://nuxt.com/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Headless UI Docs](https://headlessui.com)
- [Vue 3 Docs](https://vuejs.org)
- [TypeScript Docs](https://www.typescriptlang.org/docs)