# Team Placeholder's Conference Managment System

## API Status
![](https://img.shields.io/uptimerobot/status/m787566269-a2f2cdfea89e35226bfc73df?color=%23E30B5D&label=server%20status&logo=raspberry-pi&logoColor=%23E30B5D&style=for-the-badge)

## Changelog

### **v1.0**: New frontend
- things 

### **v0.4**: New js middleware, profile page and refactored html sources
- response interceptor now resolves responses from `logout` and `is-authenticated`, even if the return code is 401 unauthorized
- functions are now organized hierarchically; ex: `api.conferences.add()`
- added profile page
- added http methods to currently exposed endpoints list
- removed redundant nested data object from vue components
- removed unneeded properties from html tags

### **v0.3.1**: Modal for creating conferences and get conference list from live endpoint
- add conference button inside the navbar which opens a modal form for creating a conference, on submit refreshes the page (for now, should be changed in the future)
- conference list is now retrieved from the live endpoint instead of the dummy one which returned a constant value
- added neccessary libraries for bootstrap modals

### **v0.3**: Documentation for new endpoints, password reset and navbar
- sick placeholder logo
- password reset by email (kinda)
- moved logout button inside the navbar
- login page now redirects back to previous page

### **v0.2**: Expanded authentication system, dummy api endpoint and a simple vue component based frontend
- dynamic elements handled by vue components
- bootstrap dark theme
- axios request interceptor for abstracting away jwt token authentication
- password change and password reset

### **v0.1**: JWT authentication system proof of concept
- home page automatically sending a get request to a restricted endpoint of the API (simulating the loading of the conference list or whatever)
- redirect to login page when user is not authenticated
- obtain access token from the API using the user's credentials
- new account creation
- log out functionality

## TODO
- encapsulate API interaction javascript layer
- make use of JWT refresh tokens and reduce access token lifespan
