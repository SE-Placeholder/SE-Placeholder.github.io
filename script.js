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

dataStore = {
    properties: {},
    set: (property, value) => {
        dataStore.properties[property] = value
    },
    get: property => {
        return dataStore.properties[property]
    }
}

document.addEventListener('readystatechange', () => {
    api.setUnauthorizedCallback(() => showModal('login-modal'))

    if (document.readyState == 'complete') {
        loginModal = loginModal.mount('#login-modal')
        signupModal = signupModal.mount('#signup-modal')
        submitProposalModal = submitProposalModal.mount('#submit-proposal-modal')
        editProposalModal = editProposalModal.mount('#edit-proposal-modal')
        reviewProposalModal = reviewProposalModal.mount('#review-proposal-modal')
        addConferenceModal = addConferenceModal.mount('#add-conference-modal')
        editConferenceModal = editConferenceModal.mount('#edit-conference-modal')
        joinConferenceModal = joinConferenceModal.mount('#join-conference-modal')
        viewProposalsModal = viewProposalsModal.mount('#view-papers-modal')
        showReviewsModal = showReviewsModal.mount('#show-reviews-modal')

        menuComponent = menuComponent.mount('#menu')
    }
})



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
                            dashboardTabComponent = dashboardTabComponent.mount('#dashboard-tab')
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


