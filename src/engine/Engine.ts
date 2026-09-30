import {
  BoxGeometry, Clock, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, Quaternion, Raycaster,
  Scene, Vector2, Vector3, WebGLRenderer, Euler, type Texture,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ACESFilmicToneMapping, NoToneMapping } from 'three'
import { Emitter } from '../game/core/events'
import { CUT_MODES, type CutModeId } from '../game/cutting/cutModes'
import { CutPlan, cellsFromCuts, idealPositions, type AddCutResult, type Bounds, type Cuts } from '../game/cutting/cutPlan'
import type { KnifeDef } from '../game/data/knives'
import { PeelMap } from '../game/potato/peelMap'
import { BAD_LOOKS, STARTER_POTATO_ID, potatoById, type BadKind, type PotatoKind } from '../game/data/potatoes'
import { createPotatoShape, extentAlong, type Axis, type PotatoShape, type Vec3 } from '../game/potato/potatoShape'
import { applyPrecision } from '../game/scoring/scoring'
import { PiecesGroup } from './cutting/PiecesGroup'
import { KnifeRig } from './knives/KnifeRig'
import { PeelParticles } from './potato/PeelParticles'
import { PeelStrips } from './potato/PeelStrips'
import { PeelerTool } from './potato/PeelerTool'
import { autoPeelSpeed } from '../game/data/upgrades'
import { radiusAt } from '../game/potato/potatoShape'
import { PotatoMesh, type PotatoLook } from './potato/PotatoMesh'
import { BOARD_TOP, Kitchen } from './scene/Kitchen'
import type { PostFx } from './fx/PostFx'
import type { PathTraceSession } from './fx/PathTraceSession'
import { MeshPhysicalMaterial } from 'three'
import type { Quality } from '../game/save/saveSchema'
import { createEnvironment } from './scene/env'
import { loadTextures, type SceneTextures } from './scene/textures'

export interface EngineEvents extends Record<string, unknown> {
  peelProgress: number
  cut: { pieceCount: number; cutCount: number; screen: { x: number; y: number } }
  cutRejected: AddCutResult
  passComplete: Axis
  allCutsDone: undefined
  finished: { bounds: Bounds; cuts: Cuts }
  contextLost: undefined
  fried: undefined
  photo: { active: boolean; samples: number; compiling: boolean; error?: string }
}

export interface RoundOptions {
  kind?: PotatoKind
  bad?: BadKind | null
  /** facteur de taille (amélioration « grosses patates ») */
  scale?: number
  /** niveau de l'éplucheur automatique (0 = aucun) */
  autoPeelLevel?: number
}

export interface EngineOptions { adaptive?: boolean; pixelRatioCap?: number; reducedMotion?: boolean; knife: KnifeDef; quality?: Quality; decor?: string[] }

/** rayon (rad) de l'éplucheur sur la patate : grande lame, épluche large */
const PEEL_RADIUS = 0.32
const AUTO_PEEL_RADIUS = 0.28
const DEFAULT_POTATO_Y = BOARD_TOP + 0.95
const CAM_PEEL = new Vector3(0, 3.6, 5)
const CAM_CUT = new Vector3(0, 4.2, 3.4)
const LOOK = new Vector3(0, DEFAULT_POTATO_Y - 0.2, 0)
const AXIS_ROT: Record<Axis, Quaternion> = {
  x: new Quaternion(),
  y: new Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2)),
  z: new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0)),
}

type Mode = 'idle' | 'peeling' | 'cutting'

/** Moteur three.js impératif. Jamais exposé au système réactif de Vue. */
export class Engine {
  readonly events = new Emitter<EngineEvents>()
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(45, 1, 0.1, 100)
  private readonly controls: OrbitControls
  private readonly clock = new Clock()
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly potatoGroup = new Group()
  private readonly particles = new PeelParticles()
  private readonly pieces = new PiecesGroup()
  private readonly rig: KnifeRig
  private readonly guide: Mesh
  private readonly resizeObs: ResizeObserver
  private readonly env: Texture
  private readonly tex: SceneTextures
  private rotateMode = false
  private rotating = false
  private readonly lastRot = new Vector2()
  private readonly canvas: HTMLCanvasElement

