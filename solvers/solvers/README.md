Solvers
=======

Solvers - improve our world.

[![Stories in Ready](https://badge.waffle.io/solvers/solvers.png?label=ready)](https://waffle.io/solvers/solvers)
[![Build Status](https://travis-ci.org/solvers/solvers.png?branch=master)](https://travis-ci.org/solvers/solvers)
[![Code Climate](https://codeclimate.com/github/solvers/solvers.png)](https://codeclimate.com/github/solvers/solvers)
[![Gitter chat](https://badges.gitter.im/solvers/solvers.png)](https://gitter.im/solvers/solvers)

[Solvers.io](http://solvers.io) is a community of people who want to improve our world. We connect projects that tackle important problems with the people who have the skills to help.

Chat to us in our [Gitter room](https://gitter.im/solvers/solvers)

Testing
==

In order to run the tests, follow these instructions:

1. Make sure the project is setup and runs normally by typing mrt in the app/ directory

2. In the root directory, run ```npm install -g grunt-cli``` to install the grunt command-line task runner

3. In the root directory, run ```npm install``` to install the other testing dependencies from npm

4. In the app/ directory, run the project with: ```mrt --settings settings_test.json``` to run the project in test mode. This ensures the database is setup correctly for testing. NOTE: CURRENTLY THIS WILL WIPE ANY EXISTING DATABASE INCLUDING USERS!!

5. In the root directory, run ```grunt test``` to execute the automated tests
