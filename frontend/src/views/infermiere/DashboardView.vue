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
      <div class="priority-column">
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

      <div class="main-column">
        <TurniCalendarCard class="calendar-hero" :events="calendarEvents" />

        <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />
      </div>

      <div class="secondary-column">
        <ConsegneRecentiCard
          :consegne="consegneRecenti"
          :loading="loading"
          :nome-paziente="nomePaziente"
        />

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
  padding: var(--page-padding);
  max-width: var(--page-2xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  container-type: inline-size;
}

.calendar-hero {
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'priority' 'main' 'secondary';
  gap: 20px;
  align-items: start;
}

.priority-column {
  grid-area: priority;
}

.main-column {
  grid-area: main;
}

.secondary-column {
  grid-area: secondary;
}

.priority-column,
.main-column,
.secondary-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

@container (min-width: 64rem) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1.7fr) minmax(19rem, 0.9fr);
    grid-template-rows: max-content 1fr;
    grid-template-areas: 'main priority' 'main secondary';
  }
}
</style>
