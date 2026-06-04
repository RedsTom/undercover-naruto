export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: 'Undercover Naruto',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Jeu Undercover en ligne sur le thème Naruto' },
      ],
    },
  },
});
