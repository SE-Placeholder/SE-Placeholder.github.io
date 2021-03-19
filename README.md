# Team Placeholder's Conference Managment System

## API Status
![](https://img.shields.io/uptimerobot/status/m787566269-a2f2cdfea89e35226bfc73df?color=%23E30B5D&label=server%20status&logo=raspberry-pi&logoColor=%23E30B5D&style=for-the-badge)

## Changelog

### **v0.1**: JWT authentication system proof of concept
- home page automatically sending a get request to a restricted endpoint of the API (simulating the loading of the conference list or whatever)
- redirect to login page when user is not authenticated
- obtain access token from the API using the user's credentials
- new account creation
- log out functionality

## TODO
- encapsulate API interaction javascript layer
- make use of JWT refresh tokens and reduce access token lifespan