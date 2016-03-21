'use strict';

/**
 * Angular controller for downloading social media data.
 */
angular.module('app').controller('SocialMediaDownloadController', [
    '$scope',
    '$uibModalInstance',
    '$window',
    function ($scope, $modalInstance, $window) {
        
        // variables
        var params = $scope.params = {skip: 0, limit: 5000};
        
        // download social media data
        $scope.download = function() {
            $window.location.href = 
                'http://'+$window.location.host+'/data/socialmedia/download'+
                '?skip='+params.skip+
                '&limit='+params.limit;
        };

        // cancel & close download modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
]);