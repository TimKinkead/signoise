'use strict';

/**
 * angular controller for dashboard
 */
angular.module('app').controller('DashboardController', [
    '$scope',
    '$resource',
    '$http',
    '$timeout',
    '$uibModal',
    'CurrentUser',
    function ($scope, $resource, $http, $timeout, $modal, CurrentUser) {

        // variables
        var status = $scope.status = {},
            params = $scope.params = {},
            errorMessages = $scope.errorMessages = [],
            successMessages = $scope.successMessages = [];

        // -------------------------------------------------------------------------------------------------------------
        // User

        // get user
        $scope.user = CurrentUser.data;

        // connect to a user's twitter account
        $scope.connectTwitter = function() {
            window.location.assign('/data/user/twitter/connect');
        };

        // connect to a user's facebook account
        $scope.connectFacebook = function() {
            window.location.assign('/data/user/facebook/connect');
        };
        
        // -------------------------------------------------------------------------------------------------------------
        // Success/Error Messages
        
        // close error message
        $scope.closeErrorMessage = function(errorIndex) {
            errorMessages.splice(errorIndex, 1);
        };

        // close success message
        $scope.closeSuccessMessage = function(successIndex) {
            successMessages.splice(successIndex, 1);
        };

        // -------------------------------------------------------------------------------------------------------------
        // Form
        
        $scope.geoChannels = ['all social media', 'district social media', 'district related social media'];

        // get channels
        status.processingChannels = true;
        $scope.channels = $resource('data/channel/list').query(
            {},
            function() {
                status.processingChannels = false;
                params.channel = $scope.channels[0]; // default
            },
            function(err) {
                status.processingChannels = false;
                errorMessages.push('Error! Could not get channels. Please try refreshing the page.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
            }
        );
        
        // get topics
        status.processingTopics = true;
        var topics = $scope.topics = $resource('data/topic/list').query(
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
        var states = $scope.states = $resource('data/state/list').query(
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
        var counties;
        function getCounties() {
            status.processingCounties = true;
            counties = $scope.counties = $resource('data/county/list').query(
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

        // -------------------------------------------------------------------------------------------------------------
        // Date Slider

        // dates
        var d = new Date(),
            year = d.getFullYear(),
            month = d.getMonth(),
            day = d.getDate();

        // date slider config
        var slider = $scope.slider = {
            min: (day > 5) ? month-12 : month-13,
            max: (day > 5) ? month : month-1,
            options: {
                floor: (day > 5) ? month-13 : month-14,
                ceil: (day > 5) ? month+1 : month,
                showTicks: true,
                translate: function(no) {
                    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return (no >= 0) ? months[no]+' 1, '+year : months[no+12]+' 1, '+(year-1);
                }
            }
        };

        // change date params based on slider
        // - use setTimeout to avoid constant changes from dragging
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

        // -------------------------------------------------------------------------------------------------------------
        // Analysis
        
        var analysis;

        // run analysis
        function runAnalysis() {
            //console.log('run analysis');
            status.processingAnalysis = true;
            errorMessages.splice(0, errorMessages.length);
            successMessages.splice(0, successMessages.length);
            analysis = $scope.analysis = $resource('data/analysis').get(
                params,
                function(data) {
                    status.processingAnalysis = false;
                    var msg;
                    if (!data || !data.ngrams || !data.sentiment) {
                        msg = 'No analysis results!<br><small>Please try a different date/channel/topic/state/county combination.</small>';
                        if (errorMessages.indexOf(msg) < 0) { errorMessages.push(msg); }
                        return;
                    }
                    // calculate minFreq / maxFreq for each ngram class
                    sentimentOptions.forEach(function(option) {
                        if (data.ngrams[option] && data.ngrams[option].all) {
                            data.ngrams[option].all.forEach(function(ngram) {
                                if (ngram.frequency && analysis.ngrams) {
                                    if (!analysis.ngrams[option].minFreq) { analysis.ngrams[option].minFreq = ngram.frequency; }
                                    if (!analysis.ngrams[option].maxFreq) { analysis.ngrams[option].maxFreq = ngram.frequency; }
                                    if (ngram.frequency < analysis.ngrams[option].minFreq) { analysis.ngrams[option].minFreq = ngram.frequency; }
                                    if (ngram.frequency > analysis.ngrams[option].maxFreq) { analysis.ngrams[option].maxFreq = ngram.frequency; }
                                }
                            });
                        }
                    });
                    msg = 'See analysis below.';
                    if (successMessages.indexOf(msg) < 0) { successMessages.push(msg); }
                },
                function(err) {
                    status.processingAnalysis = false;
                    var msg = 'Error! Could not get analysis. Please try a different date/channel/topic/state/county combination.<br><small>'+JSON.stringify(err, null, 4)+'</small>';
                    if (errorMessages.indexOf(msg) < 0) { errorMessages.push(msg); }
                }
            );
        }

        // get analysis
        function getAnalysis() {
            //console.log('get analysis');
            var _params = {
                minDate: params.minDate,
                maxDate: params.maxDate,
                channel: params.channel,
                topic: params.topic,
                state: params.state,
                county: params.county
            };
            setTimeout(
                function() {
                    var run = true;
                    for (var key in _params) {
                        if (_params.hasOwnProperty(key) && _params[key] !== params[key]) {
                            run = false;
                        }
                    }
                    if (run) { runAnalysis(); }
                },
                500
            );
        }

        // -------------------------------------------------------------------------------------------------------------
        // Sentiment

        var sentimentOptions = $scope.sentimentOptions = [
            'negative',
            'neutral',
            'positive'
        ];

        $scope.sentimentConfig = {
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
        };

        // get width for sentiment class button
        $scope.getSentimentWidth = function(sentimentOption) {
            if (!analysis || !analysis.sentiment || !analysis.sentiment[sentimentOption]) { return '5%'; }
            var total = 100;
            sentimentOptions.forEach(function(option) {
                if (!analysis.sentiment[option]) { total -= 5; }
            });
            return Math.floor((analysis.sentiment[sentimentOption] / analysis.count) * total) + '%';
        };
        
        // get social media
        $scope.getMediaPreview = function(sentimentClass, word) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/dashboard/media-preview/view.html',
                controller: 'DashboardMediaPreviewController',
                resolve: {
                    info: {
                        sentimentClass: sentimentClass,
                        word: word,
                        params: params,
                        topics: angular.copy(topics),
                        states: states,
                        counties: counties
                    }
                }
            });
            modalInstance.result.then(
                function() { console.log('close'); },
                function() { console.log('dismiss'); }
            );
        };

        // -------------------------------------------------------------------------------------------------------------
        // Map

        var map,
            mapDefaultZoom = 4,
            mapDefaultCenter = {lat: 38, lng: -100},
            mapDefaultStyle = {
                state: {
                    fillColor: 'gray',
                    fillOpacity: 0.5,
                    strokeColor: 'gray',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    zIndex: 1
                },
                county: {
                    fillColor: 'gray',
                    fillOpacity: 0.5,
                    strokeColor: 'gray',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    zIndex: 2
                },
                district: {
                    zIndex: 3
                }
            },
            mapBox = $scope.mapBox = {},
            infowindow;

        // initialize map
        $scope.loadMap = function() {
            var mapDiv = document.getElementById('map');
            if (!mapDiv) { return; }

            // initialize map
            map = new google.maps.Map(document.getElementById('map'), {
                center: mapDefaultCenter,
                zoom: mapDefaultZoom,
                scrollwheel: false,
                title: true
            });

            // style map
            map.data.setStyle(function(feature) {
                switch(feature.getProperty('type')) {
                    case 'state': return (mapDefaultStyle.state);
                    case 'county': return (mapDefaultStyle.county);
                    case 'district': return (mapDefaultStyle.district);
                }
            });

            // initilaize info window
            infowindow = new google.maps.InfoWindow();

            // load states
            loadStatesOnMap();
        };

        // fit map bounds to state or county
        function fitMapBounds() {
            infowindow.close();
            if (!params.county && !params.state) {
                map.setZoom(mapDefaultZoom);
                map.setCenter(mapDefaultCenter);
                return;
            }
            var bounds, i, x;
            if (params.county) {
                for (i=0, x=$scope.counties.length; i<x; i++) {
                    if ($scope.counties[i]._id === params.county) {
                        bounds = $scope.counties[i].bounds;
                        break;
                    }
                }
            } else if (params.state) {
                for (i=0, x=$scope.states.length; i<x; i++) {
                    if ($scope.states[i]._id === params.state) {
                        bounds = $scope.states[i].bounds;
                        break;
                    }
                }
            }
            if (bounds &&
                bounds[0] && bounds[0][0] && bounds[0][1] &&
                bounds[1] && bounds[1][0] && bounds[1][1]) {
                map.fitBounds({
                    west: bounds[0][0],
                    south: bounds[0][1],
                    east: bounds[1][0],
                    north: bounds[1][1]
                });
            }
        }

        // hover behavior
        function addHoverBehavior() {
            map.data.addListener('mouseover', function(event) {
                var fType = event.feature.getProperty('type');
                if (event.feature.getProperty('_id') !== params[fType]) {
                    map.data.overrideStyle(event.feature, {strokeWeight: mapDefaultStyle[fType].strokeWeight+4});
                }
                $scope.$apply(function() {
                    switch(event.feature.getProperty('type')) {
                        case 'state': mapBox.text = event.feature.getProperty('name'); break;
                        case 'county': mapBox.text = event.feature.getProperty('name')+' county'; break;
                    }
                });
            });
            map.data.addListener('mouseout', function(event) {
                var fType = event.feature.getProperty('type');
                if (event.feature.getProperty('_id') !== params[fType]) {
                    map.data.overrideStyle(event.feature, {strokeWeight: mapDefaultStyle[fType].strokeWeight});
                }
                $scope.$apply(function() { mapBox.text = null; });
            });
        }

        // load states on map
        function loadStatesOnMap() {

            // fit map bounds
            fitMapBounds();

            // clear map features
            map.data.forEach(function(feature) { map.data.remove(feature); });
            map.data.revertStyle();

            // load states geo json
            map.data.loadGeoJson('http://'+window.location.host+'/data/state/list/geojson');

            // click event listeners
            map.data.addListener('click', function(event) {
                if (event.feature.getProperty('type') === 'state') {
                    //console.log('click state: '+event.feature.getProperty('name'));
                    $scope.$apply(function() { params.state = event.feature.getProperty('_id'); });
                }
            });

            // add hover behavior
            addHoverBehavior();
        }

        // load counties on map
        function loadCountiesOnMap() {

            // fit map bounds
            fitMapBounds();

            // clear map features
            map.data.forEach(function(feature) { map.data.remove(feature); });
            map.data.revertStyle();

            // load counties
            map.data.loadGeoJson('http://'+window.location.host+'/data/county/list/geojson?state='+params.state);

            // click event listeners
            map.data.addListener('click', function(event) {
                if (event.feature.getProperty('type') === 'county') {
                    //console.log('click county: '+event.feature.getProperty('name'));
                    $scope.$apply(function() { params.county = event.feature.getProperty('_id'); });
                    map.data.overrideStyle(event.feature, {strokeWeight: mapDefaultStyle.county.strokeWeight+6});
                    map.data.forEach(function(feature) {
                        if (feature.getProperty('type') === 'county' &&
                            params.county !== feature.getProperty('_id')) {
                            map.data.overrideStyle(feature, {strokeWeight: mapDefaultStyle.county.strokeWeight});
                        }
                    });
                }
            });

            // add hover behavior
            addHoverBehavior();
        }

        // load districts on map
        function loadDistrictsOnMap() {

            // fit map bounds
            fitMapBounds();

            // clear other districts & make selected county bold
            map.data.forEach(function(feature) {
                switch(feature.getProperty('type')) {
                    case 'district':
                        map.data.remove(feature);
                        break;
                    case 'county':
                        var fStrokeWeight = (feature.getProperty('_id') === params.county) ? mapDefaultStyle.county.strokeWeight+6 : mapDefaultStyle.county.strokeWeight;
                        map.data.overrideStyle(feature, {strokeWeight: fStrokeWeight});
                        break;
                }
            });

            // load districts
            map.data.loadGeoJson('http://'+window.location.host+'/data/district/list/geojson?state='+params.state+'&county='+params.county);

            // click event listeners
            map.data.addListener('click', function(event) {
                if (event.feature.getProperty('type') === 'district') {
                    //console.log('click district: '+event.feature.getProperty('name'));
                    infowindow.setContent('<div style="margin:  10px 10px 5px 10px; text-align: center;">'+event.feature.getProperty('name')+'</div>');
                    infowindow.setPosition(event.feature.getGeometry().get());
                    infowindow.setOptions({pixelOffset: new google.maps.Size(0,-30)});
                    infowindow.open(map);
                }
            });
        }
        
        // -------------------------------------------------------------------------------------------------------------
        // Watch Parameter Changes

        $scope.$watch('params.minDate', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });
        $scope.$watch('params.maxDate', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });
        $scope.$watch('params.channel', function(nV, oV) {
            if (nV !== oV) { getAnalysis(); }
        });
        $scope.$watch('params.topic', function(nV, oV) {
            if (nV !== oV) {
                if (nV === '') {
                    params.topic = null;
                } else {
                    getAnalysis();
                }
            }
        });
        $scope.$watch('params.state', function(nV, oV) {
            //console.log('state changed from', oV, 'to', nV);
            if (nV !== oV) {
                if (nV === '') {
                    params.state = null;
                } else if (!nV) {
                    params.county = null;
                    $scope.counties = null;
                    getAnalysis();
                    loadStatesOnMap();
                } else {
                    getCounties();
                    getAnalysis();
                    loadCountiesOnMap();
                }
            }
        });
        $scope.$watch('params.county', function(nV, oV) {
            //console.log('county changed from', oV, 'to', nV);
            if (nV !== oV) {
                if (nV === '') {
                    params.county = null;
                } else if (!nV) {
                    getAnalysis();
                    if (params.state) { loadCountiesOnMap(); }
                } else {
                    getAnalysis();
                    loadDistrictsOnMap();
                }
            }
        });

        // -------------------------------------------------------------------------------------------------------------
        // Development Buttons

        var devErrorMessages = $scope.devErrorMessages = [],
            devSuccessMessages = $scope.devSuccessMessages = [];

        // close error message
        $scope.closeDevErrorMessage = function(errorIndex) {
            devErrorMessages.splice(errorIndex, 1);
        };

        // close success message
        $scope.closeDevSuccessMessage = function(successIndex) {
            devSuccessMessages.splice(successIndex, 1);
        };
        
        // get environment variables
        $scope.envVar = $resource('data/env-var').get();
        
        // pull social media from twitter seeds
        $scope.pullTwitter = function () {
            $http.get('/data/socialmedia/pull/twitter')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not pull from Twitter.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // pull social media from facebook seeds
        $scope.pullFacebook = function () {
            $http.get('/data/socialmedia/pull/facebook')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not pull from Facebook.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // process ngrams
        $scope.processNgrams = function() {
            $http.get('/data/socialmedia/process/ngrams')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not process ngrams.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // process sentiment
        $scope.processSentiment = function() {
            $http.get('/data/socialmedia/process/sentiment')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not process sentiment.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // initialize topics
        $scope.initTopics = function() {
            $http.get('/data/init/topics')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not initialize topics.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // initialize states
        $scope.initStates = function() {
            $http.get('/data/init/states')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not initialize states.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // initialize counties
        $scope.initCounties = function() {
            $http.get('/data/init/counties')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not initialize counties.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };
        
        // initialize districts
        $scope.initDistricts = function() {
            $http.get('/data/init/districts')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not initialize districts.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };

        // update district related social media
        $scope.updateDistrictRelatedSocialMedia = function() {
            $http.get('/data/socialmedia/district/related')
                .success(function(data) {
                    devSuccessMessages.push(data);
                })
                .error(function(err) {
                    devErrorMessages.push('Error! Could not update district related social media.<br><small>'+JSON.stringify(err, null, 4)+'</small>');
                });
        };
    }
]);
