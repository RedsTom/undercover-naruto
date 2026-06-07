<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-xl w-full space-y-8 animate-slide-up">
      <div class="text-center">
        <h1 class="text-3xl font-black text-white">Mentions légales</h1>
      </div>

      <GameCard>
        <div class="space-y-6 text-sm text-gray-300 leading-relaxed">
          <div class="space-y-2">
            <h2 class="text-lg font-bold text-white">&#128274; Confidentialité</h2>
            <p>Undercover Anime Edition ne collecte <strong class="text-white">aucune donnée personnelle</strong>.</p>
            <p>Les seules données stockées sont celles nécessaires au déroulement d'une partie : pseudonyme, rôle, mot, et état de la partie. Ces données sont conservées <strong class="text-white">exclusivement en mémoire vive (RAM)</strong> côté serveur et sont définitivement supprimées lorsque la salle est détruite (inactivité ou fermeture).</p>
            <p>Aucun cookie, aucun traceur, aucune base de données persistante n'est utilisé. Aucune donnée n'est transmise à des tiers.</p>
          </div>

          <div class="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          <div class="space-y-2">
            <h2 class="text-lg font-bold text-white">&#128214; Code source</h2>
            <p>Ce projet est entièrement open source sous licence MIT.</p>
            <p>Le code source est disponible à l'adresse :</p>
            <a href="https://github.com/RedsTom/undercover-naruto" target="_blank" class="inline-block mt-1 text-orange-400 hover:text-orange-300 underline underline-offset-2 font-medium">
              github.com/RedsTom/undercover-naruto
            </a>
          </div>

          <div class="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          <div class="space-y-2">
            <h2 class="text-lg font-bold text-white">&#127760; Contact</h2>
            <p>Pour toute question, ouvrez une issue sur le dépôt GitHub ci-dessus.</p>
          </div>
        </div>
      </GameCard>

      <div class="text-center">
        <GameButton variant="ghost" @click="navigateTo('/')">&#8592; Retour à l'accueil</GameButton>
      </div>
    </div>
  </div>
</template>