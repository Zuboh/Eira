<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'
import type { ProssimiTurniCardProps } from '@/features/dashboard/types'
import type { ProssimoTurnoConColleghi } from '@/api/turni'

const props = defineProps<ProssimiTurniCardProps>()

type Collega = ProssimoTurnoConColleghi['colleghi'][number]

function nomeCollega(collega: Collega) {
  return `${collega.cognome} ${collega.nome}`
}

function colleghiPreview(colleghi: Collega[]) {
  return colleghi.slice(0, 2).map(nomeCollega).join(', ')
}

function colleghiExtraCount(colleghi: Collega[]) {
  return Math.max(0, colleghi.length - 2)
}
</script>

<template>
  <EiraCard flush title="Prossimi turni" class="dashboard-card">
    <SkeletonBlock v-if="loading" :lines="4" />
    <p v-else-if="props.turni.length === 0" class="muted">
      Nessun turno assegnato.
    </p>
    <ul v-else class="turni-list">
      <li v-for="entry in props.turni" :key="entry.turno.id">
        <span
          class="dot"
          :class="`turno-${entry.turno.tipo}`"
          aria-hidden="true"
        />
        <span class="turno-content">
          <span>
            {{ formatDateShortIt(entry.turno.data) }} ·
            {{ TIPO_TURNO_LABEL[entry.turno.tipo] }} ·
            <span class="mono"
              >{{ entry.turno.ora_inizio.slice(0, 5) }}–{{
                entry.turno.ora_fine.slice(0, 5)
              }}</span
            >
          </span>
          <span class="colleghi">
            <template v-if="entry.colleghi.length > 0">
              Con: {{ colleghiPreview(entry.colleghi) }}
              <span v-if="colleghiExtraCount(entry.colleghi) > 0">
                +{{ colleghiExtraCount(entry.colleghi) }}
              </span>
            </template>
            <template v-else>Solo tu assegnato</template>
          </span>
        </span>
      </li>
    </ul>
  </EiraCard>
</template>

<style scoped>
.turni-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.turni-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--ink);
  font-size: 0.9375rem;
}

.turno-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.colleghi,
.muted {
  color: var(--steel);
  font-size: 0.875rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
  margin-top: 5px;
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
</style>
