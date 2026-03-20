import axios from "axios";

type TokenGetter = () => Promise<string | null>;
let getToken: TokenGetter | null = null;

export const setTokenGetter = (fn: TokenGetter) => {
    getToken = fn;
};

export const api = axios.create({
    baseURL: "http://localhost:5555"
});

api.interceptors.request.use(async (config) => {
    const token = getToken ? await getToken() : null;

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
    }

    return config;
});
