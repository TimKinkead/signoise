'use strict';

/**
 * Angular controller for creating a new social seed.
 */
angular.module('app').controller('SocialSeedsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    '$resource',
    function ($scope, $modalInstance, $http, $resource) {

        // variables
        var status = $scope.status = {},
            step = $scope.step = 1,
            platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            seed = $scope.seed = {platform: 'facebook', frequency: 'daily'};

        // cancel & close create modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save new social seed
        $scope.save = function() {
            switch(seed.platform) {
                case 'facebook':
                    return;
                    //break;
                case 'instagram':
                    return;
                    //break;
                case 'twitter':
                    if (!seed.query || !seed.frequency) {return;}
                    break;
                default: return;
            }
            $http.post('data/socialseed', seed)
                .success(function(data) {
                    $modalInstance.close(data);
                })
                .error(function(err) {
                    // handle error
                });
        };

        // switch tabs in create form
        $scope.active = platforms.indexOf(seed.platform);
        $scope.$watch('active', function (nV, oV) {
            if (nV !== oV) {
                seed.platform = platforms[nV];
            }
        });

        // search facebook for groups and pages
        $scope.searchFacebook = function() {
            status.processing = true;
            status.errorMessage = null;
            $scope.facebookResults = $resource('data/socialseed/facebook/search').get(
                {query: seed.query},
                function() { status.processing = false; },
                function(err) { status.processing = false; status.errorMessage = 'Error! Please try again.\n'+err; }
            );
        };

        // select a facebook group or page
        $scope.selectFacebook = function(fbItem) {
            step = 2;
            seed.facebookId = 0;
        };

    }
]);