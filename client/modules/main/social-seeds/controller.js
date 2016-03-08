'use strict';

/**
 * Angular controller for social seeds table.
 */
angular.module('app').controller('SocialSeedsController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    function($scope, $resource, $modal, $window) {

        // get summary info
        $scope.summary = $resource('data/socialseed/summary').get();

        // filter by 'active' by default
        $scope.filterBy = 'active';

        // variables
        var skip = 0, limit = 20,
            seeds = $scope.seeds = $resource('data/socialseed/list').query({skip: skip, limit: limit, filterBy: $scope.filterBy}),
            fields = $scope.fields = ['platform', 'query', 'frequency', 'references', 'media', 'activated'],
            dates = $scope.dates = ['activated', 'initialized', 'created'];

        // table header filters
        $scope.orderBy = fields[0];
        $scope.reverse = false;
        $scope.filter = function(key) {
            $scope.reverse = ($scope.orderBy === key && !$scope.reverse);
            $scope.orderBy = key;
        };

        // launch create modal and handle result
        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-seeds/create/view.html',
                controller: 'SocialSeedsCreateController'
            });
            modalInstance.result.then(
                function (seed) {seeds.push(seed);}, // close modal
                function () {console.log('dismiss');} // dismiss modal
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
                function (data) { // close modal
                    if (data.update) {seed = angular.extend(seed, data.update);}
                    else if (data.delete) {seeds.splice(seeds.indexOf(seed), 1);}
                },
                function () {console.log('dismiss');} // dismiss modal
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
                    {skip: skip, limit: limit},
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
                    {skip: skip, limit: limit, filterBy: nV},
                    function() {angular.element($window).bind('scroll', loadMore);}
                );
            }
        });

    }
]);