<template>
  <div class="home-page">
    <div class="hero">
      <h1>Benvingut a la Plataforma d'Entrades</h1>
      <p>Compra entrades per als millors esdeveniments en temps real</p>
      <div class="hero-buttons">
        <NuxtLink to="/login" class="btn btn-primary">Iniciar Sessió</NuxtLink>
        <NuxtLink to="/register" class="btn btn-secondary">Registrar-se</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.hero {
  text-align: center;
  color: #fff;
  padding: 2rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}

.btn-secondary:hover {
  background: #fff;
  color: #1a1a2e;
}
</style>
