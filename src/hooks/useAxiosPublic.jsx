import axios from "axios";
import { patchAxios } from "../Components/Layout/DataRefresh";


const axiosPublic = axios.create({
  baseURL: 'https://squirrel-peace-server.onrender.com'
});
patchAxios(axiosPublic);

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
