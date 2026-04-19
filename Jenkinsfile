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
                    def image = docker.build("raminarmanfar/demo-backend:${env.BUILD_NUMBER}", "./demo-backend")

                    docker.withRegistry('', 'dockerhub') {
                        image.push("${env.BUILD_NUMBER}")
                        image.push('latest')
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

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl config current-context'
                sh 'kubectl get nodes'
                sh 'kubectl apply -f k8s/'
                sh "kubectl set image deployment/backend backend=raminarmanfar/demo-backend:${env.BUILD_NUMBER}"
                sh 'kubectl rollout status deployment/backend'
            }
        }

        stage('Done') {
            steps {
                echo 'Build completed successfully'
            }
        }
    }
}