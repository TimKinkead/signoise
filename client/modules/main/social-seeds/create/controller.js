'use strict';

/**
 * Angular controller for creating a new social seed.
 */
angular.module('app').controller('SocialSeedsCreateController', [
    '$scope',
    '$uibModalInstance',
    '$http',
    '$resource',
    function ($scope, $modalInstance, $http, $resource) {

        // variables
        var status = $scope.status = {step: 1},
            platforms = $scope.platforms = ['facebook', 'instagram', 'twitter'],
            seed = $scope.seed = {platform: 'facebook', frequency: 'daily'},

            facebookResultTypes = $scope.facebookResultTypes = ['groups', 'pages'];

        // cancel & close create modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        // save new social seed
        var save = $scope.save = function(clbk) {
            status.processing = true;
            $http.post('data/socialseed', seed)
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
        $scope.activePlatform = platforms.indexOf(seed.platform);
        $scope.$watch('activePlatform', function (nV, oV) {
            if (nV !== oV) {
                seed.platform = platforms[nV];
                switch(seed.platform) {
                    case 'facebook':
                        seed.facebook = {};
                        if (seed.twitter) {delete seed.twitter;}
                        break;
                    case 'twitter':
                        seed.twitter = {};
                        if (seed.facebook) {delete seed.facebook;}
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
            $scope.facebookResults = $resource('data/socialseed/facebook/search').get(
                {query: seed.facebook.query},
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
            seed.facebook.id = fbItem.id;
            seed.facebook.name = fbItem.name;
            seed.facebook.type = activeFacebookResultType.slice(0, -1); // groups/pages -> group/page
            seed.facebook.category = (fbItem.category) ? fbItem.category : 'Group';
        };
        
        // go back to facebook search results
        var step1Facebook = $scope.step1Facebook = function() {
            status.step = 1;
            delete seed.facebook.id;
            delete seed.facebook.name;
            delete seed.facebook.category;
        };
        
        // save seed and go back to facebook search results
        $scope.saveAndStep1Facebook = function() {
            save(function() { step1Facebook(); });
        };  

    }
]);