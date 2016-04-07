'use strict';

/**
 * angular controller for dashboard
 */
angular.module('app').controller('DashboardController', [
    '$scope',
    '$resource',
    '$http',
    'CurrentUser',
    function ($scope, $resource, $http, CurrentUser) {

        // variables
        var status = $scope.status = {},
            params = $scope.params = {},
            errorMessages = $scope.errorMessages = [],
            successMessages = $scope.successMessages = [];

        // get user
        $scope.user = CurrentUser.data;

        // set default params
        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth(),
            day = d.getDate();
        params.minDate = (day > 15) ? new Date(year, month, 1) : new Date(year, month-1, 1);
        params.maxDate = (day > 15) ? new Date(year, month+1, 1) : new Date(year, month, 1);

        // close error message
        $scope.closeErrorMessage = function(errorIndex) {
            errorMessages.splice(errorIndex, 1);
        };

        // close success message
        $scope.closeSuccessMessage = function(successIndex) {
            successMessages.splice(successIndex, 1);
        };

        // get environment variables
        $scope.envVar =$resource('data/env-var').get();

        // get topics
        status.processingTopics = true;
        $scope.topics = $resource('data/topic/list').query(
            {},
            function() {
                status.processingTopics = false;
                params.topic = 'common core'; // default
            },
            function(err) {
                status.processingTopics = false;
                errorMessages.push('Error! Could not get topics. Please try refreshing the page.\n'+err);
            }
        );

        // get states
        status.processingStates = true;
        $scope.states = $resource('data/state/list').query(
            {},
            function() {
                status.processingStates = false;
                params.state = 'ca'; // default
            }, 
            function(err) {
                status.processingStates = false;
                errorMessages.push('Error! Could not get states. Please try refreshing the page.\n'+err);
            }
        );

        // get counties
        function getCounties() {
            console.log('getCounties');
            status.processingCounties = true;
            $scope.counties = $resource('data/county/list').query(
                {state: params.state},
                function() {
                    status.processingCounties = false;
                    if (params.state === 'ca') { params.county = 'alameda'; } // default
                },
                function(err) {
                    status.processingCounties = false;
                    errorMessages.push('Error! Could not get counties. Please try refreshing the page.\n'+err);
                }
            );
        }

        // get counties if state is selected
        $scope.$watch('params.state', function(nV, oV) {
            if (nV !== oV) {
                getCounties();
            }
        });

        // channels
        $scope.channels = ['all', 'district social media', 'district content', 'geography only', 'related social media', 'related organizations & news'];
        params.channel = 'district social media'; // default

        // measures
        $scope.measures = ['count', 'sentiment', 'ngrams'];
        params.measure = 'count'; // default

        // -- SOCIAL ACCOUNTS --

        // connect to a user's twitter account
        $scope.connectTwitter = function() {
            window.location.assign('/data/user/twitter/connect');
        };

        // connect to a user's facebook account
        $scope.connectFacebook = function() {
            window.location.assign('/data/user/facebook/connect');
        };

        // -- DEVELOPMENT BUTTONS --

        // pull social media from twitter seeds
        $scope.pullTwitter = function () {
            $http.get('/data/socialmedia/pull/twitter')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not pull from Twitter.\n'+err);
                });
        };

        // pull social media from facebook seeds
        $scope.pullFacebook = function () {
            $http.get('/data/socialmedia/pull/facebook')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not pull from Facebook.\n'+err);
                });
        };

        // process ngrams
        $scope.processNgrams = function() {
            $http.get('/data/socialmedia/process/ngrams')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not process ngrams.\n'+err);
                });
        };

        // process sentiment
        $scope.processSentiment = function() {
            $http.get('/data/socialmedia/process/sentiment')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not process sentiment.\n'+err);
                });
        };

        // initialize districts
        $scope.initDistricts = function() {
            errorMessages.push('Initialize Districts is not set up yet.');
        };
    }
]);
