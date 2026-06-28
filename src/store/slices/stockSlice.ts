import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { StockCell } from '@/types';
import { fetchStock } from '@/lib/mockApi';

interface StockState {
  initial: StockCell[];
  remaining: Record<string, number>; // key: "wh|sp|item"
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: StockState = {
  initial: [],
  remaining: {},
  status: 'idle',
  error: null,
};

export const loadStock = createAsyncThunk(
  'stock/load',
  async () => {
    return await fetchStock();
  }
);

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
      state.status = 'ready';
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
  extraReducers: (builder) => {
    builder
      .addCase(loadStock.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadStock.fulfilled, (state, action) => {
        state.status = 'ready';
        state.initial = action.payload;
        // Build remaining map
        for (const cell of action.payload) {
          const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
          state.remaining[key] = cell.remaining_qty;
        }
      })
      .addCase(loadStock.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load stock';
      });
  },
});

export const { setStock, updateStock, resetStock } = stockSlice.actions;
export default stockSlice.reducer;
