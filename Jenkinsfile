pipeline {
    agent any

    parameters {
        booleanParam(name: 'DEPLOY_TO_K8S', defaultValue: false, description: 'Deploy to Kubernetes after pushing images')
    }

    environment {
        DOCKERHUB_USERNAME = credentials('dockerhub-username')
    }

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
                    if (!env.DOCKERHUB_USERNAME?.trim()) {
                        error('Missing Docker Hub username. Add Jenkins secret text credential with id dockerhub-username.')
                    }

                    def backendImage = "${env.DOCKERHUB_USERNAME}/demo-backend"
                    def image = docker.build("${backendImage}:${env.BUILD_NUMBER}", "./demo-backend")

                    docker.withRegistry('', 'dockerhub') {
                        image.push("${env.BUILD_NUMBER}")
                        image.push('latest')
                    }
                }
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                script {
                    if (!env.DOCKERHUB_USERNAME?.trim()) {
                        error('Missing Docker Hub username. Add Jenkins secret text credential with id dockerhub-username.')
                    }

                    def frontendImage = "${env.DOCKERHUB_USERNAME}/demo-frontend"
                    def image = docker.build("${frontendImage}:${env.BUILD_NUMBER}", "./demo-frontend")

                    docker.withRegistry('', 'dockerhub') {
                        image.push("${env.BUILD_NUMBER}")
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { return params.DEPLOY_TO_K8S }
            }
            steps {
                sh 'kubectl config current-context'
                sh 'kubectl get nodes'
                sh 'kubectl apply -f k8s/'
                sh "kubectl set image deployment/backend backend=${env.DOCKERHUB_USERNAME}/demo-backend:${env.BUILD_NUMBER}"
                sh "kubectl set image deployment/frontend frontend=${env.DOCKERHUB_USERNAME}/demo-frontend:${env.BUILD_NUMBER}"
                sh 'kubectl rollout status deployment/backend'
                sh 'kubectl rollout status deployment/frontend'
            }
        }

        stage('Done') {
            steps {
                echo 'Build completed successfully'
            }
        }
    }
}