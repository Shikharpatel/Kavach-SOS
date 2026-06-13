import axios from 'axios';

const axiosInstance = axios.create({ baseURL: '/api' });

export const customInstance = <T>(config: any, options?: any): Promise<T> => {
  return axiosInstance({ ...config, ...options }).then(({ data }) => data);
};

export default customInstance;
