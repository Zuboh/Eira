<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import BancaOreSection from '@/features/banca-ore/components/BancaOreSection.vue'
import { useBancaOre } from '@/features/banca-ore/useBancaOre'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const {
  mese,
  infermieri,
  infermiereId,
  bancaOre,
  loading,
  error,
  spostaMese,
} = useBancaOre({ loadInfermieriForCaposala: true })
</script>

<template>
  <div class="banca-ore-view">
    <PageHeader title="Banca Ore" subtitle="Saldo mensile tra ore pianificate e ore contrattuali." />

    <BancaOreSection
      v-model:infermiere-id="infermiereId"
      :banca-ore="bancaOre"
      :mese="mese"
      :loading="loading"
      :error="error"
      :infermieri="infermieri"
      :show-infermiere-select="auth.ruolo === 'caposala'"
      @previous-month="spostaMese(-1)"
      @next-month="spostaMese(1)"
    />
  </div>
</template>

<style scoped>
.banca-ore-view {
  padding: var(--page-padding);
  max-width: 900px;
  margin: 0 auto;
}
</style>
