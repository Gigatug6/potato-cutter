/** Manette (Gamepad API) : curseur virtuel (stick gauche), A = éplucher/trancher, etc. La logique est pure et testable. */

export const DEADZONE = 0.18
export const CURSOR_SPEED = 620 // px/s à pleine inclinaison

/** Zone morte avec remise à l'échelle : 0 sous le seuil, puis progressif jusqu'à ±1. */
export function applyDeadzone(v: number, dz = DEADZONE): number {
  const a = Math.abs(v)
  if (a < dz) return 0
  return Math.sign(v) * Math.min(1, (a - dz) / (1 - dz))
}

export interface PadState { axes: readonly number[]; buttons: readonly { pressed: boolean }[] }

export interface PadActions {
  /** rectangle du canvas (pour borner le curseur) */
  bounds(): { left: number; top: number; width: number; height: number }
  pointer(type: 'down' | 'move' | 'up', x: number, y: number): void
  nudge(dir: number): void
  rotate(dx: number, dy: number): void
  toggleRotate(): void
  capture(): void
  discard(): void
  start(): void
  /** curseur déplacé (affichage) */
  cursor(x: number, y: number, active: boolean): void
}

const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

export class GamepadController {
  private x = 0
  private y = 0
  private inited = false
  private prev: boolean[] = []
  private aHeld = false
  private active = false

  constructor(private readonly actions: PadActions) {}

  /** À appeler à chaque frame avec l'état de la première manette (ou null) et le pas de temps en secondes. */
  poll(pad: PadState | null, dt: number): void {
    if (!pad) {
      if (this.active) { this.active = false; this.actions.cursor(this.x, this.y, false) }
      return
    }
    const b = this.actions.bounds()
    if (!this.inited) { this.x = b.left + b.width / 2; this.y = b.top + b.height * 0.5; this.inited = true }
    const pressed = (i: number) => !!pad.buttons[i]?.pressed
    const edge = (i: number) => pressed(i) && !this.prev[i]

    const lx = applyDeadzone(pad.axes[0] ?? 0), ly = applyDeadzone(pad.axes[1] ?? 0)
    const dpadX = (pressed(BTN.RIGHT) ? 1 : 0) - (pressed(BTN.LEFT) ? 1 : 0)
    const dpadY = (pressed(BTN.DOWN) ? 1 : 0) - (pressed(BTN.UP) ? 1 : 0)
    const mx = lx + dpadX, my = ly + dpadY
    const moving = mx !== 0 || my !== 0
    if (moving || edge(BTN.A) || pressed(BTN.A)) this.active = true
    if (moving) {
      this.x = Math.min(b.left + b.width, Math.max(b.left, this.x + mx * CURSOR_SPEED * dt))
      this.y = Math.min(b.top + b.height, Math.max(b.top, this.y + my * CURSOR_SPEED * dt))
      this.actions.pointer('move', this.x, this.y)
    }
    if (this.active) this.actions.cursor(this.x, this.y, true)

    // A : appui maintenu = pointeur enfoncé (éplucher) ; relâché = clic (trancher)
    if (edge(BTN.A)) { this.aHeld = true; this.actions.pointer('down', this.x, this.y) }
    else if (this.aHeld && !pressed(BTN.A)) { this.aHeld = false; this.actions.pointer('up', this.x, this.y) }

    // stick droit : tourne la patate (épluchage) ; gâchettes d'épaule : place le couteau
    const rx = applyDeadzone(pad.axes[2] ?? 0), ry = applyDeadzone(pad.axes[3] ?? 0)
    if (rx !== 0 || ry !== 0) this.actions.rotate(rx * 240 * dt, ry * 240 * dt)
    if (edge(BTN.LB)) this.actions.nudge(-1)
    if (edge(BTN.RB)) this.actions.nudge(1)
    if (pressed(BTN.LB) && this.prev[BTN.LB]) this.actions.nudge(-0.35)
    if (pressed(BTN.RB) && this.prev[BTN.RB]) this.actions.nudge(0.35)
    if (edge(BTN.X)) this.actions.toggleRotate()
    if (edge(BTN.Y)) this.actions.capture()
    if (edge(BTN.B)) this.actions.discard()
    if (edge(BTN.START)) this.actions.start()

    this.prev = pad.buttons.map((bt) => bt.pressed)
  }
}
