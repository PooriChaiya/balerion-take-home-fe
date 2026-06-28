'use client';

import { useAllocation } from '@/hooks/useAllocation';
import TopBar from '@/components/allocation/TopBar';
import AllocationTable from '@/components/allocation/AllocationTable';
import SummaryPanel from '@/components/allocation/SummaryPanel';
import { Box, LinearProgress, Typography, Stack } from '@mui/material';

export default function AllocationPage() {
  const { isReady, isRunning, progress } = useAllocation();


  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Stack sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Loading allocation data...
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            Debug: isReady={String(isReady)} isRunning={String(isRunning)} progress={progress}
          </Typography>
          {isRunning && (
            <>
              <Box sx={{ width: 256, mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            </>
          )}
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
