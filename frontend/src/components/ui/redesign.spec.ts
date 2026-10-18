import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import FormField from './FormField.vue'
import EiraTable from './EiraTable.vue'

const ButtonStub = {
  emits: ['click'],
  template: '<button @click="$emit(\'click\')">{{ $attrs.label }}</button>',
}

describe('accessible field feedback', () => {
  it('associates help, required and invalid state with the actual input', async () => {
    const wrapper = mount(
      defineComponent({
        components: { FormField },
        props: { error: { type: String, default: undefined } },
        template:
          '<FormField for-id="name" label="Nome" help="Nome completo" :error="error" required v-slot="{ fieldAttrs }"><input id="name" v-bind="fieldAttrs"></FormField>',
      }),
    )
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      'name-help',
    )
    expect(wrapper.get('input').attributes('aria-required')).toBe('true')
    expect(wrapper.get('#name-help').text()).toBe('Nome completo')
    await wrapper.setProps({ error: 'Inserisci il nome' })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      'name-error',
    )
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#name-error').attributes('role')).toBe('alert')
    expect(wrapper.find('#name-help').exists()).toBe(false)
  })
})

describe('table state and keyboard access', () => {
  it('shows loading, error with retry, then empty without mixing states', async () => {
    const wrapper = mount(EiraTable, {
      props: {
        loading: true,
        empty: true,
        error: 'Connessione interrotta',
        retryable: true,
      },
      global: { stubs: { Button: ButtonStub } },
    })
    expect(wrapper.find('[aria-label="Caricamento dati"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Connessione interrotta')
    await wrapper.setProps({ loading: false })
    expect(wrapper.text()).toContain('Connessione interrotta')
    expect(wrapper.text()).not.toContain('Nessun dato')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    await wrapper.setProps({ error: null })
    expect(wrapper.text()).toContain('Nessun dato')
  })
  it('provides a named keyboard-accessible region around the table', () => {
    const wrapper = mount(EiraTable, {
      props: { label: 'Parametri vitali' },
      slots: {
        default: '<table><tbody><tr><td>37 °C</td></tr></tbody></table>',
      },
    })
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBe('0')
    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe(
      'Parametri vitali',
    )
    expect(wrapper.get('table').text()).toBe('37 °C')
  })
})
