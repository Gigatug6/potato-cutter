export interface AchievementContext {
  potatoes: number
  sGrades: number
  streak: number
  totalEarned: number
  knivesOwned: number
  knivesTotal: number
  rareKnives: number
  legendaryKnives: number
  potatoKinds: number
  potatoKindsTotal: number
  upgradeMaxed: number
  decorOwned: number
  ordersDelivered: number
  challenges: number
  bestChallengeScore: number
  photos: number
  crates: number
}

export interface AchievementDef { id: string; icon: string; name: string; description: string; reward: number; test: (c: AchievementContext) => boolean; progress?: (c: AchievementContext) => [number, number] }

const count = (id: string, icon: string, name: string, description: string, reward: number, get: (c: AchievementContext) => number, target: number): AchievementDef =>
  ({ id, icon, name, description, reward, test: (c) => get(c) >= target, progress: (c) => [Math.min(get(c), target), target] })

export const ACHIEVEMENTS: AchievementDef[] = [
  count('first-potato', '🥔', 'Première patate', 'Coupe ta première patate.', 50, (c) => c.potatoes, 1),
  count('potatoes-10', '🔪', 'Commis de cuisine', 'Coupe 10 patates.', 100, (c) => c.potatoes, 10),
  count('potatoes-50', '👨‍🍳', 'Chef de partie', 'Coupe 50 patates.', 400, (c) => c.potatoes, 50),
  count('potatoes-250', '🏅', 'Maître patatier', 'Coupe 250 patates.', 2000, (c) => c.potatoes, 250),
  count('grade-s', '⭐', 'Perfection', 'Obtiens une note S.', 150, (c) => c.sGrades, 1),
  count('grade-s-10', '🌟', 'Main de maître', 'Obtiens 10 notes S.', 1000, (c) => c.sGrades, 10),
  count('streak-5', '🔥', 'Série de feu', 'Enchaîne 5 notes A ou S.', 300, (c) => c.streak, 5),
  count('rich-1k', '💰', 'Petit pécule', 'Gagne 1 000 Patacoins au total.', 100, (c) => c.totalEarned, 1000),
  count('rich-10k', '🏦', 'Patate-millionnaire', 'Gagne 10 000 Patacoins au total.', 500, (c) => c.totalEarned, 10000),
  count('rich-100k', '💎', 'Empire de la frite', 'Gagne 100 000 Patacoins au total.', 5000, (c) => c.totalEarned, 100000),
  count('knife-rare', '🗡️', 'Lame affûtée', 'Possède un couteau rare ou mieux.', 200, (c) => c.rareKnives, 1),
  count('knife-legend', '⚔️', 'Légende', 'Possède un couteau légendaire.', 1500, (c) => c.legendaryKnives, 1),
  { id: 'collector', icon: '🗃️', name: 'Collectionneur', description: 'Possède tous les couteaux.', reward: 3000,
    test: (c) => c.knivesOwned >= c.knivesTotal, progress: (c) => [c.knivesOwned, c.knivesTotal] },
  count('potato-3', '🍠', 'Curieux', 'Débloque 3 variétés de patates.', 300, (c) => c.potatoKinds, 3),
  { id: 'potato-all', icon: '🌈', name: 'Jardinier', description: 'Débloque toutes les variétés de patates.', reward: 2500,
    test: (c) => c.potatoKinds >= c.potatoKindsTotal, progress: (c) => [c.potatoKinds, c.potatoKindsTotal] },
  count('upgrade-max', '⚙️', 'Optimiseur', 'Amène une amélioration au niveau maximum.', 800, (c) => c.upgradeMaxed, 1),
  count('decorator', '🏠', 'Décorateur', 'Possède 6 décors.', 400, (c) => c.decorOwned, 6),
  count('orders-5', '🍽️', 'Service impeccable', 'Livre 5 commandes.', 300, (c) => c.ordersDelivered, 5),
  count('challenge-1', '⏱️', 'Contre la montre', 'Termine un chrono.', 150, (c) => c.challenges, 1),
  count('challenge-500', '🏆', 'Coup de feu', 'Marque 500 🥔 en un chrono.', 1000, (c) => c.bestChallengeScore, 500),
  count('photo-1', '📸', 'Photographe', 'Prends une capture ou une photo ray tracing.', 100, (c) => c.photos, 1),
  count('crate-10', '📦', 'Déballeur', 'Ouvre 10 caisses mystère.', 500, (c) => c.crates, 10),
]

export const achievementById = (id: string): AchievementDef | undefined => ACHIEVEMENTS.find((a) => a.id === id)

/** Succès nouvellement débloqués pour ce contexte. */
export function newlyUnlocked(ctx: AchievementContext, unlocked: readonly string[]): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.includes(a.id) && a.test(ctx))
}
