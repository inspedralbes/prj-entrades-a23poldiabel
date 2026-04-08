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

  app: {
    head: {
      title: 'Plataforma d\'Entrades',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Plataforma de venda d\'entrades en temps real' },
      ],
      htmlAttrs: {
        lang: 'ca',
      },
    },
  },

  css: ['~/assets/main.css'],

  nitro: {
    routeRules: {
      '/api/**': {
        proxy: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/**' 
          : 'http://backend:3000/api/**'
      }
    }
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    },
  },

  compatibilityDate: '2024-01-01',
});
