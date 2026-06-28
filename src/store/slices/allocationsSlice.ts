import { createSlice } from '@reduxjs/toolkit';
import { Allocation, Action } from '@/types';

interface AllocationsState {
  byId: Record<string, Allocation[]>; // sub_order_id -> allocations
  history: Action[];
  cursor: number; // Points to current state in history
}

const initialState: AllocationsState = {
  byId: {},
  history: [],
  cursor: -1,
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

      // Add to history
      state.history = state.history.slice(0, state.cursor + 1);
      state.history.push({
        type: 'allocate',
        timestamp: Date.now(),
        data: allocation,
      });
      state.cursor = state.history.length - 1;
    },
    removeAllocation: (state, action) => {
      const { subOrderId, index } = action.payload;
      if (state.byId[subOrderId]) {
        state.byId[subOrderId].splice(index, 1);
      }

      // Add to history
      state.history = state.history.slice(0, state.cursor + 1);
      state.history.push({
        type: 'deallocate',
        timestamp: Date.now(),
        data: { subOrderId, index },
      });
      state.cursor = state.history.length - 1;
    },
    clearAllocations: (state) => {
      state.byId = {};
      state.history = [];
      state.cursor = -1;
    },
    undo: (state) => {
      if (state.cursor >= 0) {
        const action = state.history[state.cursor];
        // Undo logic would be applied here
        state.cursor = Math.max(-1, state.cursor - 1);
      }
    },
    redo: (state) => {
      if (state.cursor < state.history.length - 1) {
        state.cursor = Math.min(state.history.length - 1, state.cursor + 1);
        const action = state.history[state.cursor];
        // Redo logic would be applied here
      }
    },
  },
});

export const { setAllocations, addAllocation, removeAllocation, clearAllocations, undo, redo } =
  allocationsSlice.actions;

export default allocationsSlice.reducer;
