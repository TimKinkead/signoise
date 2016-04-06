'use strict';

angular.module('app').filter('percentage', [
    function() {
        return function(num) {
            if (!num) { return ''; }
            num = Number(num);
            return Math.round(num*100)+'%';
        };
    }
]);