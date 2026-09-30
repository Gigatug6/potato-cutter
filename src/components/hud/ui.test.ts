// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../../stores/game'
import { useProfileStore } from '../../stores/profile'
import MoneyCounter from './MoneyCounter.vue'
import PhaseActions from './PhaseActions.vue'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('UI', () => {
  it('MoneyCounter formate en fr-FR', async () => {
    const p = useProfileStore()
    p.earn(12345)
    const w = mount(MoneyCounter)
    expect(w.text().replace(/\s/g, '')).toContain('12345')
  })
  it('« Passer à la découpe » désactivé sous 50 %', async () => {
    const g = useGameStore()
    g.startRound('rondelles', 1)
    const w = mount(PhaseActions)
    expect(w.get('[data-testid=to-cutting]').attributes('disabled')).toBeDefined()
    g.setPeelCoverage(0.6)
    await w.vm.$nextTick()
    expect(w.get('[data-testid=to-cutting]').attributes('disabled')).toBeUndefined()
  })
})
