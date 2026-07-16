<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { getBancaOre, type BancaOre } from '@/api/bancaOre'
import { listUtentiByReparto, type UtenteTile } from '@/api/reparti'

const auth = useAuthStore()

function meseCorrente() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const mese = ref(meseCorrente())
const infermieri = ref<UtenteTile[]>([])
const infermiereId = ref<number | null>(auth.user?.id ?? null)
const bancaOre = ref<BancaOre | null>(null)
const loading = ref(false)
const error = ref('')

function spostaMese(delta: number) {
  const [y, m] = mese.value.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  mese.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function load() {
  if (!infermiereId.value) return
  error.value = ''
  loading.value = true
  try {
    const { data } = await getBancaOre(infermiereId.value, mese.value)
    bancaOre.value = data
  } catch {
    error.value = 'Impossibile caricare la banca ore.'
    bancaOre.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (auth.ruolo === 'caposala' && auth.user) {
    const { data } = await listUtentiByReparto(auth.user.reparto_id)
    infermieri.value = data.filter((u) => u.ruolo === 'infermiere')
    infermiereId.value = infermieri.value[0]?.id ?? null
  }
  await load()
})

watch([mese, infermiereId], load)

const saldoLabel = computed(() => {
  if (!bancaOre.value) return ''
  return bancaOre.value.saldo >= 0 ? `+${bancaOre.value.saldo}` : `${bancaOre.value.saldo}`
})
</script>

<template>
  <div class="banca-ore-view">
    <h1>Banca Ore</h1>

    <div class="controls">
      <Select
        v-if="auth.ruolo === 'caposala'"
        v-model="infermiereId"
        :options="infermieri"
        optionLabel="cognome"
        optionValue="id"
        placeholder="Seleziona infermiere"
      />
      <div class="mese-picker">
        <Button icon="pi pi-chevron-left" text @click="spostaMese(-1)" />
        <span class="mono">{{ mese }}</span>
        <Button icon="pi pi-chevron-right" text @click="spostaMese(1)" />
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="bancaOre" class="tiles">
      <div class="tile">
        <span class="tile-label">Ore pianificate</span>
        <span class="tile-value mono">{{ bancaOre.ore_pianificate }}</span>
      </div>
      <div class="tile">
        <span class="tile-label">Ore contrattuali</span>
        <span class="tile-value mono">{{ bancaOre.ore_contrattuali }}</span>
      </div>
      <div class="tile" :class="{ negative: bancaOre.saldo < 0, positive: bancaOre.saldo >= 0 }">
        <span class="tile-label">Saldo</span>
        <span class="tile-value mono">{{ saldoLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banca-ore-view {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0 24px;
}

.mese-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.tile-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.tile.positive .tile-value {
  color: var(--state-attiva);
}

.tile.negative .tile-value {
  color: var(--state-urgente);
}

.mono {
  font-family: var(--mono);
}

.error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
}
</style>
