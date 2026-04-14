export default defineNuxtConfig({
  srcDir: 'src/',
  devServer: {
    port: 5173,
    host: '0.0.0.0',
  },
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
  ],

  routeRules: {
    '/': { ssr: true },
    '/login': { prerender: true },
    '/register': { prerender: true },
    '/events': { prerender: true },
    '/events/**': { prerender: true },
    '/checkout': { prerender: true },
    '/account': { prerender: true },
    '/admin': { prerender: true },
  },

  app: {
    head: {
      title: 'a23poldiabel',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'a23poldiabel - ticketing en temps real amb una experiencia visual moderna' },
      ],
      htmlAttrs: {
        lang: 'ca',
      },
    },
  },

  css: ['~/assets/main.css'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8000',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    },
  },

  compatibilityDate: '2024-01-01',
});
