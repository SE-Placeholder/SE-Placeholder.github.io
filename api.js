const client = axios.create({
    baseURL: 'https://kind-wind-83282.pktriot.net/'
    // baseURL: 'http://localhost:1337/'
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
    joinConferenceSection: 'conferences/<id>/join-section',

    userConferences: '/user/conferences',
    userProposals: '/user/proposals',

    proposals: 'proposals',
    proposalDetails: 'proposals/<id>',
    bidProposal: 'proposals/<id>/bid',
    reviewProposal: 'proposals/<id>/review',
    assignReviewers: 'proposals/<id>/assign-reviewers'
}

const pathEncode = (endpoint, ...arguments) =>
    arguments.reduce((path, argument) => path.replace(/<[^>]*>/, argument), endpoint)

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
        create: ({title, description, date, location, fee, abstract_deadline, proposal_deadline, bidding_deadline, reviewing_deadline}) =>
            client.post(endpoints.conferences, {title, description, date, location, fee, abstract_deadline, proposal_deadline, bidding_deadline, reviewing_deadline}),
        update: ({id, title, description, date, location, fee, abstract_deadline, proposal_deadline, bidding_deadline, reviewing_deadline, steering_committee, sections}) => {
            updatedConference = {
                title,
                description,
                date,
                location,
                fee,
                abstract_deadline,
                proposal_deadline,
                bidding_deadline,
                reviewing_deadline,
                steering_committee: JSON.stringify(steering_committee)
            }
            if (sections) updatedConference.sections = JSON.stringify(sections)
            return client.post(pathEncode(endpoints.conferenceDetails, id), updatedConference)
        },
        join: id =>
            client.post(pathEncode(endpoints.joinConference, id)),
        joinSection: (id, section) =>
            client.post(pathEncode(endpoints.joinConferenceSection, id), {section})
    },
    proposals: {
        list: () =>
            client.get(endpoints.proposals),
        create: ({title, conference, topics, keywords, abstract, paper, authors}) => {
            data = new FormData()
            data.append('title', title)
            data.append('conference', conference)
            data.append('authors', JSON.stringify(authors))
            data.append('abstract', abstract)
            data.append('paper', paper)
            data.append('keywords', JSON.stringify(keywords))
            data.append('topics', JSON.stringify(topics))
            return client.post(endpoints.proposals, data)
        },
        // update: ({id, title, conference, topics, keywords, abstract, paper, authors}) => {
        update: ({id, title, topics, keywords, abstract, paper, authors}) => {
            data = new FormData()
            data.append('title', title)
            // data.append('conference', conference)
            data.append('authors', JSON.stringify(authors))
            // check if a new file was uploaded
            if (abstract)
                data.append('abstract', abstract)
            if (paper)
                data.append('paper', paper)
            data.append('keywords', JSON.stringify(keywords))
            data.append('topics', JSON.stringify(topics))
            return client.post(pathEncode(endpoints.proposalDetails, id), data)
        },
        bid: (id, qualifier) => client.post(pathEncode(endpoints.bidProposal, id), {qualifier}),
        assignReviewers: (id, reviewers) => client.post(pathEncode(endpoints.assignReviewers, id), {reviewers}),
        review: (id, qualifier, review) => client.post(pathEncode(endpoints.reviewProposal, id), {qualifier, review})
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
