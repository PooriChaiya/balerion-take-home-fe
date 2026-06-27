import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/ordersSlice';
import stockReducer from './slices/stockSlice';
import customersReducer from './slices/customersSlice';
import pricesReducer from './slices/pricesSlice';
import allocationsReducer from './slices/allocationsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    stock: stockReducer,
    customers: customersReducer,
    prices: pricesReducer,
    allocations: allocationsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
