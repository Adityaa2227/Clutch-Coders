import React, { createContext, useReducer, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'LOGOUT':
    case 'REGISTER_FAIL':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null
      };
    case 'UPDATE_WALLET': 
      return {
        ...state,
        user: { ...state.user, walletBalance: action.payload }
      }
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async () => {
    if (localStorage.getItem('token')) {
      // Set to headers done by interceptor, but we need to call the endpoint
      try {
        const res = await api.get('/auth/user');
        dispatch({ type: 'USER_LOADED', payload: res.data });
      } catch (err) {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } else {
        dispatch({ type: 'AUTH_ERROR' }); // Stop loading
    }
  };

  const login = async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
  };

  const register = async (name, email, password) => {
      const res = await api.post('/auth/register', { name, email, password });
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const updateWallet = (newBalance) => dispatch({ type: 'UPDATE_WALLET', payload: newBalance });

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loadUser, login, register, logout, updateWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
