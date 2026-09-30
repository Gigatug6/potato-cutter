import type { Engine } from './engine/Engine'
import type { CutModeId } from './game/cutting/cutModes'
import type { Axis } from './game/potato/potatoShape'
import { useGameStore } from './stores/game'
import { useProfileStore } from './stores/profile'

/** window.__potato : API de test déterministe (DEV ou VITE_E2E=1 uniquement). */
export function installDebug(engine: Engine): () => void {
  if (!(import.meta.env.DEV || import.meta.env.VITE_E2E === '1')) return () => {}
  const game = useGameStore()
  const profile = useProfileStore()
  const api = {
    getState: () => ({
      phase: game.phase,
      screen: game.screen,
      mode: game.round?.mode ?? null,
      peelCoverage: engine.peelCoverage,
      cutCount: engine.cutCount,
      pieceCount: engine.pieceCount,
      money: profile.money,
      frames: engine.frames,
      result: game.round?.result ?? null,
      ...engine.renderInfo,
    }),
    startRound: (mode: CutModeId = 'rondelles', seed = 42) => game.startRound(mode, seed),
    peelFraction: (f: number) => engine.debugPeel(f),
    peelAll: () => engine.debugPeel(1),
    goToCutting: () => game.goToCutting(),
    cutAt: (axis: Axis, pos: number) => engine.cutAtLocal(axis, pos) === 'ok',
    finishRound: () => engine.finish(),
    addMoney: (n: number) => profile.earn(n),
  }
  ;(window as unknown as { __potato?: typeof api }).__potato = api
  return () => { delete (window as unknown as { __potato?: typeof api }).__potato }
}
