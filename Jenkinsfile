pipeline {
    agent any

    triggers {
        githubPush()
        pollSCM('H/2 * * * *')
        cron('H/2 * * * *')
    }

    parameters {
        booleanParam(name: 'DEPLOY_TO_K8S', defaultValue: false, description: 'Deploy to Kubernetes after pushing images')
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            when {
                anyOf {
                    changeset "demo-backend/**"
                    changeset "Jenkinsfile"
                }
            }
            steps {
                dir('demo-backend') {
                    sh './mvnw clean package'
                }
            }
        }

        stage('Build & Push Backend Image') {
            when {
                anyOf {
                    changeset "demo-backend/**"
                    changeset "Jenkinsfile"
                }
            }
            steps {
                script {
                    if (!env.DOCKERHUB_CREDENTIALS_USR?.trim()) {
                        error('Missing Docker Hub username. Check Jenkins credential id dockerhub is Username with password.')
                    }

                    def backendImage = "${env.DOCKERHUB_CREDENTIALS_USR}/demo-backend"
                    def image = docker.build("${backendImage}:${env.BUILD_NUMBER}", "./demo-backend")

                    docker.withRegistry('', 'dockerhub') {
                        image.push("${env.BUILD_NUMBER}")
                        image.push('latest')
                    }
                }
            }
        }

        stage('Build Frontend') {
            when {
                anyOf {
                    changeset "demo-frontend/**"
                    changeset "Jenkinsfile"
                }
            }
            steps {
                dir('demo-frontend') {
                    script {
                        docker.image('node:24-alpine').inside {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Push Frontend Image') {
            when {
                anyOf {
                    changeset "demo-frontend/**"
                    changeset "Jenkinsfile"
                }
            }
            steps {
                script {
                    if (!env.DOCKERHUB_CREDENTIALS_USR?.trim()) {
                        error('Missing Docker Hub username. Check Jenkins credential id dockerhub is Username with password.')
                    }

                    def frontendImage = "${env.DOCKERHUB_CREDENTIALS_USR}/demo-frontend"
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
                sh "kubectl set image deployment/backend backend=${env.DOCKERHUB_CREDENTIALS_USR}/demo-backend:${env.BUILD_NUMBER}"
                sh "kubectl set image deployment/frontend frontend=${env.DOCKERHUB_CREDENTIALS_USR}/demo-frontend:${env.BUILD_NUMBER}"
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