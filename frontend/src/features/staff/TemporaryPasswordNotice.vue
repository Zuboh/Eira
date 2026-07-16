<script setup lang="ts">
import Button from 'primevue/button'
import type {
  TemporaryPasswordNoticeEmits,
  TemporaryPasswordNoticeProps,
} from '@/features/staff/types'

defineProps<TemporaryPasswordNoticeProps>()

const emit = defineEmits<TemporaryPasswordNoticeEmits>()
</script>

<template>
  <section class="temporary-password" role="status">
    <div>
      <p class="temporary-title">Password temporanea</p>
      <code>{{ password }}</code>
    </div>
    <Button label="Copia" size="small" severity="secondary" @click="emit('copy')" />
  </section>
</template>

<style scoped>
.temporary-password {
  margin-top: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.temporary-title {
  margin: 0 0 4px;
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
}

.temporary-password code {
  font-family: var(--mono);
  font-size: 0.9375rem;
  color: var(--ink);
}
</style>
