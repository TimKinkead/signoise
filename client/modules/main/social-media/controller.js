'use strict';

angular.module('app').controller('SocialMediaController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$window',
    function($scope, $resource, $modal, $window) {

        // get summary info
        $scope.summary = $resource('data/socialmedia/summary').get();

        // filter by 'ready' by default
        $scope.filterBy = 'ready';

        // variables
        var skip = 0, limit = 20,
            media = $scope.media = $resource('data/socialmedia/list').query({skip: skip, limit: limit, filterBy: $scope.filterBy}),
            fields = $scope.fields = ['date', 'text', 'seed', 'platform', 'status', 'processed'],
            dates = $scope.dates = ['date', 'processed', 'modified', 'created'];
        

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

        // download social media data as csv file
        $scope.download = function() {
            $window.location.href = 'http://'+$window.location.host+'/data/socialmedia/download';
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