'use strict';

angular.module('app').service('ErrorModal', [
    '$uibModal',
    function ($modal) {
        var open = function (rejection, close) {
            if (!angular.isObject(rejection)) {
                close(); return;
            }

            rejection = rejection.data ? rejection.data : rejection;

            // make sure there's a header & message
            if (!rejection.header || !rejection.header.length ||
                !rejection.message || !rejection.message.length) {
                close(); return;
            }

            // -----
            var modalInstance = $modal.open({
                templateUrl: 'modules/parts/error-modal/view.html',
                controller: [
                    '$scope', '$uibModalInstance', 'info', '$http',
                    function ($scope, $modalInstance, info, $http) {
                        $scope.rejection = info.rejection;

                        $scope.retry = function () {
                            $http(info.rejection.data.retry);
                            $modalInstance.close();
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        // for 'backspace' to work as standard 'back' navigation
                        $scope.$on('$stateChangeStart', $scope.cancel);
                    }
                ],
                resolve: {
                    info: function () {
                        return {rejection: rejection};
                    }
                }
            });

            if (angular.isFunction(close)) {
                modalInstance.result.then(close, close);
            }
        };

        return { open: open };
    }
]);

