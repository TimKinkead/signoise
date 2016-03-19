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
        var status = $scope.status = {step: 1},
            platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            seed = $scope.seed = {platform: 'facebook', frequency: 'daily'};

        // cancel & close create modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save new social seed
        $scope.save = function() {
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
                switch(seed.platform) {
                    case 'facebook':
                        seed.facebook = {};
                        if (seed.twitter) {delete seed.twitter;}
                        break;
                    case 'twitter':
                        seed.twitter = {};
                        if (seed.facebook) {delete seed.facebook;}
                }
            }
        });

        // search facebook for groups and pages
        $scope.searchFacebook = function() {
            status.processing = true;
            status.errorMessage = null;
            $scope.facebookResults = $resource('data/socialseed/facebook/search').get(
                {query: seed.facebook.title},
                function() { status.processing = false; },
                function(err) { status.processing = false; status.errorMessage = 'Error! Please try again.\n'+err; }
            );
        };

        // select a facebook group or page
        $scope.selectFacebook = function(fbItem) {
            $scope.facebookFields = ['id', 'name', 'category'];
            status.step = 2;
            seed.facebook = {
                id: fbItem.id,
                name: fbItem.name,
                category: (fbItem.category) ? fbItem.category : 'Group'
            };
        };

    }
]);