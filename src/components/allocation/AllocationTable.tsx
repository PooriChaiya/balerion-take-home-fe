'use client';

import { useMemo, useState, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';
import { SubOrder } from '@/types';
import { bankersRound } from '@/lib/allocation';
import StockModal from './StockModal';
import CustomerModal from './CustomerModal';

const columnHelper = createColumnHelper<SubOrder>();

interface AllocationTableProps {
  onRowClick?: (order: SubOrder) => void;
  selectedOrderId?: string | null;
}

export default function AllocationTable({ onRowClick, selectedOrderId }: AllocationTableProps) {
  const orders = useAppSelector(state => state.orders.data);
  const stockRemaining = useAppSelector(state => state.stock.remaining);
  const prices = useAppSelector(state => state.prices.byKey);
  const { search, typeFilter, statusFilter, sourceFilter } = useAppSelector(state => state.ui);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'type', desc: false }]);

  // Modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>();
  const [highlightedCustomerId, setHighlightedCustomerId] = useState<string | undefined>();

  // Fetch stock and customers data for modals
  const stockData = useAppSelector(state => state.stock.initial);
  const customersData = useAppSelector(state => state.customers.data);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matches =
          order.order_id?.toLowerCase().includes(q) ||
          order.sub_order_id?.toLowerCase().includes(q) ||
          order.customer_id?.toLowerCase().includes(q) ||
          order.item_id?.toLowerCase().includes(q) ||
          order.remark?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && order.type !== typeFilter) return false;

      // Source filter
      if (sourceFilter === 'WILDCARD' &&
          order.warehouse_id !== 'WH-000' &&
          order.supplier_id !== 'SP-000') return false;
      if (sourceFilter === 'SPECIFIC' &&
          (order.warehouse_id === 'WH-000' || order.supplier_id === 'SP-000')) return false;

      // Status filter
      const allocated = order.allocated_qty || 0;
      const status = allocated >= order.request_qty ? 'FULL' : allocated > 0 ? 'PARTIAL' : 'NONE';
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;

      return true;
    });
  }, [orders, search, typeFilter, statusFilter, sourceFilter]);

  // Define columns
  const columns = useMemo(() => [
    columnHelper.accessor('sub_order_id', {
      header: 'Sub Order',
      cell: info => info.getValue(),
      size: 150,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => {
        const type = info.getValue();
        const colors: Record<string, { bgcolor: string; color: string }> = {
          EMERGENCY: { bgcolor: '#fee2e2', color: '#991b1b' },
          OVERDUE: { bgcolor: '#fef3c7', color: '#92400e' },
          DAILY: { bgcolor: '#dbeafe', color: '#1e40af' },
        };
        const color = colors[type] || colors.DAILY;
        return <Chip label={type} size="small" sx={{ bgcolor: color.bgcolor, color: color.color, fontWeight: 500 }} />;
      },
      size: 100,
    }),
    columnHelper.accessor('customer_id', {
      header: 'Customer',
      cell: info => {
        const customerId = info.getValue();
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setHighlightedCustomerId(customerId);
              setCustomerModalOpen(true);
            }}
            sx={{ cursor: 'pointer', color: '#3b82f6', '&:hover': { textDecoration: 'underline' } }}
          >
            {customerId}
          </Box>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('item_id', {
      header: 'Item',
      cell: info => info.getValue(),
      size: 80,
    }),
    columnHelper.accessor('warehouse_id', {
      header: 'Warehouse',
      cell: info => {
        const warehouseId = info.getValue();
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setHighlightedItemId(info.row.original.item_id);
              setStockModalOpen(true);
            }}
            sx={{ cursor: 'pointer', color: '#3b82f6', '&:hover': { textDecoration: 'underline' } }}
          >
            {warehouseId}
          </Box>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('supplier_id', {
      header: 'Supplier',
      cell: info => {
        const supplierId = info.row.original.supplier_id;
        const isWildcard = supplierId === 'SP-000';
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setHighlightedItemId(info.row.original.item_id);
              setStockModalOpen(true);
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            <Typography sx={{
              color: isWildcard ? '#9333ea' : '#3b82f6',
              fontWeight: isWildcard ? 600 : 400
            }}>
              {supplierId}
            </Typography>
            {isWildcard && <span>✨</span>}
          </Box>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('request_qty', {
      header: 'Requested',
      cell: info => info.getValue()?.toLocaleString(),
      size: 100,
    }),
    columnHelper.accessor(row => row.allocated_qty || 0, {
      id: 'allocated_qty',
      header: 'Allocated',
      cell: info => {
        const order = info.row.original;
        const allocated = order.allocated_qty || 0;
        const requested = order.request_qty;
        const fillPct = bankersRound((allocated / requested) * 100, 0);

        const barColor = fillPct >= 100 ? '#22c55e' : fillPct > 0 ? '#3b82f6' : '#9ca3af';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ width: 60, textAlign: 'right', fontSize: '0.875rem' }}>
              {allocated.toLocaleString()}
            </Typography>
            <Box sx={{ width: 60, height: 8, bgcolor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  bgcolor: barColor,
                  width: `${Math.min(fillPct, 100)}%`,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', width: 35 }}>
              {fillPct}%
            </Typography>
          </Box>
        );
      },
      size: 200,
    }),
    columnHelper.accessor('create_date', {
      header: 'Date',
      cell: info => info.getValue(),
      size: 100,
    }),
  ], []);

  // Create table instance
  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  // Virtual row setup
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const rows = table.getRowModel().rows;
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TableContainer
        ref={tableContainerRef}
        component={Paper}
        sx={{
          flex: 1,
          overflow: 'auto',
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Table stickyHeader sx={{ minWidth: 800 }}>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell
                    key={header.id}
                    sx={{
                      width: header.getSize(),
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f9fafb' },
                      bgcolor: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                    No orders match the current filters.
                  </Typography>
                  {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
                    <Button size="small" onClick={() => window.location.reload()}>
                      Clear filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Spacer for virtual scrolling */}
                {virtualRows.length > 0 && (
                  <TableRow style={{ height: `${virtualRows[0]?.start || 0}px` }}>
                    <TableCell colSpan={columns.length} sx={{ border: 'none' }} />
                  </TableRow>
                )}

                {virtualRows.map(virtualRow => {
                  const row = rows[virtualRow.index];
                  const isEmergencyUnallocated = row.original.type === 'EMERGENCY' && (row.original.allocated_qty || 0) === 0;

                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      onClick={() => onRowClick?.(row.original)}
                      sx={{
                        borderBottom: isEmergencyUnallocated ? '4px solid #ef4444' : undefined,
                        borderLeft: isEmergencyUnallocated ? '4px solid #ef4444' : undefined,
                        '&:hover': { bgcolor: '#f9fafb', cursor: 'pointer' },
                        bgcolor: selectedOrderId === row.original.sub_order_id ? '#e0f2fe' : undefined,
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          sx={{
                            width: cell.column.getSize(),
                            fontSize: '0.875rem',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}

                {/* Spacer for virtual scrolling */}
                {virtualRows.length > 0 && (
                  <TableRow style={{ height: `${rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)}px` }}>
                    <TableCell colSpan={columns.length} sx={{ border: 'none' }} />
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      <StockModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        stock={stockData}
        highlightedItemId={highlightedItemId}
      />
      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        customers={customersData}
        highlightedCustomerId={highlightedCustomerId}
      />
    </Box>
  );
}
