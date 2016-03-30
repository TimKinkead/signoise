'use strict';

/**
 * Angular controller for creating a new district.
 */
angular.module('app').controller('DistrictsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    '$resource',
    function ($scope, $modalInstance, $http, $resource) {

        // variables
        var status = $scope.status = {},
            district = $scope.district = {};

        // cancel & close create modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save new district
        var save = $scope.save = function() {
            status.processing = true;
            $http.post('data/district', district)
                .success(function(data) {
                    status.processing = false;
                    $modalInstance.close(data);
                })
                .error(function(err) {
                    status.errorMessage = 'Error! Please try again.\n'+err;
                });
        };
        
    }
]);