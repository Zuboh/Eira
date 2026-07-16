<script setup lang="ts">
import { onMounted } from 'vue'
import EiraCard from '@/components/ui/EiraCard.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BancaOreSection from '@/features/banca-ore/components/BancaOreSection.vue'
import { useBancaOre } from '@/features/banca-ore/useBancaOre'
import ConsegneRecentiCard from '@/features/dashboard/components/ConsegneRecentiCard.vue'
import InfermiereQuickLinks from '@/features/dashboard/components/InfermiereQuickLinks.vue'
import PazientiAttiviCard from '@/features/dashboard/components/PazientiAttiviCard.vue'
import ProssimiTurniCard from '@/features/dashboard/components/ProssimiTurniCard.vue'
import { useInfermiereDashboard } from '@/features/dashboard/useInfermiereDashboard'

const {
  loading,
  error,
  mieiTurni,
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

    <InfermiereQuickLinks />

    <EiraCard class="dashboard-card">
      <BancaOreSection
        :banca-ore="bancaOre"
        :mese="bancaOreMese"
        :loading="bancaOreLoading"
        :error="bancaOreError"
        @previous-month="spostaBancaOreMese(-1)"
        @next-month="spostaBancaOreMese(1)"
      />
    </EiraCard>

    <ProssimiTurniCard :turni="mieiTurni" :loading="loading" />

    <ConsegneRecentiCard
      :consegne="consegneRecenti"
      :loading="loading"
      :nome-paziente="nomePaziente"
    />

    <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />
  </div>
</template>

<style scoped>
.dashboard-infermiere {
  padding: var(--page-padding);
  max-width: var(--page-xl);
  margin: 0 auto;
}

.dashboard-card {
  margin-top: 24px;
}
</style>
