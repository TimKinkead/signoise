'use strict';

/**
 * Angular controller for creating a new social seed.
 */
angular.module('app').controller('SocialSeedsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    function ($scope, $modalInstance, $http) {

        // variables
        var platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            seed = $scope.seed = {platform: 'twitter', frequency: 'daily'};

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
    }
]);