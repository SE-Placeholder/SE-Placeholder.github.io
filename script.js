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
        editProposalModal = editProposalModal.mount('#edit-proposal-modal')
        addConferenceModal = addConferenceModal.mount('#add-conference-modal')
        editConferenceModal = editConferenceModal.mount('#edit-conference-modal')
        joinConferenceModal = joinConferenceModal.mount('#join-conference-modal')
        viewProposalsModal = viewProposalsModal.mount('#view-papers-modal')

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
                dataStore.set('authenticated', response.data.authenticated)

                if (this.authenticated) {
                    this.username = response.data.user.username
                    dataStore.set('user', response.data.user)
                }

                document.body.classList.add("loaded")

                api.conferences.list()
                    .then(response => {
                        dataStore.set('conferences', response.data)
                        homeTabComponent = homeTabComponent.mount('#home-tab')
                        if (this.authenticated)
                            dahsboardTabComponent = dahsboardTabComponent.mount('#dashboard-tab')
                    })
                    .catch(error => console.log(error))
            })
            .catch(error => console.log(error))
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
        this.conferences = dataStore.get('conferences')
    },
    methods: {
        showSubmissionModal(id) {
            submitProposalModal.$data.conferenceId = id
            if (dataStore.get('authenticated'))
                showModal('submit-proposal-modal')
            else
                showModal('login-modal')
        },
        showConfirmJoinModal(id, title) {
            joinConferenceModal.$data.id = id
            joinConferenceModal.$data.title = title
            if (dataStore.get('authenticated'))
                showModal('join-conference-modal')
            else
                showModal('login-modal')
        }
    }
})


