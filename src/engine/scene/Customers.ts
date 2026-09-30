import {
  BoxGeometry, CapsuleGeometry, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type BufferGeometry,
} from 'three'

/** Clients de restaurant (un par commande) : arrivent, attendent, sautent de joie quand ils sont servis, repartent. */

const SLOTS = [-1.95, 0, 1.95]
const Z = -2.95
const FLOOR = -0.11
const OFFSTAGE = 7.5

type State = 'arriving' | 'idle' | 'happy' | 'leaving'

interface Customer { id: string; group: Group; slot: number; state: State; t: number; fromX: number; toX: number; head: Mesh }

export const hashString = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const SKIN = ['#f1c8a5', '#e0a77e', '#c68863', '#8d5a3a', '#f6d7bd']
const SHIRT = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad', '#e67e22', '#16a085', '#d4ac0d']

export class Customers {
  readonly group = new Group()
  private list: Customer[] = []
  private time = 0
  private readonly geos: BufferGeometry[] = []
  private readonly mats = new Map<string, MeshStandardMaterial>()
  private readonly body = this.g(new CapsuleGeometry(0.34, 0.85, 6, 14))
  private readonly headG = this.g(new SphereGeometry(0.28, 18, 14))
  private readonly eyeG = this.g(new SphereGeometry(0.035, 8, 6))
  private readonly toqueG = this.g(new CylinderGeometry(0.2, 0.22, 0.32, 14))
  private readonly toqueTopG = this.g(new SphereGeometry(0.26, 14, 10))
  private readonly capG = this.g(new SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2))
  private readonly mustG = this.g(new BoxGeometry(0.2, 0.04, 0.05))
  private readonly armG = this.g(new CapsuleGeometry(0.08, 0.5, 4, 8))

  private g<T extends BufferGeometry>(geo: T): T {
    this.geos.push(geo)
    return geo
  }

  private mat(color: string, rough = 0.7): MeshStandardMaterial {
    const key = `${color}:${rough}`
    let m = this.mats.get(key)
    if (!m) { m = new MeshStandardMaterial({ color: new Color(color), roughness: rough }); this.mats.set(key, m) }
    return m
  }

  get count(): number { return this.list.length }

  private build(id: string): { group: Group; head: Mesh } {
    const h = hashString(id)
    const g = new Group()
    const skin = this.mat(SKIN[h % SKIN.length], 0.6)
    const shirt = this.mat(SHIRT[(h >>> 3) % SHIRT.length])
    const torso = new Mesh(this.body, shirt)
    torso.position.y = 0.88
    const head = new Mesh(this.headG, skin)
    head.position.y = 1.78
    for (const x of [-0.1, 0.1]) {
      const eye = new Mesh(this.eyeG, this.mat('#1b1b1b', 0.3))
      eye.position.set(x, 0.04, 0.25)
      head.add(eye)
    }
    const hat = (h >>> 6) % 4
    if (hat === 1) { // toque de chef
      const a = new Mesh(this.toqueG, this.mat('#fafafa'))
      a.position.y = 0.33
      const b = new Mesh(this.toqueTopG, this.mat('#fafafa'))
      b.position.y = 0.58
      head.add(a, b)
    } else if (hat === 2) { // casquette
      const c = new Mesh(this.capG, this.mat(SHIRT[(h >>> 9) % SHIRT.length]))
      c.position.y = 0.06
      head.add(c)
    } else if (hat === 3) { // cheveux
      const c = new Mesh(this.capG, this.mat(['#2b1d12', '#6b4423', '#d9b36c', '#8a8a8a'][(h >>> 9) % 4], 0.9))
      c.position.y = 0.03
      c.scale.set(1.02, 1.05, 1.02)
      head.add(c)
    }
    if ((h >>> 12) % 3 === 0) {
      const m = new Mesh(this.mustG, this.mat('#2b1d12', 0.9))
      m.position.set(0, -0.08, 0.26)
      head.add(m)
    }
    for (const side of [-1, 1]) {
      const arm = new Mesh(this.armG, shirt)
      arm.position.set(side * 0.44, 0.92, 0)
      arm.rotation.z = side * 0.12
      g.add(arm)
    }
    g.add(torso, head)
    g.scale.setScalar(0.85)
    g.traverse((o) => { o.castShadow = true })
    return { group: g, head }
  }

  /** Synchronise les clients avec les commandes ; `delivered` : commandes servies (le client saute puis part). */
  setOrders(ids: string[], delivered: ReadonlySet<string>): void {
    for (const c of this.list) {
      if (!ids.includes(c.id) && c.state !== 'leaving' && c.state !== 'happy') this.startLeaving(c, delivered.has(c.id))
      else if (!ids.includes(c.id) && delivered.has(c.id) && c.state === 'idle') this.startLeaving(c, true)
    }
    for (const id of ids) {
      if (this.list.some((c) => c.id === id)) continue
      const used = new Set(this.list.filter((c) => c.state !== 'leaving' && c.state !== 'happy').map((c) => c.slot))
      const slot = SLOTS.findIndex((_, i) => !used.has(i))
      if (slot === -1) continue
      const { group, head } = this.build(id)
      const fromX = slot < 1 ? -OFFSTAGE : OFFSTAGE
      group.position.set(fromX, FLOOR, Z)
      this.group.add(group)
      this.list.push({ id, group, slot, state: 'arriving', t: 0, fromX, toX: SLOTS[slot], head })
    }
  }

  private startLeaving(c: Customer, happy: boolean): void {
    c.state = happy ? 'happy' : 'leaving'
    c.t = 0
    c.fromX = c.group.position.x
    c.toX = c.fromX < 0 ? -OFFSTAGE : OFFSTAGE
  }

  update(dt: number): void {
    this.time += dt
    for (const c of [...this.list]) {
      c.t += dt
      const g = c.group
      if (c.state === 'arriving') {
        const u = Math.min(1, c.t / 1.3)
        g.position.x = c.fromX + (c.toX - c.fromX) * (u * u * (3 - 2 * u))
        g.position.y = FLOOR + Math.abs(Math.sin(c.t * 9)) * 0.08 * (1 - u)
        g.rotation.y = 0
        if (u >= 1) { c.state = 'idle'; c.t = 0 }
      } else if (c.state === 'idle') {
        g.position.y = FLOOR + Math.sin(this.time * 2 + c.slot) * 0.02
        c.head.rotation.z = Math.sin(this.time * 1.3 + c.slot * 2) * 0.07
        g.rotation.y = Math.sin(this.time * 0.7 + c.slot) * 0.12
      } else if (c.state === 'happy') {
        const u = Math.min(1, c.t / 1.0)
        g.position.y = FLOOR + Math.abs(Math.sin(u * Math.PI * 3)) * 0.45
        g.rotation.y = u * Math.PI * 2
        if (u >= 1) { c.state = 'leaving'; c.t = 0; g.rotation.y = 0 }
      } else {
        const u = Math.min(1, c.t / 1.6)
        g.position.x = c.fromX + (c.toX - c.fromX) * u * u
        g.position.y = FLOOR + Math.abs(Math.sin(c.t * 9)) * 0.08
        if (u >= 1) this.remove(c)
      }
    }
  }

  private remove(c: Customer): void {
    this.group.remove(c.group)
    this.list = this.list.filter((x) => x !== c)
  }

  /** Clients en attente (pour les bulles) : id + position monde au-dessus de la tête. */
  waiting(): { id: string; x: number; y: number; z: number }[] {
    return this.list
      .filter((c) => c.state === 'idle' || c.state === 'arriving')
      .map((c) => ({ id: c.id, x: c.group.position.x, y: c.group.position.y + 2.12, z: Z }))
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose())
    this.mats.forEach((m) => m.dispose())
    this.list = []
  }
}
