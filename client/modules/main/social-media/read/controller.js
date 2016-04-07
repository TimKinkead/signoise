'use strict';

/**
 * Angular controller for reading a social media.
 */
angular.module('app').controller('SocialMediaReadController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    '$resource',
    function ($scope, $modalInstance, info, $http, $resource) {

        // append info to scope
        $scope = angular.extend($scope, info);
        
        // variables
        var status = $scope.status = {processing: true, errorMessage: null};

        $scope.showData = false;
        $scope.showNgrams = false;
        
        $scope.fields = [
            '_id', 'date', 'text', 'seed', 'platform', 'data',
            'ngrams', 'sentiment', 'ngramsProcessed', 'sentimentProcessed',
            'modified', 'created'];
        $scope.dates = ['date', 'ngramsProcessed', 'sentimentProcessed', 'modified', 'created'];
        
        // get full media doc
        $scope.mediaDoc = $resource('data/socialmedia').get(
            {_id: info.mediaDocId},
            function(data) {
                status.processing = false;
                status.errorMessage = null;
            },
            function(err) {
                status.processing = false;
                status.errorMessage = 'Error! Could not get social media doc. Please try again.\n'+err;
            }
        );

        // cancel & close read modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // show/hide data
        $scope.toggleData = function() {
            $scope.showData = !$scope.showData;
            $scope.showNgrams = false;
        };

        // show/hide ngrams
        $scope.toggleNgrams = function() {
            $scope.showNgrams = !$scope.showNgrams;
            $scope.showData = false;
        };

        // get media doc data field as stringified json
        $scope.getDataAsJSON = function() {
            return JSON.stringify($scope.mediaDoc.data, null, 4);
        };

        // get media doc ngrams field as stringified json
        $scope.getNgramsAsJSON = function() {
            return JSON.stringify($scope.mediaDoc.ngrams, null, 4);
        };
    }
]);