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

$scope.translateToChinese = function () {
  var fileId = $stateParams.fileId;

  // 第1步：获取文件内容
  $http.get('../api/file/' + fileId + '/data?size=content')
    .then(function (response) {
      var originalContent = response.data;
      if (!originalContent) {
        $scope.translationError = '没有内容可以翻译！';
        return;
      }

      // 第2步：准备数据调用后端翻译API
      var data = new URLSearchParams();
      data.append('text', originalContent);
      data.append('targetLang', 'ZH');

      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // 确保响应被当作JSON处理
        transformResponse: function (data, headers) {
          try {
            // 如果响应是字符串，尝试手动解析它
            if (typeof data === 'string' && data.trim()) {
              return JSON.parse(data);
            }
            return data;
          } catch (e) {
            console.error('解析响应为JSON失败：', data);
            throw new Error('无效的JSON响应');
          }
        }
      };

      // 第3步：调用后端翻译API
      return $http.post('../api/translate/text', data.toString(), config);
    })
    .then(function (response) {
      var data = response.data;
      if (data) {
        // 处理两种可能的响应格式
        if (data.translatedText) {
          $scope.translatedContent = data.translatedText;  // 更新翻译后的内容
        } else if (data.translations && data.translations[0] && data.translations[0].text) {
          $scope.translatedContent = data.translations[0].text;  // 更新翻译后的内容
        } else {
          $scope.translationError = '没有返回翻译结果。';
          return;
        }

        // 第4步：将翻译后的内容保存为新文件
        var newFileData = {
          content: $scope.translatedContent,
          originalFileId: fileId,  // 关联原始文件ID
          originalFileName: $scope.file.name + '_translated',  // 设置新文件名称
          mimetype: $scope.file.mimetype,
          // 其他必要的文件信息，可以根据实际情况传递
        };

        // 将翻译后的文件保存
        Restangular.all('file').post(newFileData).then(function (newFile) {
          // 在保存新文件后，直接跳转到新文件的查看页面
          $state.go('^.file', { id: $stateParams.id, fileId: newFile.id });
        }, function (error) {
          console.error('保存翻译文件失败：', error);
          $scope.translationError = '保存翻译文件失败';
        });

        $scope.translationError = null; // 清除之前的错误
      } else {
        $scope.translationError = '没有返回翻译结果。';
      }
    })
    .catch(function (error) {
      console.error('翻译失败：', error);
      console.error('错误详情：', error.data || error.message);
      // 处理 $http:baddata 或其他错误
      var errorMessage = error.message || '未知错误';
      if (error.data && error.data.error) {
        errorMessage = error.data.error;
      } else if (error.statusText) {
        errorMessage = error.statusText;
      }
      $scope.translationError = '翻译失败：' + errorMessage;
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
