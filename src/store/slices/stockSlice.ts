import { createSlice } from '@reduxjs/toolkit';
import { StockCell } from '@/types';

interface StockState {
  initial: StockCell[];
  remaining: Record<string, number>; // key: "wh|sp|item"
}

const initialState: StockState = {
  initial: [],
  remaining: {},
};

export const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setStock: (state, action) => {
      state.initial = action.payload;
      // Build remaining map
      for (const cell of action.payload) {
        const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
        state.remaining[key] = cell.remaining_qty;
      }
    },
    updateStock: (state, action) => {
      const { warehouseId, supplierId, itemId, qty } = action.payload;
      const key = `${warehouseId}|${supplierId}|${itemId}`;
      state.remaining[key] = (state.remaining[key] || 0) - qty;
    },
    resetStock: (state) => {
      // Rebuild from initial
      for (const cell of state.initial) {
        const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
        state.remaining[key] = cell.remaining_qty;
      }
    },
  },
});

export const { setStock, updateStock, resetStock } = stockSlice.actions;
export default stockSlice.reducer;
