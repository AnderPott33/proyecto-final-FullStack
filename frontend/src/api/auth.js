import axios from 'axios';

const API_URL = 'https://owl-soft.onrender.com/api/auth';

export const fetchUsuarios = async (token) => {
  const res = await axios.get(`${API_URL}/`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};