'use strict';

angular.module('app').run([
    '$rootScope',
    '$state',
    'CurrentUser',
    function($rootScope, $state, CurrentUser) {

        function isLoggedIn() {
            return Boolean(CurrentUser.data && CurrentUser.data._id);
        }

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (toState.data && toState.data.guestOnly && isLoggedIn()) {
                event.preventDefault();
                $state.go('dashboard');
            } else if (toState.data && toState.data.memberOnly && !isLoggedIn()) {
                event.preventDefault();
                $state.go('home');
            }
        });
    }
]);