dashboardTabComponent = Vue.createApp({
    data() {
        return {
            conferences: [],
            submittedProposals: [],
            reviewingProposals: [],
            sections: [],
            selectedSections: {}
        }
    },
    mounted() {
        allConferences = dataStore.get('conferences')
        currentUser = dataStore.get('user')

        this.conferences = {
            steeringCommittee: allConferences.filter(conference =>
                conference.steering_committee.map(user => user.id).includes(currentUser.id)),
            listener: allConferences.filter(conference =>
                conference.listeners.map(listener => listener.user.id).includes(currentUser.id))
        }

        this.submittedProposals = allConferences.map(conference => {
            conference = {...conference}
            conference.proposals = conference.proposals.filter(proposal =>
                proposal.authors.map(user => user.id).includes(currentUser.id))
            return conference
        }).filter(conference => conference.proposals.length > 0)

        this.reviewingProposals = allConferences.map(conference => {
            conference = {...conference}
            conference.proposals = conference.proposals.filter(proposal =>
                proposal.reviews.map(review => review.user.id).includes(currentUser.id))
            return conference
        }).filter(conference => conference.proposals.length > 0)
        
        this.sections = []
        for (conference of allConferences) {
            console.log(conference.listeners.find(listener => listener.user.id == currentUser.id))
            sections = conference.listeners.find(listener => listener.user.id == currentUser.id)
            if (sections) {
                for (section of sections.sections) {
                    conferenceID = section.conference.id
                    if (!(conferenceID in this.selectedSections))
                        this.selectedSections[conferenceID] = []
                    this.selectedSections[conferenceID].push(section)
                }
                this.sections.push(...sections.sections)
            }
        }
        this.sections.sort(function(section1, section2) {
            return new Date(section1.start) - new Date(section2.start);
        });
    },
    methods: {
        joinSection(conferenceID) {
            sectionID = document.getElementById("selected-section").value
            api.conferences.joinSection(conferenceID, sectionID)
                .then(result => {
                    if (!(conferenceID in this.selectedSections))
                        this.selectedSections[conferenceID] = []
                    section = dataStore.get('conferences').find(conference => conference.id == conferenceID).sections.find(section => section.id == sectionID)
                    this.selectedSections[conferenceID].push(section)
                })
                .catch(error => alert(error.response.data.detail))
        },
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
            editConferenceModal.$data.sections = conference.sections
            editConferenceModal.$data.proposals = conference.proposals

            showModal('edit-conference-modal')
        },

        showViewProposalsModal(conference) {
            viewProposalsModal.$data.proposals = [...conference.proposals].map(proposal => {
                // console.log(proposal)
                // reviewers = proposal.reviewers.map(user => user.username)
                reviewers = proposal.reviews.map(review => review.user.username)
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
        },

        showReviewsModal(proposal) {
            // editProposalModal.$data.paperId = proposal.id
            // editProposalModal.$data.conferenceId = proposal.conference
            // editProposalModal.$data.title = proposal.title
            // editProposalModal.$data.abstract = ''
            // editProposalModal.$data.paper = ''
            // // editProposalModal.$data.abstract = proposal.abstract || ''
            // // editProposalModal.$data.paper = proposal.paper || ''
            // editProposalModal.$data.keywords_list = proposal.keywords
            // editProposalModal.$data.topics_list = proposal.topics
            // editProposalModal.$data.authors_list = proposal.authors.map(user => user.username)
            showReviewsModal.$data.reviews = proposal.reviews.filter(review => review.qualifier != null)
            showModal('show-reviews-modal')
        },

        showReviewProposalModal(proposal) {
            // console.log(proposal)
            reviewProposalModal.$data.paperId = proposal.id
            reviewProposalModal.$data.conferenceId = proposal.conference
            reviewProposalModal.$data.title = proposal.title
            reviewProposalModal.$data.abstract = proposal.abstract
            reviewProposalModal.$data.paper = proposal.paper
            reviewProposalModal.$data.keywords_list = proposal.keywords
            reviewProposalModal.$data.topics_list = proposal.topics
            reviewProposalModal.$data.authors_list = proposal.authors.map(user => user.username)
            review = proposal.reviews.find(review => review.user.id == dataStore.get('user').id)
            reviewProposalModal.$data.qualifier = review.qualifier
            reviewProposalModal.$data.review = review.review
            showModal('review-proposal-modal')
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
            document.getElementById("upload-progress").classList.remove("w3-hide")
            api.proposals.create({
                title: this.title,
                conference: this.conferenceId,
                topics: [...this.topics_list],
                keywords: [...this.keywords_list],
                abstract: this.abstract,
                paper: this.paper,
                authors: [...this.authors_list]
            })
                .then(response => {
                    document.getElementById("upload-progress").classList.add("w3-hide")
                    // hideModal("submit-proposal-modal")
                    window.location.reload()
                })
                .catch(error => alert(JSON.stringify(error)))
        },
        abstractUpload() {
            this.abstract = document.querySelector('#upload-abstract').files[0]
        },
        paperUpload() {
            this.paper = document.querySelector('#upload-paper').files[0]
        },
        checkIfEmpty(event,divId){
            event.preventDefault();
            var value = event.target.value.trim();
            if (value.length > 0)
                document.getElementById(divId).style.display = 'block';
        },
        hideDiv(divId){
            document.getElementById(divId).style.display = 'none';
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
        checkIfEmpty(event,divId){
            event.preventDefault();
            var value = event.target.value.trim();
            if (value.length > 0)
                document.getElementById(divId).style.display = 'block';
                },
        hideDiv(divId){
            document.getElementById(divId).style.display = 'none';
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
            steering_committee: [],
            sections: [],
            proposals: [],
            selectedProposals: [],
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
        },
        addProposal() {
            selectedProposalID = document.getElementById("selected-proposal").value
            if (selectedProposalID == "yolo") return
            proposal = this.proposals.find(proposal => proposal.id == selectedProposalID)
            this.proposals = this.proposals.filter(proposal => proposal.id != selectedProposalID)
            this.selectedProposals.push(proposal)
        },
        deleteSection(sectionID) {
            deletedSection = this.sections.find(section => section.title == sectionID)
            api.conferences.update({
                id: this.id,
                sections: this.sections.map(section => {
                    return {
                        title: section.title,
                        start: section.start,
                        end: section.end,
                        proposals: section.proposals.map(proposal => proposal.id)
                    }
                }).filter(section => section.title != sectionID)
            })
                .then(response => {
                    this.sections = this.sections.filter(section => section.title != sectionID)
                })
                .catch(error => console.log(error))
        },
        addSection() {
            newSection = {
                title: document.getElementById("section-name").value,
                start: document.getElementById("section-start").value,
                end: new Date(),
                proposals: this.selectedProposals.map(proposal => proposal.id)
            }
            api.conferences.update({
                id: this.id,
                sections: this.sections.map(section => {
                    return {
                        title: section.title,
                        start: section.start,
                        end: section.end,
                        proposals: section.proposals.map(proposal => proposal.id)
                    }
                }).concat(newSection)
            })
                .then(response => {
                    this.sections.push(newSection)
                })
                .catch(error => console.log(error))
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
            if (proposal.assigned_reviewers.length < 2) {
                alert('kurwa')
                return
            }
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


reviewProposalModal = Vue.createApp({
    data() {
        return {
            paperId: null,
            // conferenceId: null,
            title: '',
            abstract: '',
            paper: '',
            keywords_list: [],
            topics_list: [],
            authors_list: [],
            review: '',
            qualifier: '',
        }
    },
    methods: {
        reviewProposal() {
            this.qualifier = document.querySelector('input[name="choice"]:checked').value;
            api.proposals.review(this.paperId, this.qualifier, this.review)
                .then(response => hideModal('review-proposal-modal'))
        }
    }
})


showReviewsModal = Vue.createApp({
    data() {
        return {
            title: '',
            reviews: []
        }
    },
    methods: {
        reviewProposal() {
            api.proposals.review(this.paperId, this.qualifier, this.review)
                .then(response => hideModal('review-proposal-modal'))
        }
    }
})
