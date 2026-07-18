<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'
import type { ProssimiTurniCardProps } from '@/features/dashboard/types'

defineProps<ProssimiTurniCardProps>()
</script>

<template>
  <EiraCard title="Prossimi turni" class="dashboard-card">
    <p v-if="loading" class="muted">Caricamento turni…</p>
    <p v-else-if="turni.length === 0" class="muted">Nessun turno assegnato.</p>
    <ul v-else class="turni-list">
      <li v-for="turno in turni" :key="turno.id">
        <span class="dot" :class="`turno-${turno.tipo}`" aria-hidden="true" />
        <span>
          {{ formatDateShortIt(turno.data) }} ·
          {{ TIPO_TURNO_LABEL[turno.tipo] }} ·
          <span class="mono"
            >{{ turno.ora_inizio.slice(0, 5) }}–{{
              turno.ora_fine.slice(0, 5)
            }}</span
          >
        </span>
      </li>
    </ul>
  </EiraCard>
</template>

<style scoped>
.turni-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.turni-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 0.9375rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.turno-mattina {
  background: var(--turno-mattina);
}

.turno-pomeriggio {
  background: var(--turno-pomeriggio);
}

.turno-notte {
  background: var(--turno-notte);
}

.turno-riposo {
  background: var(--turno-riposo);
}

.turno-ferie {
  background: var(--turno-ferie);
}

.turno-ferie_estive {
  background: var(--turno-ferie-estive);
}

.muted {
  color: var(--steel);
  font-size: 0.875rem;
}
</style>
