'use strict';

/**
 * angular controller for dashboard
 */
angular.module('app').controller('DashboardController', [
    '$scope',
    '$resource',
    '$http',
    '$timeout',
    'CurrentUser',
    function ($scope, $resource, $http, $timeout, CurrentUser) {

        // variables
        var status = $scope.status = {},
            params = $scope.params = {},
            errorMessages = $scope.errorMessages = [],
            successMessages = $scope.successMessages = [],
            
            sentimentConfig = $scope.sentimentConfig = {
                negative: {
                    title: 'negative',
                    color: '#FF4C43',
                    filter: function(percentage) {
                        return (percentage < 0.25) ? 'saturate(25%)' : 'saturate('+percentage*100+'%)';
                    }
                },
                neutral: {
                    title: 'neutral', 
                    color: '#8FBAFF', //'#E4F0FF',
                    filter: function(percentage) {
                        return (percentage < 0.25) ? 'saturate(25%)' : 'saturate('+percentage*100+'%)';
                    }
                },
                positive: {
                    title: 'positive',
                    color: '#31E839',
                    filter: function(percentage) {
                        return (percentage < 0.25) ? 'saturate(25%)' : 'saturate('+percentage*100+'%)';
                    }
                }
            },
            sentimentOptions = $scope.sentimentOptions = [
                'negative',
                'neutral',
                'positive'
            ],

            analysis;

        // get width for sentiment class button
        $scope.getSentimentWidth = function(sentimentOption) {
            if (!analysis || !analysis.sentiment || !analysis.sentiment[sentimentOption]) { return '5%'; }
            var total = 100;
            sentimentOptions.forEach(function(option) {
                if (!analysis.sentiment[option]) { total -= 5; }
            });
            return Math.floor(analysis.sentiment[sentimentOption] / analysis.count * total) + '%';
        };

        // get user
        $scope.user = CurrentUser.data;

        // dates
        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth();

        // date slider config
        var slider = $scope.slider = {
            min: month-2,
            max: month+1,
            options: {
                floor: month-12,
                ceil: month+1,
                showTicks: true,
                translate: function(no) {
                    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    if (no >= 0) { return months[no]+' 1, '+year; }
                    else { return months[no+12]+' 1, '+(year-1); }
                }
            }
        };

        // check date params based on slider
        function changeDateParams() {
            params.minDate = (slider.min >= 0) ? new Date(year, slider.min, 1) : new Date(year-1, slider.min+12, 1);
            params.maxDate = (slider.max >= 0) ? new Date(year, slider.max, 1) : new Date(year-1, slider.min+12, 1);
        }
        changeDateParams(); // set default date params

        // watch for date slider changes
        $scope.$watch('slider.min', function(nV, oV) {
            if (nV !== oV) { changeDateParams(); }
        });
        $scope.$watch('slider.max', function(nV, oV) {
            if (nV !== oV) { changeDateParams(); }
        });

        // close error message
        $scope.closeErrorMessage = function(errorIndex) {
            errorMessages.splice(errorIndex, 1);
        };

        // close success message
        $scope.closeSuccessMessage = function(successIndex) {
            successMessages.splice(successIndex, 1);
        };

        // get environment variables
        $scope.envVar = $resource('data/env-var').get();

        // get topics
        status.processingTopics = true;
        $scope.topics = $resource('data/topic/list').query(
            {},
            function() {
                status.processingTopics = false;
                params.topic = $scope.topics[0]._id; // default
            },
            function(err) {
                status.processingTopics = false;
                errorMessages.push('Error! Could not get topics. Please try refreshing the page.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
            }
        );

        // get states
        status.processingStates = true;
        $scope.states = $resource('data/state/list').query(
            {},
            function() {
                status.processingStates = false;
            }, 
            function(err) {
                status.processingStates = false;
                errorMessages.push('Error! Could not get states. Please try refreshing the page.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
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
                },
                function(err) {
                    status.processingCounties = false;
                    errorMessages.push('Error! Could not get counties. Please try refreshing the page.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                }
            );
        }

        // channels
        $scope.channels = ['all social media', 'district social media', 'district related social media', 'district content', 'geography only', 'related social media', 'related organizations & news'];
        params.channel = 'all social media'; // default

        // get analysis
        function getAnalysis() {
            if (params.topic && params.minDate && params.maxDate && params.channel) {
                status.processingAnalysis = true;
                analysis = $scope.analysis = $resource('data/analysis').get(
                    params,
                    function(data) {
                        status.processingAnalysis = false;
                        if (!data || !data.ngrams || !data.sentiment) {
                            errorMessages.push('No analysis results!<br><small>Please try a different topic/date/channel/state/county combination.</small>');
                            return;
                        }
                        sentimentOptions.forEach(function(option) {
                            if (data.ngrams[option] && data.ngrams[option].all) {
                                data.ngrams[option].all.forEach(function(ngram) {
                                    if (ngram.frequency) {
                                        if (!analysis.ngrams[option].minFreq) { analysis.ngrams[option].minFreq = ngram.frequency; }
                                        if (!analysis.ngrams[option].maxFreq) { analysis.ngrams[option].maxFreq = ngram.frequency; }
                                        if (ngram.frequency < analysis.ngrams[option].minFreq) { analysis.ngrams[option].minFreq = ngram.frequency; }
                                        if (ngram.frequency > analysis.ngrams[option].maxFreq) { analysis.ngrams[option].maxFreq = ngram.frequency; }
                                    }
                                });
                            } 
                        });
                        console.log(analysis);
                    },
                    function(err) {
                        status.processingAnalysis = false;
                        errorMessages.push('Error! Could not get analysis. Please try a different topic/date/channel/state/county combination.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                    }
                );   
            }
        }
        
        // check date params
        var lastDateChange = new Date();
        function checkDateParams() {
            var now = new Date();
            if (now - lastDateChange < 1000) { return; }
            else { lastDateChange = now; }
            if (params.minDate.getTime() === params.maxDate.getTime()) { return; }
            getAnalysis();
        }
        
        // watch parameters
        $scope.$watch('params.topic', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });
        $scope.$watch('params.minDate', function(nV, oV) {
            if (nV !== oV) { checkDateParams(); }
        });
        $scope.$watch('params.maxDate', function(nV, oV) {
            if (nV !== oV) { checkDateParams(); }
        });
        $scope.$watch('params.channel', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });
        $scope.$watch('params.state', function(nV, oV) {
            if (nV !== oV) {
                getCounties();
                getAnalysis(); 
            }
        });
        $scope.$watch('params.county', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });

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
                    errorMessages.push('Error! Could not pull from Twitter.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // pull social media from facebook seeds
        $scope.pullFacebook = function () {
            $http.get('/data/socialmedia/pull/facebook')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not pull from Facebook.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // process ngrams
        $scope.processNgrams = function() {
            $http.get('/data/socialmedia/process/ngrams')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not process ngrams.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // process sentiment
        $scope.processSentiment = function() {
            $http.get('/data/socialmedia/process/sentiment')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not process sentiment.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // initialize districts
        $scope.initDistricts = function() {
            $http.get('/data/init/districts')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not initialize districts.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };
        
        // initialize topics
        $scope.initTopics = function() {
            $http.get('/data/init/topics')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not initialize topics.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // update district related social media
        $scope.updateDistrictRelatedSocialMedia = function() {
            $http.get('/data/socialmedia/district/related')
                .success(function(data) {
                    successMessages.push(data);
                })
                .error(function(err) {
                    errorMessages.push('Error! Could not update district related social media.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };
    }
]);
