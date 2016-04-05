'use strict';

/**
 * Angular controller for editing a district.
 */
angular.module('app').controller('DistrictsEditController', [
    '$scope',
    '$uibModalInstance',
    'info',
    '$http',
    '$resource',
    function ($scope, $modalInstance, info, $http, $resource) {

        // append info to scope
        $scope = angular.extend($scope, info);

        // variables
        var status = $scope.status = {processing: false, errorMessage: null},
            display = $scope.display = {},
            params = $scope.params = {};

        $scope.fields = [
            '_id', 'name', 'cdsId', 'ncesId', 'website', 'facebook', 'twitter', 
            'street', 'city', 'state', 'zip', 'county', 'latitude', 'longitude',
            'studentCount', 'lepCount', 'iepCount', 'frlCount', 'fetchCount',
            'modified', 'created'
        ];
        $scope.dates = ['modified', 'created'];

        // full district doc
        status.processing = true;
        var fullDistrict = $scope.fullDistrict = $resource('data/district').get(
            {_id: info.district._id},
            function() { // success
                status.processing = false;
            },
            function(err) { // error
                status.processing = false;
                status.errorMessage = 'Error! We had trouble getting the district. Please try again';
            }
        );

        // cancel & close edit modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        
        // -- FACEBOOK --
        
        // edit facebook account
        $scope.editFacebook = function() {
            if (fullDistrict.facebookSeed) {
                params.facebookQuery = fullDistrict.facebookSeed.facebook.name;
            } else if (fullDistrict.facebookAccount) {
                var fQ = fullDistrict.facebookAccount,
                    regex1 = /\-/, // replace with spaces
                    regex2 = /[^A-Z\s]{1}[A-Z]{1}[a-z]+/, // add spaces
                    regex3 = /\?[^\s]*$/; // remove
                while(fQ.search(regex1) > -1) {
                    fQ = fQ.replace(regex1, ' ');
                }
                while(fQ.search(regex2) > -1) {
                    fQ = fQ.slice(0, fQ.search(regex2)+1)+' '+fQ.slice(fQ.search(regex2)+1);
                }
                while(fQ.search(regex3) > -1) {
                    fQ = fQ.replace(regex3, '');
                }
                params.facebookQuery = fQ;
            }
            display.editFacebook = true;
        };
        
        // cancel edit facebook account
        var cancelEditFacebook = $scope.cancelEditFacebook = function() {
            status.processing = false;
            status.errorMessage = null;
            params.facebookQuery = null;
            params.facebookItem = null;
            display.editFacebook = false;
            display.facebookResults = false;
            display.facebookItem = false;
        };
        
        // search facebook for groups and pages
        $scope.searchFacebook = function() {
            status.processing = true;
            status.errorMessage = null;
            display.facebookResults = true;
            $scope.facebookResults = $resource('data/socialseed/facebook/search').get(
                {query: params.facebookQuery},
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
        $scope.selectFacebook = function(fbItem, fbItemType) {
            status.processing = true;
            // create seed (or get existing)
            var seed = {
                platform: 'facebook', 
                facebook: {
                    id: fbItem.id, 
                    name: fbItem.name, 
                    type: (fbItemType) ? fbItemType.slice(0, -1) : null,
                    category: (fbItem.category) ? fbItem.category : 'Group'},
                frequency: 'daily'
            };
            $http.post('data/socialseed', seed)
                .success(function(data) {
                    fullDistrict.facebookSeed = data._id;
                    save();
                })
                .error(function(err) {
                    status.processing = false;
                    status.errorMessage = 'Error! Please try again.\n'+err;
                });
        };
        
        // -- SAVE --
        
        // save changes to district
        var save = $scope.save = function() {
            if (status.errorMessage) { delete status.errorMessage; }
            status.processing = true;
            $http.put('data/district', fullDistrict)
                .success(function() {   
                    $modalInstance.close({update: fullDistrict});
                })
                .error(function(err) {
                    status.processing = false;
                    status.errorMessage = 'Error! We had trouble updating the district. Please try again';
                });
        };

        // delete district
        $scope.delete = function(confirm) {
            if (status.errorMessage) { delete status.errorMessage; }
            if (!confirm) { // show confirm delete
                $scope.confirmDelete = !$scope.confirmDelete;
                return;
            }
            status.processing = true;
            $http.delete('data/district', {data: {_id: info.district._id}})
                .success(function() {
                    $modalInstance.close({delete: true});
                })
                .error(function(err) {
                    status.processing = false;
                    $scope.confirmDelete = false;
                    status.errorMessage = 'Error! We had trouble deleting the district. Please try again';
                });
        };

        // return uri encoded query string for view on twitter link
        $scope.getQuery = function(query) {
            return encodeURIComponent(query);
        };
    }
]);