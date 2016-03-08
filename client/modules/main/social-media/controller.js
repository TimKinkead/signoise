'use strict';

angular.module('app').controller('SocialMediaController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$http',
    '$window',
    function($scope, $resource, $modal, $http, $window) {

        // only show pull buttons if running locally (pull is run by cron job on cloud servers)
        $scope.showPullBtns = $window.location.hostname === 'localhost';

        // get summary info
        $scope.summary = $resource('data/socialmedia/summary').get();

        // filter by 'ready' by default
        $scope.filterBy = 'ready';

        // variables
        var skip = 0, limit = 20,
            media = $scope.media = $resource('data/socialmedia/list').query({skip: skip, limit: limit, filterBy: $scope.filterBy}),
            fields = $scope.fields = ['platform', 'status', 'processed', 'username', 'text', 'date'],
            dates = $scope.dates = ['processed', 'modified', 'created'];

        // table header filters
        $scope.orderBy = fields[0];
        $scope.reverse = false;
        $scope.filter = function(key) {
            $scope.reverse = ($scope.orderBy === key && !$scope.reverse);
            $scope.orderBy = key;
        };

        // pull social media from twitter seeds
        $scope.pullTwitter = function () {
            $http.get('/data/socialmedia/pull/twitter')
                .success(function(data) {})
                .error(function(err) {});
        };

        // download social media data as csv file
        $scope.download = function() {
            $window.location.href = 'http://'+$window.location.host+'/data/socialmedia/download';
        };

        // lazy load social media docs
        function loadMore() {
            if (media.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.2,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                skip += limit;
                $resource('data/socialmedia/list').query(
                    {skip: skip, limit: limit},
                    function(items) {
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }

                        angular.forEach(items, function(item, index) {
                            media.push(item);
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
                media = $scope.media = $resource('data/socialmedia/list').query(
                    {skip: skip, limit: limit, filterBy: nV},
                    function() {
                        angular.element($window).bind('scroll', loadMore);
                    }
                );
            }
        });

        // get text from twitter
        $scope.getTwitterText = function(twitterText) {
            return decodeURIComponent(twitterText);
        };

        // create date object from twitter date string and return
        $scope.getTwitterDate = function(twitterDate) {
            return new Date(twitterDate);
        };

    }
]);