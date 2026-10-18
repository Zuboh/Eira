import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

export async function checkA11y(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    )
  })
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations
}
