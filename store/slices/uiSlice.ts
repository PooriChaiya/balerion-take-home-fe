import { createSlice } from '@reduxjs/toolkit';
import { UIState } from '@/types';

const initialState: UIState = {
  search: '',
  typeFilter: 'ALL',
  statusFilter: 'ALL',
  sourceFilter: 'ALL',
  selectedIds: [],
  sortBy: { column: 'create_date', direction: 'asc' },
  expandedRows: [],
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
    toggleSelected: (state, action) => {
      const id = action.payload;
      const index = state.selectedIds.indexOf(id);
      if (index >= 0) {
        state.selectedIds.splice(index, 1);
      } else {
        state.selectedIds.push(id);
      }
    },
    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    setSort: (state, action) => {
      state.sortBy = action.payload;
    },
    toggleExpanded: (state, action) => {
      const id = action.payload;
      const index = state.expandedRows.indexOf(id);
      if (index >= 0) {
        state.expandedRows.splice(index, 1);
      } else {
        state.expandedRows.push(id);
      }
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
  toggleSelected,
  setSelectedIds,
  clearSelection,
  setSort,
  toggleExpanded,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
