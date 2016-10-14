'use strict';

angular.module('app').controller('WebNetworkController', [
    '$scope',
    '$resource',
    'VisDataSet',
    function($scope, $resource, VisDataSet) {

        var status = $scope.status = {},
            params = $scope.params = {channel: 'all'},
            networkChannels = $scope.networkChannels = ['all', 'core', 'coupled'],

            data = $scope.data = {},
            
            options = $scope.options = {
                autoResize: true,
                height: '100%',
                width: '100%',


                // 4.7 options
                //configure: {enabled: true},
                physics: {
                    //enabled: false,
                    repulsion: {
                        nodeDistance: 275,
                        damping: 0.15
                    },
                    solver: 'repulsion'
                },
                edges: {
                    color:{inherit:true},
                    width: 0.15,
                    smooth: { type: 'continuous' },
                    arrows: { to: { enabled: true } }
                },
                nodes: {
                    shape: 'dot',
                    size: 18,
                    // scaling: {min: 10, max: 30},
                    font: {
                        size: 12,
                        face: 'Tahoma',
                        color: 'white'
                    }
                }
            },

            events = $scope.events = {
                stabilizationIterationsDone: function() {
                    status.processing = false;
                    status.successMessage = null;
                    $scope.$digest();
                }
            };
        
        // load network graph
        function reloadNetwork() {
            status.processing = true;
            status.successMessage = 'Retrieving Network Data ...';
            status.errorMessage = null;
            data = $scope.data = $resource('data/webnetwork').get(
                params,
                function() { // success
                    setTimeout(
                        function() {
                            if (status.processing) {
                                status.successMessage = '... Network Data Retrieved ...';
                                $scope.$digest();
                                setTimeout(
                                    function() {
                                        if (status.processing) {
                                            status.successMessage = '... Loading Network Graph ...';
                                            $scope.$digest();
                                        }
                                    },
                                    3000
                                );
                            }
                        },
                        2000
                    );
                },
                function(err) { // error
                    status.processing = false;
                    status.errorMessage = 'Error! We had trouble retrieving the web network data. '+
                        'Please try selecting a different channel or refreshing the page.';
                }
            );
        }

        reloadNetwork(); // initial load

        // switch between channels
        $scope.$watch('params.channel', function(nV, oV) {
            if (nV !== oV) { reloadNetwork(); }
        });

        // close messages
        $scope.closeSuccessMessage = function() {
            status.successMessage = null;
        };
        $scope.closeErrorMessage = function() {
            status.errorMessage = null;
        };

    }
]);