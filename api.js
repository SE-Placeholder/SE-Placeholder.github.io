const api = axios.create({
    baseURL: 'https://kind-wind-83282.pktriot.net/'
})

// TODO: handle refresh tokens
api.interceptors.request.use(
    config => {
        access_token = window.localStorage.getItem("x-jwt-access-tokens")
        if (access_token)
            config.headers['Authorization'] = `Bearer ${access_token}`
        return config
    },
    error => Promise.reject(error)
)

// TODO: handle refresh tokens
// TODO: intercept access token response
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status == 401)
            window.location.href = 'login.html'
        return Promise.reject(error)
    }
)

// TODO: something like this?
// api.endpoints = {
//     getConferences: () => {
//         return api.get()...
//     }
// }