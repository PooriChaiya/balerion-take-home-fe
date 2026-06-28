'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SubOrder, StockCell, PriceRule, Customer } from '@/types';
import { addAllocation } from '@/store/slices/allocationsSlice';
import { updateOrderAllocated } from '@/store/slices/ordersSlice';
import { updateStock } from '@/store/slices/stockSlice';
import { updateCreditUsed } from '@/store/slices/customersSlice';
import { bankersRound } from '@/lib/allocation';
import { resolveSource, buildStockMap } from '@/lib/allocation/resolveSource';
import { buildPriceMap } from '@/lib/allocation/getUnitPrice';

interface AllocationModalProps {
  open: boolean;
  onClose: () => void;
  order: SubOrder | null;
  stock: StockCell[];
  prices: PriceRule[];
  customer: Customer | null;
}

export default function AllocationModal({
  open,
  onClose,
  order,
  stock,
  prices,
  customer,
}: AllocationModalProps) {
  const dispatch = useDispatch();

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stockMap = useMemo(() => buildStockMap(stock), [stock]);
  const priceMap = useMemo(() => buildPriceMap(prices), [prices]);

  // Get available sources based on order and current selection
  const availableSources = useMemo(() => {
    if (!order) return [];

    const wh = selectedWarehouse || order.warehouse_id;
    const sp = selectedSupplier || order.supplier_id;

    return resolveSource(order.item_id, wh, sp, stockMap, priceMap);
  }, [order, selectedWarehouse, selectedSupplier, stockMap, priceMap]);

  // Get unique warehouses and suppliers from stock for this item
  const warehouses = useMemo(() => {
    if (!order) return [];
    const whSet = new Set<string>();
    for (const cell of stock) {
      if (cell.item_id === order.item_id) {
        whSet.add(cell.warehouse_id);
      }
    }
    return Array.from(whSet).sort();
  }, [order, stock]);

  const suppliers = useMemo(() => {
    if (!order) return [];
    const spSet = new Set<string>();
    for (const cell of stock) {
      if (cell.item_id === order.item_id) {
        spSet.add(cell.supplier_id);
      }
    }
    return Array.from(spSet).sort();
  }, [order, stock]);

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setSelectedWarehouse(order.warehouse_id === 'WH-000' ? '' : order.warehouse_id);
      setSelectedSupplier(order.supplier_id === 'SP-000' ? '' : order.supplier_id);
      const remainingToAllocate = order.request_qty - (order.allocated_qty || 0);
      setQuantity(remainingToAllocate.toString());
      setError(null);
    }
  }, [order]);

  // Calculate validation
  const validation = useMemo(() => {
    if (!order || !selectedWarehouse || !selectedSupplier || !quantity) {
      return { valid: false, message: 'Please fill all fields' };
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return { valid: false, message: 'Invalid quantity' };
    }

    const remainingToAllocate = order.request_qty - (order.allocated_qty || 0);
    if (qty > remainingToAllocate) {
      return { valid: false, message: `Cannot exceed remaining need: ${remainingToAllocate}` };
    }

    // Check stock availability
    const stockKey = `${selectedWarehouse}|${selectedSupplier}|${order.item_id}`;
    const availableStock = stockMap[stockKey] || 0;
    if (qty > availableStock) {
      return { valid: false, message: `Insufficient stock: ${availableStock} available` };
    }

    // Check credit availability
    if (customer) {
      const priceKey = `${order.item_id}|${selectedSupplier}|${order.type}`;
      const unitPrice = priceMap[priceKey] || 0;
      const totalCost = bankersRound(qty * unitPrice, 2);
      const remainingCredit = customer.credit_limit - (customer.credit_used || 0);
      if (totalCost > remainingCredit) {
        return { valid: false, message: `Insufficient credit: ${remainingCredit.toFixed(2)} available, need ${totalCost.toFixed(2)}` };
      }
    }

    return { valid: true, message: '' };
  }, [order, selectedWarehouse, selectedSupplier, quantity, stockMap, priceMap, customer]);

  const handleSubmit = async () => {
    if (!order || !selectedWarehouse || !selectedSupplier || !quantity || !validation.valid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const qty = parseFloat(quantity);
      const stockKey = `${selectedWarehouse}|${selectedSupplier}|${order.item_id}`;
      const priceKey = `${order.item_id}|${selectedSupplier}|${order.type}`;
      const unitPrice = priceMap[priceKey] || 0;
      const totalPrice = bankersRound(qty * unitPrice, 2);

      // Create allocation record
      const allocation = {
        sub_order_id: order.sub_order_id,
        warehouse_id: selectedWarehouse,
        supplier_id: selectedSupplier,
        item_id: order.item_id,
        qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      };

      // Dispatch actions
      dispatch(addAllocation(allocation));
      dispatch(updateOrderAllocated({
        subOrderId: order.sub_order_id,
        allocatedQty: (order.allocated_qty || 0) + qty,
      }));
      dispatch(updateStock({
        warehouseId: selectedWarehouse,
        supplierId: selectedSupplier,
        itemId: order.item_id,
        qty,
      }));
      dispatch(updateCreditUsed({
        customerId: order.customer_id,
        amount: totalPrice,
      }));

      onClose();
    } catch (err) {
      setError('Failed to allocate. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingToAllocate = order ? order.request_qty - (order.allocated_qty || 0) : 0;
  const stockKey = order && selectedWarehouse && selectedSupplier
    ? `${selectedWarehouse}|${selectedSupplier}|${order.item_id}`
    : null;
  const availableStock = stockKey ? (stockMap[stockKey] || 0) : 0;
  const priceKey = order && selectedSupplier
    ? `${order.item_id}|${selectedSupplier}|${order.type}`
    : null;
  const unitPrice = priceKey ? (priceMap[priceKey] || 0) : 0;
  const estimatedCost = quantity ? bankersRound(parseFloat(quantity || '0') * unitPrice, 2) : 0;
  const remainingCredit = customer ? customer.credit_limit - (customer.credit_used || 0) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {order ? (
        <>
          <DialogTitle>
            Manual Allocation
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
                Order
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {order.sub_order_id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={`Item: ${order.item_id}`} size="small" />
                <Chip label={`Customer: ${order.customer_id}`} size="small" />
                <Chip
                  label={order.type}
                  size="small"
                  sx={{
                    bgcolor: order.type === 'EMERGENCY' ? '#fee2e2' :
                           order.type === 'OVERDUE' ? '#fef3c7' : '#dbeafe',
                    color: order.type === 'EMERGENCY' ? '#991b1b' :
                           order.type === 'OVERDUE' ? '#92400e' : '#1e40af',
                  }}
                />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Requested
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {order.request_qty.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Already Allocated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {(order.allocated_qty || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Remaining
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#059669' }}>
                    {remainingToAllocate.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Warehouse Selection */}
              <FormControl fullWidth disabled={order.warehouse_id !== 'WH-000'}>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={selectedWarehouse}
                  label="Warehouse"
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  {order.warehouse_id !== 'WH-000' ? (
                    <MenuItem value={order.warehouse_id}>{order.warehouse_id} (Fixed)</MenuItem>
                  ) : (
                    warehouses.map(wh => (
                      <MenuItem key={wh} value={wh}>{wh}</MenuItem>
                    ))
                  )}
                </Select>
                {order.warehouse_id !== 'WH-000' && (
                  <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5 }}>
                    Fixed by order
                  </Typography>
                )}
              </FormControl>

              {/* Supplier Selection */}
              <FormControl fullWidth disabled={order.supplier_id !== 'SP-000'}>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={selectedSupplier}
                  label="Supplier"
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  {order.supplier_id !== 'SP-000' ? (
                    <MenuItem value={order.supplier_id}>{order.supplier_id} (Fixed)</MenuItem>
                  ) : (
                    suppliers.map(sp => (
                      <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                    ))
                  )}
                </Select>
                {order.supplier_id !== 'SP-000' && (
                  <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5 }}>
                    Fixed by order
                  </Typography>
                )}
              </FormControl>

              {/* Quantity Input */}
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                slotProps={{ htmlInput: { min: 0, max: remainingToAllocate, step: 0.01 } }}
                helperText={`Max: ${remainingToAllocate.toLocaleString()}`}
              />

              {/* Available Sources Info */}
              {selectedWarehouse && selectedSupplier && (
                <Box sx={{ p: 1.5, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Source Availability
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    Stock: {availableStock.toLocaleString()} | Unit Price: ${unitPrice.toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Credit Info */}
              {customer && (
                <Box sx={{ p: 1.5, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Credit
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                    Remaining: ${remainingCredit.toFixed(2)} | Est. Cost: ${estimatedCost.toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Validation Error */}
              {error && (
                <Alert severity="error">{error}</Alert>
              )}
              {!validation.valid && validation.message && (
                <Alert severity="warning">{validation.message}</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!validation.valid || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isSubmitting ? 'Allocating...' : 'Allocate'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <DialogContent>
          <Typography>No order selected</Typography>
        </DialogContent>
      )}
    </Dialog>
  );
}
