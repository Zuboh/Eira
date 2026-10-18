<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import FormField from '@/components/ui/FormField.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ApprovaFerieDialog from '@/features/ferie/components/ApprovaFerieDialog.vue'
import FerieTable from '@/features/ferie/components/FerieTable.vue'
import RifiutoFerieDialog from '@/features/ferie/components/RifiutoFerieDialog.vue'
import { useFerie } from '@/features/ferie/useFerie'
import { formatDateShortIt } from '@/utils/dateFormat'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const preferenceFieldIds = [
  'ferie-preferenza-1',
  'ferie-preferenza-2',
  'ferie-preferenza-3',
] as const

const {
  richieste,
  slotDisponibili,
  loading,
  error,
  preferenzeSelezionate,
  editingId,
  saving,
  canRequestFerie,
  currentRole,
  rifiutoDialog,
  motivoRifiuto,
  approvaDialog,
  approvaTarget,
  nomeUtente,
  load,
  aggiungiPreferenza,
  rimuoviPreferenza,
  avviaModifica,
  resetForm,
  salva,
  cancella,
  apriApprova,
  confermaApprova,
  apriRifiuto,
  confermaRifiuto,
} = useFerie()

function slotOptionsFor(index: number) {
  const scelteAltrove = preferenzeSelezionate.value.filter(
    (_, i) => i !== index,
  )
  return slotDisponibili.value
    .filter((data) => !scelteAltrove.includes(data))
    .map((data) => ({
      label: `${formatDateShortIt(data)} → 2 settimane`,
      value: data,
    }))
}

const showForm = computed(
  () => canRequestFerie.value || editingId.value !== null,
)

onMounted(load)
</script>

<template>
  <div class="ferie-view">
    <PageHeader title="Ferie" />

    <InlineError :message="error" retryable @retry="load" />
    <SkeletonBlock v-if="loading" :lines="5" />

    <form v-if="showForm" class="richiesta-form" @submit.prevent="salva">
      <p class="form-title">
        {{
          editingId !== null
            ? 'Modifica preferenze'
            : 'Nuova richiesta ferie estive'
        }}
      </p>
      <FormField
        v-for="(_, index) in preferenzeSelezionate"
        :key="preferenceFieldIds[index]"
        v-slot="{ fieldAttrs }"
        :for-id="preferenceFieldIds[index]"
        :label="`${index + 1}ª scelta`"
        :required="index === 0"
      >
        <div class="slot-row">
          <Select
            v-model="preferenzeSelezionate[index]"
            :pt="{ label: fieldAttrs }"
            :input-id="preferenceFieldIds[index]"
            :options="slotOptionsFor(index)"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleziona un blocco di 2 settimane"
          />
          <Button
            v-if="index > 0"
            v-tooltip.top="'Rimuovi preferenza'"
            icon="pi pi-times"
            text
            severity="secondary"
            aria-label="Rimuovi preferenza"
            @click="rimuoviPreferenza(index)"
          />
        </div>
      </FormField>
      <div class="form-actions">
        <Button
          v-if="preferenzeSelezionate.length < 3"
          v-tooltip.top="'Aggiungi preferenza'"
          type="button"
          icon="pi pi-plus"
          label="Aggiungi preferenza"
          text
          @click="aggiungiPreferenza"
        />
        <div class="form-actions-submit">
          <Button
            v-if="editingId !== null"
            type="button"
            label="Annulla modifica"
            severity="secondary"
            text
            @click="resetForm"
          />
          <Button
            class="eira-saving-button"
            type="submit"
            :label="
              editingId !== null ? 'Salva modifiche' : 'Richiedi ferie estive'
            "
            :loading="saving"
            :disabled="!preferenzeSelezionate[0]"
          />
        </div>
      </div>
    </form>

    <FerieTable
      v-if="!loading && !error"
      :richieste="richieste"
      :current-role="currentRole"
      :current-user-id="auth.user?.id ?? null"
      :nome-utente="nomeUtente"
      @approve="apriApprova"
      @reject="apriRifiuto"
      @edit="avviaModifica"
      @cancel="cancella"
    />

    <RifiutoFerieDialog
      v-model:visible="rifiutoDialog"
      v-model:motivo="motivoRifiuto"
      :error="error"
      @save="confermaRifiuto"
    />
    <ApprovaFerieDialog
      v-model:visible="approvaDialog"
      :error="error"
      :richiesta="approvaTarget"
      @confirm="confermaApprova"
    />
  </div>
</template>

<style scoped>
.ferie-view {
  padding: var(--eira-page-padding);
  max-width: var(--eira-page-lg);
  margin: 0 auto;
}

.richiesta-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-block: var(--eira-space-5);
  border-block: 1px solid var(--eira-border-default);
  background: var(--eira-bg-surface);
}

.form-title {
  margin: 0;
  font-weight: 600;
}

.slot-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-actions-submit {
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (max-width: 47.9375rem) {
  .slot-row {
    min-width: 0;
  }
  .slot-row :deep(.p-select) {
    min-width: 0;
    flex: 1;
  }
}
</style>
