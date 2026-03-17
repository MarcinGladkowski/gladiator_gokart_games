/**
 * Strip all attributes from every HTML element, keeping only tags and content.
 * Usage: node scripts/strip-html-attrs.mjs input.html [output.html]
 * If output is omitted, prints to stdout.
 */

import { readFileSync, writeFileSync } from 'fs'

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath) {
  console.error('Usage: node scripts/strip-html-attrs.mjs input.html [output.html]')
  process.exit(1)
}

const html = readFileSync(inputPath, 'utf-8')

// Remove all attributes from every tag
const stripped = html.replace(/<([a-z][a-z0-9]*)\s[^>]*?(\/??)>/gi, '<$1$2>')

if (outputPath) {
  writeFileSync(outputPath, stripped, 'utf-8')
  console.log(`Saved to ${outputPath}`)
} else {
  process.stdout.write(stripped)
}
