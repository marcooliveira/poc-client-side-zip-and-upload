POC - Client-side ZIP and upload a file
=======================================

This is a simple Proof of Concept of an application that generates
a `ZIP` file from a list of files that the user has selected from his
filesystem.

Note that this is not compatible with all browsers. It has only been
tested with Chrome 20.0.

## Requirements

In order to run this POC, you must have [node.js](http://nodejs.org)
and [npm](https://npmjs.org/) installed.

Once the requirements are met, clone the repository and simply run:

1. `npm install`
  - This will install all the dependencies of the project
2. `npm start`
  - This will start the HTTP server on port 3000.

After this, you should be able to access `http://localhost:3000/`.
Select the files you want to upload in there, and once the files
are uploaded, you should see a `ZIP` file with the contents you
selected in the `uploads` folder.