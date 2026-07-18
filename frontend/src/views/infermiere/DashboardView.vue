<script setup lang="ts">
import { onMounted } from 'vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BancaOreSection from '@/features/banca-ore/components/BancaOreSection.vue'
import { useBancaOre } from '@/features/banca-ore/useBancaOre'
import ConsegneRecentiCard from '@/features/dashboard/components/ConsegneRecentiCard.vue'
import PazientiAttiviCard from '@/features/dashboard/components/PazientiAttiviCard.vue'
import ProssimiTurniCard from '@/features/dashboard/components/ProssimiTurniCard.vue'
import TurniCalendarCard from '@/features/dashboard/components/TurniCalendarCard.vue'
import { useInfermiereDashboard } from '@/features/dashboard/useInfermiereDashboard'

const {
  loading,
  error,
  mieiTurni,
  calendarEvents,
  consegneRecenti,
  pazientiAttivi,
  nomePaziente,
  load,
} = useInfermiereDashboard()

const {
  mese: bancaOreMese,
  bancaOre,
  loading: bancaOreLoading,
  error: bancaOreError,
  spostaMese: spostaBancaOreMese,
} = useBancaOre()

onMounted(load)
</script>

<template>
  <div class="dashboard-infermiere">
    <PageHeader title="Dashboard Infermiere" />

    <InlineError :message="error" />

    <div class="dashboard-row">
      <TurniCalendarCard class="calendar-column" :events="calendarEvents" />

      <div class="side-column">
        <ProssimiTurniCard :turni="mieiTurni" :loading="loading" />

        <BancaOreSection
          :banca-ore="bancaOre"
          :mese="bancaOreMese"
          :loading="bancaOreLoading"
          :error="bancaOreError"
          @previous-month="spostaBancaOreMese(-1)"
          @next-month="spostaBancaOreMese(1)"
        />
      </div>
    </div>

    <div class="dashboard-row">
      <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />

      <ConsegneRecentiCard
        :consegne="consegneRecenti"
        :loading="loading"
        :nome-paziente="nomePaziente"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-infermiere {
  padding: var(--page-padding);
  max-width: var(--page-xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  gap: 24px;
  align-items: start;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 960px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}
</style>
