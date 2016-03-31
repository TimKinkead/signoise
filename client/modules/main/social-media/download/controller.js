'use strict';

/**
 * Angular controller for downloading social media data.
 */
angular.module('app').controller('SocialMediaDownloadController', [
    '$scope',
    '$uibModalInstance',
    '$resource',
    '$window',
    function ($scope, $modalInstance, $resource, $window) {
        
        // variables
        var status = $scope.status = {processing: false, errorMessage: null},
            params = $scope.params = {
                skip: 0, limit: 5000,
                minDate: (function() { var d = new Date(); d.setMonth(d.getMonth()-1); return d; })(),
                maxDate: new Date()},

            tabs = $scope.tabs = [
                {name: 'districts.by.state', display: 'Districts by State'}, 
                {name: 'skip.limit', display: 'Skip/Limit'}
            ],
            activeTab = $scope.activeTab = null,
            activeTabIndex = $scope.activeTabIndex = null,
            
            states = $scope.states = null;
        
        function getStates() {
            states = $scope.states = $resource('data/state/list').query(
                {},
                function() { // success
                    status.processing = false;
                },
                function(err) { // error
                    status.processing = false;
                    status.errorMessages.push('Error! We had trouble listing the states. Please try switching tabs.');
                }
            );   
        }

        function switchTab(tabIndex) {
            activeTabIndex = tabIndex;
            activeTab = $scope.activeTab = tabs[activeTabIndex];
            switch(activeTab.name) {
                case 'districts.by.state':
                    if (!states || !states.length) {
                        status.processing = true;
                        status.errorMessage = null;
                        getStates();
                    }
                    break;
                case 'skip.limit':
                    status.processing = false;
                    status.errorMessage = null;
                    break;
            }
        }
        
        // default tab
        switchTab(0); // default to first tab
        
        // watch for changing tabs
        $scope.$watch('activeTabIndex', function (nV, oV) {
            if (nV !== oV) { switchTab(nV); }
        });
        
        // download social media data
        $scope.download = function() {
            var url = 'http://'+$window.location.host+'/data/socialmedia/download',
                parameters = [];
            switch (activeTab.name) {
                case 'districts.by.state':
                    url += '?type=districts-by-state';
                    parameters = ['state', 'minDate', 'maxDate'];
                    break;
                case 'skip.limit':
                    url += '?type=skip-limit';
                    parameters = ['minDate', 'maxDate', 'skip', 'limit'];
                    break;
                default:
                    console.log('download type not supported');
                    return;
            }
            parameters.forEach(function(cV) {
                if (params[cV]) {
                    url += '&'+cV+'='+params[cV];
                } 
            });
            console.log(url);
            $window.location.href = url;
        };

        // cancel & close download modal
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
]);