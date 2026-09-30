import type { Engine } from './Engine'

/** Référence non réactive vers le moteur courant (pour l'UI : bouton « Terminer », debug). */
export const engineRef: { current: Engine | null } = { current: null }
