<template>
  <main class="home-page">
    <section class="hero card page-enter">
      <span class="pill">Experiencia live ticketing</span>
      <h1>a23poldiabel</h1>
      <p>Reserva en temps real, compra en segons, i viu cada esdeveniment amb una interfície pensada per emocionar.</p>
      <div class="hero-buttons">
        <NuxtLink to="/login" class="btn btn-primary">Entrar</NuxtLink>
        <NuxtLink to="/register" class="btn btn-secondary">Crear compte</NuxtLink>
      </div>

      <div class="mini-metrics">
        <div>
          <strong>Live</strong>
          <span>sincronitzat amb sockets</span>
        </div>
        <div>
          <strong>Instant</strong>
          <span>reserva i checkout fluid</span>
        </div>
        <div>
          <strong>Smart</strong>
          <span>events locals + Ticketmaster</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.hero {
  max-width: 960px;
  width: 100%;
  text-align: center;
  padding: 3rem clamp(1rem, 4vw, 3rem);
  background:
    linear-gradient(170deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: auto -40% -55% auto;
  width: 420px;
  height: 420px;
  border-radius: 40% 60% 70% 30% / 40% 30% 70% 60%;
  background: linear-gradient(130deg, rgba(15, 123, 127, 0.12), rgba(255, 107, 74, 0.16));
  z-index: 0;
}

.hero h1 {
  font-size: clamp(2.5rem, 7vw, 5rem);
  margin-bottom: 0.7rem;
  position: relative;
  z-index: 1;
}

.hero p {
  max-width: 680px;
  margin: 0 auto 1.8rem;
  font-size: clamp(1rem, 2.1vw, 1.25rem);
  color: var(--color-text-light);
  position: relative;
  z-index: 1;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.pill {
  display: inline-flex;
  background: rgba(15, 123, 127, 0.12);
  color: #0b6165;
  border: 1px solid rgba(15, 123, 127, 0.3);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
}

.mini-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  position: relative;
  z-index: 1;
}

.mini-metrics div {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(199, 212, 223, 0.9);
  border-radius: 1rem;
  padding: 0.9rem;
  display: grid;
  gap: 0.2rem;
}

.mini-metrics strong {
  font-family: var(--font-heading);
}

.mini-metrics span {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

@media (max-width: 760px) {
  .mini-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
