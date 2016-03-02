'use strict';

angular.module('app').controller('SocialSeedsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    function ($scope, $modalInstance, $http) {
        var platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            seed = $scope.seed = {platform: 'twitter', frequency: 'daily'};

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

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

                });
        };

        $scope.active = platforms.indexOf(seed.platform);
        $scope.$watch('active', function (nV, oV) {
            if (nV !== oV) {
                seed.platform = platforms[nV];
            }
        });
    }
]);