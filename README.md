# Signal in the Noise
Its a needle-in-the-haystack kind of thing.

### Development Details
This project uses a MEAN stack. (MongoDB, Express, Angular, Node)

### Getting Started
* Download [GitHub Desktop](https://desktop.github.com/).
  * Use GitHub Desktop to clone this repository (signal-noise) to your local machine.
* Download an [IDE](http://paulb.gd/comparing-nodejs-ides/)
  * Use your IDE to open the project files.
* Install [MongoDB](https://www.mongodb.org/downloads#production).
  * Use the [MongoDB download page](https://www.mongodb.org/downloads#production). 
  * For additional guidance follow a [tutorial](https://docs.mongodb.org/manual/administration/install-community/).
* Install [NodeJS](https://nodejs.org/en/). 
  * NodeJS comes with [NPM](https://www.npmjs.com/) (Node Package Manager).
* Install the project dependencies.
  * Open a terminal.
  * Change directory to the project root (wherever GitHub cloned the project). `cd C:\<yourname>\Documents\GitHub\signal-noise`
  * Install the node package dependencies using [NPM](https://www.npmjs.com/). 
    * Run `npm install`.
    * The node package dependencies listed in `package.json` will be installed in the `node_modules` directory.
  * Install the web package dependencies using [Bower](http://bower.io/).
    * Install Bower globally with `npm install bower -g`.
    * Run `bower install`.
    * The web packages listed in `bower.json` will be installed in the `client/lib` directory.
* Install [Grunt](http://gruntjs.com/)'s command line interface globally.
  * Run `npm install grunt-cli -g`.
  * Grunt is a javascript task runner.

### Starting The Application Locally
* Make sure MongoDB's [mongod process](https://docs.mongodb.org/manual/reference/program/mongod/) is running.
  * Open a terminal.
  * Change directory to MongoDB's install location. `cd C:\Program Files\MongoDB\Server\3.0\bin`
  * Start the mongod process with the command `mongod`.
* Start the signal-noise application.
  * Open another terminal.
  * Change directory to the project root (wherever GitHub cloned the project). `cd C:\<yourname>\Documents\GitHub\signal-noise`
  * Start the application with the command `grunt`.

### Accessing the Database through the MongoDB Shell
* Make sure MongoDB's mongod process is running.
  * See above.
* Start the [mongo shell](https://docs.mongodb.org/manual/reference/program/mongo/).
  * Change directory to MongoDB's install location. `cd C:\Program Files\MongoDB\Server\3.0\bin`
  * Start the mongo shell with the command `mongo`.
* Note: If you add MongoDB's install location to your path environment variable, you can run `mongod` and `mongo` from any directory.

### The Project Root Directory
| Name | Description |
| ---- | ----------- |
| **client** | Directory for the front-end (client-side) angular application. |
| **node_modules** | Directory for the node package project dependencies installed via NPM. |
| **server** | Directory for the back-end (server-side) expressjs application. |
| **tasks** | Directory for grunt tasks that are run with grunt command line tool. |
| **.bowerrc** | Configuration for the location where web packages installed via Bower should be saved. |
| **.gitignore** | Configuration for the files that should be ignored when committing to GitHub. |
| **.jshintrc** | Configuration for the 'jshint' grunt task. |
| **auth.js** | All passwords and keys for the apis that this project uses. |
| **bower.json** | The front-end angular application configuration file. It defines the required bower packages. |
| **gruntfile.js** | This file bundles all of the grunt tasks. |
| **LICENSE** | The project license. |
| **package.json** | The back-end express application configuration file. It defines the required node packages. |
| **README.md** | The file that you're looking at right now! |
| **server.js** | This file starts the server. |

### Git
* [A Successful Git Branching Model](http://nvie.com/posts/a-successful-git-branching-model/)