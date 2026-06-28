import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SubOrder } from '@/types';
import { fetchOrders } from '@/lib/mockApi';

interface OrdersState {
  data: SubOrder[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: OrdersState = {
  data: [],
  status: 'idle',
  error: null,
};

export const loadOrders = createAsyncThunk(
  'orders/load',
  async () => {
    return await fetchOrders();
  }
);

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.data = action.payload;
      state.status = 'ready';
    },
    updateOrderAllocated: (state, action) => {
      const { subOrderId, allocatedQty } = action.payload;
      const order = state.data.find(o => o.sub_order_id === subOrderId);
      if (order) {
        order.allocated_qty = allocatedQty;
      }
    },
    updateOrderSource: (state, action) => {
      const { subOrderId, warehouseId, supplierId } = action.payload;
      const order = state.data.find(o => o.sub_order_id === subOrderId);
      if (order) {
        order.resolved_source = { warehouse_id: warehouseId, supplier_id: supplierId };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOrders.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadOrders.fulfilled, (state, action) => {
        state.status = 'ready';
        state.data = action.payload;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load orders';
      });
  },
});

export const { setOrders, updateOrderAllocated, updateOrderSource } = ordersSlice.actions;
export default ordersSlice.reducer;
