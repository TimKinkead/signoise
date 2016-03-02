'use strict';

angular.module('app').controller('SocialMediaController', [
    '$scope',
    '$resource',
    '$uibModal',
    '$http',
    function($scope, $resource, $modal, $http) {

        var status = {},
            media = $scope.media = $resource('data/socialmedia/list').query(),
            fields = $scope.fields = ['platform', 'status', 'data', 'processed', 'meta'],
            dates = $scope.dates = ['processed', 'modified', 'created'];

        $scope.orderBy = fields[0];
        $scope.reverse = false;
        $scope.filter = function(key) {
            $scope.reverse = ($scope.orderBy === key && !$scope.reverse);
            $scope.orderBy = key;
        };

        $scope.pullTwitter = function () {
            $http.get('/data/socialmedia/pull/twitter')
                .success(function(data) {})
                .error(function(err) {});
        };

    }
]);