dahsboardTabComponent = Vue.createApp({
    data() {
        return {
            conferences: [],
            proposals: []
        }
    },
    mounted() {
        allConferences = dataStore.get('conferences')
        currentUser = dataStore.get('user')
        this.conferences = {
            steeringCommittee: allConferences.filter(conference => {
                return conference.steering_committee.map(user => user.id).includes(currentUser.id)
            }),
            listener: allConferences.filter(conference => {
                return conference.listeners.map(user => user.id).includes(currentUser.id)
            })
        }
        this.proposals = allConferences.map(conference => {
            conference = {...conference}
            conference.proposals = conference.proposals.filter(proposal => 
                proposal.authors.map(user => user.id).includes(currentUser.id))
            return conference
        }).filter(conference => conference.proposals.length > 0)
    },
    methods: {
        showEditConferenceModal(conference) {
            editConferenceModal.$data.title = conference.title
            editConferenceModal.$data.description = conference.description
            editConferenceModal.$data.location = conference.location
            editConferenceModal.$data.fee = conference.fee
            editConferenceModal.$data.abstractDeadline = new Date(Date.parse(conference.abstract_deadline)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.proposalDeadline = new Date(Date.parse(conference.proposal_deadline)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.biddingDeadline = new Date(Date.parse(conference.bidding_deadline)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.date = new Date(Date.parse(conference.date)).toISOString().replace(/\..*$/, '')
            editConferenceModal.$data.id = conference.id
            editConferenceModal.$data.steering_committee = conference.steering_committee.map(user => user.username)
            document.querySelector('#edit-conference-modal').style.display = 'block'
        },

        showViewProposalsModal(conference) {
            viewProposalsModal.$data.proposals = [...conference.proposals].map(proposal => {
                console.log(proposal)
                reviewers = proposal.reviewers.map(user => user.username)
                if (reviewers.length > 0) {
                    proposal.assigned_reviewers = reviewers
                } else {
                    proposal.assigned_reviewers = proposal.bids.filter(bid => bid.qualifier >= 0).map(bid => bid.user.username)
                }
                return proposal
            })
            viewProposalsModal.$data.bidding_deadline = conference.bidding_deadline
            showModal('view-papers-modal')
        },

        showEditProposalModal(proposal) {
            editProposalModal.$data.paperId = proposal.id
            editProposalModal.$data.conferenceId = proposal.conference
            editProposalModal.$data.title = proposal.title
            editProposalModal.$data.abstract = ''
            editProposalModal.$data.paper = ''
            // editProposalModal.$data.abstract = proposal.abstract || ''
            // editProposalModal.$data.paper = proposal.paper || ''
            editProposalModal.$data.keywords_list = proposal.keywords
            editProposalModal.$data.topics_list = proposal.topics
            editProposalModal.$data.authors_list = proposal.authors.map(user => user.username)
            showModal('edit-proposal-modal')
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
            conferenceId: null,
            title: '',
            abstract: '',
            paper: '',
            keywords_list: [],
            topics_list: [],
            authors_list: []
        }
    },
    methods: {
        submitProposal() {
            api.proposals.create({
                title: this.title,
                conference: this.conferenceId,
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


editProposalModal = Vue.createApp({
    data() {
        return {
            paperId: null,
            // conferenceId: null,
            title: '',
            abstract: '',
            paper: '',
            keywords_list: [],
            topics_list: [],
            authors_list: []
        }
    },
    methods: {
        updateProposal() {
            api.proposals.update({
                id: this.paperId,
                title: this.title,
                // conference: this.conferenceId,
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
            this.abstract = document.querySelector('#update-abstract').files[0]
        },
        paperUpload() {
            this.paper = document.querySelector('#update-paper').files[0]
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
            abstractDeadline: new Date().toISOString().replace(/\..*$/, ''),
            proposalDeadline: new Date().toISOString().replace(/\..*$/, ''),
            biddingDeadline: new Date().toISOString().replace(/\..*$/, ''),
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
                fee: this.fee,
                abstract_deadline: this.abstractDeadline,
                proposal_deadline: this.proposalDeadline,
                bidding_deadline: this.biddingDeadline
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
            abstractDeadline: new Date().toISOString().replace(/\..*$/, ''),
            proposalDeadline: new Date().toISOString().replace(/\..*$/, ''),
            biddingDeadline: new Date().toISOString().replace(/\..*$/, ''),
            fee: 0,
            steering_committee: []
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
                fee: this.fee,
                abstract_deadline: this.abstractDeadline,
                proposal_deadline: this.proposalDeadline,
                bidding_deadline: this.biddingDeadline,
                steering_committee: [...this.steering_committee]
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
                .catch(error => alert(JSON.stringify(error.data)))
        }
    }
})


viewProposalsModal = Vue.createApp({
    data() {
        return {
            proposals: [],
            bidding_deadline: new Date()
        }
    },
    methods: {
        openAccordionTab(id) {
            document.getElementById('view-papers-section' + id).classList.toggle("w3-show")
        },
        showPopup(id) {
            document.getElementById('bid-popup' + id).classList.toggle("w3-show")
        },
        showReviewers(proposal) {
            document.getElementById('reviewers-popup' + proposal.id).classList.toggle("w3-show")
        },
        bid(id, qualifier) {
            api.proposals.bid(id, qualifier)
                .then(response => {
                    this.proposals.forEach(proposal => {
                        if (proposal.id == id) {
                            bid = proposal.bids.filter(bid => bid.user.id == dataStore.get('user').id)
                            if (bid.length == 1) {
                                bid[0].qualifier = qualifier
                            } else {
                                proposal.bids.push({user: dataStore.get('user'), qualifier: qualifier})
                            }
                            // TODO: check user andfor empty bids array
                            // proposal.bids[0].qualifier = qualifier
                        }
                    })
                    }
                    // window.location.reload()
                )
                .catch(error => console.log(error))
        },
        //TODO: refactor... too bad
        bidChoice(choice, bids) {
            bid = [...bids].find(bid => bid.user.id == dataStore.get("user").id)
            return bid && bid.qualifier == choice
        },
        isBiddingPhase() {
            return new Date() < new Date(this.bidding_deadline)
        },
        saveReviewers(proposal) {
            api.proposals.assignReviewers(proposal.id, proposal.assigned_reviewers)
                .then(response => console.log(response))
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
