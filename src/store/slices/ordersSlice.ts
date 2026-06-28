import { createSlice } from '@reduxjs/toolkit';
import { SubOrder } from '@/types';

interface OrdersState {
  data: SubOrder[];
}

const initialState: OrdersState = {
  data: [],
};

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.data = action.payload;
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
});

export const { setOrders, updateOrderAllocated, updateOrderSource } = ordersSlice.actions;
export default ordersSlice.reducer;
