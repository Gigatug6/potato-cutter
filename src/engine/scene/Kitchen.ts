import {
  BoxGeometry, Color, CylinderGeometry, DirectionalLight, EquirectangularReflectionMapping, Fog, Group, HemisphereLight,
  LinearSRGBColorSpace, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PMREMGenerator, PlaneGeometry, PointLight,
  RepeatWrapping, SRGBColorSpace, SphereGeometry, TextureLoader, Vector3, type BufferGeometry, type Material, type Scene,
  type Texture, type WebGLRenderer,
} from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { DEFAULT_DECOR, decorById, type DecorDef, type MoodStyle, type PropKind } from '../../game/data/decor'
import type { Ktx2Upgrader } from './ktx2'
import type { SceneTextures } from './textures'

export const BOARD_TOP = 0.1
export const FRYER_POS = new Vector3(2.15, BOARD_TOP, -0.5)

interface HdriEntry { equirect: Texture; env: Texture }

/** Décor de la cuisine : planche, murs, éclairage/HDRI, friteuse, objets. Reconstruit selon les décors équipés. */
export class Kitchen {
  readonly fryTarget: Vector3
  mood: MoodStyle
  /** équirectangulaire de l'ambiance courante (pour le path tracer) */
  equirect: Texture | null = null

  private readonly hemi = new HemisphereLight('#fff6e5', '#8a6a4a', 0.35)
  private readonly sun = new DirectionalLight('#fffbe8', 1.6)
  private readonly boardMat: MeshPhysicalMaterial
  private readonly wallMat = new MeshStandardMaterial({ roughness: 0.95 })
  private readonly props = new Group()
  private readonly wallGroup = new Group()
  private neon: Mesh | null = null
  private readonly loader = new TextureLoader()
  private readonly texCache = new Map<string, Texture>()
  private readonly hdriCache = new Map<string, HdriEntry>()
  private hdriWanted = ''
  private readonly disposables: { dispose(): void }[] = []
  private propDisposables: { dispose(): void }[] = []
  private flames: { mesh: Mesh; light: PointLight; phase: number }[] = []
  private time = 0
  private appliedKey = ''

