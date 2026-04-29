import { create } from "zustand";
import type { VehiclePosition } from "../types/vehicle";

// zustand 用の型
type PositionStore = {
  // store したいデータ
  positions: Map<string, VehiclePosition>;
  // storeへ代入する関数
  setPosition: (pos: VehiclePosition) => void;
};

export const usePositionStore = create<PositionStore>((set) => ({
  // ------------------------------------------
  // zustand の定番：取り出されるstoreしたい変数
  // ------------------------------------------
  // 取り出し例）
  // const positions = usePositionStore((s) => s.positions);  //変数部分を取り出し
  // const sorted = positions.values();
  positions: new Map(),

  // ------------------------------------------
  // zustand の定番：store変数へ代入
  // ------------------------------------------
  // 代入例）
  // const updateVehicle = usePositionStore((s) => s.setPosition); //set関数を取り出し
  // const pos = JSON.parse(event.data as string) as VehiclePosition;
  // updateVehicle(pos);
  setPosition: (pos) =>
    // 現在のstateを受け取り、新しいstateを返す
    set((state) => {
      // 全車両データをコピー
      const next = new Map(state.positions);
      // posの車両だけ更新
      next.set(pos.vehicleId, pos);

      // nextは新しい参照なので、利用しているコンポーネントの再レンダリングトリガーになる
      return { positions: next };
    }),
}));
