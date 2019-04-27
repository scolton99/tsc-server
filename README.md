# TSC Server
This server exists to provide extra functionality to the resources that Northwestern IT Tier 1 uses.
***
## Running locally
**Users who are not part of the organization should not use these steps. Fork the repository instead. Unless you have received special permission from the owners of the organization, do not expect any of your pull requests to be approved.**

In order to make changes to the server, you should make changes locally, test them, and then push your changes. First, clone the repository:
```
git clone https://github.com/nuit-tsc/tsc-server.git
```
Before making changes, switch to a new branch. You will not be allowed to push to the `master` branch.
```
git checkout -b [new-branch-name]
```
Make your branch name descriptive of the functionality that you are adding or the bugs that you are fixing.

Make all of the changes you wish to make, and then run the following command to test:
```
npm start
```
The server will now be running locally at `http://localhost:3000/`. Use API testing tools such as [Advanced Rest Client](https://install.advancedrestclient.com/install) or [Postman](https://www.getpostman.com/) to make sure that the server doesn't crash under normal conditions and that it responds as expected.

At any time during the development process, you may commit your changes to the repository and/or push the changes. Once you have finished your work completely, [create a pull request](https://github.com/nuit-tsc/tsc-server/compare) for your branch and it will be reviewed as soon as possible.

***
## Features
### TSC Kudos
At the endpoint `/kudos`, `POST` requests can be made to update the TSC Kudos shown on [Conweb](https://kb.northwestern.edu/internal/conweb). The request structure should resemble the structure detailed by Slack in their [API documentation](https://api.slack.com/messaging/interactivity/enabling#understanding-payloads). After receiving the request, the server responds with the text "`Loading...`". During this time, it sends a request to Airtable updating a record in the `Feedback` table of the `Support Center Consultants` base with the requested text and sets whether or not the compliment will be shown on Conweb.

Once this request has completed, the server sends a `POST` request to the URL identified by the `response_url` property of the original request object detailing a Slack message in JSON. This object should still be fairly comprehensible to other applications.

Currently, this endpoint is not meant to be called manually. [Zapier](https://www.zapier.com) checks for new compliments in Airtable approximately every 15 minutes and then automatically sends a request to an incoming webhook for an app made for the NUIT LCs organization in Slack, and when a user clicks a button in the message that is subsequently created and sent to `#kudos`, Slack pings this server (hosted at `https://tsc-server.herokuapp.com/`) and makes a call as described above. No guarantees can be made about functionality when this endpoint is called manually.
