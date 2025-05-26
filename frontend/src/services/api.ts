// // frontend/src/services/api.ts
// import axios from 'axios';
// import { store } from '../app/store'; // We'll create this soon

// const REACT_APP_API_BASE_URL= "http://localhost:3000/api/v1"

// const api = axios.create({
//   baseURL: REACT_APP_API_BASE_URL,
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = store.getState().auth.token; // Assuming auth slice stores the token
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;


// frontend/src/services/api.ts
import axios, { InternalAxiosRequestConfig } from 'axios';
import type { Store } from '@reduxjs/toolkit'; // For type, not for value
import type { RootState } from '../app/store'; // For type

const REACT_APP_API_BASE_URL= "http://localhost:3000/api/v1"

// Hold a reference to the store
let storeRef: Store<RootState> | undefined;

export const injectStore = (store: Store<RootState>) => {
  storeRef = store;
};

const api = axios.create({
  baseURL: REACT_APP_API_BASE_URL,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> => {
    if (storeRef) {
      const token = storeRef.getState().auth.token;
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && storeRef) {
      originalRequest._retry = true; // Mark to avoid retry loops
      console.error("Unauthorized or token expired. Dispatching auto-logout.");
      // Dispatch a custom action string that authSlice will listen for
      // This avoids directly importing the `logout` thunk here, breaking the cycle.
      storeRef.dispatch({ type: 'auth/interceptorLogout' });

      // Optionally, you could redirect here, but it's often better handled by UI reacting to auth state.
      // Example: window.location.href = '/login';
      return Promise.reject(error.response?.data || 'Unauthorized: Session expired or invalid.');
    }
    return Promise.reject(error);
  }
);

export default api;