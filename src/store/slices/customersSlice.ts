import { createSlice } from '@reduxjs/toolkit';
import { Customer } from '@/types';

interface CustomersState {
  data: Customer[];
  creditUsed: Record<string, number>;
}

const initialState: CustomersState = {
  data: [],
  creditUsed: {},
};

export const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers: (state, action) => {
      state.data = action.payload;
    },
    updateCreditUsed: (state, action) => {
      const { customerId, amount } = action.payload;
      state.creditUsed[customerId] = (state.creditUsed[customerId] || 0) + amount;
    },
    resetCredit: (state) => {
      state.creditUsed = {};
    },
  },
});

export const { setCustomers, updateCreditUsed, resetCredit } = customersSlice.actions;
export default customersSlice.reducer;
