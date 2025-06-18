import axios from "axios";

const axiosPublic = axios.create({
  baseURL: 'https://squirrel-peace-server.vercel.app'
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
