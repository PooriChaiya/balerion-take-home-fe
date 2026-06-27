'use client';

import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
} from '@mui/material';

export default function SummaryPanel() {
  const orders = useAppSelector(state => state.orders.data);
  const stockRemaining = useAppSelector(state => state.stock.remaining);
  const stockInitial = useAppSelector(state => state.stock.initial);
  const customers = useAppSelector(state => state.customers.data);
  const creditUsed = useAppSelector(state => state.customers.creditUsed);

  // Calculate totals
  const totals = useMemo(() => {
    let totalRequested = 0;
    let totalAllocated = 0;
    let fullOrders = 0;
    let partialOrders = 0;
    let unallocatedOrders = 0;

    for (const order of orders) {
      totalRequested += order.request_qty;
      const allocated = order.allocated_qty || 0;
      totalAllocated += allocated;

      if (allocated >= order.request_qty) {
        fullOrders++;
      } else if (allocated > 0) {
        partialOrders++;
      } else {
        unallocatedOrders++;
      }
    }

    let totalStockInitial = 0;
    let totalStockRemaining = 0;

    for (const cell of stockInitial) {
      totalStockInitial += cell.remaining_qty;
      const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
      totalStockRemaining += stockRemaining[key] || 0;
    }

    let totalCreditLimit = 0;
    let totalCreditUsed = 0;

    for (const customer of customers) {
      totalCreditLimit += customer.credit_limit;
      totalCreditUsed += creditUsed[customer.customer_id] || 0;
    }

    return {
      totalRequested,
      totalAllocated,
      fullOrders,
      partialOrders,
      unallocatedOrders,
      totalStockInitial,
      totalStockRemaining,
      totalCreditLimit,
      totalCreditUsed,
    };
  }, [orders, stockRemaining, stockInitial, customers, creditUsed]);

  const stockUsed = totals.totalStockInitial - totals.totalStockRemaining;
  const stockUtilization = totals.totalStockInitial > 0
    ? (stockUsed / totals.totalStockInitial) * 100
    : 0;

  const creditUtilization = totals.totalCreditLimit > 0
    ? (totals.totalCreditUsed / totals.totalCreditLimit) * 100
    : 0;

  const allocationPct = totals.totalRequested > 0
    ? (totals.totalAllocated / totals.totalRequested) * 100
    : 0;

  return (
    <Box
      sx={{
        width: 320,
        bgcolor: '#f9fafb',
        borderLeft: '1px solid #e5e7eb',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        {/* Allocation Summary */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Allocation Summary
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Total Allocated</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {totals.totalAllocated.toLocaleString()} / {totals.totalRequested.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={allocationPct}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Stack direction="row" spacing={1}>
              <Box sx={{ flex: 1, bgcolor: '#f0fdf4', borderRadius: 1, p: 1.5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803d' }}>
                  {totals.fullOrders}
                </Typography>
                <Typography variant="caption" sx={{ color: '#16a34a' }}>
                  Full
                </Typography>
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#eff6ff', borderRadius: 1, p: 1.5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d4ed8' }}>
                  {totals.partialOrders}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2563eb' }}>
                  Partial
                </Typography>
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#f3f4f6', borderRadius: 1, p: 1.5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  {totals.unallocatedOrders}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  None
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {/* Stock Summary */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Stock Summary
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Stock Used</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {stockUsed.toLocaleString()} / {totals.totalStockInitial.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stockUtilization}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block' }}>
                {totals.totalStockRemaining.toLocaleString()} remaining
              </Typography>
            </Box>

            {/* Top stock cells by consumption */}
            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>
                Top Consumed
              </Typography>
              {stockInitial.slice(0, 5).map(cell => {
                const key = `${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}`;
                const remaining = stockRemaining[key] || 0;
                const used = cell.remaining_qty - remaining;
                const pct = (used / cell.remaining_qty) * 100;

                return (
                  <Box key={key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">{cell.item_id}</Typography>
                      <Typography variant="caption">{pct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Paper>

        {/* Credit Summary */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Credit Summary
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Credit Used</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  ${(totals.totalCreditUsed / 1000).toFixed(1)}k / ${(totals.totalCreditLimit / 1000).toFixed(1)}k
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={creditUtilization}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': creditUtilization > 90 ? { bgcolor: '#ef4444' } : {},
                }}
              />
              <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block' }}>
                {creditUtilization.toFixed(1)}% utilization
              </Typography>
            </Box>

            {/* Top credit users */}
            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>
                Top Credit Usage
              </Typography>
              {customers.slice(0, 5).map(customer => {
                const used = creditUsed[customer.customer_id] || 0;
                const pct = (used / customer.credit_limit) * 100;

                return (
                  <Box key={customer.customer_id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: '80%' }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="caption">{pct.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': pct > 90 ? { bgcolor: '#ef4444' } : {},
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
