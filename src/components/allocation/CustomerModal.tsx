'use client';

import { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
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
  Chip,
  LinearProgress,
} from '@mui/material';
import { Customer } from '@/types';

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  highlightedCustomerId?: string;
}

export default function CustomerModal({
  open,
  onClose,
  customers,
  highlightedCustomerId,
}: CustomerModalProps) {
  const [search, setSearch] = useState('');
  const creditUsedMap = useAppSelector(state => state.customers.creditUsed);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.customer_id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.tier.toLowerCase().includes(q) ||
      c.credit_limit.toString().includes(q)
    );
  }, [customers, search]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return { bgcolor: '#fef3c7', color: '#92400e' };
      case 'GOLD':
        return { bgcolor: '#dbeafe', color: '#1e40af' };
      default:
        return { bgcolor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Customers</Typography>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            {filteredCustomers.length} {filteredCustomers.length === customers.length ? 'total' : 'filtered'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search by ID, name, tier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="right">Credit Limit</TableCell>
                <TableCell align="right">Credit Used</TableCell>
                <TableCell align="right">Available</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      No customers found matching "{search}"
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => {
                  const creditUsed = creditUsedMap[c.customer_id] || 0;
                  const remaining = c.credit_limit - creditUsed;
                  const usagePct = (creditUsed / c.credit_limit) * 100;
                  const tierColor = getTierColor(c.tier);

                  return (
                    <TableRow
                      key={c.customer_id}
                      sx={{
                        bgcolor: highlightedCustomerId === c.customer_id ? '#e0f2fe' : undefined,
                      }}
                    >
                      <TableCell sx={{ fontWeight: highlightedCustomerId === c.customer_id ? 600 : 400 }}>
                        {c.customer_id}
                      </TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.tier}
                          size="small"
                          sx={{ bgcolor: tierColor.bgcolor, color: tierColor.color, fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="right">${c.credit_limit.toLocaleString()}</TableCell>
                      <TableCell align="right">${creditUsed.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: remaining > 0 ? '#059669' : '#dc2626',
                            fontWeight: 500,
                          }}
                        >
                          ${remaining.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
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
