'use strict';

angular.module('app').filter('capitalize', [
    function() {
        return function(str) {
            if (!str) { return ''; }
            if (typeof str !== 'string') { return str; }

            var newStr;
            
            switch (str) {

                case 'lepCount':
                case 'iepCount':
                case 'frlCount':
                    newStr = str.slice(0, str.indexOf('Count')).toUpperCase();
                    break;

                case 'studentCount':
                    newStr = 'Students';
                    break;

                case 'fetchCount':
                    newStr = 'Fetched';
                    break;

                default:
                    newStr = '';
                    var uppercase = true;
                    for (var i=0, x=str.length; i<x; i++) {
                        newStr += (uppercase) ? str[i].toUpperCase() : str[i];
                        uppercase = (str[i] === ' ');
                    }
                    return newStr;
            }
            
            return newStr;
        };
    }
]);