  private mode: Mode = 'idle'
  private shape: PotatoShape | null = null
  private peel = new PeelMap()
  private potato: PotatoMesh | null = null
  private plan: CutPlan | null = null
  bounds: Bounds | null = null
  private knife: KnifeDef
  private reducedMotion: boolean
  private peeling = false
  private lastDir: Vec3 | null = null
  private lastProgress = 0
  private targetQuat = new Quaternion()
  private camTarget: Vector3 | null = null
  private camBase: Vector3 = CAM_PEEL
  private shake = 0
  frames = 0
  private fryTarget = new Vector3()
  private kitchen!: Kitchen
  private fx: PostFx | null = null
  private quality: Quality = 'low'
  private time = 0
  private photo: { session: PathTraceSession; restore: () => void; lastCam: Vector3; lastQuat: Quaternion; wantSave: boolean } | null = null
  private photoTick = 0
  private fxToken = 0
  private paused = false
  private adaptive = false
  private pixelCap = 2
  private pixelNow = 1
  private frameAcc = 0
  private frameN = 0
  private lastAdapt = 0
  private kbX = 0
  private disposed = false
  private readonly juice = new PeelParticles('#f3e3a0', 0.06, 5)
  private readonly coins = new PeelParticles('#ffc933', 0.1, 4)
  private readonly oilFx = new PeelParticles('#ffd27a', 0.05, 2)
  private readonly strips: PeelStrips
  private readonly peeler: PeelerTool
  private lastStrip = 0
  private hoverPeeler = false
  private autoPeelLevel = 0
  private autoT = 0
  private autoLast: Vec3 | null = null
  private autoAcc = 0
  private fryToken = 0
  private skipFry = false
  private colors = { flesh: [0.72, 0.6, 0.3] as Vec3, skin: [0.18, 0.1, 0.04] as Vec3 }

