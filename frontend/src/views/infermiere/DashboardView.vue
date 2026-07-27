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

    <InlineError :message="error" />

    <div class="dashboard-grid">
      <div class="main-column">
        <TurniCalendarCard class="calendar-hero" :events="calendarEvents" />

        <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />
      </div>

      <div class="side-column">
        <ProssimiTurniCard
          :turni="prossimiTurniConColleghi"
          :loading="loading"
        />

        <RichiesteCambioTurnoCard
          :richieste="richiesteCambioTurno"
          :loading="loading"
          :nome-utente="nomeUtente"
        />

        <BancaOreSection
          :banca-ore="bancaOre"
          :mese="bancaOreMese"
          :loading="bancaOreLoading"
          :error="bancaOreError"
          @previous-month="spostaBancaOreMese(-1)"
          @next-month="spostaBancaOreMese(1)"
        />
        <ConsegneRecentiCard
          :consegne="consegneRecenti"
          :loading="loading"
          :nome-paziente="nomePaziente"
        />

        <CarelloBassoStockCard :farmaci="farmaciCritici" :loading="loading" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-infermiere {
  padding: var(--page-padding);
  max-width: var(--page-2xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calendar-hero {
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  gap: 24px;
  align-items: start;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
