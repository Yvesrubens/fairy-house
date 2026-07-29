import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSiteContent } from './useSiteContent'
import * as api from './api'
import { getDefault } from './siteContent'

describe('useSiteContent', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('repli sur le défaut avant chargement et pour clé absente', () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([])
    const { result } = renderHook(() => useSiteContent())
    const firstKey = 'home.hero.title'
    expect(result.current.c(firstKey)).toBe(getDefault(firstKey))
  })

  it('utilise la valeur en base quand présente et non vide', async () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([
      { key: 'home.hero.title', value: 'NOUVEAU TITRE', updated_at: '' },
      { key: 'home.hero.subtitle1', value: '   ', updated_at: '' },
    ])
    const { result } = renderHook(() => useSiteContent())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.c('home.hero.title')).toBe('NOUVEAU TITRE')
    // valeur vide (espaces) -> repli sur défaut
    expect(result.current.c('home.hero.subtitle1')).toBe(getDefault('home.hero.subtitle1'))
  })

  it('cList découpe par lignes non vides', async () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([
      { key: 'home.room1.features', value: 'Lit double\n\nVue sur jardin\n', updated_at: '' },
    ])
    const { result } = renderHook(() => useSiteContent())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.cList('home.room1.features')).toEqual(['Lit double', 'Vue sur jardin'])
  })
})
