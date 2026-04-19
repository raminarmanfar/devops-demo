pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('demo-backend') {
                    sh './mvnw clean package'
                }
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                script {
                    def image = docker.build('raminarmanfar/demo-backend:latest', './demo-backend')

                    docker.withRegistry('', 'dockerhub') {
                        image.push()
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('demo-frontend') {
                    script {
                        docker.image('node:20').inside {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Done') {
            steps {
                echo 'Build completed successfully'
            }
        }
    }
}