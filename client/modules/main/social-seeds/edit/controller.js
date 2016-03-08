'use strict';

/**
 * Angular controller for editing a social seed.
 */
angular.module('app').controller('SocialSeedsEditController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    function ($scope, $modalInstance, info, $http) {

        // append info to scope
        $scope = angular.extend($scope, info);

        // cancel & close edit modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save changes to social seed
        $scope.save = function() {
            $http.put('data/socialseed', {_id: info.seed._id, frequency: info.seed.frequency})
                .success(function() {
                    $modalInstance.close({update: info.seed});
                })
                .error(function(err) {
                    // handle error
                });
        };

        // delete social seed
        $scope.delete = function(confirm) {
            if (!confirm) { // show confirm delete
                $scope.confirmDelete = !$scope.confirmDelete;
                return;
            }
            $http.delete('data/socialseed', {data: {_id: info.seed._id}})
                .success(function() {
                    $modalInstance.close({delete: true});
                })
                .error(function(err) {
                    // handle error
                });
            $modalInstance.close({delete: true});
        };

        // return uri encoded query string for twitter preview
        $scope.getQuery = function(query) {
            return encodeURIComponent(query);
        };
    }
]);