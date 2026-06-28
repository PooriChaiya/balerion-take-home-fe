import { createSlice } from '@reduxjs/toolkit';
import { UIState } from '@/types';

const initialState: UIState = {
  search: '',
  typeFilter: 'ALL',
  statusFilter: 'ALL',
  sourceFilter: 'ALL',
  selectedIds: [],
  sortBy: { column: 'create_date', direction: 'asc' },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setTypeFilter: (state, action) => {
      state.typeFilter = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setSourceFilter: (state, action) => {
      state.sourceFilter = action.payload;
    },
    setSort: (state, action) => {
      state.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.search = '';
      state.typeFilter = 'ALL';
      state.statusFilter = 'ALL';
      state.sourceFilter = 'ALL';
    },
  },
});

export const {
  setSearch,
  setTypeFilter,
  setStatusFilter,
  setSourceFilter,
  setSort,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
