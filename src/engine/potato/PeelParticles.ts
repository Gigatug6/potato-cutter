import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial, Vector3 } from 'three'

const N = 200

/** Copeaux d'épluchure : pool de points avec gravité. */
export class PeelParticles {
  readonly points: Points
  private readonly pos = new Float32Array(N * 3)
  private readonly vel: Vector3[] = Array.from({ length: N }, () => new Vector3())
  private readonly life = new Float32Array(N)
  private next = 0

  constructor() {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(this.pos, 3))
    this.points = new Points(g, new PointsMaterial({ color: '#8a5a2b', size: 0.07, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    this.points.frustumCulled = false
    this.pos.fill(-999)
  }

  emit(at: Vector3, count = 3): void {
    for (let c = 0; c < count; c++) {
      const i = this.next++ % N
      this.pos.set([at.x, at.y, at.z], i * 3)
      this.vel[i].set((Math.random() - 0.5) * 1.2, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2)
      this.life[i] = 0.8
    }
  }

  update(dt: number): void {
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] -= dt
      const v = this.vel[i]
      v.y -= 5 * dt
      this.pos[i * 3] += v.x * dt
      this.pos[i * 3 + 1] += v.y * dt
      this.pos[i * 3 + 2] += v.z * dt
      if (this.life[i] <= 0) this.pos.set([0, -999, 0], i * 3)
    }
    ;(this.points.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true
  }

  dispose(): void {
    this.points.geometry.dispose()
    ;(this.points.material as PointsMaterial).dispose()
  }
}
