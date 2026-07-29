import { describe, it, expect } from 'vitest'
import { PAGES, DEFAULTS, getDefault } from './siteContent'

describe('registre siteContent', () => {
  it('les clés sont uniques', () => {
    const keys = PAGES.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => f.key)))
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('DEFAULTS mappe chaque clé sur sa valeur par défaut', () => {
    const first = PAGES[0].sections[0].fields[0]
    expect(DEFAULTS[first.key]).toBe(first.default)
    expect(getDefault(first.key)).toBe(first.default)
  })
  it('getDefault renvoie une chaîne vide pour une clé inconnue', () => {
    expect(getDefault('cle.inexistante')).toBe('')
  })
  it('couvre les pages home et lelieu', () => {
    expect(PAGES.map((p) => p.key).sort()).toEqual(['home', 'lelieu'])
  })
})
