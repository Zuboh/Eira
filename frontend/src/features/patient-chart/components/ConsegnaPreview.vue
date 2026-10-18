<script setup lang="ts">
import Button from 'primevue/button'
import type { ConsegnaSection } from '@/features/patient-chart/consegnaSections'

withDefaults(
  defineProps<{
    sections: ConsegnaSection[]
    values: Record<string, string>
    hasOrphanText: boolean
    copiedKeys?: string[]
    missingKeys?: string[]
    canCopyForward?: boolean
  }>(),
  {
    copiedKeys: () => [],
    missingKeys: () => [],
    canCopyForward: false,
  },
)
const emit = defineEmits<{
  quickFill: [key: string]
  copyForwardSection: [key: string]
}>()
</script>

<template>
  <!-- niente aria-live sul contenitore: annuncerebbe l'intero elenco sezioni
       a ogni carattere digitato. Solo la riga di stato parla. -->
  <section class="preview">
    <h2>Come verrà salvata</h2>
    <p class="orphan" aria-live="polite">
      <template v-if="hasOrphanText">
        Il testo scritto prima della prima sigla è finito in
        {{ sections[0].label }}.
      </template>
    </p>

    <dl>
      <div
        v-for="section in sections"
        :key="section.key"
        class="row"
        :class="{ 'row--missing': missingKeys.includes(section.key) }"
      >
        <dt>
          <span class="sigla">{{ section.sigla }}</span>
          {{ section.label }}
          <!-- Il role=alert annuncia solo il proprio sottoalbero: senza il
               nome della sezione lo screen reader sente "da compilare" x4
               senza sapere quali. -->
          <span
            v-if="missingKeys.includes(section.key)"
            class="missing"
            role="alert"
          >
            <i class="pi pi-exclamation-circle" aria-hidden="true" />
            <span class="sr-only">{{ section.label }}: </span>
            da compilare
          </span>
          <span
            v-if="copiedKeys.includes(section.key)"
            class="copied"
            :title="`${section.label} ripresa dalla consegna precedente`"
            >↻<span class="sr-only">
              ripresa dalla consegna precedente</span
            ></span
          >
        </dt>
        <dd v-if="values[section.key]">{{ values[section.key] }}</dd>
        <dd v-else class="empty">
          <span class="hint">{{ section.hint }}</span>
          <!-- Colonna azioni a larghezza fissa: in flex+wrap gli stessi due
               bottoni cadevano a quattro ascisse diverse (la riga wrappava o
               no a seconda della lunghezza dell'hint) e l'altezza riga
               alternava 32/61px. -->
          <span class="actions">
            <Button
              type="button"
              severity="secondary"
              text
              size="small"
              :label="`Segna «invariato»`"
              :aria-label="`Segna ${section.label} come invariato`"
              @click="emit('quickFill', section.key)"
            />
            <Button
              v-if="canCopyForward"
              type="button"
              severity="secondary"
              text
              size="small"
              label="Riprendi"
              :aria-label="`Riprendi ${section.label} dalla consegna precedente`"
              @click="emit('copyForwardSection', section.key)"
            />
          </span>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.preview {
  padding-block: var(--eira-space-4);
  border-top: 1px solid var(--eira-border-default);
}

.preview h2 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.orphan {
  margin: 0 0 12px;
  color: var(--eira-text-secondary);
  font-size: 0.875rem;
}

.orphan:empty {
  display: none;
}

/* la mancanza non e' affidata al solo colore: icona + parola "da compilare" */
.missing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--eira-status-danger);
  font-weight: 500;
  font-size: 0.8125rem;
}

.missing .pi {
  font-size: 0.8125rem;
}

.row--missing .sigla {
  color: var(--eira-status-danger);
}

dl {
  display: grid;
  gap: var(--eira-space-3);
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(9rem, auto) minmax(0, 1fr);
  align-items: baseline;
  gap: 4px 12px;
}

dt {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.sigla {
  display: inline-grid;
  place-items: center;
  min-width: 1.4rem;
  padding: 1px 4px;
  border-radius: var(--eira-radius-md);
  color: var(--eira-text-secondary);
  font-size: 0.75rem;
}

dd {
  margin: 0;
  white-space: pre-wrap;
}

dd.empty {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

dd.empty .actions {
  display: flex;
  justify-content: flex-end;
  /* 8px minimi tra due target adiacenti: sotto, si sbaglia bottone */
  gap: 8px;
}

.copied {
  color: var(--eira-text-secondary);
  font-weight: 400;
}

/* --eira-text-secondary qui stava a 2.24:1: il fondo del pannello e' tintato, serve la
   variante -on-tint (stessa regola di --eira-action-selected-text). */
.hint {
  color: var(--eira-text-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

/* i due bottoni testuali secondari ereditano il grigio PrimeVue (4.15:1 sul
   fondo tintato): riportati sul token della palette */
dd.empty :deep(.p-button-secondary) {
  color: var(--eira-text-secondary);
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }

  /* niente colonna azioni su schermo stretto: hint e bottoni si
     schiaccerebbero a vicenda */
  dd.empty {
    grid-template-columns: 1fr;
  }

  dd.empty .actions {
    justify-content: flex-start;
  }
}
</style>
