'use strict';

angular.module('app').controller('NavbarController', [
    '$scope',
    'CurrentUser',
    function ($scope, CurrentUser) {

        $scope.user = CurrentUser.data;

        $scope.toggleNavbar = function() {
            angular.element(document.getElementById('navbar-collapse')).toggleClass('in');
        };

        $scope.tables = [
            {state: 'socialseeds', name: 'Social Seeds'},
            {state: 'socialmedia', name: 'Social Media'},
            {state: 'websites', name: 'Web Sites'},
            {state: 'webpages', name: 'Web Pages'}
        ];

        $scope.logout = function (e) {
            if (e) {e.preventDefault();}

            window.location.assign('/data/user/sign-out');
        };

    }
]);