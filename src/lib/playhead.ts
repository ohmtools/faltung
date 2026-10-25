/** Sprünge (zum Anfang, Tippen in die Zeitleiste) gleiten so lange (halbe Geschwindigkeit des Designs) */
export const GLIDE_MS = 560

/**
 * Abspielkopf als kleiner externer Store: Die Animation ändert t bis zu 60-mal pro Sekunde;
 * nur Canvas, Schieberegler und Anzeige abonnieren das, der Rest der App rendert nicht neu.
 */
export class Playhead {
  t: number
  playing: boolean
  speed = 1
  private listeners = new Set<() => void>()

  constructor(t = 0, playing = false) {
    this.t = t
    this.playing = playing
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  private emit() {
    for (const l of this.listeners) l()
  }

  private glide = 0

  setT(t: number) {
    cancelAnimationFrame(this.glide)
    this.put(t)
  }

  private put(t: number) {
    if (t === this.t) return
    this.t = t
    this.emit()
  }

  /**
   * Pausiert und gleitet in `ms` nach t (schnell los, sanft am Ziel), statt zu springen; 0 springt.
   * Jedes andere Setzen von t bricht das Gleiten ab.
   */
  glideTo(t: number, ms: number) {
    this.setPlaying(false)
    this.setT(this.t)
    if (ms <= 0) return this.put(t)
    const from = this.t
    const start = performance.now()
    const frame = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      this.put(from + (t - from) * (1 - (1 - k) ** 3))
      if (k < 1) this.glide = requestAnimationFrame(frame)
    }
    this.glide = requestAnimationFrame(frame)
  }

  setPlaying(p: boolean) {
    if (p === this.playing) return
    this.playing = p
    this.emit()
  }

  setSpeed(s: number) {
    this.speed = s
    this.emit()
  }

  /** Pausiert und springt um einen Bruchteil des Bereichs [min, max] weiter. */
  step(frac: number, min: number, max: number) {
    this.setPlaying(false)
    this.setT(Math.min(max, Math.max(min, this.t + frac * (max - min))))
  }

  getT = () => this.t
  getPlaying = () => this.playing
  getSpeed = () => this.speed
}
