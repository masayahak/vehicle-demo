import { create } from 'zustand'
import type { VehiclePosition } from '../types/vehicle'

type PositionStore = {
  positions: Map<string, VehiclePosition>
  setPosition: (pos: VehiclePosition) => void
}

export const usePositionStore = create<PositionStore>((set) => ({
  positions: new Map(),
  setPosition: (pos) =>
    set((state) => {
      const next = new Map(state.positions)
      next.set(pos.vehicleId, pos)
      return { positions: next }
    }),
}))
