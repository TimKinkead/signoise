'use strict';

angular.module('app').controller('UserController', [
    '$scope',
    '$http',
    '$resource',
    '$state',
    'CurrentUser',
    function($scope, $http, $resource, $state, CurrentUser) {
        var user = $scope.user = {},
            status = $scope.status = {};

        function errorMessage(data) {
            if (data && data.message) {status.message = data.message;}
            status.processing = false;
        }

        function successMessage(message) {
            status.successMessage = message;
            setTimeout(function() {status.successMessage = null;}, 1000);
        }

        // -- AUTHENTICATION --

        /*function errorLoggingIn(data) {
            if (data && data.message) {status.message = data.message;}
            status.processing = false;
        }*/

        function loggedIn(data) {
            if (data && data._id) {
                CurrentUser.data = angular.extend(CurrentUser.data, data);
                $state.go('dashboard');
            } else {
                errorMessage({message: 'We had trouble logging you in. Please try again.'});
            }
        }

        // sign up a new user
        $scope.signUp = function() {
            if (!user.email || !user.password) {
                status.message = '*Email and password are required!';
                return;
            }
            status.processing = true;
            $http
                .post('/data/user/sign-up', user)
                .success(loggedIn)
                .error(errorMessage);
        };

        // login an existing user
        $scope.login = function() {
            if (!user.email || !user.password) {
                status.message = '*Email and password are required!';
                return;
            }
            status.processing = true;
            $http
                .post('/data/user/sign-in', user)
                .success(loggedIn)
                .error(errorMessage);
        };

        // -- SETTINGS --

        var current;
        if ($state.is('user.settings')) {
            user = $scope.user = $resource('data/user/settings').get(
                function() {current = angular.copy(user);}, // success
                errorMessage // error
            );
        }

        // display edit mode
        var showEdit = $scope.showEdit = function (field, cancel) {
            $scope['edit' + field] = cancel ? false : true;
        };

        // update settings
        $scope.update = function(field) {

            function updated() {
                showEdit(field, true);
                if (field === 'Email') {
                    current.email = user.email;
                    CurrentUser.data.username = user.email.slice(0, user.email.indexOf('@'));
                    successMessage('Email address updated!');
                } else if (field === 'Password') {
                    successMessage('Password changed!');
                }
                status.processing = false;
            }

            var params = {};
            switch (field) {
                case 'Email':
                    if (!user.email || user.email === current.email) {
                        user.email = current.email;
                        showEdit('Email', true);
                        return;
                    }
                    params.email = user.email;
                    break;
                case 'Password':
                    if (!user.password && !user.newPassword) {
                        showEdit('Password', true);
                        return;
                    } else if (!user.password) {
                        status.message = 'Please provide your current password.';
                        return;
                    } else if (!user.newPassword) {
                        status.message = 'Please provide a new password.';
                        return;
                    }
                    params.password = user.password;
                    params.newPassword = user.newPassword;
            }

            status.processing = true;
            $http
                .put('/data/user/settings', params)
                .success(updated)
                .error(errorMessage);
        };

        // -- SOCIAL MEDIA --

        $scope.toggleTwitter = function() {
            status.processing = true;
            if (!user.twitter) {
                // connect twitter
                window.location.assign('/data/user/twitter/connect');
            } else {
                // disconnect twitter
                $http
                    .get('/data/user/twitter/disconnect')
                    .success(function() {
                        user.twitter = false;
                        status.processing = false;
                        successMessage('Twitter Disconnected!');
                    })
                    .error(errorMessage);
            }
        };

        $scope.toggleFacebook = function() {
            status.processing = true;
            if (!user.facebook) {
                // connect facebook
                window.location.assign('/data/user/facebook/connect');
            } else {
                // disconnect facebook
                $http
                    .get('/data/user/facebook/disconnect')
                    .success(function() {
                        user.facebook = false;
                        status.processing = false;
                        successMessage('Facebook Disconnected!');
                    })
                    .error(errorMessage);
            }
        };
    }
]);