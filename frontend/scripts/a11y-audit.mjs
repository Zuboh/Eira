/**
 * Audit a11y/layout su una pagina dell'app, per viewport e schema colore.
 *
 * Uso:
 *   node scripts/a11y-audit.mjs [path] [--shots]
 *   node scripts/a11y-audit.mjs /infermiere --shots
 *
 * Richiede backend :8000 e frontend :5173 gia' avviati (./dev.sh).
 *
 * Controlli: contrasto WCAG AA, touch target < 44px, testo < 12px,
 * troncamenti, overflow orizzontale di pagina.
 *
 * Nota sul contrasto: i colori vanno normalizzati disegnandoli su un
 * canvas 1x1 e rileggendo il pixel. Parsare le stringhe con un regex
 * numerico sbaglia su oklch() e color(srgb ...) e produce ratio finti.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const API = process.env.EIRA_API ?? 'http://localhost:8000'
const APP = process.env.EIRA_APP ?? 'http://localhost:5173'
const USER_ID = process.env.EIRA_USER_ID ?? '4'
const PASSWORD = process.env.EIRA_PASSWORD ?? 'password'

const TARGET_PATH = process.argv[2]?.startsWith('/')
  ? process.argv[2]
  : '/infermiere'
const WANT_SHOTS = process.argv.includes('--shots')
const SHOT_DIR = 'audit-shots'

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
]
const SCHEMES = ['light', 'dark']

const MIN_TOUCH = 44
const MIN_FONT = 12

async function getToken() {
  const res = await fetch(`${API}/api/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: USER_ID,
      password: PASSWORD,
      scope: '',
    }),
  })

  if (!res.ok) {
    throw new Error(`login fallito: ${res.status} ${await res.text()}`)
  }

  return (await res.json()).access_token
}

/* Girato dentro la pagina: niente import, solo DOM. */
function auditPage({ minTouch, minFont }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  /** Normalizza qualunque notazione CSS (oklch, color(srgb ...), color-mix) in [r,g,b,a]. */
  function toRgba(value) {
    if (!value || value === 'transparent') return [0, 0, 0, 0]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = value
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }

  function over(fg, bg) {
    const a = fg[3]
    return [
      fg[0] * a + bg[0] * (1 - a),
      fg[1] * a + bg[1] * (1 - a),
      fg[2] * a + bg[2] * (1 - a),
      1,
    ]
  }

  function luminance([r, g, b]) {
    const lin = [r, g, b].map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  }

  function ratio(a, b) {
    const la = luminance(a)
    const lb = luminance(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }

  /** Composita gli sfondi degli antenati fino a trovarne uno opaco. */
  function effectiveBackground(el) {
    let acc = [0, 0, 0, 0]
    let node = el

    while (node) {
      const bg = toRgba(getComputedStyle(node).backgroundColor)
      if (bg[3] > 0) {
        acc = acc[3] === 0 ? bg : over(acc, bg)
        if (acc[3] >= 0.999) return acc
      }
      node = node.parentElement
    }

    return over(acc, [255, 255, 255, 1])
  }

  function visible(el) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    const style = getComputedStyle(el)
    if (
      style.visibility === 'hidden' ||
      style.display === 'none' ||
      style.opacity === '0'
    ) {
      return false
    }
    /* Visually-hidden (sr-only): ritagliato apposta, quindi corpo del testo
       e troncamento non sono difetti. Va escluso o produce falsi positivi. */
    const clipped = style.clipPath !== 'none' || style.clip !== 'auto'
    return !(clipped && rect.width <= 2 && rect.height <= 2)
  }

  function label(el) {
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    const cls =
      typeof el.className === 'string' ? el.className.split(' ')[0] : ''
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${text ? ` "${text}"` : ''}`
  }

  const contrast = []
  const touch = []
  const smallText = []
  const truncated = []
  const seenTouch = new Set()

  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue

    const style = getComputedStyle(el)
    const fontSize = parseFloat(style.fontSize)

    const ownText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
    )

    if (ownText) {
      if (fontSize < minFont) {
        smallText.push({ el: label(el), fontSize })
      }

      const fg = over(toRgba(style.color), effectiveBackground(el))
      const bg = effectiveBackground(el)
      const r = ratio(fg, bg)
      const bold = Number(style.fontWeight) >= 700
      const large = fontSize >= 24 || (fontSize >= 18.66 && bold)
      const required = large ? 3 : 4.5

      if (r < required) {
        contrast.push({
          el: label(el),
          ratio: Number(r.toFixed(2)),
          required,
          fontSize,
        })
      }
    }

    const interactive =
      el.matches('a[href], button, input, select, textarea, [tabindex]') &&
      !el.hasAttribute('disabled')

    if (interactive && !seenTouch.has(el)) {
      seenTouch.add(el)
      const rect = el.getBoundingClientRect()
      if (rect.width < minTouch || rect.height < minTouch) {
        touch.push({
          el: label(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
      }
    }

    if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== 'auto') {
      const text = (el.textContent ?? '').trim()
      if (text && el.children.length === 0) {
        truncated.push({
          el: label(el),
          visible: el.clientWidth,
          needed: el.scrollWidth,
        })
      }
    }
  }

  return {
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    pageOverflowX:
      document.documentElement.scrollWidth > window.innerWidth + 1
        ? document.documentElement.scrollWidth
        : 0,
    contrast,
    touch,
    smallText,
    truncated,
  }
}

const token = await getToken()
const browser = await chromium.launch()
if (WANT_SHOTS) await mkdir(SHOT_DIR, { recursive: true })

const report = []
let failures = 0

for (const scheme of SCHEMES) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: scheme,
      deviceScaleFactor: 1,
    })

    await context.addInitScript(
      ([t]) => {
        localStorage.setItem('eira_token', t)
        localStorage.setItem('eira_device_reparto', '1')
      },
      [token],
    )

    const page = await context.newPage()
    await page.goto(`${APP}${TARGET_PATH}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const result = await page.evaluate(auditPage, {
      minTouch: MIN_TOUCH,
      minFont: MIN_FONT,
    })

    if (WANT_SHOTS) {
      await page.screenshot({
        path: `${SHOT_DIR}/${viewport.name}-${scheme}.png`,
        fullPage: true,
      })
    }

    const count =
      result.contrast.length +
      result.touch.length +
      result.smallText.length +
      result.truncated.length +
      (result.pageOverflowX ? 1 : 0)
    failures += count

    report.push({ viewport: viewport.name, scheme, ...result })

    console.log(`\n=== ${viewport.name}px ${scheme} — ${count} problemi ===`)
    console.log(`root font-size: ${result.rootFontSize}`)
    if (result.pageOverflowX)
      console.log(`  OVERFLOW pagina: ${result.pageOverflowX}px`)
    for (const c of result.contrast)
      console.log(`  contrasto ${c.ratio}:1 (serve ${c.required}) — ${c.el}`)
    for (const t of result.touch)
      console.log(`  touch ${t.width}x${t.height} — ${t.el}`)
    for (const s of result.smallText)
      console.log(`  testo ${s.fontSize}px — ${s.el}`)
    for (const t of result.truncated)
      console.log(`  troncato ${t.visible}px vs ${t.needed}px — ${t.el}`)

    await context.close()
  }
}

await browser.close()
await writeFile('audit-report.json', JSON.stringify(report, null, 2))

console.log(`\nTotale problemi: ${failures}`)
process.exit(failures > 0 ? 1 : 0)
