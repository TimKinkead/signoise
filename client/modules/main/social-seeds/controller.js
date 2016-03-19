'use strict';

/**
 * Angular controller for social seeds table.
 */
angular.module('app').controller('SocialSeedsController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    '$http',
    function($scope, $resource, $modal, $window, $http) {

        // get summary info
        $scope.summary = $resource('data/socialseed/summary').get();

        // variables
        var skip = 0, limit = 20,
            filterBy = $scope.filterBy = 'active',
            seeds = $scope.seeds = $resource('data/socialseed/list').query({filterBy: filterBy, skip: skip, limit: limit}),
            fields = $scope.fields = ['title', 'platform', 'frequency', 'references', 'media', 'activated'],
            dates = $scope.dates = ['activated', 'initialized', 'created'];

        // launch create modal and handle result
        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-seeds/create/view.html',
                controller: 'SocialSeedsCreateController'
            });
            modalInstance.result.then(
                // close modal
                function (seed) {seeds.push(seed);},
                // dismiss modal
                function () {console.log('dismiss');}
            );
        };

        // launch edit modal (passing info to controller) and handle result
        $scope.edit = function (seed) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-seeds/edit/view.html',
                controller: 'SocialSeedsEditController',
                resolve: {
                    info: function() {
                        return {seed: angular.copy(seed), fields: fields, dates: dates};
                    }
                }
            });
            modalInstance.result.then(
                // close modal
                function (data) {
                    if (data.update) {seed = angular.extend(seed, data.update);}
                    else if (data.delete) {seeds.splice(seeds.indexOf(seed), 1);}
                },
                // dismiss modal
                function () {console.log('dismiss');}
            );
        };

        // lazy load social seeds in batches of 'limit'
        function loadMore() {
            if (seeds.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.2,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                skip += limit;
                $resource('data/socialseed/list').query(
                    {filterBy: filterBy, skip: skip, limit: limit},
                    function(items) {
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }

                        angular.forEach(items, function(item, index) {
                            seeds.push(item);
                        });
                    }
                );
            }
        }
        angular.element($window).bind('scroll', loadMore);

        // switch between filterBy modes
        $scope.$watch('filterBy', function(nV, oV) {
            if (nV !== oV) {
                angular.element($window).unbind('scroll');
                skip = 0;
                seeds = $scope.seeds = $resource('data/socialseed/list').query(
                    {filterBy: nV, skip: skip, limit: limit},
                    function() {angular.element($window).bind('scroll', loadMore);}
                );
            }
        });

        // only show pull buttons if running locally (pull is run by cron job on cloud servers)
        $scope.showPullBtns = $window.location.hostname === 'localhost';
        
        // pull social media from twitter seeds
        $scope.pullTwitter = function () {
            $http.get('/data/socialmedia/pull/twitter')
                .success(function(data) {})
                .error(function(err) {});
        };

        // pull social media from facebook seeds
        $scope.pullFacebook = function () {
            $http.get('/data/socialmedia/pull/facebook')
                .success(function(data) {})
                .error(function(err) {});
        };
        
    }
]);