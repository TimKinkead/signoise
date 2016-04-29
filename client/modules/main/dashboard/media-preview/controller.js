'use strict';

/**
 * Angular controller for previewing social media on the dashboard.
 */
angular.module('app').controller('DashboardMediaPreviewController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$resource',
    function ($scope, $modalInstance, info, $resource) {

        // append info to scope
        $scope = angular.extend($scope, info);

        // variables
        var status = $scope.status = {},
            params = $scope.params;

        // get media
        status.processing = true;
        $scope.media = $resource('data/socialmedia/list').query(
            {
                sentimentClass: $scope.sentimentClass,
                word: $scope.word,
                minDate: params.minDate,
                maxDate: params.maxDate,
                channel: params.channel,
                topic: params.topic,
                state: params.state,
                county: params.county
            },
            function(data) {
                status.processing = false;
            },
            function(err) {
                status.processing = false;
                status.errorMessage = 'Error! Could not load social media. Please try refreshing the page.\n'+err;
            }
        );

        // get topic name
        $scope.getTopicName = function() {
            var topicName = '???';
            $scope.topics.forEach(function(topic) {
                if (topic._id === params.topic) { topicName = topic.name; }
            });
            return topicName;
        };

        // get state name
        $scope.getStateName = function() {
            var stateName = '???';
            $scope.states.forEach(function(state) {
                if (state._id === params.state) { stateName = state.name; }
            });
            return stateName;
        };

        // get county name
        $scope.getCountyName = function() {
            var countyName = '???';
            $scope.counties.forEach(function(county) {
                if (county._id === params.county) { countyName = county.name; }
            });
            return countyName;
        };

        // cancel & close edit modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
]);