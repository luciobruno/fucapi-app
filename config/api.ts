import axios from 'axios';

const api = axios.create({
    // baseURL: 'https://app-qdrnejwvta-uc.a.run.app',
    baseURL: 'http://localhost:5000',
    timeout: 1000
});

export default api;