  constructor(private readonly container: HTMLElement, opts: EngineOptions) {
    this.knife = opts.knife
    this.reducedMotion = !!opts.reducedMotion
    this.renderer = new WebGLRenderer({ antialias: true })
    this.pixelCap = opts.pixelRatioCap ?? 2
    this.adaptive = !!opts.adaptive
    this.pixelNow = Math.min(window.devicePixelRatio || 1, this.pixelCap)
    this.renderer.setPixelRatio(this.pixelNow)
    this.renderer.shadowMap.enabled = true
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.canvas = this.renderer.domElement
    this.canvas.setAttribute('role', 'application')
    this.canvas.setAttribute('aria-label', 'Plan de travail 3D : éplucher et trancher la patate (flèches gauche/droite pour placer le couteau, Entrée pour trancher)')
    this.canvas.tabIndex = 0
    this.canvas.style.touchAction = 'none'
    this.canvas.style.display = 'block'
    container.appendChild(this.canvas)

    this.tex = loadTextures(this.renderer)
    this.env = createEnvironment(this.renderer)
    this.kitchen = new Kitchen(this.scene, this.tex, this.renderer, this.env)
    this.fryTarget = this.kitchen.fryTarget
    if (opts.decor) this.kitchen.apply(opts.decor)
    this.potatoGroup.position.set(0, DEFAULT_POTATO_Y, 0)
    this.potatoGroup.add(this.pieces.group)
    this.scene.add(this.potatoGroup, this.particles.points, this.juice.points, this.coins.points, this.oilFx.points)
    this.strips = new PeelStrips(this.tex, potatoById(STARTER_POTATO_ID)!)
    this.peeler = new PeelerTool(this.tex)
    this.scene.add(this.strips.mesh, this.peeler.group)
    this.pieces.setLook(this.tex, potatoById(STARTER_POTATO_ID)!)
    this.rig = new KnifeRig(this.knife)
    this.scene.add(this.rig.group)
    this.guide = new Mesh(new BoxGeometry(0.012, 1.6, 1.8), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }))
    this.guide.position.y = DEFAULT_POTATO_Y
    this.guide.visible = false
    this.scene.add(this.guide)

    this.camera.position.copy(CAM_PEEL)
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.target.copy(LOOK)
    this.controls.enablePan = false
    this.controls.minDistance = 3
    this.controls.maxDistance = 16
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.enableDamping = true
    this.controls.update()

    this.canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.canvas.addEventListener('contextmenu', this.onContext)
    this.canvas.addEventListener('pointerdown', this.onDown)
    this.canvas.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(container)
    this.resize()
    this.setQuality(opts.quality ?? 'low')
    this.renderer.setAnimationLoop(this.tick)
  }

  // ---------- API publique ----------

  startRound(modeId: CutModeId, seed: number, opts: RoundOptions = {}): void {
    this.clearRound()
    const kind = opts.kind ?? potatoById(STARTER_POTATO_ID)!
    const look: PotatoLook = opts.bad ? BAD_LOOKS[opts.bad] : kind
    this.colors = { flesh: look.flesh, skin: look.skinPiece }
    this.pieces.colors = this.colors
    this.pieces.setLook(this.tex, look)
    this.strips.reset()
    this.strips.setLook(look)
    this.peeler.show(false)
    this.shape = createPotatoShape(seed, kind.radiiMult, opts.scale ?? 1)
    this.peel = new PeelMap()
    this.potato = new PotatoMesh(this.shape, this.peel, this.tex, look)
    this.autoPeelLevel = opts.autoPeelLevel ?? 0
    this.autoT = 0
    this.autoLast = null
    this.potatoGroup.add(this.potato.mesh)
    this.potatoGroup.quaternion.identity()
    this.targetQuat.identity()
    this.bounds = {
      x: extentAlong(this.shape, 'x'), y: extentAlong(this.shape, 'y'), z: extentAlong(this.shape, 'z'),
    }
    // la patate repose sur la planche quelle que soit sa taille
    this.potatoGroup.position.y = BOARD_TOP - this.bounds.y[0] + 0.01
    this.guide.position.y = this.potatoGroup.position.y
    this.plan = new CutPlan(CUT_MODES[modeId], this.bounds)
    this.mode = 'peeling'
    this.controls.enabled = true
    this.setCamBase(CAM_PEEL)
    this.rig.show(false)
    this.guide.visible = false
    this.events.emit('peelProgress', 0)
  }

  beginCutting(): void {
    if (!this.plan || this.mode !== 'peeling') return
    this.mode = 'cutting'
    this.peeling = false
    this.controls.enabled = false
    this.setCamBase(CAM_CUT)
    this.alignToCurrentAxis()
    this.rig.show(true)
  }

  /** Coupe brute à une position locale sur l'axe. Renvoie le résultat du plan. */
  cutAtLocal(axis: Axis, pos: number): AddCutResult {
    const plan = this.plan
    if (!plan || !this.shape || this.mode !== 'cutting') return 'passFull'
    const before = plan.passIndex
    const res = plan.addCut(axis, pos)
    if (res !== 'ok') {
      this.events.emit('cutRejected', res)
      return res
    }
    this.potato && (this.potato.mesh.visible = false)
    this.rebuildPieces()
    this.rig.chop(this.potatoGroup.position.x + pos, this.knife.stats.speed)
    if (!this.reducedMotion) this.shake = 0.08
    const worldX = this.potatoGroup.position.x + pos
    this.juice.emit(new Vector3(worldX, this.potatoGroup.position.y, 0), 26, 1.6, 0.7)
    this.events.emit('cut', { pieceCount: this.pieces.count, cutCount: plan.cutCount, screen: this.project(worldX, this.potatoGroup.position.y + 0.8, 0) })
    if (plan.passIndex !== before) {
      this.events.emit('passComplete', axis)
      if (plan.isComplete) this.events.emit('allCutsDone', undefined)
      else this.alignToCurrentAxis()
    }
    return res
  }

  finish(): void {
    if (!this.plan || !this.bounds) return
    this.events.emit('finished', { bounds: this.bounds, cuts: this.plan.cuts })
    this.guide.visible = false
    this.mode = 'idle'
    this.rig.show(false)
    this.coins.emit(this.potatoGroup.position.clone(), 40, 2.2, 2.2)
    const token = ++this.fryToken
    if (this.skipFry || this.reducedMotion || this.pieces.count === 0) {
      this.events.emit('fried', undefined)
      return
    }
    this.pieces.launch(this.scene, this.fryTarget, (p) => this.oilFx.emit(p, 2, 0.5, 1.4), () => {
      if (token === this.fryToken) this.events.emit('fried', undefined)
    })
  }

  setSkipFry(v: boolean): void {
    this.skipFry = v
  }

  /** Mode « tourner » : glisser fait pivoter la patate elle-même (aussi : clic droit ou Maj + glisser). */
  setRotateMode(v: boolean): void {
    this.rotateMode = v
  }

  setKnife(def: KnifeDef): void {
    this.knife = def
    this.rig.setKnife(def)
  }

  /** Qualité graphique : low = rendu direct ; high/ultra = post-traitement (AO, bloom, tone mapping, SMAA, bokeh). */
  setQuality(q: Quality): void {
    this.quality = q
    const token = ++this.fxToken
    this.fx?.dispose()
    this.fx = null
    this.renderer.toneMapping = ACESFilmicToneMapping // rendu direct tant que la chaîne de post-traitement n'est pas chargée
    this.renderer.toneMappingExposure = 1
    if (q !== 'low') {
      // chunk séparé (postprocessing + n8ao ≈ 250 Ko) : chargé seulement en qualité élevée/ultra
      void import('./fx/PostFx').then(({ PostFx }) => {
        if (token !== this.fxToken || this.disposed) return
        this.renderer.toneMapping = NoToneMapping // fait par la chaîne de post-traitement
        const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1
        this.fx = new PostFx(this.renderer, this.scene, this.camera, q, w, h)
        this.fx.setBloom(this.kitchen.mood.bloom)
      })
    }
    this.resize()
  }

  get currentQuality(): Quality { return this.quality }

  /** Met le rendu en pause (écrans opaques : boutique, collection, réglages) : 0 % GPU. */
  setPaused(v: boolean): void {
    this.paused = v
    if (!v) this.clock.getDelta() // évite un gros dt à la reprise
  }

  /** Résolution adaptative : baisse le pixel ratio si les images dépassent ~26 ms, le remonte si tout va bien. */
  private adaptResolution(rawDt: number): void {
    if (!this.adaptive || this.photo) return
    this.frameAcc += rawDt
    if (++this.frameN < 45) return
    const avg = this.frameAcc / this.frameN
    this.frameAcc = 0
    this.frameN = 0
    const now = performance.now()
    if (now - this.lastAdapt < 1500) return
    const max = Math.min(window.devicePixelRatio || 1, this.pixelCap)
    let next = this.pixelNow
    if (avg > 0.026) next = Math.max(0.6, this.pixelNow - 0.2)
    else if (avg < 0.015) next = Math.min(max, this.pixelNow + 0.1)
    if (Math.abs(next - this.pixelNow) > 0.01) {
      this.pixelNow = next
      this.lastAdapt = now
      this.renderer.setPixelRatio(next)
      this.resize()
    }
  }

  /** Pointeur virtuel (manette) : mêmes chemins que la souris. Coordonnées client (px). */
  virtualPointer(type: 'down' | 'move' | 'up', x: number, y: number): void {
    const e = { clientX: x, clientY: y, button: 0, shiftKey: false, target: this.canvas } as unknown as PointerEvent
    if (type === 'down') this.onDown(e)
    else if (type === 'move') this.onMove(e)
    else this.onUp(e)
  }

  /** Fait tourner la patate (px d'écran) — molette/stick droit. */
  rotateBy(dx: number, dy: number): void {
    if (this.mode !== 'peeling' || this.photo) return
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx * 0.012).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy * 0.012))
    this.potatoGroup.quaternion.premultiply(q)
    this.targetQuat.copy(this.potatoGroup.quaternion)
  }

  /** Clavier : déplace le guide de coupe (pas de 0,06) — accessibilité sans souris. */
  nudgeCut(dir: number): void {
    if (this.mode !== 'cutting' || !this.plan || !this.bounds) return
    const [min, max] = this.bounds[this.plan.currentAxis ?? 'x']
    this.kbX = Math.min(max - 0.05, Math.max(min + 0.05, this.kbX + dir * 0.06))
    this.guide.visible = true
    this.guide.position.x = this.potatoGroup.position.x + this.kbX
    this.rig.hoverAt(this.guide.position.x)
  }

  /** Clavier : tranche à la position du guide (mêmes règles que la souris, y compris la précision du couteau). */
  cutAtKeyboard(): void {
    const axis = this.plan?.currentAxis
    if (this.mode !== 'cutting' || !this.plan || !this.bounds || !axis) return
    const pass = this.plan.mode.passes[this.plan.passIndex]
    const ideals = idealPositions(this.bounds[axis][0], this.bounds[axis][1], pass.cuts)
    this.cutAtLocal(axis, applyPrecision(this.kbX, ideals, this.knife.stats.precision))
  }

  get photoActive(): boolean { return !!this.photo }
  get photoSamples(): number { return this.photo?.session.samples ?? 0 }

  /**
   * Mode photo « ray tracing » : path tracing GPU progressif de la scène courante (éclairage global, reflets, ombres douces réelles).
   * Fige la partie ; orbite caméra autorisée ; `stopPhoto()` restaure le rendu temps réel.
   */
  async startPhoto(): Promise<boolean> {
    if (this.photo) return true
    const supported = this.renderer.capabilities.isWebGL2 && this.renderer.extensions.has('EXT_color_buffer_float')
    if (!supported) {
      this.events.emit('photo', { active: false, samples: 0, compiling: false, error: 'Ray tracing indisponible sur ce GPU (WebGL2 + float requis)' })
      return false
    }
    // chunk séparé (three-gpu-pathtracer + three-mesh-bvh) : chargé à la première utilisation
    const { PathTraceSession } = await import('./fx/PathTraceSession')
    if (this.photo || this.disposed) return !!this.photo
    const undo: (() => void)[] = []
    const hide = (o: { visible: boolean }) => { const v = o.visible; o.visible = false; undo.push(() => { o.visible = v }) }
    ;[this.particles.points, this.juice.points, this.coins.points, this.oilFx.points, this.guide, this.peeler.group, this.strips.mesh].forEach(hide)

    const potatoVisible = this.potato?.mesh.visible
    if (potatoVisible) { this.potato!.enterPathTrace(); undo.push(() => this.potato?.exitPathTrace()) }
    if (this.pieces.count) {
      const mat = new MeshPhysicalMaterial({ vertexColors: true, map: this.tex.flesh, roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.45 })
      this.pieces.swapMaterial(mat)
      undo.push(() => { this.pieces.swapMaterial(null); mat.dispose() })
    }
    const staticStrips = this.strips.toStaticMesh()
    if (staticStrips) {
      this.scene.add(staticStrips)
      undo.push(() => { this.scene.remove(staticStrips); staticStrips.geometry.dispose() })
    }
    const prevEnv = this.scene.environment
    if (this.kitchen.equirect) this.scene.environment = this.kitchen.equirect
    undo.push(() => { this.scene.environment = prevEnv })
    const prevTone = this.renderer.toneMapping
    this.renderer.toneMapping = ACESFilmicToneMapping
    undo.push(() => { this.renderer.toneMapping = prevTone })
    const prevEnabled = this.controls.enabled
    this.controls.enabled = true
    undo.push(() => { this.controls.enabled = prevEnabled && this.mode === 'peeling' })

    try {
      const scale = this.quality === 'ultra' ? 0.9 : 0.6
      const session = new PathTraceSession(this.renderer, this.scene, this.camera, { scale, bounces: this.quality === 'ultra' ? 7 : 5 })
      this.photo = { session, restore: () => undo.reverse().forEach((f) => f()), lastCam: this.camera.position.clone(), lastQuat: this.camera.quaternion.clone(), wantSave: false }
      this.events.emit('photo', { active: true, samples: 0, compiling: true })
      return true
    } catch (e) {
      undo.reverse().forEach((f) => f())
      this.events.emit('photo', { active: false, samples: 0, compiling: false, error: `Ray tracing : ${(e as Error).message}` })
      return false
    }
  }

  stopPhoto(): void {
    const p = this.photo
    if (!p) return
    this.photo = null
    p.session.dispose()
    p.restore()
    this.renderer.setRenderTarget(null)
    this.resize()
    this.events.emit('photo', { active: false, samples: 0, compiling: false })
  }

  /** Télécharge l'image path-tracée courante (PNG). */
  savePhoto(): void {
    if (this.photo) this.photo.wantSave = true
  }

  private captureResolvers: ((url: string) => void)[] = []

  /** Capture l'image affichée (rendu temps réel ou path tracing) sous forme de data URL PNG. */
  captureImage(): Promise<string> {
    return new Promise((resolve) => this.captureResolvers.push(resolve))
  }

  private flushCaptures(): void {
    if (!this.captureResolvers.length) return
    const url = this.canvas.toDataURL('image/png') // lu juste après le rendu, tampon encore valide
    this.captureResolvers.splice(0).forEach((r) => r(url))
  }

  /** Décors équipés (planche, mur, ambiance, objets). */
  setDecor(ids: string[]): void {
    this.kitchen.apply(ids)
    this.fx?.setBloom(this.kitchen.mood.bloom)
  }

  setSettings(s: { pixelRatioCap?: number; reducedMotion?: boolean }): void {
    if (s.reducedMotion !== undefined) this.reducedMotion = s.reducedMotion
    if (s.pixelRatioCap !== undefined) {
      this.pixelCap = s.pixelRatioCap
      this.pixelNow = Math.min(window.devicePixelRatio || 1, this.pixelCap)
      this.renderer.setPixelRatio(this.pixelNow)
    }
    this.resize()
  }

  // ---------- debug ----------

  get peelCoverage(): number { return this.peel.coverage() }
  get pieceCount(): number { return this.pieces.count }
  get cutCount(): number { return this.plan?.cutCount ?? 0 }
  get currentAxis(): Axis | null { return this.plan?.currentAxis ?? null }
  get currentMode(): Mode { return this.mode }
  get renderInfo() {
    const i = this.renderer.info
    return { drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures }
  }

  /** Épluche une fraction de la surface (utilitaire de test). */
  debugPeel(fraction: number): void {
    if (this.mode !== 'peeling') return
    const steps = 60
    const limit = Math.max(0, Math.min(1, fraction))
    for (let i = 0; i <= steps && this.peel.coverage() < limit; i++) {
      const lat = -Math.PI / 2 + (i / steps) * Math.PI
      let prev: Vec3 = [Math.cos(lat), Math.sin(lat), 0]
      for (let j = 1; j <= 60; j++) {
        const lon = (j / 60) * Math.PI * 2
        const cur: Vec3 = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
        this.peel.paintStroke(prev, cur, 0.25)
        prev = cur
      }
    }
    if (limit >= 1) this.peel.paint([1, 0, 0], 4)
    this.potato?.refresh()
    this.events.emit('peelProgress', this.peel.coverage())
  }

  // ---------- interne ----------

  private clearRound(): void {
    this.fryToken++
    this.pieces.clear()
    if (this.potato) {
      this.potatoGroup.remove(this.potato.mesh)
      this.potato.dispose()
      this.potato = null
    }
  }

  private rebuildPieces(): void {
    if (!this.plan || !this.shape) return
    const cuts = this.plan.cuts
    const cells = cellsFromCuts(this.plan.bounds, cuts)
    this.pieces.rebuild(cells, [cuts.x.length + 1, cuts.y.length + 1, cuts.z.length + 1], this.shape, this.peel)
  }

  private alignToCurrentAxis(): void {
    const ax = this.plan?.currentAxis
    if (ax) this.targetQuat.copy(AXIS_ROT[ax])
  }

  private setPointer(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect()
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  private hitPotato(): { dir: Vec3; world: Vector3; normal: Vector3 } | null {
    if (!this.potato) return null
    const hit = this.raycaster.intersectObject(this.potato.mesh, false)[0]
    if (!hit) return null
    const local = this.potatoGroup.worldToLocal(hit.point.clone())
    const l = local.length() || 1
    // normale de la surface, en repère monde (la lame doit s'y poser à plat)
    const normal = (hit.face ? hit.face.normal.clone() : local.clone().normalize()).transformDirection(this.potato.mesh.matrixWorld)
    return { dir: [local.x / l, local.y / l, local.z / l], world: hit.point, normal }
  }

  /** x monde du pointeur sur le plan horizontal de la patate. */
  private cutWorldX(): number | null {
    const p = new Vector3()
    const hit = this.raycaster.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -this.potatoGroup.position.y), p)
    return hit ? p.x : null
  }

  private downAt = new Vector2()

  private readonly onContextLost = (e: Event): void => {
    e.preventDefault()
    this.renderer.setAnimationLoop(null)
    this.events.emit('contextLost', undefined)
  }

  private readonly onContext = (e: Event): void => e.preventDefault()

  private readonly onDown = (e: PointerEvent): void => {
    if (this.photo) return
    this.downAt.set(e.clientX, e.clientY)
    if (this.mode !== 'peeling') return
    if (this.rotateMode || e.button === 2 || e.shiftKey) {
      this.rotating = true
      this.controls.enabled = false
      this.lastRot.set(e.clientX, e.clientY)
      return
    }
    this.setPointer(e)
    const h = this.hitPotato()
    if (h) {
      this.peeling = true
      this.controls.enabled = false
      this.lastDir = null
      this.peelAt(h)
    }
  }

  private readonly onMove = (e: PointerEvent): void => {
    if (this.photo) return
    if (this.rotating) {
      const dx = e.clientX - this.lastRot.x, dy = e.clientY - this.lastRot.y
      this.lastRot.set(e.clientX, e.clientY)
      const q = new Quaternion()
        .setFromAxisAngle(new Vector3(0, 1, 0), dx * 0.012)
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy * 0.012))
      this.potatoGroup.quaternion.premultiply(q)
      this.targetQuat.copy(this.potatoGroup.quaternion)
      return
    }
    this.setPointer(e)
    if (this.mode === 'peeling' && this.peeling) {
      const h = this.hitPotato()
      if (h) this.peelAt(h)
    } else if (this.mode === 'peeling') {
      const h = this.hitPotato()
      this.hoverPeeler = !!h
      if (h) this.peeler.placeAt(h.world, h.normal, false)
    } else if (this.mode === 'cutting') {
      const x = this.cutWorldX()
      if (x !== null && this.plan) {
        const [min, max] = this.bounds![this.plan.currentAxis ?? 'x']
        const lx = x - this.potatoGroup.position.x
        this.guide.visible = lx > min && lx < max
        this.guide.position.x = x
        this.rig.hoverAt(x)
      }
    }
  }

  private readonly onUp = (e: PointerEvent): void => {
    if (this.photo) return
    if (this.rotating) {
      this.rotating = false
      this.controls.enabled = this.mode === 'peeling'
      return
    }
    if (this.peeling) {
      this.peeling = false
      this.lastDir = null
      this.controls.enabled = this.mode === 'peeling'
      this.events.emit('peelProgress', this.peel.coverage())
      return
    }
    if (this.mode === 'cutting' && e.target === this.canvas && this.plan && this.bounds) {
      this.setPointer(e)
      const x = this.cutWorldX()
      const axis = this.plan.currentAxis
      if (x === null || !axis) return
      const pass = this.plan.mode.passes[this.plan.passIndex]
      const ideals = idealPositions(this.bounds[axis][0], this.bounds[axis][1], pass.cuts)
      const pos = applyPrecision(x - this.potatoGroup.position.x, ideals, this.knife.stats.precision)
      this.cutAtLocal(axis, pos)
    }
  }

  private peelAt(h: { dir: Vec3; world: Vector3; normal: Vector3 }): void {
    const radius = PEEL_RADIUS * Math.sqrt(this.knife.stats.speed)
    const added = this.lastDir ? this.peel.paintStroke(this.lastDir, h.dir, radius) : this.peel.paint(h.dir, radius)
    this.lastDir = h.dir
    this.peeler.placeAt(h.world, h.normal, true)
    if (added > 0) {
      this.potato?.refresh()
      this.particles.emit(h.world, 2)
      this.dropStrip(h.world)
      const now = performance.now()
      if (now - this.lastProgress > 100) {
        this.lastProgress = now
        this.events.emit('peelProgress', this.peel.coverage())
      }
    }
  }

  /** Recule la caméra sur écran étroit pour garder la patate entière visible. */
  private fitted(base: Vector3): Vector3 {
    const k = Math.max(1, 0.75 / this.camera.aspect)
    return LOOK.clone().add(base.clone().sub(LOOK).multiplyScalar(k))
  }

  private setCamBase(base: Vector3): void {
    this.camBase = base
    this.camTarget = this.fitted(base)
  }

  private project(x: number, y: number, z: number): { x: number; y: number } {
    const v = new Vector3(x, y, z).project(this.camera)
    return { x: ((v.x + 1) / 2) * this.container.clientWidth, y: ((1 - v.y) / 2) * this.container.clientHeight }
  }

  /** Fait tomber un ruban de peau (au plus ~25 par seconde). */
  private dropStrip(world: Vector3): void {
    const now = performance.now()
    if (now - this.lastStrip < 40) return
    this.lastStrip = now
    this.strips.spawn(world, this.potatoGroup.position)
  }

  /** Éplucheur automatique : un petit robot balaie la surface en spirale. */
  private autoPeel(dt: number): void {
    if (this.autoPeelLevel <= 0 || !this.potato || !this.shape) return
    this.autoT += dt * autoPeelSpeed(this.autoPeelLevel) * 1.5
    const t = this.autoT
    const lon = t * 3.3, lat = Math.sin(t * 0.77) * 1.25
    const dir: Vec3 = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
    const added = this.autoLast ? this.peel.paintStroke(this.autoLast, dir, AUTO_PEEL_RADIUS) : this.peel.paint(dir, AUTO_PEEL_RADIUS)
    this.autoLast = dir
    const r = radiusAt(this.shape, dir) * 1.12
    const world = this.potatoGroup.localToWorld(new Vector3(dir[0] * r, dir[1] * r, dir[2] * r))
    this.peeler.placeAt(world, world.clone().sub(this.potatoGroup.position).normalize(), true)
    if (added > 0) {
      this.autoAcc += dt
      if (this.autoAcc > 0.08) {
        this.autoAcc = 0
        this.potato.refresh()
        this.particles.emit(world, 2)
        this.dropStrip(world)
        this.events.emit('peelProgress', this.peel.coverage())
      }
    }
  }

  private resize(): void {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.fx?.setSize(w, h)
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (this.mode !== 'idle') this.camTarget = this.fitted(this.camBase)
  }

  private tickPhoto(): void {
    const p = this.photo!
    this.controls.update()
    const moved = !p.lastCam.equals(this.camera.position) || !p.lastQuat.equals(this.camera.quaternion)
    if (moved) { p.lastCam.copy(this.camera.position); p.lastQuat.copy(this.camera.quaternion) }
    p.session.frame(moved)
    this.flushCaptures()
    if (p.wantSave) {
      p.wantSave = false
      const a = document.createElement('a')
      a.href = this.canvas.toDataURL('image/png')
      a.download = `potato-raytracing-${Date.now()}.png`
      a.click()
    }
    if (++this.photoTick % 10 === 0) this.events.emit('photo', { active: true, samples: p.session.samples, compiling: p.session.compiling })
  }

  private readonly tick = (): void => {
    const raw = this.clock.getDelta()
    const dt = Math.min(0.05, raw)
    if (this.paused) return
    this.adaptResolution(raw)
    this.frames++
    if (this.photo) {
      this.tickPhoto()
      return
    }
    this.potatoGroup.quaternion.slerp(this.targetQuat, 1 - Math.exp(-10 * dt))
    if (this.camTarget) {
      this.camera.position.lerp(this.camTarget, 1 - Math.exp(-6 * dt))
      if (this.camera.position.distanceTo(this.camTarget) < 0.01) this.camTarget = null
      this.controls.target.copy(LOOK)
    }
    if (this.mode === 'peeling' && !this.peeling && !this.rotating) this.autoPeel(dt)
    if (this.mode !== 'peeling' || this.rotating || (this.autoPeelLevel <= 0 && !this.peeling && !this.hoverPeeler)) this.peeler.show(false)
    this.peeler.update(dt)
    this.strips.update(dt)
    this.pieces.update(dt, Math.min(0.25, raw))
    this.juice.update(dt)
    this.coins.update(dt)
    this.oilFx.update(dt)
    this.rig.update(dt)
    this.particles.update(dt)
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 0.5)
      this.camera.position.x += (Math.random() - 0.5) * this.shake
    }
    if (this.controls.enabled) this.controls.update()
    else this.camera.lookAt(LOOK)
    this.time += dt
    this.kitchen.update(dt)
    if (this.fx) {
      this.fx.setFocus(this.camera.position.distanceTo(this.potatoGroup.position))
      this.fx.render(raw)
    } else this.renderer.render(this.scene, this.camera)
    this.flushCaptures()
  }

  dispose(): void {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObs.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('contextmenu', this.onContext)
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    this.controls.dispose()
    this.clearRound()
    this.pieces.dispose()
    this.particles.dispose()
    this.juice.dispose()
    this.coins.dispose()
    this.oilFx.dispose()
    this.strips.dispose()
    this.peeler.dispose()
    this.rig.dispose()
    this.guide.geometry.dispose()
    ;(this.guide.material as MeshBasicMaterial).dispose()
    this.stopPhoto()
    this.fx?.dispose()
    this.kitchen.dispose()
    this.env.dispose()
    this.renderer.dispose()
    this.canvas.remove()
    this.events.clear()
  }
}
