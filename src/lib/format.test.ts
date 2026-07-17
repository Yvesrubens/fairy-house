import { describe, it, expect } from 'vitest'
import { formatDate, formatEuro, toCSV, slugify } from './format'

describe('formatDate', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2026-06-04')).toBe('04/06/2026')
  })
})

describe('formatEuro', () => {
  it('formats zero', () => {
    expect(formatEuro(0)).toBe('0€')
  })
  it('groups thousands', () => {
    expect(formatEuro(1200)).toBe('1 200€')
  })
})

describe('toCSV', () => {
  it('builds header + rows and escapes commas', () => {
    const csv = toCSV([{ a: 'x,y', b: 1 }])
    expect(csv).toBe('a,b\r\n"x,y",1')
  })
})

describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('Été à la Fairy House!')).toBe('ete-a-la-fairy-house')
  })
})
