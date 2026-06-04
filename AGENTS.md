# AGENTS.md - Conventions pour les IA

## Vue d'ensemble

Ce document définit les conventions de code et les bonnes pratiques pour le projet Undercover Naruto. Suivez ces directives lors de toute modification du code.

## Stack Technique

- **Framework** : Nuxt.js 3 (Vue 3 + TypeScript)
- **UI** : Nuxt UI (basé sur Tailwind CSS)
- **État** : Pinia
- **Temps réel** : Socket.io
- **Langage** : TypeScript strict

## Structure du Projet

```
undercover-naruto/
├── server/              # Backend Nuxt (Node.js)
│   ├── api/            # Endpoints REST
│   ├── socket/         # Handlers Socket.io
│   ├── models/         # Classes/Interfaces de données
│   └── services/       # Logique métier (SOLID)
├── components/         # Composants Vue (SFC)
│   ├── game/          # Composants liés au jeu
│   └── lobby/         # Composants liés au salon
├── composables/        # Hooks Vue réutilisables
├── pages/             # Routes Nuxt (file-based routing)
├── stores/            # Stores Pinia
├── types/             # Types TypeScript globaux
├── data/              # Données statiques (Naruto)
└── utils/             # Fonctions utilitaires pures
```

## Principes SOLID

### Single Responsibility Principle (SRP)
- Chaque classe/fichier a une seule responsabilité
- Un service = une fonctionnalité
- Exemple : `GameService` gère le flux du jeu, `VoteService` gère les votes

### Open/Closed Principle (OCP)
- Ouvert à l'extension, fermé à la modification
- Utilisez des interfaces pour permettre l'extension
- Évitez le `switch` sur des types - préférez le polymorphisme

### Liskov Substitution Principle (LSP)
- Les sous-types doivent être substituables à leurs types de base
- Respectez les contrats d'interface

### Interface Segregation Principle (ISP)
- Interfaces petites et spécifiques plutôt que grandes et générales
- Préférez plusieurs petites interfaces à une grande

### Dependency Inversion Principle (DIP)
- Dépendez d'abstractions, pas d'implémentations
- Injectez les dépendances via le constructeur ou les paramètres

## Principes DRY (Don't Repeat Yourself)

### Composables
- Logique réutilisable → `composables/`
- Nommage : `use[NomFonctionnalité].ts`
- Exemple : `useSocket.ts`, `useGame.ts`, `useVote.ts`

### Utilitaires
- Fonctions pures → `utils/`
- Pas d'effets de bord
- Testables unitairement

### Types
- Centralisés dans `types/`
- Réutilisez les types existants
- Évitez les duplications de définitions

## Conventions de Nommage

### Fichiers
- **Composants** : PascalCase (`PlayerCard.vue`)
- **Composables** : camelCase avec préfixe `use` (`useSocket.ts`)
- **Services** : PascalCase avec suffixe `Service` (`GameService.ts`)
- **Types** : PascalCase (`Player.ts`, `Game.ts`)
- **Utils** : camelCase (`formatters.ts`, `gameLogic.ts`)

### Variables et Fonctions
- **camelCase** pour variables et fonctions
- Nommage explicite et descriptif
- Évitez les abréviations (sauf conventions établies : `id`, `url`, `api`)

### Constantes
- **UPPER_SNAKE_CASE** pour les constantes globales
- **camelCase** pour les constantes locales

### Types et Interfaces
- **PascalCase**
- Interfaces : préfixez avec `I` uniquement si nécessaire pour éviter les conflits
- Types : suffixez avec `Type` si ambigu

## Style de Code

### TypeScript
- **Strict mode** activé
- Évitez `any` - utilisez `unknown` si nécessaire
- Préférez les `interface` aux `type` pour les objets
- Utilisez les generics quand approprié

### Vue 3 Composition API
- Utilisez `<script setup lang="ts">`
- Déclarez les props avec `defineProps<T>()`
- Déclarez les emits avec `defineEmits<T>()`
- Utilisez `ref()` et `reactive()` avec typage explicite

### Nuxt UI
- Utilisez les composants Nuxt UI en priorité
- Personnalisez via les props et slots
- Évitez le CSS custom sauf si nécessaire

