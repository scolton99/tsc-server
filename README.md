# TSC Server
This server exists to provide extra functionality to the resources that Northwestern IT Tier 1 uses.

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

## Features
### Main Pages
#### Kudos Display
Past Kudos that have been approved for display by the LC team are visible at `/kudos/[NetID]`. Anyone can access this page; no authentication is required. If a NetID is entered that has no approved Kudos or is not a **current** employee, a 404 error is returned.

#### Contacts
The page `/contacts` generates a CSV file (compatible with Google Contacts) of the contact information for all consultants.

#### Directory
The directory page (`/directory`) renders a printable directory of phone numbers for all consultants (and general phone numbers for Northwestern IT).

#### Ticket Editor
Support requests that were improperly saved with the wrong submission tracking type (i.e., Agent instead of Chat) can be edited at `/edit-ticket`. This is in place since this field cannot be edited via Footprints on the web after the first time the ticket is saved.

#### Queue Status
`/queue` displays and automatically refreshes (every two minutes) the amount of tickets in the ticket queue. The background changes based on the number of tickets:

Ticket Count | Background
--- | ---
0 | ![#401F68](https://placehold.it/15/401F68/000000?text=+)
1 | ![#087f23](https://placehold.it/15/087f23/000000?text=+)
11 | ![#c6a700](https://placehold.it/15/c6a700/000000?text=+)
26 | ![#ba000d](https://placehold.it/15/ba000d/000000?text=+)
51 | ![#000000](https://placehold.it/15/000000/000000?text=+)
100 | ![Fire](https://imgur.com/A0nY9U7.png)
150 | ![Nuke](https://imgur.com/LitvtNz.png)
200 | ![Nova](https://imgur.com/VQY7n1t.png)
250 | ![Black Hole](https://imgur.com/PxbgHhv.png)
500 | ![Confetti](https://imgur.com/E1OkcHd.png)
    
#### Schedule Page
The `/schedule` page provides a nice view of who is currently scheduled to be on shift so that WhenToWork doesn't need to be consulted since that page is frequently out-of-date and is difficult to read.

This page automatically reloads every fifteen minutes aligned with the hour (e.g., at :00, :15, :30, and :45).

#### Potential Spam Tickets
At `/spam`, the application identifies support requests currently in Tier 1's queue that have come from outside sources (not `@northwestern.edu`, `@**.northwestern.edu`, `@nm.org`, `@luriechildrens.org`, or `@garrett.edu`). Though this is often wrong and users frequently send us requests from personal addresses or addresses outside of those listed here, this provides a much more concise view of what support requests might simply need to be deleted.

### JSON Endpoints
#### Modify Kudos 
At the endpoint `/kudos`, `POST` requests can be made to update the TSC Kudos shown on [Conweb](https://kb.northwestern.edu/internal/conweb). The request structure should resemble the structure detailed by Slack in their [API documentation](https://api.slack.com/messaging/interactivity/enabling#understanding-payloads). After receiving the request, the server responds with the text "`Loading...`". During this time, it sends a request to Airtable updating a record in the `Feedback` table of the `Support Center Consultants` base with the requested text and sets whether or not the compliment will be shown on Conweb.

Once this request has completed, the server sends a `POST` request to the URL identified by the `response_url` property of the original request object detailing a Slack message in JSON. This object should still be fairly comprehensible to other applications.

Currently, this endpoint is not meant to be called manually. [Zapier](https://www.zapier.com) checks for new compliments in Airtable approximately every 15 minutes and then automatically sends a request to an incoming webhook for an app made for the NUIT LCs organization in Slack, and when a user clicks a button in the message that is subsequently created and sent to `#kudos`, Slack pings this application and makes a call as described above. No guarantees can be made about functionality when this endpoint is called manually.

#### Get Kudos
All Kudos that have been approved by the LC team and were submitted within the last two weeks can be accessed in JSON form at `/kudos`. They will be grouped by the consultant that is being complimented and show up in descending order of time submitted.

The response is an object of the following structure:
```
{
    "Consultant Name": [
        "Most Recent Compliment",
        "Next Compliment"
    ],
    "Next Consultant": [
        "Most Recent Compliment",
        "Next Compliment",
        "Another Compliment"
    ]
}
```
The consultants appearing first in this object have the most recent complements.

#### Ticket Count
The number of tickets in Tier 1's queue can be obtained in JSON format at `/queue/status`. This endpoint causes a call back to Footprints which can take quite a long time, so each time this endpoint is called by any client, the response is stored in memory on the server. The most recent reading can be found at `/queue/quick`, which should load with very little latency but may be any amount of time behind (usually no more than two minutes). Both endpoints have the same response format:

Field | Type/Values | Description
--- | --- | ---
`num_tickets` | `string` or `integer` | The number of tickets in the queue. If something goes wrong, the value will be "an unknown amount".
`verb` | `"is"` or `"are"` | `"is"` if there is one ticket in the queue or something went wrong, `"are"` otherwise.
`noun` | `"tickets"` or `"ticket"` | `"ticket"` if there is one ticket in the queue, `"tickets"` otherwise.
`background_color` | `string` | A suggested background color for this number of tickets. See the section "Queue Status" above on this page for more information.

The `/queue/status` endpoint is used internally by the `/queue` page.

#### Assignment Group and Category Statistics
Statistics about assignment groups and categorizations of tickets can be found at the endpoints `/assignment-group` and `/categorization`, respectively. Requests should be made using the `GET` method and should take the following form:
* `/assignment-group/[assignment-group]`
* `/categorization/[service-family]/[service]/[category]/[sub-category]`

Each variable present in the request (`assignment-group`, `service-family`, `service`, `category`, `sub-category`) needs to be "fixed" so that it is appropriately formatted. The rules for fixing or unfixing a string are defined by BMC Footprints and can be found in [`util/FP.js`](https://github.com/nuit-tsc/tsc-server/blobl/master/util/FP.js).

Not all variables are required to be present. For assignment group statistics, the assignment group name is required or the response will be a 404. For a categorization, only the Service Family is required; all others are optional but as in Footprints, there cannot be, for example, a Sub-Category without a Category or Service. Example requests are found below:

Request | Description
--- | ---
`/assignment-group/AA_SUPPORT__bCENTER` | Statistics for the top 15 types of tickets completed by the group `AA_SUPPORT CENTER`.
`/assignment-group/NUIT-TSS-USSTier2` | Statistics for the top 15 types of tickets completed by the group `NUIT-TSS-USSTier2`.
`/categorization/Help__band__bSupport/General__bQuestion` | Statistics for the top 15 assignment groups to complete tickets with the a categorization starting with **Help and Support → General Question**. Further subcategorizations will also appear in this count.
`/categorization/Identity__band__bAccess__bManagement/NetID__bServices/NUValidate` | Statistics for the top 15 assignment groups to complete tickets with the a categorization starting with **Identity and Access Management → NetID Services → NUValidate**. Further subcategorizations will also appear in this count (any Sub-Categories of this categorization are also counted).

**`/categorization` Response**

Field | Type/Values | Description
--- | --- | ---
`result` | `"success"` or `"failure"` | Whether or not the request succeeded.
`categorization` | `string` | A human-readable unfixed (see above) string describing the searched categorization.
`stats[]` | `array` | An array of objects, each describing an assignment group that has completed support requests in this area.
`stats[].group` | `string` | An unfixed (see above) string describing the name of the assignment group.
`stats[].count` | `integer` | The number of tickets of this type completed by the assignment group.

**`/assignment-group` Response**

Field | Type/Values | Description
--- | --- | ---
`result` | `"success"` or `"failure"` | Whether or not the request succeeded.
`group_name` | `string` | A human-readable unfixed (see above) string of the assignment group's name.
`stats[]` | `array` | An array of objects, each describing a category of support requests that this assignment group has completed.
`stats[].category` | `string` | An unfixed (see above) string describing the category of tickets.
`stats[].count` | `integer` | The number of tickets of the category that this assignment group has completed.

Usage of the `/assignment-group` endpoint can be found [here](https://kb.northwestern.edu/internal/85097) and usage of the `/categorization` endpoint can be found [here](https://kb.northwestern.edu/internal/90183).

#### Con Photos
This server handles the back-end side of uploading consultant photos. 

At the endpoint `/photo`, `POST` requests can be submitted with the following key-pair form values:

 Key | Value 
 --- | --- 
 `photo` | The uploaded photo. 
 `redirect` | The URL to redirect to after the submission is complete. If the process succeeded, the server will redirect to `redirect`#success, and otherwise it will redirect to `redirect`#failure. The server provides no UI for photo uploads and something bad **will** happen if this value is left out. 
 `netid` | The NetID of the person whose photo is to be replaced. 

Form submissions should be encoded in `application/x-www-form-urlencoded` format. All fields are required.

Photos are stored in Google Cloud Storage indefinitely, but a new upload for the same NetID will replace the existing photo. Airtable is given a public URL for the photo and within several minutes after a request is made to this server, Airtable will download the photo from our server and will copy it to theirs. At this point, the copy stored on Google Cloud is no longer necessary. 

An example of a form that works to fill this purpose can be found at https://kb.northwestern.edu/internal/62391.

#### Birthdays
At the endpoint `/birthdays`, the application will return a JSON array of strings of the first and last names of everyone whose birthday it currently is. These appear on [Conweb](https://kb.northwestern.edu/internal/conweb).

#### WhenToWork
The `/w2w/get-sid` endpoint provides a Session ID for the monitors WhenToWork account so that employee availability can be accessed through the internal KB. An implementation of this feature can be found at https://kb.northwestern.edu/internal/74946.