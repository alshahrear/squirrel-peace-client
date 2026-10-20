import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useClientAuth } from "../Components/Provider/ClientAuthContext"; 

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000'
});

const useAxiosClient = () => {
    const navigate = useNavigate();
    const { clientLogout } = useClientAuth();

    // request interceptor to add client token for every secure call
    axiosClient.interceptors.request.use(function (config) {
        const token = localStorage.getItem('clientToken'); // ক্লায়েন্টের টোকেন নেওয়া
        if (token) {
            config.headers.authorization = `Bearer ${token}`;
        }
        return config;
    }, function (error) {
        return Promise.reject(error);
    });

    // intercepts 401 and 403 status for clients
    axiosClient.interceptors.response.use(function (response) {
        return response;
    }, async (error) => {
        const status = error.response?.status;
        
        // টোকেন মেয়াদোত্তীর্ণ বা অবৈধ হলে ক্লায়েন্টকে লগআউট করে লগইন পেজে পাঠিয়ে দেওয়া
        if (status === 401 || status === 403) {
            await clientLogout();
            navigate('/login'); // আপনার ক্লায়েন্টের লগইন রাউটের পাথ দেবেন
        }
        return Promise.reject(error);
    });

    return axiosClient;
};

export default useAxiosClient;