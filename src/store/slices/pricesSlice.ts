import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PriceRule } from '@/types';
import { fetchPrices } from '@/lib/mockApi';

interface PricesState {
  data: PriceRule[];
  byKey: Record<string, PriceRule>; // "item|supplier|tier"
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: PricesState = {
  data: [],
  byKey: {},
  status: 'idle',
  error: null,
};

export const loadPrices = createAsyncThunk(
  'prices/load',
  async () => {
    return await fetchPrices();
  }
);

export const pricesSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    setPrices: (state, action) => {
      state.data = action.payload;
      // Build lookup map
      for (const price of action.payload) {
        const key = `${price.item_id}|${price.supplier_id}|${price.price_tier}`;
        state.byKey[key] = price;
      }
      state.status = 'ready';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPrices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadPrices.fulfilled, (state, action) => {
        state.status = 'ready';
        state.data = action.payload;
        // Build lookup map
        for (const price of action.payload) {
          const key = `${price.item_id}|${price.supplier_id}|${price.price_tier}`;
          state.byKey[key] = price;
        }
      })
      .addCase(loadPrices.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load prices';
      });
  },
});

export const { setPrices } = pricesSlice.actions;

export default pricesSlice.reducer;
