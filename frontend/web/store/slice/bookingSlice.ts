import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SeatsUpdatePayload } from '@/types';

interface BookingFlowState {
  selectedShowId: string | null;
  selectedSeats: string[];
  holdExpiresAt: number | null;
  seatStatus: SeatsUpdatePayload | null;
}

const initialState: BookingFlowState = {
  selectedShowId: null,
  selectedSeats: [],
  holdExpiresAt: null,
  seatStatus: null,
};

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedShow: (state, action: PayloadAction<string>) => {
      state.selectedShowId = action.payload;
      state.selectedSeats = [];
      state.holdExpiresAt = null;
    },
    setSelectedSeats: (state, action: PayloadAction<string[]>) => {
      state.selectedSeats = action.payload;
    },
    setHoldExpiresAt: (state, action: PayloadAction<number | null>) => {
      state.holdExpiresAt = action.payload;
    },
    setSeatStatus: (state, action: PayloadAction<SeatsUpdatePayload>) => {
      state.seatStatus = action.payload;
    },
    resetBookingFlow: (state) => {
      state.selectedShowId = null;
      state.selectedSeats = [];
      state.holdExpiresAt = null;
      state.seatStatus = null;
    },
  },
});

export const {
  setSelectedShow,
  setSelectedSeats,
  setHoldExpiresAt,
  setSeatStatus,
  resetBookingFlow,
} = bookingSlice.actions;
