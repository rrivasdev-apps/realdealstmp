#!/usr/bin/env node
// Guards the bilingual rule in CLAUDE.md: every user-facing string exists in
// both catalogs, and no component hardcodes English. Run with `npm run
// check:i18n` -- it's the thing to run after building any new section.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not URL.pathname -- this repo's path contains a space, which
// pathname leaves percent-encoded.
const root = fileURLToPath(new URL('..', import.meta.url))
const messagesDir = join(root, 'src/messages')
const srcDir = join(root, 'src')

const problems = []

// 1. en/es parity -- a key in one catalog and not the other means someone
//    added a string and translated it in only one place.
const en = JSON.parse(readFileSync(join(messagesDir, 'en.json'), 'utf8'))
const es = JSON.parse(readFileSync(join(messagesDir, 'es.json'), 'utf8'))

for (const [namespace, entries] of Object.entries(en)) {
  for (const [key, value] of Object.entries(entries)) {
    const translated = es[namespace]?.[key]
    if (translated === undefined) problems.push(`es.json is missing ${namespace}.${key} ("${value}")`)
    else if (!String(translated).trim()) problems.push(`es.json has an empty ${namespace}.${key}`)
  }
}
for (const [namespace, entries] of Object.entries(es)) {
  for (const key of Object.keys(entries)) {
    if (en[namespace]?.[key] === undefined) problems.push(`en.json is missing ${namespace}.${key}`)
  }
}

// 2. No hardcoded user-facing English in components. Deliberately narrow: JSX
//    text nodes and the attributes a person actually reads, plus confirm/alert
//    copy. Data values (lookup names, enum comparisons) aren't matched.
const PATTERNS = [
  // Punctuation matters here: an earlier version stopped at `(` and so missed
  // "Due diligence period (days)" entirely.
  { rx: />\s*([A-Z][A-Za-z]+(?:[ ,][A-Za-z0-9'’&/()%.,:?!-]+){1,})\s*</g, what: 'JSX text' },
  { rx: /(?:placeholder|aria-label|title|alt)="([A-Z][^"]{3,})"/g, what: 'attribute' },
  { rx: /(?:confirm|alert)\(\s*['"`]([^'"`]{6,})/g, what: 'dialog copy' },
  // Prose in a string literal -- `{submitting ? 'Saving…' : 'Save permissions'}`
  // and `setError('Something went wrong.')` render to the user just as much as
  // a JSX text node, and were the gap that let one slip through.
  { rx: /'([A-Z][a-z]+(?:[ ,][A-Za-z'’&/-]+)+[.?!…]?)'/g, what: 'string literal' },
]

// Technical values that happen to look like prose. Kept explicit and short --
// if this list starts growing, the string probably is user-facing copy.
const ALLOWED = new Set(['Content Type', 'Not Found', 'Bad Request'])

// Positions where a capitalised string is data, not copy: comparing against a
// lookup row's name, or passing one to a helper that filters by it. Anything
// else that legitimately holds a DB value gets an explicit `i18n-exempt`
// comment, which applies until the next blank line.
const DATA_POSITION = /===|!==|filterContactsByType\(|statusColors\(/
const EXEMPT = /i18n-exempt/

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (entry.endsWith('.tsx')) checkFile(full)
  }
}

function checkFile(path) {
  const source = readFileSync(path, 'utf8')
  const lines = source.split('\n')

  // Lines covered by an `i18n-exempt` comment: from the comment to the next
  // blank line, so one comment can cover a whole lookup table.
  const exempt = new Set()
  lines.forEach((line, index) => {
    if (!EXEMPT.test(line)) return
    for (let cursor = index; cursor < lines.length && lines[cursor].trim() !== ''; cursor += 1) {
      exempt.add(cursor + 1)
    }
  })

  for (const { rx, what } of PATTERNS) {
    for (const match of source.matchAll(rx)) {
      const text = match[1].trim()
      if (text.startsWith('{') || text.startsWith('http') || ALLOWED.has(text)) continue
      const line = source.slice(0, match.index).split('\n').length
      const lineText = lines[line - 1].trim()
      // Comments are prose by nature and aren't shipped to the user.
      if (lineText.startsWith('//') || lineText.startsWith('*')) continue
      if (exempt.has(line) || DATA_POSITION.test(lineText)) continue
      problems.push(`${relative(root, path)}:${line}: hardcoded ${what} — "${text.slice(0, 60)}"`)
    }
  }
}

walk(srcDir)

if (problems.length) {
  console.error(`i18n check failed (${problems.length}):\n`)
  console.error(problems.map((problem) => `  ${problem}`).join('\n'))
  console.error('\nAdd the string to src/messages/en.json AND es.json, then read it with')
  console.error('useTranslations() / getTranslations(). See "Localization" in CLAUDE.md.')
  process.exit(1)
}

console.log('i18n check passed: en/es catalogs match and no hardcoded strings found.')
