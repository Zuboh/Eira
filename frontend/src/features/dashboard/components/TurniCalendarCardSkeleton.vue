<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
</script>

<template>
  <EiraCard title="Calendario turni" class="turni-calendar-card">
    <SkeletonBlock :lines="6" />
  </EiraCard>
</template>
