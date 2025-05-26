// frontend/src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from './authService';
import { User, AuthState, LoginCredentials, RegisterCredentials } from './types';
import {jwtDecode} from 'jwt-decode';

// Retrieve token and user from localStorage
const storedToken = localStorage.getItem('token');
let userFromToken: User | null = null;

if (storedToken) {
  try {
    const decodedToken: {
      sub: string;
      email: string;
      firstName: string;
      lastName: string;
      iat: number;
      exp: number;
    } = jwtDecode(storedToken); // Use jwt-decode

    // Check if token is expired
    if (decodedToken.exp * 1000 > Date.now()) {
      userFromToken = {
        id: decodedToken.sub,
        email: decodedToken.email,
        firstName: decodedToken.firstName,
        lastName: decodedToken.lastName,
        // Add any other user fields you stored in the token
      };
    } else {
      localStorage.removeItem('token'); // Token expired
    }
  } catch (error) {
    console.error("Failed to decode token or token is invalid:", error);
    localStorage.removeItem('token');
  }
}


const initialState: AuthState = {
  user: userFromToken,
  token: storedToken,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterCredentials, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        (error.response?.data?.error) || // NestJS validation pipe might use 'error'
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData: LoginCredentials, thunkAPI) => {
    try {
      const data = await authService.login(userData);
      
      
      return {user: data.user, token: data.accessToken}; // Expects { user: User, token: string }
    } catch (error: any) {
      const message =
        (error.response?.data?.message) ||
        (error.response?.data?.error) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user - this is an explicit user action
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    // await authService.logout(); // Call if you have a backend logout endpoint
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // If you were storing the user object separately
  } catch (error: any) {
     const message = (error.response?.data?.message) || error.message || error.toString();
     return thunkAPI.rejectWithValue(message);
  }
});


export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    // You could add a reducer here to manually set user/token if needed from other sources
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.message = ''; // Clear previous messages
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => { // Assuming register returns the user
        state.isLoading = false;
        state.isSuccess = true;
        // state.user = action.payload; // Typically, registration doesn't auto-login user, so no token/user set here
        state.message = 'Registration successful! Please login.';
      })
      .addCase(register.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Registration failed';
        state.user = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.message = 'Login successful!';
      })
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Login failed';
        state.user = null;
        state.token = null;
      })
      // Logout (explicit user action)
      .addCase(logout.pending, (state) => {
        state.isLoading = true; // Optional: show loading during logout
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isSuccess = true; // Or false, depending on how you view logout
        state.message = 'Logout successful.';
      })
      .addCase(logout.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Logout failed.';
        // state.user = null; // State should ideally remain as is or reflect error
        // state.token = null;
      })
      // Case for logout triggered by API interceptor (e.g., 401 error)
      .addCase('auth/interceptorLogout', (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        state.isError = true; // Indicate an error/forced logout state
        state.message = 'Session expired or invalid. Please login again.';
        state.isLoading = false;
        state.isSuccess = false;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;