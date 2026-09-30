import { describe, expect, it, vi } from 'vitest'
import { GamepadController, applyDeadzone, type PadActions, type PadState } from './gamepad'

const pad = (axes: number[] = [0, 0, 0, 0], pressed: number[] = []): PadState => ({
  axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i) })),
})

function make() {
  const a: PadActions = {
    bounds: () => ({ left: 0, top: 0, width: 1000, height: 600 }),
    pointer: vi.fn(), nudge: vi.fn(), rotate: vi.fn(), toggleRotate: vi.fn(), capture: vi.fn(), discard: vi.fn(), start: vi.fn(), cursor: vi.fn(),
  }
  return { a, c: new GamepadController(a) }
}

describe('gamepad', () => {
  it('zone morte : 0 sous le seuil, ±1 à fond, signe conservé', () => {
    expect(applyDeadzone(0.1)).toBe(0)
    expect(applyDeadzone(-0.15)).toBe(0)
    expect(applyDeadzone(1)).toBe(1)
    expect(applyDeadzone(-1)).toBe(-1)
    expect(applyDeadzone(0.59)).toBeGreaterThan(0)
  })
  it('le stick gauche déplace le curseur (borné au canvas)', () => {
    const { a, c } = make()
    c.poll(pad(), 0.016) // initialise au centre
    c.poll(pad([1, 0]), 0.5)
    const last = (a.pointer as ReturnType<typeof vi.fn>).mock.calls.at(-1)!
    expect(last[0]).toBe('move')
    expect(last[1]).toBeGreaterThan(500)
    for (let i = 0; i < 20; i++) c.poll(pad([1, 0]), 0.5)
    expect((a.pointer as ReturnType<typeof vi.fn>).mock.calls.at(-1)![1]).toBe(1000)
  })
  it('A : pointeur enfoncé puis relâché', () => {
    const { a, c } = make()
    c.poll(pad(), 0.016)
    c.poll(pad([0, 0, 0, 0], [0]), 0.016)
    c.poll(pad([0, 0, 0, 0], [0]), 0.016)
    c.poll(pad(), 0.016)
    const types = (a.pointer as ReturnType<typeof vi.fn>).mock.calls.map((x) => x[0])
    expect(types).toEqual(['down', 'up'])
  })
  it('boutons sur front montant : LB/RB/X/Y/B/Start', () => {
    const { a, c } = make()
    c.poll(pad(), 0.016)
    c.poll(pad([0, 0, 0, 0], [4, 2, 3, 1, 9]), 0.016)
    c.poll(pad([0, 0, 0, 0], [4, 2, 3, 1, 9]), 0.016) // maintenu : pas de répétition (sauf nudge doux)
    expect(a.nudge).toHaveBeenCalledWith(-1)
    expect(a.toggleRotate).toHaveBeenCalledTimes(1)
    expect(a.capture).toHaveBeenCalledTimes(1)
    expect(a.discard).toHaveBeenCalledTimes(1)
    expect(a.start).toHaveBeenCalledTimes(1)
  })
  it('stick droit : rotation ; sans manette : curseur masqué', () => {
    const { a, c } = make()
    c.poll(pad([0, 0, 0.9, 0]), 0.1)
    expect(a.rotate).toHaveBeenCalled()
    c.poll(pad([0.5, 0]), 0.1) // curseur actif
    c.poll(null, 0.016)
    expect((a.cursor as ReturnType<typeof vi.fn>).mock.calls.at(-1)![2]).toBe(false)
  })
})
