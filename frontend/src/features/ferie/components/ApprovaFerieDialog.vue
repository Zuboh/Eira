<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { formatDateShortIt } from '@/utils/dateFormat'
import type { RichiestaFerie } from '@/api/ferie'

const visible = defineModel<boolean>('visible', { required: true })

const props = defineProps<{
  richiesta: RichiestaFerie | null
}>()

const emit = defineEmits<{ confirm: [preferenzaRank: number] }>()

const rankSelezionato = ref<number | null>(null)

watch(
  () => props.richiesta,
  (richiesta) => {
    rankSelezionato.value = richiesta?.preferenze[0]?.rank ?? null
  },
)

function preferenzeOrdinate() {
  return (props.richiesta?.preferenze ?? []).slice().sort((a, b) => a.rank - b.rank)
}

function conferma() {
  if (rankSelezionato.value !== null) {
    emit('confirm', rankSelezionato.value)
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" header="Approva richiesta ferie" modal :style="dialogStyle.sm">
    <form class="form" @submit.prevent="conferma">
      <p class="hint">Scegli quale preferenza approvare:</p>
      <div v-for="p in preferenzeOrdinate()" :key="p.rank" class="option">
        <RadioButton
          v-model="rankSelezionato"
          :input-id="`pref-${p.rank}`"
          :value="p.rank"
          name="preferenza"
        />
        <label :for="`pref-${p.rank}`">
          {{ p.rank }}ª scelta — {{ formatDateShortIt(p.data_inizio) }} → {{ formatDateShortIt(p.data_fine) }}
        </label>
      </div>
      <Button type="submit" label="Conferma approvazione" :disabled="rankSelezionato === null" />
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint {
  margin: 0;
  color: var(--steel);
  font-size: 0.875rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
