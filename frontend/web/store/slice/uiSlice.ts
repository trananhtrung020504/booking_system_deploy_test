import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  globalLoading: boolean;
  activeRequests: number;
}

const initialState: UIState = {
  globalLoading: false,
  activeRequests: 0,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    incrementLoading: (state) => {
      state.activeRequests += 1;
      state.globalLoading = true;
    },
    decrementLoading: (state) => {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
      if (state.activeRequests === 0) {
        state.globalLoading = false;
      }
    },
  },
});

export const { setLoading, incrementLoading, decrementLoading } = uiSlice.actions;
export default uiSlice.reducer;
