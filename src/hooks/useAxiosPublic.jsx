import axios from "axios";

const axiosPublic = axios.create({
  baseURL: 'https://squirrelpeace.com/api/'
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
