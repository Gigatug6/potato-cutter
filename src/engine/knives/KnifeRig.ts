import type { Group } from 'three'
import type { KnifeDef } from '../../game/data/knives'
import { buildKnife, type KnifeObject } from './buildKnife'

const HIGH = 3.4
const LOW = 0.7

/** Couteau équipé + animation de coupe (descente, contact, remontée). */
export class KnifeRig {
  readonly group: Group
  private knife: KnifeObject
  private t = 1
  private duration = 0.35
  private time = 0

  constructor(def: KnifeDef) {
    this.knife = buildKnife(def)
    this.group = this.knife.group
    this.group.position.y = HIGH
    this.group.visible = false
  }

  setKnife(def: KnifeDef): void {
    const parent = this.group.parent
    const x = this.group.position.x
    this.knife.dispose()
    this.group.clear()
    this.knife = buildKnife(def)
    // transfère les enfants du nouveau couteau dans notre groupe
    while (this.knife.group.children.length) this.group.add(this.knife.group.children[0])
    this.group.position.x = x
    void parent
  }

  show(v: boolean): void {
    this.group.visible = v
  }

  /** Lance une coupe à la position monde x. */
  chop(worldX: number, speed: number): void {
    this.group.position.x = worldX
    this.group.visible = true
    this.duration = 0.35 / speed
    this.t = 0
  }

  update(dt: number): void {
    this.time += dt
    this.knife.update(this.time)
    if (this.t >= 1) {
      this.group.position.y += (HIGH - this.group.position.y) * Math.min(1, dt * 6)
      return
    }
    this.t = Math.min(1, this.t + dt / this.duration)
    // 0→0.45 descente, 0.45→1 remontée
    const k = this.t < 0.45 ? this.t / 0.45 : 1 - (this.t - 0.45) / 0.55
    const e = k * k * (3 - 2 * k)
    this.group.position.y = HIGH + (LOW - HIGH) * e
  }

  dispose(): void {
    this.knife.dispose()
  }
}
