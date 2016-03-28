'use strict';

/**
 * Angular controller for creating a new district.
 */
angular.module('app').controller('DistrictsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    '$resource',
    function ($scope, $modalInstance, $http, $resource) {

        // variables
        var status = $scope.status = {step: 1},
            platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            district = $scope.district = {platform: 'facebook', frequency: 'daily'},

            facebookResultTypes = $scope.facebookResultTypes = ['groups', 'pages'];

        // cancel & close create modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save new district
        var save = $scope.save = function(clbk) {
            status.processing = true;
            $http.post('data/district', district)
                .success(function(data) {
                    status.processing = false;
                    if (clbk) { return clbk(); }
                    $modalInstance.close(data);
                })
                .error(function(err) {
                    status.errorMessage = 'Error! Please try again.\n'+err;
                });
        };

        // switch tabs in create form
        $scope.activePlatform = platforms.indexOf(district.platform);
        $scope.$watch('activePlatform', function (nV, oV) {
            if (nV !== oV) {
                district.platform = platforms[nV];
                switch(district.platform) {
                    case 'facebook':
                        district.facebook = {};
                        if (district.twitter) {delete district.twitter;}
                        break;
                    case 'twitter':
                        district.twitter = {};
                        if (district.facebook) {delete district.facebook;}
                }
            }
        });

        // -- FACEBOOK --

        // switch result type tabs
        var activeFacebookResultType = $scope.activeFacebookResultType = facebookResultTypes.indexOf('groups');
        $scope.getActiveFacebookResultType = function() {
            console.log('get', activeFacebookResultType);
            return activeFacebookResultType;
        };
        $scope.setActiveFacebookResultType = function(resultType) {
            console.log('set', resultType);
            activeFacebookResultType = facebookResultTypes.indexOf(resultType);
        };

        // search facebook for groups and pages
        $scope.searchFacebook = function() {
            status.processing = true;
            status.errorMessage = null;
            $scope.facebookResults = $resource('data/district/facebook/search').get(
                {query: district.facebook.query},
                function() { 
                    status.processing = false;
                },
                function(err) { 
                    status.processing = false;
                    status.errorMessage = 'Error! Please try again.\n'+err;
                }
            );
        };

        // select a facebook group or page
        $scope.selectFacebook = function(fbItem) {
            $scope.facebookFields = ['id', 'name', 'category'];
            status.step = 2;
            district.facebook.id = fbItem.id;
            district.facebook.name = fbItem.name;
            district.facebook.category = (fbItem.category) ? fbItem.category : 'Group';
        };
        
        // go back to facebook search results
        var step1Facebook = $scope.step1Facebook = function() {
            status.step = 1;
            delete district.facebook.id;
            delete district.facebook.name;
            delete district.facebook.category;
        };
        
        // save district and go back to facebook search results
        $scope.saveAndStep1Facebook = function() {
            save(function() { step1Facebook(); });
        };  

    }
]);