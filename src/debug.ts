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
      seed: game.round?.seed ?? null,
      bad: game.round?.bad ?? null,
      challenge: game.challenge ? { ...game.challenge } : null,
      peelCoverage: engine.peelCoverage,
      cutCount: engine.cutCount,
      pieceCount: engine.pieceCount,
      money: profile.money,
      frames: engine.frames,
      photo: { active: engine.photoActive, samples: engine.photoSamples },
      result: game.round?.result ?? null,
      ...engine.renderInfo,
    }),
    startRound: (mode: CutModeId = 'rondelles', seed = 42, bad: 'green' | 'rotten' | null = null) => game.startRound(mode, seed, bad),
    unlockPotato: (id: string) => { if (!profile.hasPotato(id)) profile.unlockedPotatoes = [...profile.unlockedPotatoes, id]; profile.selectPotato(id) },
    setUpgrade: (id: string, level: number) => { profile.upgrades = { ...profile.upgrades, [id]: level } },
    peelFraction: (f: number) => engine.debugPeel(f),
    peelAll: () => engine.debugPeel(1),
    goToCutting: () => game.goToCutting(),
    cutAt: (axis: Axis, pos: number) => engine.cutAtLocal(axis, pos) === 'ok',
    startPhoto: () => engine.startPhoto(),
    stopPhoto: () => engine.stopPhoto(),
    finishRound: () => engine.finish(),
    completeQuests: () => profile.quests?.items.forEach((q) => { q.progress = q.target }),
    setOrders: (o: typeof profile.orders) => { profile.orders = o },
    setChallengeEnd: (ms: number) => { if (game.challenge) game.challenge.endsAt = Date.now() + ms },
    addMoney: (n: number) => profile.earn(n),
  }
  ;(window as unknown as { __potato?: typeof api }).__potato = api
  return () => { delete (window as unknown as { __potato?: typeof api }).__potato }
}
