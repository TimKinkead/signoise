'use strict';

angular.module('app').controller('DashboardController', [
    '$scope',
    'CurrentUser',
    function ($scope, CurrentUser) {

        $scope.user = CurrentUser.data;

        // connect to a user's twitter account
        $scope.connectTwitter = function() {
            window.location.assign('/data/user/twitter/connect');
        };

        // connect to a user's facebook account
        $scope.connectFacebook = function() {
            window.location.assign('/data/user/facebook/connect');
        };
    }
]);
