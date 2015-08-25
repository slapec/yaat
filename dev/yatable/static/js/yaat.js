angular.module('yaat', [])
.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
}])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    // Variable initialization -------------------------------------------------
    $scope.$limit = $scope.$limit || 25;
    $scope.$offset = $scope.$offset || null;
    $scope.$noDropdown = $scope.$noDropdown || false;
    $scope.$noControls = $scope.$noControls || false;
    $scope.$untouchedOffset = $scope.$offset;

    // Template URLs -----------------------------------------------------------
    $scope.$ctrlsTemplate = $scope.$ctrlsTemplate || 'yatable/ctrls.html';
    $scope.$rowTemplate = $scope.$rowTemplate || 'yatable/row.html';
    $scope.$pagingTemplate = $scope.$pagingTemplate || 'yatable/paging.html';

    // Not-so private variables ------------------------------------------------
    $scope.dropdownText = $scope.dropdownText || 'Columns';

    // Watchers ----------------------------------------------------------------
    $scope.$watch('$api', function(){
        $scope.init($scope.$api);
    });

    $scope.$watch('$limit', function(newValue, oldValue){
        if(newValue !== oldValue){
            $scope.init($scope.$api);
        }
    });

    // Events ------------------------------------------------------------------
    $scope.$on('yaat.http.extra', function(e, args){
        $scope.$httpExtra = args;
    });

    $scope.$on('yaat.init', function(e, api){
        if($scope.$api === api){
            $scope.init($scope.$api);
        }
        $scope.$api = api;
    });

    $scope.$on('yaat.update', function(){
        $scope.update();
    });

    // Scope methods -----------------------------------------------------------
    if($scope.init === undefined){
        $scope.init = function(url){
            if(url !== undefined) {
                var payload = self.initPayload();
                if($scope.$httpExtra !== undefined){
                    payload.extra = $scope.$httpExtra;
                }
                $http({
                    method: 'POST',
                    url: url,
                    data: payload
                }).success(function(data) {
                    $scope.$emit('yaat.http.success');
                    self.parse(data);
                }).error(function(data, status, headers, config){
                    $scope.$emit('yaat.http.error', data, status, headers, config);
                });
            }
        }
    }

    if($scope.update === undefined){
        $scope.update = function(sortable){
            if(sortable !== undefined){
                self.applyOrder(sortable);
            }

            var payload = self.getPayload();

            if($scope.$httpExtra !== undefined){
                payload.extra = $scope.$httpExtra;
            }

            $http({
                method: 'POST',
                url: $scope.$api,
                data: payload
            }).success(function(data){
                $scope.$emit('yaat.http.success');
                self.parse(data);
            }).error(function(data, status, headers, config){
                $scope.$emit('yaat.http.error', data, status, headers, config);
            });
        }
    }

    if($scope.loadPage === undefined){
        $scope.loadPage = function(offset){
            if(offset){
                $scope.$offset = offset;
                $scope.update();
            }
        }
    }

    if($scope.getKey === undefined){
        $scope.getKey = function(idx){
            return $scope.$visibleHeaders[idx].key;
        }
    }

    if($scope.getIndex === undefined){
        $scope.getIndex = function(key){
            return $scope.$visibleHeadersReverse[key];
        }
    }

    $scope.toggleSorting = function(header){
        header.order = (header.order + 1) % 3;
        $scope.update();
    };

    // Controller only ---------------------------------------------------------
    this.parse = function(data){
        var headers = [];
        var visibleHeaders = [];
        var visibleHeadersReverse = {};
        for(var i=0; i<data.columns.length; i++){
            var header = data.columns[i];
            headers.push(header);
            if(header.order === undefined){
                header.unorderable = true;
            }
            if(header.hidden === undefined){
                header.unhideable = true;
                visibleHeaders.push(header);
                visibleHeadersReverse[header.key] = i;
            }
            else if(header.hidden === false){
                visibleHeaders.push(header);
                visibleHeadersReverse[header.key] = i;
            }
        }
        $scope.$headers = headers;
        $scope.$visibleHeaders = visibleHeaders;
        $scope.$visibleHeadersReverse = visibleHeadersReverse;
        $scope.$rows = data.rows;
        $scope.$pages = data.pages;
        $scope.$offset = data.pages.list[data.pages.current].key;
    };

    this.applyOrder = function(sortable){
        var keys = $(sortable).find('li').map(function(){return this.id}).get();

        var headerOrder = [];
        for(var i=0; i<keys.length; i++){
            for(var j=0; j<$scope.$headers.length; j++){
                if(keys[i] === $scope.$headers[j].key){
                    headerOrder.push($scope.$headers.splice(j, 1)[0]);
                    break;
                }
            }
        }
        $scope.$headers = headerOrder;
    };

    this.initPayload = function(){
        return {
            offset: $scope.$untouchedOffset,
            limit: $scope.$limit
        }
    };

    this.getPayload = function(){
        var clean = [];
        var headers = $scope.$headers;
        for(var i=0; i<headers.length; i++){
            var header = headers[i];
            clean.push({
                order: header.order,
                hidden: header.hidden,
                key: header.key
            });
        }

        return {
            offset: $scope.$offset,
            limit: $scope.$limit,
            headers: clean
        }
    };

    // Ready to receive events -------------------------------------------------
    $scope.$emit('yaat.ready');
}])
.directive('yat', [function(){
    return {
        restrict: 'E',
        controller: 'YATableController',
        templateUrl: function(elem, attrs){
            return attrs.template !== undefined ? attrs.template : 'yatable/table.html';
        },
        scope: true,
        link: function(scope, element, attrs){
            // Attribute parsing only ------------------------------------------
            if(attrs.api !== undefined){
                scope.$api = attrs.api;
            }

            if(attrs.limit !== undefined){
                scope.$limit = scope.$eval(attrs.limit);
                scope.$watch(attrs.limit, function(newValue, oldValue){
                    if(newValue !== oldValue){
                        scope.$limit = newValue;
                    }
                });
            }

            if(attrs.offset !== undefined){
                scope.$offset = attrs.offset;
                scope.$untouchedOffset = attrs.offset;
            }

            if(attrs.dropdowntext !== undefined){
                scope.dropdownText = attrs.dropdowntext;
            }

            if(attrs.nodropdown !== undefined){
                scope.$noDropdown = true;
            }

            if(attrs.nocontrols !== undefined){
                scope.$noControls = true;
            }

            // Sortable setup --------------------------------------------------
            var updateHandler = function(){
                scope.update(this)
            };

            var options = scope.$sortableOptions;
            if(options !== undefined){
                if(!options.hasOwnProperty('update')){
                    options.update = updateHandler;
                }
            }
            else {
                var options = {
                    axis: 'y',
                    containment: 'parent',
                    tolerance: 'pointer',
                    update: updateHandler
                }
            }

            var disable = scope.$on('$includeContentLoaded', function(e, url){
                if(url === scope.$ctrlsTemplate || url === 'yatable/bootstrap_dropdown.html'){
                    disable();

                    var headerList = $(element).find('.ya-headers');
                    headerList.disableSelection();
                    headerList.sortable(options);

                    // To avoid the dropdown closing itself when clicking on a checkbox
                    $(document).on('click', '.dropdown-menu', function(e) {
                        e.stopPropagation();
                    });
                }
            });


        }
    }
}]);