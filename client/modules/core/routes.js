'use strict';

angular.module('app').config([
    '$stateProvider',
    function($stateProvider) {

        $stateProvider.state('home', {
            url: '/',
            templateUrl: 'modules/main/home/view.html',
            controller: 'HomeController'
        });

        $stateProvider.state('dashboard', {
            url: '/dashboard',
            templateUrl: 'modules/main/dashboard/view.html',
            controller: 'DashboardController'
        });

        /*$stateProvider.state('settings', {
            url: '/settings',
            templateUrl: 'modules/main/settings/view.html',
            controller: 'SettingsController'
        });*/

        // -- User States --

        $stateProvider.state('user', {
            template: '<div ui-view></div>',
            controller: 'UserController',
            abstract: true
        });

        $stateProvider.state('user.signup', {
            url: '/sign-up',
            templateUrl: 'modules/main/user/views/sign-up.html',
            data: {guestOnly: true}
        });

        $stateProvider.state('user.login', {
            url: '/login',
            templateUrl: 'modules/main/user/views/login.html',
            data: {guestOnly: true}
        });

        $stateProvider.state('user.settings', {
            url: '/settings',
            templateUrl: 'modules/main/user/views/settings.html',
            data: {memberOnly: true}
        });

        // -- Social Media States --

        $stateProvider.state('socialseeds', {
            url: '/social-seeds',
            templateUrl: 'modules/main/social-seeds/view.html',
            controller: 'SocialSeedsController'
        });

        $stateProvider.state('socialmedia', {
            url: '/social-media',
            templateUrl: 'modules/main/social-media/view.html',
            controller: 'SocialMediaController'
        });



        /*
         {state: 'seedlist', name: 'Seed List'},
         {state: 'blacklist', name: 'Blacklist'},
         {state: 'crawlstats', name: 'Crawl Stats'},
         {state: 'links', name: 'Referenced Links'}
         */
    }
]);
