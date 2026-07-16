<template>
  <main class="auth-view">
    <section class="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">Eira</h1>
      <slot />
    </section>
  </main>
</template>

<style scoped>
.auth-view {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--canvas);
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: var(--page-padding);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
