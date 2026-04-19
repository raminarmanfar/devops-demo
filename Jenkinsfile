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

        stage('Build Backend Image') {
            steps {
                script {
                    docker.build("demo-backend:latest", "./demo-backend")
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