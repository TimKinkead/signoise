// this starts the angular application

'use strict';

try {
    var app = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        'ngResource',
        'ngSanitize'
    ]);

    // ---------
    app.config([
        '$locationProvider',
        '$urlRouterProvider',
        function($locationProvider, $urlRouterProvider) {
            // to get rid of #!/ read:
            // https://docs.angularjs.org/error/$location/nobase
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: true
            });

            // setup: OTHERWISE (default path)
            $urlRouterProvider.otherwise('/');
        }
    ]);

    // IE 9 redirect
    if (window.ie9 && !window.location.hash &&
        window.location.pathname.length <= 1) {
        console.log('IE 9 requires # for client side routing.');
        window.location.assign('/#/' + window.location.search);
    }
} catch  (e) {
    window.location.assign('/unsupported');
}
