<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { dialogStyle } from '@/components/ui/dialogStyles'
import EiraTable from '@/components/ui/EiraTable.vue'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useConsegneSbar } from '@/features/sbar/useConsegneSbar'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'

const {
  consegne,
  pazienti,
  assegnazioni,
  loading,
  error,
  dialogOpen,
  isEditing,
  saving,
  form,
  prioritaOptions,
  canCreateConsegna,
  nomePaziente,
  canEditConsegna,
  load,
  apriNuova,
  apriEdit,
  salva,
} = useConsegneSbar()

onMounted(load)
</script>

<template>
  <div class="sbar-view">
    <PageHeader title="Consegne SBAR">
      <template #actions>
        <Button v-if="canCreateConsegna" label="Nuova consegna" size="small" @click="apriNuova" />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <EiraTable v-if="!loading" :empty="consegne.length === 0" empty-message="Nessuna consegna SBAR.">
      <table style="min-width: var(--table-min-wide)">
        <thead>
          <tr><th>Data</th><th>Paziente</th><th>Priorità</th><th>Situation</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="consegna in consegne" :key="consegna.id">
            <td class="mono">{{ formatDateTimeCompactIt(consegna.creata_il) }}</td>
            <td>{{ nomePaziente(consegna.paziente_id) }}</td>
            <td><StatusBadge :status="consegna.priorita" /></td>
            <td>{{ consegna.situation }}</td>
            <td>
              <Button
                v-if="canEditConsegna(consegna)"
                label="Modifica"
                size="small"
                severity="secondary"
                @click="apriEdit(consegna)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </EiraTable>

    <Dialog v-model:visible="dialogOpen" :header="isEditing ? 'Modifica consegna' : 'Nuova consegna'" modal :style="dialogStyle.lg">
      <form class="form" @submit.prevent="salva">
        <template v-if="!isEditing">
          <FormField label="Paziente" required>
            <Select v-model="form.paziente_id" :options="pazienti" optionLabel="cognome" optionValue="id" placeholder="Seleziona paziente" required />
          </FormField>
          <FormField label="Turno" required>
            <Select v-model="form.turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="turno_id" placeholder="Seleziona turno" required />
          </FormField>
        </template>
        <FormField label="Priorità">
          <Select v-model="form.priorita" :options="prioritaOptions" optionLabel="label" optionValue="value" />
        </FormField>
        <FormField label="Situation" required>
          <Textarea v-model="form.situation" rows="2" required />
        </FormField>
        <FormField label="Background" required>
          <Textarea v-model="form.background" rows="2" required />
        </FormField>
        <FormField label="Assessment" required>
          <Textarea v-model="form.assessment" rows="2" required />
        </FormField>
        <FormField label="Recommendation" required>
          <Textarea v-model="form.recommendation" rows="2" required />
        </FormField>
        <Button type="submit" label="Salva" :loading="saving" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.sbar-view {
  padding: var(--page-padding);
  max-width: var(--page-lg);
  margin: 0 auto;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
