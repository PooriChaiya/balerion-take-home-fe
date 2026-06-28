import { createSlice } from '@reduxjs/toolkit';
import { Allocation } from '@/types';

interface AllocationsState {
  byId: Record<string, Allocation[]>; // sub_order_id -> allocations
}

const initialState: AllocationsState = {
  byId: {},
};

export const allocationsSlice = createSlice({
  name: 'allocations',
  initialState,
  reducers: {
    setAllocations: (state, action) => {
      const { allocations } = action.payload;
      state.byId = {};
      for (const alloc of allocations) {
        if (!state.byId[alloc.sub_order_id]) {
          state.byId[alloc.sub_order_id] = [];
        }
        state.byId[alloc.sub_order_id].push(alloc);
      }
    },
    addAllocation: (state, action) => {
      const allocation = action.payload;
      if (!state.byId[allocation.sub_order_id]) {
        state.byId[allocation.sub_order_id] = [];
      }
      state.byId[allocation.sub_order_id].push(allocation);
    },
    removeAllocation: (state, action) => {
      const { subOrderId, index } = action.payload;
      if (state.byId[subOrderId]) {
        state.byId[subOrderId].splice(index, 1);
      }
    },
    clearAllocations: (state) => {
      state.byId = {};
    },
  },
});

export const { setAllocations, addAllocation, removeAllocation, clearAllocations } = allocationsSlice.actions;

export default allocationsSlice.reducer;
