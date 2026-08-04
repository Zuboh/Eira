import { readFile } from 'node:fs/promises'

const [expectedPath, actualPath] = process.argv.slice(2)

if (!expectedPath || !actualPath) {
  console.error('Usage: node compare-json.mjs <expected.json> <actual.json>')
  process.exit(2)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value === null || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

const [expected, actual] = await Promise.all(
  [expectedPath, actualPath].map(async (path) =>
    canonicalize(JSON.parse(await readFile(path, 'utf8'))),
  ),
)

if (JSON.stringify(expected) !== JSON.stringify(actual)) {
  console.error(
    `JSON contract drift: ${expectedPath} differs semantically from ${actualPath}`,
  )
  process.exit(1)
}

console.log(`JSON contracts match: ${expectedPath}`)
