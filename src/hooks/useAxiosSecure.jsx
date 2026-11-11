import axios from "axios";
import { API_BASE } from "../config/api";
import { useEffect } from "react";
import { patchAxios } from "./DataRefresh";
import { useNavigate } from "react-router-dom";
import useAuth from "./useAuth";

const axiosSecure = axios.create({
    baseURL: API_BASE
});
patchAxios(axiosSecure);

axiosSecure.interceptors.request.use((config) => {
    const token = localStorage.getItem('access-token');
    config.headers.authorization = `Bearer ${token}`;
    return config;
});

let onUnauthorized = null;
let handling = false;

// শুধু 401 হলে logout; 403 (যেমন action token expire) হলে admin logout হবে না
axiosSecure.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && onUnauthorized && !handling) {
            handling = true;
            try {
                await onUnauthorized();
            } finally {
                setTimeout(() => { handling = false; }, 1500);
            }
        }
        return Promise.reject(error);
    }
);

const useAxiosSecure = () => {
    const navigate = useNavigate();
    const { logOut } = useAuth();

    useEffect(() => {
        onUnauthorized = async () => {
            await logOut();
            navigate('/login');
        };
    }, [logOut, navigate]);

    return axiosSecure;
};

export default useAxiosSecure;