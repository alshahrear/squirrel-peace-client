import axios from "axios";
import { API_BASE } from "../config/api";
import { patchAxios } from "./DataRefresh";


const axiosPublic = axios.create({
  baseURL: API_BASE
});
patchAxios(axiosPublic);

// login/gate/jwt বাদে বাকি সব রিকোয়েস্টে token জুড়ে দেওয়া
axiosPublic.interceptors.request.use((config) => {
  const u = config.url || '';
  const skip = u.startsWith('/client/login') || u.startsWith('/gate') || u.startsWith('/jwt') || u.startsWith('/users');
  if (!skip && !config.headers.authorization) {
    const t = localStorage.getItem('clientToken') || localStorage.getItem('access-token');
    if (t) config.headers.authorization = `Bearer ${t}`;
  }
  return config;
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
