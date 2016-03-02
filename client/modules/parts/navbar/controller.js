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
            {state: 'socialmedia', name: 'Social Media'}
            //{state: 'seedlist', name: 'Seed List'},
            //{state: 'blacklist', name: 'Blacklist'},
            //{state: 'crawlstats', name: 'Crawl Stats'},
            //{state: 'links', name: 'Referenced Links'}
        ];

        var query = $scope.query = {};
        $scope.search = function () {
            if (query.term) {
                alert('You searched for: ' + query.term);
            }
        };

        $scope.logout = function (e) {
            if (e) {e.preventDefault();}

            window.location.assign('/data/user/sign-out');
        };
    }
]);