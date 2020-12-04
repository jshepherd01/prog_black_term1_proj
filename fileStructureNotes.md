# Notes on the structure of files in this project

## root

This directory contains all server-side code, plus git and npm config information.
- package-lock.json, package.json: npm config
- server.js: main javascript code for server-side, executable in node

## data

This directory functions as a databse would, but uses flat JSON files instead.
- admin-db.json: stores information about administrator accounts
- blocked-db.json: stores information about IP addresses that have been blocked from editting information on the server
- comment-db.json: stores information about comments left by users on the various images that have been posted
- image-db.json: stores information about images posted by users
- report-db.json: stores information about reports made to admins by users about content that is offensive or otherwise breaks site rules

## error

This directory contains HTML pages which should be displayed to the user in the event of a server error. This HTML data will also be sent on the API if a request results in an error, but does not need to be displayed to the user; the calling function can choose to ignore it.
- XXX.html: the HTML page to be displayed when a http error code of XXX is returned

## static

This directory stores static files which the user's browser can request directly, without any pre-processing. In other words, this is the client-side directory.
- admin.html: the admin panel for the site; a normal user can access this page, but should be prompted for credentials
- index.html: the main page of the site, allowing all standard user actions

### css

This directory contains all CSS styling for the site.
- stylesheet.css: CSS styling for the entire site; might get refactored like the JavaScript code is further down the line

### js

This directory contains all of the client-side JavaScript code.
- admin.js: JavaScript code that should be exclusive to the admin panel
- client.js: JavaScript code that should be exclusive to the main page
- main.js: JavaScript code that should be shared between all pages of the site

## uploads

This directory contains images, the majority of which will be uploaded by users.
- not-found.png: the image to display to the user if they request an image which does not exist or which has been deleted
