'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { StockCell } from '@/types';

interface StockModalProps {
  open: boolean;
  onClose: () => void;
  stock: StockCell[];
  highlightedItemId?: string;
}

export default function StockModal({ open, onClose, stock, highlightedItemId }: StockModalProps) {
  const [search, setSearch] = useState('');

  const filteredStock = useMemo(() => {
    if (!search) return stock;
    const q = search.toLowerCase();
    return stock.filter(cell =>
      cell.warehouse_id.toLowerCase().includes(q) ||
      cell.supplier_id.toLowerCase().includes(q) ||
      cell.item_id.toLowerCase().includes(q) ||
      cell.remaining_qty.toString().includes(q)
    );
  }, [stock, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Stock Inventory</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            {filteredStock.length} {filteredStock.length === stock.length ? 'total' : 'filtered'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search by warehouse, supplier, item ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Warehouse</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Item ID</TableCell>
                <TableCell align="right">Remaining Qty</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      No stock found matching "{search}"
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStock.map((cell, idx) => (
                  <TableRow
                    key={`${cell.warehouse_id}|${cell.supplier_id}|${cell.item_id}|${idx}`}
                    sx={{
                      bgcolor: highlightedItemId && cell.item_id === highlightedItemId ? '#fef3c7' : undefined,
                    }}
                  >
                    <TableCell>{cell.warehouse_id}</TableCell>
                    <TableCell>{cell.supplier_id}</TableCell>
                    <TableCell sx={{ fontWeight: highlightedItemId === cell.item_id ? 600 : 400 }}>
                      {cell.item_id}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color: cell.remaining_qty > 0 ? '#059669' : '#dc2626',
                          fontWeight: 500,
                        }}
                      >
                        {cell.remaining_qty.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
