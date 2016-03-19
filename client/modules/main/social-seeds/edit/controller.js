'use strict';

/**
 * Angular controller for editing a social seed.
 */
angular.module('app').controller('SocialSeedsEditController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    '$resource',
    function ($scope, $modalInstance, info, $http, $resource) {
        
        // append info to scope
        $scope = angular.extend($scope, info);

        // variables
        $scope.showHistory = false;
        $scope.fullSeed = null;

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

        // show/hide pull history
        $scope.toggleHistory = function() {
            $scope.showHistory = !$scope.showHistory;
            if (!$scope.fullSeed) {
                $scope.fullSeed = $resource('data/socialseed').get({_id: info.seed._id});
            }
        };

        // return uri encoded query string for view on twitter link
        $scope.getQuery = function(query) {
            return encodeURIComponent(query);
        };
    }
]);