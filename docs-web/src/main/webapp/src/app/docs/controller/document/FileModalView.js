'use strict';

/**
 * File modal view controller.
 */
angular.module('docs').controller('FileModalView', function ($uibModalInstance, $scope, $state, $stateParams, $sce, Restangular, $transitions, $http, $timeout) {

  // 1. **Load the files** - Load files and try to set the current file
  var loadFiles = function () {
    Restangular.one('file/list').get({ id: $stateParams.id }).then(function (data) {
      if (data.files && Array.isArray(data.files)) {
        $scope.files = data.files;
        setFile(data.files);

        // If no file found, check versions
        if (!$scope.file) {
          loadFileVersions();
        }
      } else {
        console.error('Error: files data is not an array or is undefined');
      }
    }, function (error) {
      console.error('Error loading files:', error);
    });
  };

  // 2. **Load file versions** - If the file is not found, try to load its versions
  var loadFileVersions = function () {
    Restangular.one('file/' + $stateParams.fileId + '/versions').get().then(function (data) {
      if (data.files && Array.isArray(data.files)) {
        setFile(data.files);
      } else {
        console.error('Error: file versions data is not an array or is undefined');
      }
    }, function (error) {
      console.error('Error loading file versions:', error);
    });
  };

  // 3. **Set the current file** - Search for the file in the provided list and set it
  var setFile = function (files) {
    var file = _.find(files, { id: $stateParams.fileId });
    if (file) {
      $scope.file = file;
      $scope.trustedFileUrl = $sce.trustAsResourceUrl('../api/file/' + $stateParams.fileId + '/data');
      $scope.originalContent = file.content;  // Store the original content
    }
  };

  // 4. **Watch for fileId change** - Reload the file if the fileId in the URL changes
  $scope.$watch(function () {
    return $stateParams.fileId;
  }, function (newFileId, oldFileId) {
    if (newFileId !== oldFileId) {
      setFile($scope.files || []);
    }
  });

  // 5. **Translate to Chinese** - Call the backend API to translate file content to Chinese
  $scope.translateToChinese = function () {
    var fileId = $stateParams.fileId;

    // Step 1: Get the file content
    $http.get('../api/file/' + fileId + '/data?size=content')
      .then(function (response) {
        var originalContent = response.data;
        if (!originalContent) {
          $scope.translationError = 'No content to translate!';
          return;
        }

        // Step 2: Prepare data for backend translation API
        var data = new URLSearchParams();
        data.append('text', originalContent);
        data.append('targetLang', 'ZH');

        var config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          // Ensure response is treated as JSON
          transformResponse: function (data, headers) {
            try {
              // Manually parse response if it's a string
              if (typeof data === 'string' && data.trim()) {
                return JSON.parse(data);
              }
              return data;
            } catch (e) {
              console.error('Failed to parse response as JSON:', data);
              throw new Error('Invalid JSON response');
            }
          }
        };

        // Step 3: Call backend translation API
        return $http.post('../api/translate/text', data.toString(), config);
      })
      .then(function (response) {
        var data = response.data;
        if (data) {
          // Handle both possible response formats
          if (data.translatedText) {
            $scope.file.content = data.translatedText;
          } else if (data.translations && data.translations[0] && data.translations[0].text) {
            $scope.file.content = data.translations[0].text;
          } else {
            $scope.translationError = 'No translation result returned.';
            return;
          }
          $scope.translationError = null; // Clear any previous error
        } else {
          $scope.translationError = 'No translation result returned.';
        }
      })
      .catch(function (error) {
        console.error('Translation failed:', error);
        console.error('Error details:', error.data || error.message);
        // Handle $http:baddata or other errors
        var errorMessage = error.message || 'Unknown error';
        if (error.data && error.data.error) {
          errorMessage = error.data.error;
        } else if (error.statusText) {
          errorMessage = error.statusText;
        }
        $scope.translationError = 'Translation failed: ' + errorMessage;
      });
  };

  // 6. **Navigate to the next file** - Get the next file in the list
  $scope.nextFile = function () {
    return getFileByOffset(1);
  };

  // 7. **Navigate to the previous file** - Get the previous file in the list
  $scope.previousFile = function () {
    return getFileByOffset(-1);
  };

  // 8. **Get file by offset** - Get the file at the given offset from the current file
  var getFileByOffset = function (offset) {
    if ($scope.files && Array.isArray($scope.files)) {
      var currentIndex = _.findIndex($scope.files, { id: $stateParams.fileId });
      if (currentIndex >= 0 && currentIndex + offset >= 0 && currentIndex + offset < $scope.files.length) {
        return $scope.files[currentIndex + offset];
      }
    }
    return null;  // Return null if files are undefined or the index is out of bounds
  };

  // 9. **Navigate to the next or previous file** - Transition to the next or previous file view
  var navigateToFile = function (file) {
    if (file) {
      $state.go('^.file', { id: $stateParams.id, fileId: file.id });
    }
  };

  $scope.goNextFile = function () {
    var nextFile = $scope.nextFile();
    navigateToFile(nextFile);
  };

  $scope.goPreviousFile = function () {
    var previousFile = $scope.previousFile();
    navigateToFile(previousFile);
  };

  // 10. **Open the file in a new window** - Open the file's raw data in a new window
  $scope.openFile = function () {
    window.open('../api/file/' + $stateParams.fileId + '/data');
  };

  // 11. **Open the file content in a new window** - Open the content of the file in a new window
  $scope.openFileContent = function () {
    window.open('../api/file/' + $stateParams.fileId + '/data?size=content');
  };

  // 12. **Print the file** - Open the file in a new window and print it
  $scope.printFile = function () {
    var popup = window.open('../api/file/' + $stateParams.fileId + '/data', '_blank');
    popup.onload = function () {
      popup.print();
      popup.close();
    };
  };

  // 13. **Close the file preview** - Close the modal dialog
  $scope.closeFile = function () {
    $uibModalInstance.dismiss();
  };

  // 14. **Handle transitions** - Close modal when the state changes
  var off = $transitions.onStart({}, function(transition) {
    if (!$uibModalInstance.closed) {
      if (transition.to().name === $state.current.name) {
        $uibModalInstance.close();
      } else {
        $uibModalInstance.dismiss();
      }
    }
    off();
  });

  // 15. **Check if preview can be displayed** - Return true if the file is not a PDF
  $scope.canDisplayPreview = function () {
    return $scope.file && $scope.file.mimetype !== 'application/pdf';
  };

  // **Initial file loading**
  loadFiles();
});
