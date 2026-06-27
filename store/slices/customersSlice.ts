import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Customer } from '@/types';
import { fetchCustomers } from '@/lib/mockApi';

interface CustomersState {
  data: Customer[];
  creditUsed: Record<string, number>;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: CustomersState = {
  data: [],
  creditUsed: {},
  status: 'idle',
  error: null,
};

export const loadCustomers = createAsyncThunk(
  'customers/load',
  async () => {
    return await fetchCustomers();
  }
);

export const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    updateCreditUsed: (state, action) => {
      const { customerId, amount } = action.payload;
      state.creditUsed[customerId] = (state.creditUsed[customerId] || 0) + amount;
    },
    resetCredit: (state) => {
      state.creditUsed = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadCustomers.fulfilled, (state, action) => {
        state.status = 'ready';
        state.data = action.payload;
      })
      .addCase(loadCustomers.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load customers';
      });
  },
});

export const { updateCreditUsed, resetCredit } = customersSlice.actions;
export default customersSlice.reducer;
