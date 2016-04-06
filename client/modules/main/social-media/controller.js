'use strict';

angular.module('app').controller('SocialMediaController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    function($scope, $resource, $modal, $window) {

        var status = $scope.status = {processing: true, processingSummary: true},

            // table display
            fields = $scope.fields = ['no', 'date', 'text', 'seed', 'platform', 'ngrams', 'sentiment', 'probability'],
            dates = $scope.dates = ['date', 'ngramsProcessed', 'sentimentProcessed', 'modified', 'created'],
            
            // list media parameters
            skip = 0, limit = 20,
            filterBy = $scope.filterBy = {type: 'all'},
            filterByOptions = $scope.filterByOptions = ['ngrams', 'sentiment', 'facebook', 'instagram', 'twitter', 'all'];
        
        // get media
        $scope.media = $resource('data/socialmedia/list').query(
            {filterBy: filterBy.type, skip: skip, limit: limit},
            function(data) {
                status.processing = false;
            },
            function(err) {
                status.processing = false;
                status.errorMessage = 'Error! Could not load social media. Please try refreshing the page.\n'+err;
            }
        );

        // get summary
        $scope.summary = $resource('data/socialmedia/summary').get(
            {},
            function(data) {
                status.processingSummary = false;
            },
            function(err) {
                status.processingSummary = false;
                if (!status.errorMessage) {
                    status.errorMessage = 'Error! Could not get social media summary. Please try refreshing the page.\n'+err;
                }
            }
        );

        // lazy load social media docs
        function loadMore() {
            if ($scope.media.length < skip + limit) { return; }

            var loadHeight = $window.innerHeight * 1.5,
                last = document.getElementsByClassName('last-row');

            last = !last.length ? false : last[0].getBoundingClientRect().top;

            if (last && last < loadHeight) {
                console.log('load more media');
                status.processing = true;
                skip += limit;
                $resource('data/socialmedia/list').query(
                    {filterBy: filterBy.type, skip: skip, limit: limit},
                    function(items) {
                        status.processing = false;
                        status.errorMessage = null;
                        if (items.length < limit) {
                            angular.element($window).unbind('scroll');
                        }
                        angular.forEach(items, function(item) {
                            $scope.media.push(item);
                        });
                    },
                    function(err) {
                        status.processing = false;
                        status.errorMessage = 'Error! We had trouble loading more social media docs.\n'+err;
                    }
                );
            }
        }
        angular.element($window).bind('scroll', loadMore);
        
        // reload media list
        function reloadmedia() {
            console.log('reload media w/ filterBy='+filterBy.type);
            status.processing = true;
            angular.element($window).unbind('scroll');
            skip = 0;
            $scope.media = $resource('data/socialmedia/list').query(
                {filterBy: filterBy.type, skip: skip, limit: limit},
                function() {
                    status.processing = false;
                    angular.element($window).bind('scroll', loadMore);
                },
                function(err) {
                    status.processing = false;
                    status.errorMessage = 'Error! Could not load social media. Please try refreshing the page.\n'+err;
                }
            );
        }

        // switch between filterBy modes
        $scope.$watch('filterBy.type', function(nV, oV) {
            if (nV !== oV) { reloadmedia(); }
        });

        // download social media data as csv file
        $scope.download = function() {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-media/download/view.html',
                controller: 'SocialMediaDownloadController'
            });
            modalInstance.result.then(
                // close modal
                function () {console.log('close');},
                // dismiss modal
                function () {console.log('dismiss');}
            );
        };

        // launch read modal
        $scope.read = function (mediaDoc) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-media/read/view.html',
                controller: 'SocialMediaReadController',
                resolve: {
                    info: function() { return {mediaDocId: mediaDoc._id}; }
                }
            });
            modalInstance.result.then(
                // close modal
                function () {console.log('close');},
                // dismiss modal
                function () {console.log('dismiss');}
            );
        };
        
    }
]);