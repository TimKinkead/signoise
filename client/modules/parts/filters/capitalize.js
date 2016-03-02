'use strict';

angular.module('app').filter('capitalize', [
    function() {
        return function(str) {
            str = str || '';
            switch(str.length) {
                case 0: return str;
                case 1: return str.toUpperCase();
                default: return str[0].toUpperCase()+str.slice(1);
            }
        };
    }
]);