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
        var mediaDoc = $scope.mediaDoc = $resource('data/socialmedia').get({_id: info.mediaDocId});
        $scope.fields = ['_id', 'date', 'text', 'seed', 'platform', 'data', 'status', 'processed', 'meta'];
        $scope.dates = ['date', 'processed', 'modified', 'created'];
        $scope.showData = false;
        $scope.showMeta = false;

        // cancel & close read modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // get media doc text
        $scope.getMediaText = function() {
            if (!mediaDoc || !mediaDoc.text) {return '*** no text ***';}
            if (mediaDoc.text.length > 200) {return mediaDoc.text.slice(0, 200)+'...';}
            return mediaDoc.text;
        };

        // show/hide data
        $scope.toggleData = function() {
            $scope.showData = !$scope.showData;
            if ($scope.showData) {$scope.showMeta = false;}
        };

        // show/hide meta data
        $scope.toggleMeta = function() {
            $scope.showMeta = !$scope.showMeta;
            if ($scope.showMeta) {$scope.showData = false;}
        };

        // get media doc data field as stringified json
        $scope.getDataAsJSON = function() {
            return JSON.stringify(mediaDoc.data, null, 4);
        };

        // get media doc meta field as stringified json
        $scope.getMetaAsJSON = function() {
            return JSON.stringify(mediaDoc.meta, null, 4);
        };
    }
]);