const client = axios.create({
    baseURL: 'https://kind-wind-83282.pktriot.net/'
})

const endpoints = {
    info: 'auth/info',
    login: 'auth/login',
    logout: 'auth/logout',
    register: 'auth/register',
    changePassword: 'auth/password/change',
    resetPassword: 'auth/password/reset',
    conferences: 'conferences',
    conferenceDetails: 'conferences/<id>',
    joinConference: 'conferences/<id>/join',
    userConferences: '/user/conferences',
    userPapers: '/user/papers',
    papers: 'papers'
}

const pathEncode = (endpoint, ...arguments) =>
    arguments.reduce((path, argument) =>
        path.replace(/<[^>]*>/, argument),
        endpoint)

const api = {
    auth: {
        info: () =>
            client.get(endpoints.info),
        login: (username, password) =>
            client.post(endpoints.login, {username, password}),
        logout: () =>
            client.post(endpoints.logout),
        register: (username, email, password1, password2) =>
            client.post(endpoints.register, {username, email, password1, password2}),
        changePassword: () =>
            console.error("NOT IMPLEMENTED"),
        resetPassword: email =>
            client.post(endpoints.resetPassword, {email}),
    },
    conferences: {
        list: () =>
            client.get(endpoints.conferences),
        retrieve: id =>
            client.get(pathEncode(endpoints.conferenceDetails, id)),
        create: ({title, description, date, location, deadline, fee}) =>
            client.post(endpoints.conferences, {title, description, date, location, deadline, fee}),
        update: ({id, title, description, date, location, deadline, fee}) =>
            client.post(pathEncode(endpoints.conferenceDetails, id), {title, description, date, location, deadline, fee}),
        join: id =>
            client.post(pathEncode(endpoints.joinConference, id))
    },
    user: {
        conferences: () =>
            client.get(endpoints.userConferences),
        papers: () =>
            client.get(endpoints.userPapers)
    },
    papers: {
        list: () =>
            client.get(endpoints.papers),
        create: ({title, conference, topics, keywords, abstract, paper, authors}) => {
            data = new FormData()
            data.append('title', title)
            data.append('conference', conference)
            console.warn('authors', authors)

            if (authors.length) data.append('contributors', authors)
            data.append('abstract', abstract)
            // TODO: rename
            data.append('proposal', paper)
            data.append('keywords', JSON.stringify(keywords))
            data.append('topics', JSON.stringify(topics))
            return client.post(endpoints.papers, data)
        }
    },
    setUnauthorizedCallback: callback =>
        api.unauthorizedCallback = callback
}

client.interceptors.request.use(
    config => {
        access_token = window.localStorage.getItem('x-jwt-access-token')
        if (access_token && config.url != endpoints.login && config.url != endpoints.register)
            config.headers['Authorization'] = `Bearer ${access_token}`
        return config
    },
    error => Promise.reject(error)
)

client.interceptors.response.use(
    response => {
        if (response.config.url == endpoints.login || response.config.url == endpoints.register)
            window.localStorage.setItem('x-jwt-access-token', response.data.access_token)

        if (response.config.url == endpoints.logout)
            window.localStorage.removeItem('x-jwt-access-token')

        return response
    },

    error => {
        if (error.response.config.url == endpoints.info && error.response.status == 401) {
            window.localStorage.removeItem('x-jwt-access-token')
            return Promise.resolve({...error.response, data: {...error.response.data, authenticated: false}})
        }
        if (error.response.config.url == endpoints.logout && error.response.status == 401) {
            window.localStorage.removeItem('x-jwt-access-token')
            return Promise.resolve(error.response)
        }

        console.warn('ERROR INTERCEPTED')
        console.log(`${error.response.config.url} ${error.response.status} ${error.response.statusText}`)
        console.log(error.response)
        console.log(error.request)
        console.log(error.config)

        if (error.response.status == 401)
            api.unauthorizedCallback()

        return Promise.reject(error)
    }
)