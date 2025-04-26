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
    storage_quota: 1000000000, 
    notChecked: true
  };

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate form
   */
  function validateForm() {
    // Check required fields
    if (!$scope.user.username || !$scope.user.email || !$scope.user.password || !$scope.user.confirmPassword) {
      console.log('Required fields missing');
      return false;
    }

    // Check email format
    if (!isValidEmail($scope.user.email)) {
      console.log('Invalid email format');
      return false;
    }

    // Check password match
    if ($scope.user.password !== $scope.user.confirmPassword) {
      console.log('Passwords do not match');
      return false;
    }

    return true;
  }

  /**
   * Register.
   */
  $scope.register = function() {
    // Validate form first
    console.log('Validating form');
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    console.log($scope.user);

    console.log('Form validation passed, attempting to register');

    // Create the user
    Restangular.one('user').put({
      username: $scope.user.username,
      email: $scope.user.email,
      password: $scope.user.password,
      storage_quota: $scope.user.storage_quota,
      notChecked: $scope.user.notChecked
    }).then(function() {
      console.log('Registration successful');
      // Registration successful, redirect to login
      //$state.go('login');
    }, function(response) {
      console.log('Registration failed:', response.data.type);
      if (response.data.type === 'AlreadyExistingUsername') {
        $scope.registerForm.username.$setValidity('alreadyExisting', false);
      } else if (response.data.type === 'AlreadyExistingEmail') {
        $scope.registerForm.email.$setValidity('alreadyExisting', false);
      }
    });
  };

  // Reset validity when user changes input
  $scope.$watch('user.username', function() {
    if ($scope.registerForm && $scope.registerForm.username) {
      $scope.registerForm.username.$setValidity('alreadyExisting', true);
    }
  });
  
  $scope.$watch('user.email', function() {
    if ($scope.registerForm && $scope.registerForm.email) {
      $scope.registerForm.email.$setValidity('format', true);
      $scope.registerForm.email.$setValidity('alreadyExisting', true);
    }
  });

  $scope.$watch('user.confirmPassword', function() {
    if ($scope.registerForm && $scope.registerForm.confirmPassword && 
        $scope.user.password === $scope.user.confirmPassword) {
      $scope.registerForm.confirmPassword.$setValidity('match', true);
    }
  });

  $scope.$watch('user.password', function() {
    if ($scope.registerForm && $scope.registerForm.confirmPassword && 
        $scope.user.password === $scope.user.confirmPassword) {
      $scope.registerForm.confirmPassword.$setValidity('match', true);
    }
  });
}); 