### Composants
- Maximum 200 lignes par composant
- Décomposez si trop complexe
- Props typées avec TypeScript
- Émettez des événements plutôt que de muter directement

## Architecture Serveur

### Services
```typescript
// server/services/GameService.ts
export class GameService {
  // Méthodes statiques pour les opérations sans état
  static startGame(room: Room): void { }
  
  // Ou instance pour les services avec état
  constructor(private dependencies: Dependencies) { }
}
```

### Socket.io Handlers
```typescript
// server/socket/index.ts
export default defineSocketHandler((io, socket) => {
  socket.on('room:join', (data) => {
    // Validation
    // Logique métier via services
    // Émission de réponses
  })
})
```

### Validation
- Validez toutes les entrées côté serveur
- Utilisez des schemas (zod ou validation manuelle)
- Retournez des erreurs claires

## Architecture Client

### Stores Pinia
```typescript
// stores/game.ts
export const useGameStore = defineStore('game', () => {
  // State
  const gameState = ref<GameState | null>(null)
  
  // Getters
  const isGameStarted = computed(() => gameState.value?.status === 'playing')
  
  // Actions
  function startGame() { }
  
  return { gameState, isGameStarted, startGame }
})
```

### Composables
```typescript
// composables/useSocket.ts
export const useSocket = () => {
  const socket = useState<Socket | null>('socket', () => null)
  
  function connect() { }
  function disconnect() { }
  
  return { socket, connect, disconnect }
}
```

### Pages
- Logique minimale dans les pages
- Déléguez aux composables et composants
- Utilisez `<script setup>` avec Composition API

## Gestion des Erreurs

### Côté Serveur
```typescript
try {
  // Logique
} catch (error) {
  console.error('[ServiceName]', error)
  throw createError({
    statusCode: 400,
    message: 'Message clair pour le client'
  })
}
```

### Côté Client
```typescript
try {
  // Action
} catch (error) {
  // Log pour debug
  console.error('[ComponentName]', error)
  // Notification utilisateur
  useToast().add({
    title: 'Erreur',
    description: 'Message utilisateur',
    color: 'red'
  })
}
```

## Commentaires

- **Pas de commentaires** sauf si absolument nécessaire
- Le code doit être auto-documenté par le nommage
- Commentez le "pourquoi" pas le "quoi"
- JSDoc pour les fonctions publiques complexes

## Tests

- Testez la logique métier (services, utils)
- Testez les cas limites
- Nommez les tests de manière descriptive
- Un test = une assertion logique

## Git

### Commits
- Messages concis et descriptifs
- Format : `type(scope): description`
- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branches
- `main` : production
- `develop` : développement
- `feature/*` : nouvelles fonctionnalités
- `fix/*` : corrections de bugs

## Performance

### Client
- Lazy load les composants lourds
- Évitez les re-renders inutiles
- Utilisez `computed` pour les calculs dérivés
- Debounce les événements fréquents

### Serveur
- Nettoyage automatique des salles inactives
- Limitez la taille des messages Socket.io
- Évitez les fuites mémoire (listeners)

## Sécurité

- Ne jamais stocker de données sensibles
- Validez toutes les entrées
- Protégez contre les injections
- Rate limiting sur les endpoints publics

## Accessibilité

- Utilisez les composants Nuxt UI (accessibles par défaut)
- Respectez les contrastes de couleur
- Ajoutez les attributs ARIA si nécessaire
- Navigation au clavier fonctionnelle

## Responsive Design

- Mobile-first
- Testez sur différentes tailles d'écran
- Utilisez les breakpoints Tailwind
- Évitez les largeurs fixes

## Checklist avant Commit

- [ ] Code compile sans erreurs TypeScript
- [ ] Pas de `console.log` de debug
- [ ] Composants < 200 lignes
- [ ] Fonctions < 20 lignes
- [ ] Nommage explicite
- [ ] Pas de duplication de code
- [ ] Tests passent (si existants)
- [ ] Responsive (si UI)

## Ressources

- [Nuxt 3 Docs](https://nuxt.com/docs)
- [Nuxt UI Docs](https://ui.nuxt.com)
- [Vue 3 Docs](https://vuejs.org)
- [Pinia Docs](https://pinia.vuejs.org)
- [Socket.io Docs](https://socket.io/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
