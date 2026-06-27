'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setSearch,
  setTypeFilter,
  setStatusFilter,
  setSourceFilter,
} from '@/store/slices/uiSlice';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

export default function TopBar() {
  const dispatch = useAppDispatch();
  const { search, typeFilter, statusFilter, sourceFilter } = useAppSelector(
    state => state.ui
  );

  const orders = useAppSelector(state => state.orders.data);
  const filteredCount = useAppSelector(state => {
    const { search, typeFilter, statusFilter, sourceFilter } = state.ui;
    return orders.filter(order => {
      if (search && !matchesSearch(order, search)) return false;
      if (typeFilter !== 'ALL' && order.type !== typeFilter) return false;
      if (sourceFilter === 'WILDCARD' &&
          order.warehouse_id !== 'WH-000' &&
          order.supplier_id !== 'SP-000') return false;
      if (sourceFilter === 'SPECIFIC' &&
          (order.warehouse_id === 'WH-000' || order.supplier_id === 'SP-000')) return false;
      return true;
    }).length;
  });

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => dispatch(setSearch(searchInput)), 200);
    return () => clearTimeout(timeout);
  }, [searchInput, dispatch]);

  function matchesSearch(order: any, query: string): boolean {
    const q = query.toLowerCase();
    return (
      order.order_id?.toLowerCase().includes(q) ||
      order.sub_order_id?.toLowerCase().includes(q) ||
      order.customer_id?.toLowerCase().includes(q) ||
      order.item_id?.toLowerCase().includes(q) ||
      order.remark?.toLowerCase().includes(q)
    );
  }

  const handleChipClick = (filterType: 'type' | 'status' | 'source', value: string) => {
    const currentValue = filterType === 'type' ? typeFilter : filterType === 'status' ? statusFilter : sourceFilter;
    const newValue = currentValue === value ? 'ALL' : value;

    if (filterType === 'type') dispatch(setTypeFilter(newValue as any));
    else if (filterType === 'status') dispatch(setStatusFilter(newValue as any));
    else dispatch(setSourceFilter(newValue as any));
  };

  return (
    <Box
      sx={{
        borderBottom: '1px solid #e5e7eb',
        bgcolor: 'white',
        px: 3,
        py: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        sx = {{ alignItems : {xs : 'flex-start', lg : 'center'}, justifyContent : 'space-between'}}
        spacing={2}
      >
        {/* Title */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Salmon Allocation
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {filteredCount.toLocaleString()} of {orders.length.toLocaleString()} orders
          </Typography>
        </Box>

        {/* Controls */}
        <Stack direction="row" spacing={2} useFlexGap sx={{ flex : "wrap", alignItems : "center"}}>
          {/* Search */}
          <TextField
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search orders..."
            size="small"
            sx={{ width: 250 }}
          />

          {/* Type filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={e => dispatch(setTypeFilter(e.target.value as any))}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="EMERGENCY">Emergency</MenuItem>
              <MenuItem value="OVERDUE">Overdue</MenuItem>
              <MenuItem value="DAILY">Daily</MenuItem>
            </Select>
          </FormControl>

          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={e => dispatch(setStatusFilter(e.target.value as any))}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="NONE">Unallocated</MenuItem>
              <MenuItem value="PARTIAL">Partial</MenuItem>
              <MenuItem value="FULL">Complete</MenuItem>
            </Select>
          </FormControl>

          {/* Source filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceFilter}
              label="Source"
              onChange={e => dispatch(setSourceFilter(e.target.value as any))}
            >
              <MenuItem value="ALL">All Sources</MenuItem>
              <MenuItem value="WILDCARD">Wildcards</MenuItem>
              <MenuItem value="SPECIFIC">Specific</MenuItem>
            </Select>
          </FormControl>

          {/* Clear filters button */}
          {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
            <Button
              size="small"
              onClick={() => {
                dispatch(setTypeFilter('ALL'));
                dispatch(setStatusFilter('ALL'));
                dispatch(setSourceFilter('ALL'));
              }}
            >
              Clear filters
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Quick filter chips */}
      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap : 'wrap' }}>
        <Chip
          label="Emergency"
          onClick={() => handleChipClick('type', 'EMERGENCY')}
          color={typeFilter === 'EMERGENCY' ? 'primary' : 'default'}
          variant={typeFilter === 'EMERGENCY' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
        <Chip
          label="Overdue"
          onClick={() => handleChipClick('type', 'OVERDUE')}
          color={typeFilter === 'OVERDUE' ? 'primary' : 'default'}
          variant={typeFilter === 'OVERDUE' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
        <Chip
          label="Daily"
          onClick={() => handleChipClick('type', 'DAILY')}
          color={typeFilter === 'DAILY' ? 'primary' : 'default'}
          variant={typeFilter === 'DAILY' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
        <Chip
          label="Unallocated"
          onClick={() => handleChipClick('status', 'NONE')}
          color={statusFilter === 'NONE' ? 'primary' : 'default'}
          variant={statusFilter === 'NONE' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
        <Chip
          label="Partial"
          onClick={() => handleChipClick('status', 'PARTIAL')}
          color={statusFilter === 'PARTIAL' ? 'primary' : 'default'}
          variant={statusFilter === 'PARTIAL' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
        <Chip
          label="Wildcard Source"
          onClick={() => handleChipClick('source', 'WILDCARD')}
          color={sourceFilter === 'WILDCARD' ? 'primary' : 'default'}
          variant={sourceFilter === 'WILDCARD' ? 'filled' : 'outlined'}
          size="small"
          clickable
        />
      </Stack>
    </Box>
  );
}
