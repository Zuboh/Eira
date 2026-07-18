<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import NewStaffDialog from '@/features/staff/components/NewStaffDialog.vue'
import StaffFilters from '@/features/staff/components/StaffFilters.vue'
import StaffTable from '@/features/staff/components/StaffTable.vue'
import TemporaryPasswordNotice from '@/features/staff/TemporaryPasswordNotice.vue'
import { useStaffWorkflow } from '@/features/staff/useStaffWorkflow'

const {
  filtro,
  loading,
  resetLoadingId,
  error,
  temporaryPassword,
  newDialogOpen,
  newSaving,
  newForm,
  filtri,
  filtrati,
  load,
  apriNuovo,
  salvaNuovo,
  approva,
  reimpostaPassword,
  copiaPassword,
} = useStaffWorkflow()

onMounted(load)
</script>

<template>
  <div class="staff-view">
    <PageHeader title="Personale">
      <template #actions>
        <Button label="Aggiungi utente" size="small" @click="apriNuovo" />
      </template>
    </PageHeader>

    <StaffFilters v-model="filtro" :options="filtri" />

    <InlineError :message="error" />

    <StaffTable
      v-if="!loading"
      :utenti="filtrati"
      :reset-loading-id="resetLoadingId"
      @approve="approva"
      @reset-password="reimpostaPassword"
    />

    <TemporaryPasswordNotice
      v-if="temporaryPassword"
      :password="temporaryPassword"
      @copy="copiaPassword"
    />

    <NewStaffDialog
      v-model:visible="newDialogOpen"
      v-model:form="newForm"
      :saving="newSaving"
      @save="salvaNuovo"
    />
  </div>
</template>

<style scoped>
.staff-view {
  padding: var(--page-padding);
  max-width: 960px;
  margin: 0 auto;
}
</style>
