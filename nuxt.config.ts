import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  nitro: {
    preset: "bun",
  },

  runtimeConfig: {
    public: {
      discordClientId: process.env.DISCORD_CLIENT_ID || "",
    },
  },

  modules: ["@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: "Undercover",
      link: [
        { rel: "icon", type: "image/png", href: "/icon.png" },
      ],
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Jeu Undercover en ligne sur le thème Anime",
        },
        { property: "og:image", content: "/icon.png" },
        { property: "og:image:width", content: "512" },
        { property: "og:image:height", content: "512" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:image", content: "/icon.png" },
      ],
    },
  },
});
