function openTab(scopeClass, tabName) {
    document.querySelectorAll(scopeClass).forEach(div => div.style.display = "none")
    document.getElementById(tabName).style.display = "block"
}

function showModal(id) {
    document.getElementById(id).style.display = 'block'
}

function hideModal(id) {
    document.getElementById(id).style.display = 'none'
}


document.addEventListener('readystatechange', () => {
    api.setUnauthorizedCallback(() => showModal('login-modal'))

    if (document.readyState == 'complete') {
        loginModal = loginModal.mount('#login-modal')
        signupModal = signupModal.mount('#signup-modal')
        submitProposalModal = submitProposalModal.mount('#submit-proposal-modal')
        addConferenceModal = addConferenceModal.mount('#add-conference-modal')
        editConferenceModal = editConferenceModal.mount('#edit-conference-modal')
        joinConferenceModal = joinConferenceModal.mount('#join-conference-modal')
        viewPapersModal = viewPapersModal.mount('#view-papers-modal')

        menuComponent = menuComponent.mount('#menu')
    }
})

dataStore = {
    properties: {},
    set: (property, value) => {
        dataStore.properties[property] = value
    },
    get: property => {
        return dataStore.properties[property]
    }
}


menuComponent = Vue.createApp({
    data() {
        return {
            authenticated: false,
            username: ""
        }
    },
    mounted() {
        api.auth.info()
            .then(response => {
                this.authenticated = response.data.authenticated
                this.username = response.data.username
                dataStore.set('authenticated', response.data.authenticated)
                dataStore.set('username', response.data.username)

                homeTabComponent = homeTabComponent.mount('#home-tab')
                if (response.data.authenticated)
                    dahsboardTabComponent = dahsboardTabComponent.mount('#dashboard-tab')
            })
    },
    methods: {
        logout() {
            api.auth.logout()
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error.response)))
        },
        showLogin() {
            showModal('login-modal')
        },
        showAddConference() {
            showModal('add-conference-modal')
        }
    }
})


homeTabComponent = Vue.createApp({
    data() {
        return {
            conferences: []
        }
    },
    mounted() {
        api.conferences.list()
            .then(response => {
                this.conferences = response.data
                document.body.classList.add("loaded")
            })
            .catch(error => alert(JSON.stringify(error)))
    },
    methods: {
        showSubmissionModal(id) {
            submitProposalModal.$data.id = id
            showModal('submit-proposal-modal')
        },
        showConfirmJoinModal(id, title) {
            joinConferenceModal.$data.id = id
            joinConferenceModal.$data.title = title
            showModal('join-conference-modal')
        }
    }
})


dahsboardTabComponent = Vue.createApp({
    data() {
        return {
            conferences: [],
            papers: []
        }
    },
    mounted() {
        api.user.conferences()
            .then(response => this.conferences = response.data)
            .catch(error => alert(JSON.stringify(error)))
        api.user.papers()
            .then(response => this.papers = response.data)
            .catch(error => alert(JSON.stringify(error)))
    },
    methods: {
        showEditConferenceModal(conference) {
            editConferenceModal.$data.title = conference.title
            editConferenceModal.$data.description = conference.description
            editConferenceModal.$data.location = conference.location
            editConferenceModal.$data.fee = conference.fee
            editConferenceModal.$data.deadline = new Date(Date.parse(conference.deadline)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.date = new Date(Date.parse(conference.date)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.id = conference.id
            document.querySelector('#edit-conference-modal').style.display = 'block'
        },

        showViewPapersModal(conference) {
            viewPapersModal.$data.papers = [...conference.papers]
            showModal('view-papers-modal')
        }
    }
})


loginModal = Vue.createApp({
    data() {
        return {
            username: '',
            password: ''
        }
    },
    methods: {
        login() {
            api.auth.login(this.username, this.password)
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error.response.data)))
        }
    }
})


signupModal = Vue.createApp({
    data() {
        return {
            username: '',
            email: '',
            password1: '',
            password2: ''
        }
    },
    methods: {
        register() {
            api.auth.register(this.username, this.email, this.password1, this.password2)
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error.response.data)))
        }
    }
})


submitProposalModal = Vue.createApp({
    data() {
        return {
            id: null,
            title: '',
            // author: '',
            abstract: '',
            paper: '',
            keywords_list: [],
            topics_list: [],
            authors_list: []
        }
    },
    methods: {
        submitProposal() {
            api.papers.create({
                title: this.title,
                conference: window.selectedConference,
                topics: [...this.topics_list],
                keywords: [...this.keywords_list],
                abstract: this.abstract,
                paper: this.paper,
                authors: [...this.authors_list]
            })
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error)))
        },
        abstractUpload() {
            this.abstract = document.querySelector('#upload-abstract').files[0]
        },
        paperUpload() {
            this.paper = document.querySelector('#upload-paper').files[0]
        },
        addTag(event, tag_list) {
            event.preventDefault()
            var val = event.target.value.trim()
            if (val.length > 0) {
                tag_list.push(val)
                event.target.value = ''
            }
        },
        removeTag(index, tag_list) {
            tag_list.splice(index, 1)
        },
        removeLastTag(event, tag_list) {
            if (event.target.value.length === 0) {
                this.removeTag(tag_list.length - 1, tag_list)
            }
        }
    }
})


addConferenceModal = Vue.createApp({
    data() {
        return {
            title: '',
            description: '',
            date: new Date().toISOString().replace(/\..*$/, ''),
            location: '',
            deadline: new Date().toISOString().replace(/\..*$/, ''),
            fee: 0
        }
    },
    methods: {
        createConference() {
            api.conferences.create({
                title: this.title,
                description: this.description,
                date: this.date,
                location: this.location,
                deadline: this.deadline,
                fee: this.fee
            })
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error)))
        }
    }
})


editConferenceModal = Vue.createApp({
    data() {
        return {
            id: 0,
            title: '',
            description: '',
            date: new Date().toISOString().replace(/\..*$/, ''),
            location: '',
            deadline: new Date().toISOString().replace(/\..*$/, ''),
            fee: 0,
            steering_committee_list: []
        }
    },
    methods: {
        editConference() {
            api.conferences.update({
                id: this.id,
                title: this.title,
                description: this.description,
                date: this.date,
                location: this.location,
                deadline: this.deadline,
                fee: this.fee
            })
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error)))
        },
        addTag(event, tag_list) {
            event.preventDefault()
            var val = event.target.value.trim()
            if (val.length > 0) {
                tag_list.push(val)
                event.target.value = ''
            }
        },
        removeTag(index, tag_list) {
            tag_list.splice(index, 1)
        },
        removeLastTag(event, tag_list) {
            if (event.target.value.length === 0) {
                this.removeTag(tag_list.length - 1, tag_list)
            }
        }
    }
})


joinConferenceModal = Vue.createApp({
    data() {
        return {
            id: null,
            title: ''
        }
    },
    methods: {
        joinConference() {
            api.conferences.join(this.id)
                .then(response => window.location.reload())
                .catch(error => alert(JSON.stringify(error)))
        }
    }
})


viewPapersModal = Vue.createApp({
    data() {
        return {
            papers: []
        }
    },
    methods: {
        openAccordionTab(id) {
            element = document.getElementById('view-papers-section' + id)
            if (element.classList.contains("w3-show"))
                element.classList.remove("w3-show")
            else
                element.classList.add("w3-show")
        }
    }
})