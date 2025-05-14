pipeline {
    agent any
    tools {
        maven 'M3'
    }
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub_credentials')
        DOCKER_IMAGE = 'jingqisun2005/teedy'
        DOCKER_TAG = "lab"
    }
    stages {
        stage('Build') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/master']],
                    extensions: [],
                    userRemoteConfigs: [[url: 'https://github.com/xx/Teedy.git']]
                )
                sh 'mvn -B -DskipTests clean package'
            }
        }
        stage('Building image') {
            steps {
                script {
                    docker.build("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}")
                }
            }
        }
        stage('Upload image') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'DOCKER_HUB_CREDENTIALS') {
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push()
                        docker.image("${env.DOCKER_IMAGE}:${env.DOCKER_TAG}").push('latest')
                    }
                }
            }
        }
        stage('Run containers') {
            steps {
                script {
                    sh 'docker stop teedy-container-8081 || true'
                    sh 'docker rm teedy-container-8081 || true'
                    sh "docker run --name teedy-container-8081 -d -p 8081:8080 ${env.DOCKER_IMAGE}:${env.DOCKER_TAG}"
                    sh 'docker ps --filter "name=teedy-container"'
                }
            }
        }
    }
}
