// TODO: handle refresh tokens

client = axios.create({
    baseURL: 'https://kind-wind-83282.pktriot.net/'
})

endpoints = {
    login: 'auth/login/',
    logout: 'auth/logout/',
    register: 'auth/register/',
    resetPassword: 'auth/password/reset/',
    getConferences: 'conference/list/',
    createConference: 'conference/add/'

    // TODO: isAuthenticated() endpoint
    // '/auth/user/'
    // '/auth/password/change/'
    // '/auth/password/reset/confirm/'
    // '/dummy/conferences/'
    // '/dummy/non-restricted/conferences/'
    // '/user/list/'
    // '/user/get/username/'
    // '/conference/get/id/'
    // '/paper/list/'
}

api = {
    login: (username, password) => client.post(endpoints.login, {username, password}),
    logout: () => client.post(endpoints.logout),
    register: (username, email, password1, password2) => client.post(endpoints.register, {username, email, password1, password2}),
    resetPassword: email => client.post(endpoints.resetPassword, {email}),
    getConferences: () => client.get(endpoints.getConferences),
    createConference: (title, description, deadline) => client.post(endpoints.createConference, {title, description, deadline}),
}

client.interceptors.request.use(
    config => {
        access_token = window.localStorage.getItem('x-jwt-access-token')
        // TODO: refactor this
        if (access_token && config.url != endpoints.login && config.url != endpoints.register)
            config.headers['Authorization'] = `Bearer ${access_token}`

        return config
    },
    error => Promise.reject(error)
)

client.interceptors.response.use(
    response => {
        // TODO: check status codes and refactor
        if (response.config.url == endpoints.login || response.config.url == endpoints.register)
            window.localStorage.setItem('x-jwt-access-token', response.data.access_token)

        if (response.config.url == endpoints.logout)
            window.localStorage.removeItem('x-jwt-access-token')

        return response
    },
    error => {
        console.warn('ERROR INTERCEPTED')
        console.log(`${error.response.config.url} ${error.response.status} ${error.response.statusText}`)
        console.log(error.response)
        console.log(error.request)
        console.log(error.config)

        if (error.response.status == 401)
            window.location.href = 'login.html'
        return Promise.reject(error)
    }
)