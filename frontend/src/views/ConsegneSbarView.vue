<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import EiraTable from '@/components/ui/EiraTable.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import GenericConsegnaDialog from '@/features/patient-chart/components/GenericConsegnaDialog.vue'
import SbarDialog from '@/features/sbar/components/SbarDialog.vue'
import { useConsegneSbar } from '@/features/sbar/useConsegneSbar'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'

const PAGE_SIZE = 25

const {
  consegne,
  pazienti,
  assegnazioni,
  loading,
  error,
  dialogOpen,
  nuovaDialogOpen,
  isEditing,
  saving,
  form,
  nuovaForm,
  nuovaInsight,
  page,
  total,
  canCreateConsegna,
  nomePaziente,
  canEditConsegna,
  load,
  goToPage,
  apriNuova,
  apriEdit,
  salva,
  salvaNuova,
} = useConsegneSbar()

onMounted(load)

function onPageChange(event: { page: number }) {
  goToPage(event.page + 1)
}
</script>

<template>
  <div class="sbar-view">
    <PageHeader title="Diario Clinico">
      <template #actions>
        <Button
          v-if="canCreateConsegna"
          label="Nuova consegna"
          size="small"
          @click="apriNuova"
        />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <EiraTable
      :loading="loading"
      :empty="consegne.length === 0"
      empty-message="Nessuna consegna SBAR."
    >
      <table style="min-width: var(--table-min-wide)">
        <thead>
          <tr>
            <th>Data</th>
            <th>Paziente</th>
            <th>Priorità</th>
            <th>Situation</th>
            <th><span class="sr-only">Azioni</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="consegna in consegne" :key="consegna.id">
            <td class="mono">
              {{ formatDateTimeCompactIt(consegna.creata_il) }}
            </td>
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

    <Paginator
      v-if="!loading && total > PAGE_SIZE"
      :rows="PAGE_SIZE"
      :total-records="total"
      :first="(page - 1) * PAGE_SIZE"
      @page="onPageChange"
    />

    <GenericConsegnaDialog
      v-model:visible="nuovaDialogOpen"
      v-model:form="nuovaForm"
      :assegnazioni="assegnazioni"
      :pazienti="pazienti"
      :saving="saving"
      :insight="nuovaInsight"
      @save="salvaNuova"
    />

    <SbarDialog
      v-model:visible="dialogOpen"
      v-model:form="form"
      :is-editing="isEditing"
      :saving="saving"
      :assegnazioni="assegnazioni"
      :pazienti="pazienti"
      @save="salva"
    />
  </div>
</template>

<style scoped>
.sbar-view {
  padding: var(--page-padding);
  max-width: var(--page-lg);
  margin: 0 auto;
}
</style>
