'use client';

import { useState } from 'react';
import { useAllocation } from '@/hooks/useAllocation';
import TopBar from '@/components/allocation/TopBar';
import AllocationTable from '@/components/allocation/AllocationTable';
import SummaryPanel from '@/components/allocation/SummaryPanel';
import AllocationModal from '@/components/allocation/AllocationModal';
import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { SubOrder } from '@/types';

export default function AllocationPage() {
  const { isReady, isRunning, progress } = useAllocation();
  const stock = useAppSelector(state => state.stock.initial);
  const prices = useAppSelector(state => state.prices.data);
  const customers = useAppSelector(state => state.customers.data);

  const [selectedOrder, setSelectedOrder] = useState<SubOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (order: SubOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Don't clear selectedOrder immediately to allow transitions
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const selectedCustomer = selectedOrder
    ? customers.find(c => c.customer_id === selectedOrder.customer_id) || null
    : null;


  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Stack sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Loading allocation data...
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            {"SALMON ALLOCATION"}
          </Typography>
          {isRunning && (
            <>
              <Box sx={{ width: 256, mt: 2 }}>
                <LinearProgress variant="determinate" value={Math.min(progress, 100)} />
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
          <AllocationTable
            onRowClick={handleRowClick}
            selectedOrderId={selectedOrder?.sub_order_id}
          />
        </Box>
      </Box>

      {/* Summary side panel */}
      <SummaryPanel />

      {/* Manual Allocation Modal */}
      <AllocationModal
        open={modalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        stock={stock}
        prices={prices}
        customer={selectedCustomer}
      />
    </Box>
  );
}
