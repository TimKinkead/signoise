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

        var status = $scope.status = {processing: true},

            skip = 0, limit = 20,
            filterBy = $scope.filterBy = {status: 'active', platform: null, type: null},
            seeds = $scope.seeds = $resource('data/socialseed/list').query(
                {status: filterBy.status, skip: skip, limit: limit},
                function() {status.processing = false;}
            ),

            fields = $scope.fields = ['title', 'platform', 'type', 'frequency', 'references', 'media', 'initialized'],
            dates = $scope.dates = ['initialized', 'created'];

        // filter by options
        $scope.filterByStatuses = ['active', 'pending', 'never', 'all'];
        $scope.filterByPlatforms = ['facebook', 'instagram', 'twitter', 'all'];
        $scope.filterByTypes = {
            facebook: ['group', 'page', 'all'],
            instagram: ['hashtag', 'username', 'all'],
            twitter: ['query', 'hashtag', 'screen_name', 'geocode', 'all']
        };

        // summary
        $scope.summary = $resource('data/socialseed/summary').get();

        // lazy load social seeds in batches of 'limit'
        function loadMore() {
            if (seeds.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.2,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                status.processing = true;
                skip += limit;
                $resource('data/socialseed/list').query(
                    {status: filterBy.status, platform: filterBy.platform, type: filterBy.type, skip: skip, limit: limit},
                    function(items) {
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }
                        angular.forEach(items, function(item, index) {
                            seeds.push(item);
                        });
                        status.processing = false;
                    }
                );
            }
        }
        angular.element($window).bind('scroll', loadMore);

        // reload seed list
        function reloadSeeds() {
            console.log('reload seeds');
            console.log(filterBy);
            status.processing = true;
            angular.element($window).unbind('scroll');
            skip = 0;
            seeds = $scope.seeds = $resource('data/socialseed/list').query(
                {status: filterBy.status, platform: filterBy.platform, type: filterBy.type, skip: skip, limit: limit},
                function() {
                    status.processing = false;
                    angular.element($window).bind('scroll', loadMore);
                }
            );
        }

        // watch filters for changes
        $scope.$watch('filterBy.status', function(nV, oV) {
            if (nV !== oV) {
                filterBy.status = nV;
                reloadSeeds();
            }
        });
        $scope.$watch('filterBy.platform', function(nV, oV) {
            if (nV !== oV) {
                filterBy.platform = (nV === 'all') ? null : nV;
                reloadSeeds();
            }
        });
        $scope.$watch('filterBy.type', function(nV, oV) {
            if (nV !== oV) {
                filterBy.type = (nV === 'all') ? null : nV;
                reloadSeeds();
            }
        });

        // switch between filterBy modes
        $scope.$watch('filterBy', function(nV, oV) {
            if (nV.status !== oV.status || nV.platform !== oV.platform || nV.type !== oV.type) {
                console.log(nV);
                if (nV.platform === 'all') {nV.platform = null;}
                if (nV.type === 'all') {nV.type = null;}
                status.processing = true;
                angular.element($window).unbind('scroll');
                filterBy = nV;
                skip = 0;
                seeds = $scope.seeds = $resource('data/socialseed/list').query(
                    {status: filterBy.status, platform: filterBy.platform, type: filterBy.type, skip: skip, limit: limit},
                    function() {angular.element($window).bind('scroll', loadMore);}
                );
            }
        });

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