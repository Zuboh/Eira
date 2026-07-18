<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ApprovaFerieDialog from '@/features/ferie/components/ApprovaFerieDialog.vue'
import FerieTable from '@/features/ferie/components/FerieTable.vue'
import RifiutoFerieDialog from '@/features/ferie/components/RifiutoFerieDialog.vue'
import { useFerie } from '@/features/ferie/useFerie'
import { formatDateShortIt } from '@/utils/dateFormat'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

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

    <InlineError :message="error" />

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
        :key="index"
        :label="`${index + 1}ª scelta`"
        :required="index === 0"
      >
        <div class="slot-row">
          <Select
            v-model="preferenzeSelezionate[index]"
            :options="slotOptionsFor(index)"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleziona un blocco di 2 settimane"
          />
          <Button
            v-if="index > 0"
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
          type="button"
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
      v-if="!loading"
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
      @save="confermaRifiuto"
    />
    <ApprovaFerieDialog
      v-model:visible="approvaDialog"
      :richiesta="approvaTarget"
      @confirm="confermaApprova"
    />
  </div>
</template>

<style scoped>
.ferie-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}

.richiesta-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-actions-submit {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
