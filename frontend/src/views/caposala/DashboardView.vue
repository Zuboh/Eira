<script setup lang="ts">
// stub Giorno 5 — dashboard caposala reale in sett.2+
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listUtenti } from '@/api/utenti'

const pendingCount = ref(0)

onMounted(async () => {
  try {
    const { data } = await listUtenti()
    pendingCount.value = data.filter((u) => u.stato === 'in_attesa').length
  } catch {
    pendingCount.value = 0
  }
})
</script>

<template>
  <div class="dashboard-caposala">
    <h1>Dashboard Caposala</h1>

    <RouterLink :to="{ name: 'caposala-staff' }" class="staff-link">
      Personale
      <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.dashboard-caposala {
  padding: 32px;
}

.staff-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 8px 16px;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  font-size: 0.9375rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--state-urgente);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
