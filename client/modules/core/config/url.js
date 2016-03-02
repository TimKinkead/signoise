'use strict';

angular.module('app').run([
    '$location',
    'ErrorModal',
    function ($location, modal) {
        var params = $location.search();

        if (params.header && params.message) {
            modal.open({
                header: params.header,
                message: params.message
            });
            $location.search({});
        }

        if ($location.hash() === '_=_') {
            $location.url($location.path());
        }
    }
]);