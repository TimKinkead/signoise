'use strict';

angular.module('app').config([
    '$stateProvider',
    function($stateProvider) {

        // -- Home Page --

        $stateProvider.state('home', {
            url: '/',
            templateUrl: 'modules/main/home/view.html',
            controller: 'HomeController'
        });

        // -- Dashboard --

        $stateProvider.state('dashboard', {
            url: '/dashboard',
            templateUrl: 'modules/main/dashboard/view.html',
            controller: 'DashboardController',
            data: {memberOnly: true}
        });

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
            controller: 'SocialSeedsController',
            data: {memberOnly: true}
        });

        $stateProvider.state('socialmedia', {
            url: '/social-media',
            templateUrl: 'modules/main/social-media/view.html',
            controller: 'SocialMediaController',
            data: {memberOnly: true}
        });

        // -- Web States --

        $stateProvider.state('webpages', {
            url: '/web-pages',
            templateUrl: 'modules/main/web-pages/view.html',
            controller: 'WebPagesController',
            data: {memberOnly: true}
        });

        $stateProvider.state('websites', {
            url: '/web-sites',
            templateUrl: 'modules/main/web-sites/view.html',
            controller: 'WebSitesController',
            data: {memberOnly: true}
        });

    }
]);
