'use strict';

angular.module('app').controller('SocialSeedsEditController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    function ($scope, $modalInstance, info, $http) {

        $scope = angular.extend($scope, info);

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.save = function() {
            $http.put('data/socialseed', {_id: info.seed._id, frequency: info.seed.frequency})
                .success(function() {
                    $modalInstance.close({update: info.seed});
                })
                .error(function(err) {

                });
        };

        $scope.delete = function(confirm) {
            if (!confirm) {
                $scope.confirmDelete = !$scope.confirmDelete;
                return;
            }
            /*$http.delete('data/socialseed', {data: {_id: info.seed._id}})
                .success(function() {
                    $modalInstance.close({delete: true});
                })
                .error(function(err) {

                });*/
            $modalInstance.close({delete: true});
        };

        $scope.pull = function() {
            console.log(info.seed.query);
            $http.get('data/socialmedia/preview/twitter?query='+encodeURIComponent(info.seed.query))
                .success(function(data) {
                    console.log(data);
                })
                .error(function() {

                });
        };
    }
]);