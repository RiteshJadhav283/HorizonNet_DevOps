pipeline {
    agent any

    environment {
        // Docker Registry settings
        DOCKER_USER = 'riteshjadav'
        IMAGE_NAME = 'horizonnet-app'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout from the GitHub repository
                git branch: 'main', url: 'https://github.com/RiteshJadhav283/HorizonNet_DevOps.git'
            }
        }

        stage('Build') {
            steps {
                script {
                    // Build the Docker image, tagging with build number and latest
                    echo "Building Docker Image: ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER} ."
                    sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    // Pushing both image tags to Docker Hub.
                    // SECURITY WARNING: Hardcoding Docker Hub credentials as plaintext in this
                    // file would be a critical security failure, exposing credentials to anyone with
                    // access to this code or public GitHub repo. Instead, we use Jenkins' secure
                    // Credentials Store and load them as environment variables via `withCredentials`.
                    withCredentials([usernamePassword(
                        credentialsId: DOCKER_CREDENTIALS_ID,
                        usernameVariable: 'DOCKER_REGISTRY_USER',
                        passwordVariable: 'DOCKER_REGISTRY_PASS'
                    )]) {
                        sh "echo \$DOCKER_REGISTRY_PASS | docker login -u \$DOCKER_REGISTRY_USER --password-stdin"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER}"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy to Kubernetes by applying the latest deployment manifest.
                    // We modify the image tag in-place in deployment.yaml using sed before applying,
                    // ensuring all new sidecar annotations and entrypoint updates are successfully configured.
                    echo "Deploying newly built image version: ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "sed -i 's|image: horizonnet-app:local|image: ${DOCKER_USER}/${IMAGE_NAME}:${BUILD_NUMBER}|' k8s/deployment.yaml"
                    sh "kubectl apply -f k8s/deployment.yaml"
                }
            }
        }

        stage('Verify') {
            steps {
                script {
                    // Wait 10 seconds for Kubernetes rolling update to begin rolling out pods.
                    sh "sleep 10"

                    // Verification check:
                    // Since the Kubernetes service is internal to Minikube's network, curl-ing it directly
                    // from the Jenkins container (which resides in the Minikube Docker bridge but outside
                    // the K8s SDN pod network) is unreliable. Instead, we run a temporary testing pod
                    // inside the cluster using `kubectl run`. This testing pod resolves the internal K8s DNS
                    // and curls the service directly, failing if it does not receive a 'status: ok' JSON.
                    echo "Running health check verification..."
                    def response = sh(
                        script: "kubectl run curl-test --image=curlimages/curl --rm -i --restart=Never -- http://horizonnet-service:3000/health",
                        returnStdout: true
                    ).trim()

                    echo "Raw health check response: ${response}"
                    if (!response.contains('"status":"ok"')) {
                        error "Health check verification failed! Response: ${response}"
                    }
                    echo "Health check verification passed successfully!"
                }
            }
        }
    }
}
