import { describe, expect, it, vi } from 'vitest'
import { Emitter } from './events'

describe('Emitter', () => {
  it('émet et se désabonne', () => {
    const e = new Emitter<{ a: number }>()
    const fn = vi.fn()
    const off = e.on('a', fn)
    e.emit('a', 1)
    off()
    e.emit('a', 2)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)
  })
})
