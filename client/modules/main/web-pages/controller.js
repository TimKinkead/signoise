'use strict';

angular.module('app').controller('WebPagesController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$http',
    '$window',
    function($scope, $resource, $modal, $http, $window) {

        // only show pull buttons if running locally (pull is run by cron job on cloud servers)
        $scope.showPullBtns = $window.location.hostname === 'localhost';

        // get summary info
        $scope.summary = $resource('data/webpage/summary').get();

        // filter by 'pending' by default
        $scope.filterBy = 'pending';

        // variables
        var skip = 0, limit = 20,
            pages = $scope.pages = $resource('data/webpage/list').query({skip: skip, limit: limit, filterBy: $scope.filterBy}),
            fields = $scope.fields = ['url', 'status', 'type', 'crawlDate', 'title', 'links', 'references', 'referencesSocialMedia', 'created'],
            dates = $scope.dates = ['crawlDate', 'created'];

        // download web pages data as csv file
        $scope.download = function() {
            $window.location.href = 'http://'+$window.location.host+'/data/webpage/download';
        };

        // lazy load web pages docs
        function loadMore() {
            if (pages.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.2,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                skip += limit;
                $resource('data/webpage/list').query(
                    {skip: skip, limit: limit},
                    function(items) {
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }

                        angular.forEach(items, function(item, index) {
                            pages.push(item);
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
                pages = $scope.pages = $resource('data/webpage/list').query(
                    {skip: skip, limit: limit, filterBy: nV},
                    function() {
                        angular.element($window).bind('scroll', loadMore);
                    }
                );
            }
        });

    }
]);