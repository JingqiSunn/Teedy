'use strict';

/**
 * Register controller.
 */
angular.module('docs').controller('Register', function($scope, $state, Restangular, $translate, $dialog) {
  $scope.user = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    storage_quota: 10000 // Default storage quota: 10GB
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
    // Check if passwords match
    if ($scope.user.password !== $scope.user.confirmPassword) {
      var title = $translate.instant('validation.password_not_match_title');
      var msg = $translate.instant('validation.password_not_match_message');
      var btns = [{result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary'}];
      $dialog.messageBox(title, msg, btns);
      return;
    }

    // Send registration request
    Restangular.one('user').post('register', {
      username: $scope.user.username,
      password: $scope.user.password,
      email: $scope.user.email
    }).then(function() {
      // Registration successful, redirect to login
      $state.go('login');
    }, function(response) {
      // Registration failed
      var title = $translate.instant('register.error_title');
      var msg = '';
      if (response.data && response.data.type) {
        msg = $translate.instant('register.' + response.data.type);
      } else {
        msg = $translate.instant('register.error_message');
      }
      var btns = [{result: 'ok', label: $translate.instant('ok'), cssClass: 'btn-primary'}];
      $dialog.messageBox(title, msg, btns);
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