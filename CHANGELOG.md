# Change log
## [1.0.6] - 2016-10-20
-   `yaat.min.js` was missing for some reason

## [1.0.5] - 2016-01-06
### Changed
-   jQuery-UI is not required when `nodropdown` is set to true.
-   `yatable/paging.html` skips rendering `null` values.

## [1.0.4] - 2015-10-20
### Added
-   A new key (`"flags"`) is sent by yaat in every `POST` (along with `"offset"`, `"limit"` and `"headers"`). This flag
    is useful for the backend to detect which client-side event requested the table data.
    
## [1.0.3] - 2015-10-08
### Added
-   Yaat can store custom values from `POST` replies. Internal yaat keys are skipped (`"columns"`, `"rows"` and 
    `"pages"`), others are stored in `$scope.$customData` object.
    
## [1.0.2] - 2015-09-15
### Added
-   Yaat is listening `yaat.reload` event. This simply invokes `$scope.$init()` and passes `$scope.$api` as an argument.
