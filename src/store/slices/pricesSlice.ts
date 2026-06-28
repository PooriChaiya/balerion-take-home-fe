import { createSlice } from '@reduxjs/toolkit';
import { PriceRule } from '@/types';

interface PricesState {
  data: PriceRule[];
  byKey: Record<string, PriceRule>; // "item|supplier|tier"
}

const initialState: PricesState = {
  data: [],
  byKey: {},
};

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
    },
  },
});

export const { setPrices } = pricesSlice.actions;

export default pricesSlice.reducer;
