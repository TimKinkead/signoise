'use strict';

/**
 * Angular controller for editing a district.
 */
angular.module('app').controller('DistrictsEditController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    '$resource',
    function ($scope, $modalInstance, info, $http, $resource) {

        // append info to scope
        $scope = angular.extend($scope, info);

        // variables
        var status = $scope.status = {processing: false, errorMessage: null};

        $scope.fields = [
            '_id', 'name', 'cdsId', 'ncesId', 'website', 'facebook', 'twitter', 
            'street', 'city', 'state', 'zip', 'county', 'latitude', 'longitude',
            'studentCount', 'lepCount', 'iepCount', 'frlCount', 'fetchCount',
            'modified', 'created'
        ];
        $scope.dates = ['modified', 'created'];

        // full district doc
        status.processing = true;
        $scope.fullDistrict = $resource('data/district').get(
            {_id: info.district._id},
            function() { // success
                status.processing = false;
            },
            function(err) { // error
                status.processing = false;
                status.errorMessage = 'Error! We had trouble getting the district. Please try again';
            }
        );

        // cancel & close edit modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save changes to district
        $scope.save = function() {
            if (status.errorMessage) { delete status.errorMessage; }
            status.processing = true;
            $http.put('data/district', info.district)
                .success(function() {
                    $modalInstance.close({update: info.district});
                })
                .error(function(err) {
                    status.processing = false;
                    status.errorMessage = 'Error! We had trouble updating the district. Please try again';
                });
        };

        // delete district
        $scope.delete = function(confirm) {
            if (status.errorMessage) { delete status.errorMessage; }
            if (!confirm) { // show confirm delete
                $scope.confirmDelete = !$scope.confirmDelete;
                return;
            }
            status.processing = true;
            $http.delete('data/district', {data: {_id: info.district._id}})
                .success(function() {
                    $modalInstance.close({delete: true});
                })
                .error(function(err) {
                    status.processing = false;
                    $scope.confirmDelete = false;
                    status.errorMessage = 'Error! We had trouble deleting the district. Please try again';
                });
        };

        // return uri encoded query string for view on twitter link
        $scope.getQuery = function(query) {
            return encodeURIComponent(query);
        };
    }
]);