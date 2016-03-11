'use strict';

/**
 * Angular controller for web sites table.
 */
angular.module('app').controller('WebSitesController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    function($scope, $resource, $modal, $window) {

        // get summary info
        $scope.summary = $resource('data/website/summary').get();

        // filter by 'active' by default
        $scope.filterBy = 'crawl';

        // variables
        var skip = 0, limit = 20,
            sites = $scope.sites = $resource('data/socialsite/list').query({skip: skip, limit: limit, filterBy: $scope.filterBy}),
            fields = $scope.fields = ['domain', 'url', 'crawl', 'category', 'notes', 'useRobots', 'disallow', 'fetched', 'ignored', 'redirected', 'scheduled', 'references', 'created'],
            dates = $scope.dates = ['created'];

        // launch create modal and handle result
        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/web-sites/create/view.html',
                controller: 'WebSitesCreateController'
            });
            modalInstance.result.then(
                function (site) {sites.push(site);}, // close modal
                function () {console.log('dismiss');} // dismiss modal
            );
        };

        // launch edit modal (passing info to controller) and handle result
        $scope.edit = function (site) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/web-sites/edit/view.html',
                controller: 'WebSitesEditController',
                resolve: {
                    info: function() {
                        return {site: angular.copy(site), fields: fields, dates: dates};
                    }
                }
            });
            modalInstance.result.then(
                function (data) { // close modal
                    if (data.update) {site = angular.extend(site, data.update);}
                    else if (data.delete) {sites.splice(sites.indexOf(site), 1);}
                },
                function () {console.log('dismiss');} // dismiss modal
            );
        };

        // lazy load social sites in batches of 'limit'
        function loadMore() {
            if (sites.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.2,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                skip += limit;
                $resource('data/website/list').query(
                    {skip: skip, limit: limit},
                    function(items) {
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }

                        angular.forEach(items, function(item, index) {
                            sites.push(item);
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
                sites = $scope.sites = $resource('data/website/list').query(
                    {skip: skip, limit: limit, filterBy: nV},
                    function() {angular.element($window).bind('scroll', loadMore);}
                );
            }
        });

    }
]);