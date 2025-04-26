'use strict';

/**
 * Register controller.
 */
angular.module('docs').controller('Register', function($scope, $state, Restangular) {
  $scope.user = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    storage_quota: 10000 // Default storage quota: 10GB
  };

  /**
   * Register.
   */
  $scope.register = function() {
    // Basic validation
    if ($scope.user.password !== $scope.user.confirmPassword) {
      return;
    }

    // Create the user
    Restangular.one('user').put({
      username: $scope.user.username,
      email: $scope.user.email,
      password: $scope.user.password,
      storage_quota: $scope.user.storage_quota
    }).then(function() {
      // Registration successful, redirect to login
      $state.go('login');
    }, function(response) {
      if (response.data.type === 'AlreadyExistingUsername') {
        $scope.registerForm.username.$setValidity('alreadyExisting', false);
      } else if (response.data.type === 'AlreadyExistingEmail') {
        $scope.registerForm.email.$setValidity('alreadyExisting', false);
      }
    });
  };

  // Reset validity when user changes input
  $scope.$watch('user.username', function() {
    $scope.registerForm.username.$setValidity('alreadyExisting', true);
  });
  
  $scope.$watch('user.email', function() {
    $scope.registerForm.email.$setValidity('alreadyExisting', true);
  });
}); 