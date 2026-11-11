import axios from "axios";
import { API_BASE } from "../config/api";
import { useEffect } from "react";
import { patchAxios } from "./DataRefresh";
import { useNavigate } from "react-router-dom";
import { useClientAuth } from "./ClientAuthContext";

const axiosClient = axios.create({
    baseURL: API_BASE
});
patchAxios(axiosClient);

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('clientToken');
    if (token) config.headers.authorization = `Bearer ${token}`;
    return config;
});

let onUnauthorized = null;
let handling = false;

// শুধু 401 (token/session শেষ) হলে logout; 403 (permission নেই) হলে logout হবে না
axiosClient.interceptors.response.use(
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

const useAxiosClient = () => {
    const navigate = useNavigate();
    const { clientLogout } = useClientAuth();

    useEffect(() => {
        onUnauthorized = async () => {
            await clientLogout();
            navigate('/login-client');
        };
    }, [clientLogout, navigate]);

    return axiosClient;
};

export default useAxiosClient;