  constructor(private readonly scene: Scene, private readonly tex: SceneTextures, private readonly renderer: WebGLRenderer, fallbackEnv: Texture, private readonly ktx2?: Ktx2Upgrader) {
    this.mood = decorById('mood-studio')!.mood!
    scene.background = new Color(this.mood.bg)
    scene.fog = new Fog(this.mood.bg, 25, 55)
    scene.environment = fallbackEnv
    scene.add(this.hemi)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.camera.left = -5; this.sun.shadow.camera.right = 5
    this.sun.shadow.camera.top = 5; this.sun.shadow.camera.bottom = -5
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.02
    this.sun.shadow.radius = 4
    scene.add(this.sun)

    this.boardMat = new MeshPhysicalMaterial({ map: tex.woodDiff, normalMap: tex.woodNor, roughness: 0.75 })
    const board = new Mesh(new BoxGeometry(7, 0.2, 4.4), this.boardMat)
    board.receiveShadow = true
    board.castShadow = true
    scene.add(board)
    this.disposables.push(board.geometry, this.boardMat, this.wallMat)

    const floor = new Mesh(new PlaneGeometry(60, 60), new MeshStandardMaterial({ color: '#a88c64', roughness: 1 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.11
    floor.receiveShadow = true
    scene.add(floor)
    this.disposables.push(floor.geometry, floor.material as Material)

    this.buildWalls()
    scene.add(this.wallGroup, this.props)
    this.fryTarget = this.buildFryer()
    this.apply(DEFAULT_DECOR)
  }

  // ---------- textures ----------

  private decorTex(name: string, file: 'diff' | 'nor', repeat: [number, number]): Texture {
    const key = `${name}:${file}:${repeat.join('x')}`
    let t = this.texCache.get(key)
    if (!t) {
      t = this.loader.load(`${import.meta.env.BASE_URL}decor/${name}_${file}.webp`)
      t.wrapS = t.wrapT = RepeatWrapping
      t.repeat.set(repeat[0], repeat[1])
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
      if (file === 'diff') t.colorSpace = SRGBColorSpace
      this.texCache.set(key, t)
      this.ktx2?.upgrade(t, `${import.meta.env.BASE_URL}decor/${name}_${file}.ktx2`, (k) => this.texCache.set(key, k))
    }
    return t
  }

  // ---------- application des décors ----------

  apply(ids: string[]): void {
    const key = [...ids].sort().join('|')
    if (key === this.appliedKey) return
    this.appliedKey = key
    const pick = (cat: DecorDef['category']) => ids.map(decorById).find((d) => d?.category === cat)
    this.applyBoard(pick('board'))
    this.applyWall(pick('wall'))
    this.applyMood(pick('mood')?.mood ?? decorById('mood-studio')!.mood!)
    this.buildProps(ids.map(decorById).filter((d): d is DecorDef => d?.category === 'prop'))
  }

  private applyBoard(def: DecorDef | undefined): void {
    const b = (def ?? decorById('board-wood')!).board!
    const m = this.boardMat
    if (b.tex) {
      m.map = this.decorTex(b.tex, 'diff', b.repeat)
      m.normalMap = this.decorTex(b.tex, 'nor', b.repeat)
    } else {
      m.map = this.tex.woodDiff
      m.normalMap = this.tex.woodNor
    }
    m.color.setRGB(b.tint[0], b.tint[1], b.tint[2], LinearSRGBColorSpace)
    m.roughness = b.roughness
    m.clearcoat = b.clearcoat
    m.clearcoatRoughness = 0.3
    m.needsUpdate = true
  }

  private applyWall(def: DecorDef | undefined): void {
    const w = (def ?? decorById('wall-plaster')!).wall!
    const m = this.wallMat
    m.map = this.decorTex(w.tex, 'diff', w.repeat)
    m.normalMap = this.decorTex(w.tex, 'nor', w.repeat)
    m.color.setRGB(w.tint[0], w.tint[1], w.tint[2], LinearSRGBColorSpace)
    m.roughness = w.roughness
    m.needsUpdate = true
  }

  private applyMood(mood: MoodStyle): void {
    this.mood = mood
    const e = mood.exposure
    this.sun.color.set(mood.sun.color)
    this.sun.intensity = mood.sun.intensity * e
    this.sun.position.set(...mood.sun.pos)
    this.hemi.intensity = mood.hemi * e
    const bg = new Color(mood.bg)
    this.scene.background = bg
    if (this.scene.fog) this.scene.fog.color.copy(bg)
    this.scene.environmentIntensity = mood.env * e
    this.loadHdri(mood.hdri)
    this.buildNeon(mood.neon)
  }

  private loadHdri(name: string): void {
    this.hdriWanted = name
    const cached = this.hdriCache.get(name)
    if (cached) {
      this.useHdri(name, cached)
      return
    }
    new RGBELoader().load(`${import.meta.env.BASE_URL}hdri/${name}.hdr`, (equirect) => {
      equirect.mapping = EquirectangularReflectionMapping
      const pmrem = new PMREMGenerator(this.renderer)
      const env = pmrem.fromEquirectangular(equirect).texture
      pmrem.dispose()
      const entry = { equirect, env }
      this.hdriCache.set(name, entry)
      this.disposables.push(equirect, env)
      if (this.hdriWanted === name) this.useHdri(name, entry)
    })
  }

  private useHdri(_name: string, entry: HdriEntry): void {
    this.scene.environment = entry.env
    this.equirect = entry.equirect
  }

  private buildNeon(color: string | undefined): void {
    if (this.neon) {
      this.wallGroup.remove(this.neon)
      ;(this.neon.material as Material).dispose()
      this.neon.geometry.dispose()
      this.neon = null
    }
    if (!color) return
    const mat = new MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: 4 })
    const tube = new Mesh(new BoxGeometry(5, 0.07, 0.07), mat)
    tube.position.set(0, 3.3, -3.25)
    this.neon = tube
    this.wallGroup.add(tube)
    const l = new PointLight(color, 25, 0, 2)
    l.position.set(0, 3.0, -2.6)
    tube.add(l)
  }

  private buildWalls(): void {
    const back = new Mesh(new PlaneGeometry(26, 9), this.wallMat)
    back.position.set(0, 4.3, -3.4)
    back.receiveShadow = true
    const mkSide = (x: number, ry: number) => {
      const s = new Mesh(new PlaneGeometry(16, 9), this.wallMat)
      s.position.set(x, 4.3, 3)
      s.rotation.y = ry
      s.receiveShadow = true
      return s
    }
    this.wallGroup.add(back, mkSide(-9, Math.PI / 2), mkSide(9, -Math.PI / 2))
    this.disposables.push(back.geometry)
  }

  private buildFryer(): Vector3 {
    const fryer = new Group()
    const steel = new MeshPhysicalMaterial({ color: '#b8bec4', metalness: 1, roughness: 0.22, clearcoat: 0.2 })
    const W = 1.15, H = 0.6, D = 1.15, T = 0.07
    const walls: [number, number, number, number, number, number][] = [
      [W, H, T, 0, H / 2, D / 2], [W, H, T, 0, H / 2, -D / 2], [T, H, D, W / 2, H / 2, 0], [T, H, D, -W / 2, H / 2, 0], [W, T, D, 0, T / 2, 0],
    ]
    for (const [w, h, d, x, y, z] of walls) {
      const m = new Mesh(new BoxGeometry(w, h, d), steel)
      m.position.set(x, y, z)
      m.castShadow = true
      m.receiveShadow = true
      fryer.add(m)
      this.disposables.push(m.geometry)
    }
    const oilMat = new MeshPhysicalMaterial({ color: '#b5650d', roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#5a2a00', emissiveIntensity: 0.25 })
    const oil = new Mesh(new PlaneGeometry(W - 2 * T, D - 2 * T), oilMat)
    oil.rotation.x = -Math.PI / 2
    oil.position.y = H * 0.72
    fryer.add(oil)
    const handleMat = new MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 })
    const handle = new Mesh(new BoxGeometry(0.7, 0.05, 0.07), handleMat)
    handle.position.set(0, H * 0.9, D / 2 + 0.25)
    fryer.add(handle)
    fryer.position.copy(FRYER_POS)
    this.scene.add(fryer)
    this.disposables.push(steel, oilMat, oil.geometry, handleMat, handle.geometry)
    return new Vector3(FRYER_POS.x, FRYER_POS.y + H * 0.85, FRYER_POS.z)
  }

  // ---------- objets ----------

  private buildProps(defs: DecorDef[]): void {
    this.props.clear()
    this.propDisposables.forEach((d) => d.dispose())
    this.propDisposables = []
    this.flames = []
    for (const d of defs) this.props.add(this.buildProp(d.prop!))
  }

  private track<T extends { dispose(): void }>(x: T): T {
    this.propDisposables.push(x)
    return x
  }

  private mesh(geo: BufferGeometry, mat: Material, x: number, y: number, z: number): Mesh {
    const m = new Mesh(this.track(geo), mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  private buildProp(kind: PropKind): Group {
    const g = new Group()
    const Y = BOARD_TOP
    if (kind === 'plant') {
      const pot = this.track(new MeshPhysicalMaterial({ color: '#b5583a', roughness: 0.7, clearcoat: 0.1 }))
      const soil = this.track(new MeshStandardMaterial({ color: '#2e1d12', roughness: 1 }))
      const leaf = this.track(new MeshPhysicalMaterial({ color: '#2f8f3a', roughness: 0.45, sheen: 0.6, sheenColor: new Color('#9fe59a') }))
      g.add(this.mesh(new CylinderGeometry(0.3, 0.22, 0.42, 20), pot, -3.0, Y + 0.21, -1.5))
      g.add(this.mesh(new CylinderGeometry(0.27, 0.27, 0.03, 20), soil, -3.0, Y + 0.41, -1.5))
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        const l = this.mesh(new SphereGeometry(0.2, 12, 8), leaf, -3.0 + Math.cos(a) * 0.17, Y + 0.72 + (i % 3) * 0.1, -1.5 + Math.sin(a) * 0.17)
        l.scale.set(0.6, 1.5, 0.25)
        l.rotation.set(Math.sin(a) * 0.6, -a, Math.cos(a) * 0.6)
        g.add(l)
      }
    } else if (kind === 'plates') {
      const ceramic = this.track(new MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }))
      for (let i = 0; i < 6; i++) g.add(this.mesh(new CylinderGeometry(0.5, 0.36, 0.055, 32), ceramic, -2.7 + (i % 2) * 0.01, Y + 0.03 + i * 0.058, 1.1))
    } else if (kind === 'spices') {
      const glass = this.track(new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, transmission: 0.92, thickness: 0.2, ior: 1.45 }))
      const lid = this.track(new MeshStandardMaterial({ color: '#30302e', metalness: 0.8, roughness: 0.3 }))
      const cols = ['#c2431b', '#e0a81a', '#e9e1cf']
      cols.forEach((c, i) => {
        const x = 2.45 + i * 0.36, z = -1.85 + (i % 2) * 0.12
        g.add(this.mesh(new CylinderGeometry(0.15, 0.15, 0.38, 20), glass, x, Y + 0.19, z))
        g.add(this.mesh(new CylinderGeometry(0.135, 0.135, 0.3, 20), this.track(new MeshStandardMaterial({ color: c, roughness: 1 })), x, Y + 0.17, z))
        g.add(this.mesh(new CylinderGeometry(0.155, 0.155, 0.06, 20), lid, x, Y + 0.41, z))
      })
    } else if (kind === 'candles') {
      const wax = this.track(new MeshPhysicalMaterial({ color: '#f3e8cf', roughness: 0.35, sheen: 0.4 }))
      const flameMat = this.track(new MeshStandardMaterial({ color: '#000000', emissive: '#ffb347', emissiveIntensity: 6 }))
      ;[[-1.5, -1.85, 0.45], [-1.15, -1.7, 0.32], [-1.3, -1.45, 0.25]].forEach(([x, z, h], i) => {
        g.add(this.mesh(new CylinderGeometry(0.08, 0.08, h, 16), wax, x, Y + h / 2, z))
        const flame = this.mesh(new SphereGeometry(0.045, 10, 8), flameMat, x, Y + h + 0.06, z)
        flame.scale.set(0.8, 1.5, 0.8)
        flame.castShadow = false
        const light = new PointLight('#ffb060', 2.2, 4.5, 2)
        light.position.copy(flame.position)
        g.add(flame, light)
        this.flames.push({ mesh: flame, light, phase: i * 1.7 })
      })
    } else if (kind === 'lamp') {
      const metal = this.track(new MeshPhysicalMaterial({ color: '#d9c38a', metalness: 1, roughness: 0.25, side: 2 }))
      const cord = this.track(new MeshStandardMaterial({ color: '#111111' }))
      const bulbMat = this.track(new MeshStandardMaterial({ color: '#000000', emissive: '#ffd9a0', emissiveIntensity: 7 }))
      g.add(this.mesh(new CylinderGeometry(0.012, 0.012, 3, 6), cord, 0.6, 5.7, -1.4))
      const shade = this.mesh(new CylinderGeometry(0.12, 0.6, 0.45, 32, 1, true), metal, 0.6, 4.25, -1.4)
      g.add(shade)
      const bulb = this.mesh(new SphereGeometry(0.14, 16, 12), bulbMat, 0.6, 4.1, -1.4)
      bulb.castShadow = false
      g.add(bulb)
      const light = new PointLight('#ffd9a0', 38, 0, 2)
      light.position.set(0.6, 3.9, -1.4)
      light.castShadow = true
      light.shadow.mapSize.set(512, 512)
      g.add(light)
    }
    return g
  }

  update(dt: number): void {
    this.time += dt
    for (const f of this.flames) {
      const k = 1 + Math.sin(this.time * 9 + f.phase) * 0.12 + Math.sin(this.time * 23 + f.phase * 2) * 0.06
      f.light.intensity = 2.2 * k
      f.mesh.scale.set(0.8, 1.5 * k, 0.8)
    }
    if (this.neon) (this.neon.material as MeshStandardMaterial).emissiveIntensity = 4 + Math.sin(this.time * 2.2) * 0.7
  }

  dispose(): void {
    this.propDisposables.forEach((d) => d.dispose())
    this.disposables.forEach((d) => d.dispose())
    this.texCache.forEach((t) => t.dispose())
  }
}
