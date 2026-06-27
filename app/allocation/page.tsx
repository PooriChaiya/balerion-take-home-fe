'use client';

import { useAppSelector } from '@/store/hooks';
import { useAllocation } from '@/hooks/useAllocation';
import TopBar from '@/components/allocation/TopBar';
import AllocationTable from '@/components/allocation/AllocationTable';
import SummaryPanel from '@/components/allocation/SummaryPanel';
import { Box, LinearProgress, Typography, Stack } from '@mui/material';

export default function AllocationPage() {
  const { isReady, isRunning, progress } = useAllocation();

  // Get filtered orders
  const orders = useAppSelector(state => state.orders.data);
  const stock = useAppSelector(state => state.stock.initial);
  const customers = useAppSelector(state => state.customers.data);
  const allocations = useAppSelector(state => state.allocations.byId);

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Stack sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Loading allocation data...
          </Typography>
          {isRunning && (
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Running auto-allocation: {progress}%
            </Typography>
          )}
        </Stack>
      </Box>
    );
  }

  if (isRunning) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Stack sx={{ textAlign: 'center', spacing: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Running auto-allocation...
          </Typography>
          <Box sx={{ width: 256 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {progress}%
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <AllocationTable />
        </Box>
      </Box>

      {/* Summary side panel */}
      <SummaryPanel />
    </Box>
  );
}
