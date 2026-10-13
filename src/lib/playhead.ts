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

  setT(t: number) {
    if (t === this.t) return
    this.t = t
    this.emit()
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
