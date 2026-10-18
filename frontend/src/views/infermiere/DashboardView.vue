<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BancaOreSection from '@/features/banca-ore/components/BancaOreSection.vue'
import { useBancaOre } from '@/features/banca-ore/useBancaOre'
import CarelloBassoStockCard from '@/features/dashboard/components/CarelloBassoStockCard.vue'
import ConsegneRecentiCard from '@/features/dashboard/components/ConsegneRecentiCard.vue'
import PazientiAttiviCard from '@/features/dashboard/components/PazientiAttiviCard.vue'
import ProssimiTurniCard from '@/features/dashboard/components/ProssimiTurniCard.vue'
import RichiesteCambioTurnoCard from '@/features/dashboard/components/RichiesteCambioTurnoCard.vue'
import TurniCalendarCardSkeleton from '@/features/dashboard/components/TurniCalendarCardSkeleton.vue'
import { useInfermiereDashboard } from '@/features/dashboard/useInfermiereDashboard'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const TurniCalendarCard = defineAsyncComponent({
  loader: () => import('@/features/dashboard/components/TurniCalendarCard.vue'),
  loadingComponent: TurniCalendarCardSkeleton,
  delay: 200,
})

const {
  loading,
  error,
  prossimiTurniConColleghi,
  calendarEvents,
  consegneRecenti,
  pazientiAttivi,
  farmaciCritici,
  richiesteCambioTurno,
  nomePaziente,
  nomeUtente,
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
    <PageHeader title="Dashboard" :reparto="auth.repartoNome" />

    <InlineError :message="error" retryable @retry="load" />

    <div v-if="!error" class="dashboard-grid">
      <div class="operational-row">
        <ProssimiTurniCard
          :turni="prossimiTurniConColleghi"
          :loading="loading"
        />
        <RichiesteCambioTurnoCard
          :richieste="richiesteCambioTurno"
          :loading="loading"
          :nome-utente="nomeUtente"
        />
      </div>
      <div class="clinical-row">
        <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />
        <ConsegneRecentiCard
          :consegne="consegneRecenti"
          :loading="loading"
          :nome-paziente="nomePaziente"
        />
      </div>
      <TurniCalendarCardSkeleton v-if="loading" />
      <TurniCalendarCard v-else :events="calendarEvents" />
      <div class="operational-row">
        <CarelloBassoStockCard :farmaci="farmaciCritici" :loading="loading" />
        <BancaOreSection
          compact
          :banca-ore="bancaOre"
          :mese="bancaOreMese"
          :loading="bancaOreLoading"
          :error="bancaOreError"
          @previous-month="spostaBancaOreMese(-1)"
          @next-month="spostaBancaOreMese(1)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-infermiere {
  padding: var(--eira-page-padding);
  max-width: var(--eira-page-xl);
  margin: 0 auto;
}
.dashboard-grid {
  display: grid;
  gap: var(--eira-space-6);
  min-width: 0;
}
.operational-row,
.clinical-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--eira-space-8);
  align-items: start;
}
@media (max-width: 74.9375rem) {
  .clinical-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 47.9375rem) {
  .operational-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
