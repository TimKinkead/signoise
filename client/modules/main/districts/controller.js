'use strict';

/**
 * Angular controller for districts table.
 */
angular.module('app').controller('DistrictsController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    '$http',
    function($scope, $resource, $modal, $window, $http) {

        // variables
        var status = $scope.status = {
                processingStates: true,
                processingCounties: true,
                processingSummary: true,
                processingDistricts: true,
                errorMessages: []
            },
            summary = $scope.summary = {},
            districts = $scope.districts = [],
            
            skip = 0, limit = 20,
            filterBy = $scope.filterBy = {state: null, county: null};
            
            $scope.fields = [
                'name', 'website', 'facebook', 'twitter', 'city', 'state', 'county', 
                'studentCount', 'lepCount', 'iepCount', 'frlCount'
            ];
            $scope.dates = ['modified', 'created'];

        // -- STATES & COUNTIES --
        
        // get states
        function getStates() {
            $scope.filterByStates = $resource('data/state/list').query(
                {},
                function() { // success
                    status.processingStates = false;
                },
                function(err) { // error
                    status.processingStates = false;
                    status.errorMessages.push('Error! We had trouble listing the states. Please try refreshing the page.');
                }
            );
        }
        getStates();
        
        // get counties
        function getCounties() {
            if (!filterBy.state) { return; }
            status.processingCounties = true;
            $scope.filterByCounties = $resource('data/county/list').query(
                {state: filterBy.state},
                function(items) { // success
                    status.processingCounties = false;
                },
                function(err) { // error
                    status.processingCounties = false;
                    status.errorMessages.push('Error! We had trouble listing the counties. Please try selecting a different state.');
                }
            );
        }

        // -- SUMMARY --
        
        // get summary info for state/county 
        function getSummary() {
            status.processingSummary = true;
            summary = $resource('data/district/summary').get(
                filterBy,
                function() { // success
                    status.processingSummary = false;
                },
                function(err) { // error
                    status.processingSummary = false;
                    status.errorMessages.push('Error! We had trouble getting the state/county summary. Please try selecting a different state/county combination.');
                }
            );
        }
        getSummary(); // initialize
        
        
        // -- DISTRICTS --
        
        // lazy load districts in batches of 'limit'
        function loadMore() {
            if (districts.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.5,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                status.processingDistricts = true;
                skip += limit;
                var query = {skip: skip, limit: limit};
                if (filterBy.state) {query.state = filterBy.state;}
                if (filterBy.county) {query.county = filterBy.county;}
                $resource('data/district/list').query(
                    query,
                    function(items) { // success
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }
                        angular.forEach(items, function(item) {
                            districts.push(item);
                        });
                        status.processingDistricts = false;
                    },
                    function(err) { // error
                        status.processingDistricts = false;
                        status.errorMessages.push(
                            'Error! We had trouble loading more districts for state='+filterBy.state+' / county='+filterBy.county+'. '+
                            'Please try again.'
                        );
                    }
                );
            }
        }

        // reload district list
        function reloadDistricts() {
            status.processingDistricts = true;
            angular.element($window).unbind('scroll');
            skip = 0;
            districts = $scope.districts = $resource('data/district/list').query(
                {state: filterBy.state, county: filterBy.county, skip: skip, limit: limit},
                function() { // success
                    status.processingDistricts = false;
                    angular.element($window).bind('scroll', loadMore);
                },
                function(err) { // error
                    status.processingDistricts = false;
                    status.errorMessages.push(
                        'Error! We had trouble listing the districts for state='+filterBy.state+' / county='+filterBy.county+'. '+
                        'Please try selecting a different state/county combination.'
                    );
                }
            );
        }
        reloadDistricts(); // initialize

        // -- WATCH FILTERS --
        
        // watch state filter for changes
        $scope.$watch('filterBy.state', function(nV, oV) {
            if (nV !== oV) {
                filterBy.state = nV;
                filterBy.county = null;
                getCounties();
                getSummary();
                reloadDistricts();
            }
        });
        
        // watch county filter for changes
        $scope.$watch('filterBy.county', function(nV, oV) {
            if (nV !== oV) {
                filterBy.county = nV;
                getSummary();
                reloadDistricts();
            }
        });

        // -- CREATE MODAL --
        
        // launch create modal and handle result
        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/districts/create/view.html',
                controller: 'DistrictsCreateController'
            });
            modalInstance.result.then(
                function (district) { // success/close
                    districts.push(district); 
                },
                function () { // cancel/dismiss 
                    console.log('dismiss'); 
                }
            );
        };
        
        // -- EDIT MODAL --

        // launch edit modal (passing info to controller) and handle result
        $scope.edit = function (district) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/districts/edit/view.html',
                controller: 'DistrictsEditController',
                resolve: {
                    info: function() {
                        return {district: angular.copy(district)};
                    }
                }
            });
            modalInstance.result.then(
                function (data) { // success/close
                    if (data.update) { district = angular.extend(district, data.update); }
                    else if (data.delete) { districts.splice(districts.indexOf(district), 1); }
                },
                function () { // cancel/dismiss 
                    console.log('dismiss'); 
                }
            );
        };
        
        // -- DOWNLOAD --

        // download district data
        $scope.download = function() {
            $window.location.href = 'http://'+$window.location.host+'/data/district/download';
        };
        
        // -- ERROR MESSAGES --
        
        // close error message
        $scope.closeErrorMessage = function(index) {
            if (index && status.errorMessages[index]) {
                status.errorMessages.splice(index, 1);
            }
        };
        
    }
]);