'use strict';

angular.module('app').controller('SocialSeedsController', [
    '$scope',
    '$resource',
    '$uibModal',
    function($scope, $resource, $modal) {

        var seeds = $scope.seeds = $resource('data/socialseed/list').query(),
            fields = $scope.fields = ['platform', 'query', 'frequency', 'references', 'media', 'activated'],
            dates = $scope.dates = ['activated', 'initialized', 'created'];

        $scope.orderBy = fields[0];
        $scope.reverse = false;
        $scope.filter = function(key) {
            $scope.reverse = ($scope.orderBy === key && !$scope.reverse);
            $scope.orderBy = key;
        };

        $scope.create = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-seeds/create/view.html',
                controller: 'SocialSeedsCreateController'
            });

            modalInstance.result.then(function (seed) {
                seeds.push(seed);
            }, function () {
                console.log('dismiss');
            });
        };

        $scope.edit = function (seed) {
            var modalInstance = $modal.open({
                templateUrl: 'modules/main/social-seeds/edit/view.html',
                controller: 'SocialSeedsEditController',
                resolve: {
                    info: function() {
                        return {seed: angular.copy(seed), fields: fields, dates: dates};
                    }
                }
            });

            modalInstance.result.then(function (data) {
                if (data.update) {seed = angular.extend(seed, data.update);}
                else if (data.delete) {seeds.splice(seeds.indexOf(seed), 1);}
            }, function () {
                console.log('dismiss');
            });
        };

    }
]);