<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Button from 'primevue/button'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const avatarFile = defineModel<File | null>({ required: true })

withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  { disabled: false },
)

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectionError = ref('')

const fileDetails = computed(() => {
  if (!avatarFile.value) return ''
  return `${avatarFile.value.name} · ${formatFileSize(avatarFile.value.size)}`
})

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function revokePreview() {
  if (!previewUrl.value) return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function resetNativeInput() {
  if (fileInput.value) fileInput.value.value = ''
}

function openFilePicker() {
  fileInput.value?.click()
}

function removeFile() {
  avatarFile.value = null
  selectionError.value = ''
  resetNativeInput()
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    selectionError.value = 'Formato non supportato. Usa JPG, PNG o WebP.'
    resetNativeInput()
    return
  }

  if (file.size > MAX_AVATAR_BYTES) {
    selectionError.value = 'La foto supera il limite massimo di 2 MB.'
    resetNativeInput()
    return
  }

  selectionError.value = ''
  avatarFile.value = file
}

watch(
  avatarFile,
  (file) => {
    revokePreview()
    if (file) previewUrl.value = URL.createObjectURL(file)
  },
  { immediate: true },
)

onBeforeUnmount(revokePreview)
</script>

<template>
  <div class="avatar-picker">
    <div class="avatar-picker__preview">
      <img v-if="previewUrl" :src="previewUrl" alt="Anteprima foto profilo" />
      <i v-else class="pi pi-user" aria-hidden="true" />
    </div>

    <div class="avatar-picker__content">
      <input
        id="staff-avatar"
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        aria-label="Seleziona foto profilo"
        tabindex="-1"
        :aria-describedby="
          selectionError
            ? 'staff-avatar-help staff-avatar-error'
            : 'staff-avatar-help'
        "
        :disabled="disabled"
        @change="onAvatarChange"
      />

      <div class="avatar-picker__actions">
        <Button
          type="button"
          :label="avatarFile ? 'Cambia foto' : 'Scegli foto'"
          icon="pi pi-camera"
          severity="secondary"
          outlined
          size="small"
          :disabled="disabled"
          data-testid="avatar-choose"
          @click="openFilePicker"
        />
        <Button
          v-if="avatarFile"
          type="button"
          label="Rimuovi"
          icon="pi pi-trash"
          severity="secondary"
          text
          size="small"
          :disabled="disabled"
          data-testid="avatar-remove"
          @click="removeFile"
        />
      </div>

      <p v-if="fileDetails" class="avatar-picker__file" :title="fileDetails">
        {{ fileDetails }}
      </p>
      <p id="staff-avatar-help" class="avatar-picker__help">
        JPG, PNG o WebP · massimo 2 MB
      </p>
      <p
        v-if="selectionError"
        id="staff-avatar-error"
        class="avatar-picker__error"
        role="alert"
      >
        {{ selectionError }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.avatar-picker {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--canvas) 65%, var(--surface));
}

.avatar-picker__preview {
  display: grid;
  place-items: center;
  flex: 0 0 4.5rem;
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: color-mix(in oklch, var(--color-primary) 12%, var(--surface));
  color: var(--color-primary-on-tint);
  font-size: 1.25rem;
}

.avatar-picker__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-picker__content {
  min-width: 0;
  flex: 1;
}

.avatar-picker__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.avatar-picker__file,
.avatar-picker__help,
.avatar-picker__error {
  margin: var(--space-1) 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
}

.avatar-picker__file {
  overflow: hidden;
  color: var(--ink);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-picker__help {
  color: var(--steel);
}

.avatar-picker__error {
  color: var(--state-urgente);
}

@media (max-width: 24rem) {
  .avatar-picker {
    align-items: flex-start;
  }

  .avatar-picker__preview {
    flex-basis: 4rem;
    width: 4rem;
    height: 4rem;
  }
}
</style>
