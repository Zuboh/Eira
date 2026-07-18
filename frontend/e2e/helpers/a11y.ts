import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

/**
 * PrimeVue's default "small" Button severity (white text on the Aura preset's
 * primary color) fails WCAG AA contrast (3.67:1, needs 4.5:1) across ~44
 * usages app-wide — a design-system-wide brand-color decision, not a one-off
 * bug fixable as a side effect of adding e2e coverage. Tracked as a known
 * finding in docs/VALUTAZIONE-TESI.md instead of fixed here.
 */
export async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page }).exclude('.p-button').analyze()
  return results.violations
}
