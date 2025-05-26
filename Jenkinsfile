

// pipeline {
//     agent any
    
//     environment {
//         // Docker registry credentials
//         DOCKER_REGISTRY = credentials('docker-hub-credentials')
//         REGISTRY_URL = 'your-registry.example.com'
        
//         // Kubernetes deployment credentials and config
//         KUBECONFIG = credentials('kubeconfig-credentials')
//         NAMESPACE = 'patient-monitoring'
        
//         // Version management
//         VERSION = "${env.BUILD_NUMBER}"
//         GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        
//         // Service directories
//         SERVICES = ['patient-service', 'vitals-ingestion-service', 'vitals-processing-service', 'alert-service', 'notification-service', 'api-gateway']
        
//         // SonarQube configuration
//         SONARQUBE_SCANNER = tool 'SonarQubeScanner'
//         SONARQUBE_SERVER = 'SonarQube'
//     }
    
//     options {
//         buildDiscarder(logRotator(numToKeepStr: '10'))
//         timeout(time: 1, unit: 'HOURS')
//         disableConcurrentBuilds()
//     }
    
//     stages {
//         stage('Checkout') {
//             steps {
//                 checkout scm
//                 script {
//                     // Define environment based on branch
//                     if (env.BRANCH_NAME == 'main') {
//                         env.DEPLOY_ENV = 'production'
//                     } else if (env.BRANCH_NAME == 'staging') {
//                         env.DEPLOY_ENV = 'staging'
//                     } else {
//                         env.DEPLOY_ENV = 'development'
//                     }
                    
//                     echo "Building for environment: ${env.DEPLOY_ENV}"
//                     echo "Version: ${VERSION}"
//                     echo "Git commit: ${GIT_COMMIT_SHORT}"
//                 }
//             }
//         }
        
//         stage('Install Dependencies') {
//             steps {
//                 script {
//                     for (service in SERVICES) {
//                         dir("services/${service}") {
//                             sh 'npm ci'
//                         }
//                     }
                    
//                     dir("services/data-generator") {
//                         sh 'pip install -r requirements.txt'
//                     }
//                 }
//             }
//         }
        
//         stage('Lint & Code Quality') {
//             parallel {
//                 stage('ESLint') {
//                     steps {
//                         script {
//                             for (service in SERVICES) {
//                                 dir("services/${service}") {
//                                     sh 'npm run lint'
//                                 }
//                             }
//                         }
//                     }
//                 }
                
//                 stage('Python Lint') {
//                     steps {
//                         dir("services/data-generator") {
//                             sh 'flake8 .'
//                         }
//                     }
//                 }
//             }
//         }
        
//         stage('Unit Tests') {
//             steps {
//                 script {
//                     for (service in SERVICES) {
//                         dir("services/${service}") {
//                             sh 'npm test'
//                         }
//                     }
                    
//                     dir("services/data-generator") {
//                         sh 'python -m pytest'
//                     }
//                 }
//             }
//         }
        
//         stage('SonarQube Analysis') {
//             steps {
//                 withSonarQubeEnv(SONARQUBE_SERVER) {
//                     script {
//                         for (service in SERVICES) {
//                             dir("services/${service}") {
//                                 sh """
//                                 ${SONARQUBE_SCANNER}/bin/sonar-scanner \
//                                 -Dsonar.projectKey=patient-monitoring-${service} \
//                                 -Dsonar.projectName="Patient Monitoring - ${service}" \
//                                 -Dsonar.projectVersion=${VERSION} \
//                                 -Dsonar.sources=src \
//                                 -Dsonar.tests=test \
//                                 -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
//                                 """
//                             }
//                         }
                        
//                         dir("services/data-generator") {
//                             sh """
//                             ${SONARQUBE_SCANNER}/bin/sonar-scanner \
//                             -Dsonar.projectKey=patient-monitoring-data-generator \
//                             -Dsonar.projectName="Patient Monitoring - Data Generator" \
//                             -Dsonar.projectVersion=${VERSION} \
//                             -Dsonar.sources=. \
//                             -Dsonar.python.coverage.reportPaths=coverage.xml
//                             """
//                         }
//                     }
//                 }
//             }
//         }
        
//         stage('Build Docker Images') {
//             steps {
//                 script {
//                     // Login to Docker registry
//                     sh "docker login -u ${DOCKER_REGISTRY_USR} -p ${DOCKER_REGISTRY_PSW} ${REGISTRY_URL}"
                    
//                     // Build and tag each service
//                     for (service in SERVICES) {
//                         def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
//                         def latestTag = "${REGISTRY_URL}/${service}:latest"
                        
//                         dir("services/${service}") {
//                             sh "docker build -t ${imageTag} -t ${latestTag} ."
//                             sh "docker push ${imageTag}"
                            
//                             // Only push latest tag for main branch
//                             if (env.BRANCH_NAME == 'main') {
//                                 sh "docker push ${latestTag}"
//                             }
//                         }
//                     }
                    
//                     // Build Python data generator
//                     def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
//                     def dataGenLatestTag = "${REGISTRY_URL}/data-generator:latest"
                    
//                     dir("services/data-generator") {
//                         sh "docker build -t ${dataGenImageTag} -t ${dataGenLatestTag} ."
//                         sh "docker push ${dataGenImageTag}"
                        
//                         if (env.BRANCH_NAME == 'main') {
//                             sh "docker push ${dataGenLatestTag}"
//                         }
//                     }
//                 }
//             }
//         }
        
//         stage('Security Scan') {
//             steps {
//                 script {
//                     // Scan each Docker image for vulnerabilities
//                     for (service in SERVICES) {
//                         def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
//                         sh "trivy image --severity HIGH,CRITICAL ${imageTag}"
//                     }
                    
//                     def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
//                     sh "trivy image --severity HIGH,CRITICAL ${dataGenImageTag}"
//                 }
//             }
//         }
        
//         stage('Integration Tests') {
//             steps {
//                 script {
//                     // Run integration tests using Docker Compose
//                     sh "docker-compose -f docker-compose.test.yml up --abort-on-container-exit"
//                     sh "docker-compose -f docker-compose.test.yml down -v"
//                 }
//             }
//         }
        
//         stage('Deploy to Kubernetes') {
//             when {
//                 anyOf {
//                     branch 'main'
//                     branch 'staging'
//                 }
//             }
//             steps {
//                 withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
//                     script {
//                         // Update Kubernetes deployment manifests with new image tags
//                         for (service in SERVICES) {
//                             def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
                            
//                             // Replace image tag in YAML file
//                             sh """
//                             sed -i 's|${REGISTRY_URL}/${service}:.*|${imageTag}|g' kubernetes/05-services/${service}.yaml
//                             """
                            
//                             // Apply the updated deployment
//                             sh "kubectl apply -f kubernetes/05-services/${service}.yaml --namespace=${NAMESPACE}"
                            
//                             // Wait for deployment to complete
//                             sh "kubectl rollout status deployment/${service} --namespace=${NAMESPACE} --timeout=5m"
//                         }
                        
//                         // Create ConfigMap with version info
//                         sh """
//                         kubectl create configmap version-info \
//                         --namespace=${NAMESPACE} \
//                         --from-literal=version=${VERSION} \
//                         --from-literal=git-commit=${GIT_COMMIT_SHORT} \
//                         --from-literal=build-date=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
//                         -o yaml --dry-run=client | kubectl apply -f -
//                         """
//                     }
//                 }
//             }
//         }
        
//         stage('Smoke Tests') {
//             when {
//                 anyOf {
//                     branch 'main'
//                     branch 'staging'
//                 }
//             }
//             steps {
//                 withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
//                     script {
//                         // Set up port forwarding to API Gateway
//                         sh "kubectl port-forward service/api-gateway 3000:3000 --namespace=${NAMESPACE} &"
//                         sh "sleep 5" // Wait for port-forwarding to establish
                        
//                         // Run basic health check tests
//                         sh "curl -f http://localhost:3000/health"
                        
//                         // Kill the port-forwarding process
//                         sh "pkill -f 'port-forward'"
//                     }
//                 }
//             }
//         }
//     }
    
//     post {
//         always {
//             // Archive test reports
//             junit 'services/*/test-results/*.xml'
            
//             // Clean up Docker images
//             script {
//                 try {
//                     for (service in SERVICES) {
//                         def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
//                         sh "docker rmi ${imageTag} || true"
//                     }
                    
//                     def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
//                     sh "docker rmi ${dataGenImageTag} || true"
//                 } catch (Exception e) {
//                     echo "Warning: Failed to clean up Docker images: ${e.message}"
//                 }
//             }
//         }
        
//         success {
//             slackSend(
//                 color: 'good',
//                 message: "✅ Build #${env.BUILD_NUMBER} of *Patient Monitoring System* successful on branch ${env.BRANCH_NAME}\nVersion: ${VERSION}\nCommit: ${GIT_COMMIT_SHORT}\nDeployed to: ${env.DEPLOY_ENV}"
//             )
//         }
        
//         failure {
//             slackSend(
//                 color: 'danger',
//                 message: "❌ Build #${env.BUILD_NUMBER} of *Patient Monitoring System* failed on branch ${env.BRANCH_NAME}\nVersion: ${VERSION}\nCommit: ${GIT_COMMIT_SHORT}\nCheck the logs: ${env.BUILD_URL}"
//             )
//         }
//     }
// }


pipeline { 
    agent any // Or specify an agent with Docker, Docker Compose, Node.js

    environment { 
        IMAGE_TAG_PREFIX = "build" 

        // Service image base names 
        API_GATEWAY_IMAGE_NAME = "pms-api-gateway" 
        AUTH_SERVICE_IMAGE_NAME = "pms-auth-service" 
        PATIENT_SERVICE_IMAGE_NAME = "pms-patient-service" 

        // Secret Management
        DOCKER_HUB_CREDS  = credentials('docker-hub-credentials') 
        POSTGRES_USER_JENKINS = credentials('pms-postgres-user') 
        POSTGRES_PASSWORD_JENKINS = credentials('pms-postgres-password') 
        JWT_SECRET_JENKINS = credentials('pms-jwt-secret') 

        // Ports from .env
        POSTGRES_PORT_ENV = "5432" 
        REDIS_PORT_ENV = "6379" 
        RABBITMQ_NODE_PORT_ENV = "5672" 
        RABBITMQ_MANAGEMENT_PORT_ENV = "15672" 
        API_GATEWAY_PORT_ENV = "3000" 
        AUTH_SERVICE_PORT_ENV = "3001" 
        PATIENT_SERVICE_PORT_ENV = "3002" 
    } 

    stages { 
        stage('Checkout') { 
            steps { 
                echo "Checking out code..." 
                checkout scm 
            } 
        } 

        stage('Prepare Environment (.env file)') { 
            steps { 
                echo "Preparing .env file for Docker Compose..." 
                script {
                    bat """ 
                    echo "POSTGRES_USER=${env.POSTGRES_USER_JENKINS ?: 'admin'}" > .env 
                    echo "POSTGRES_PASSWORD=${env.POSTGRES_PASSWORD_JENKINS ?: 'supersecret'}" >> .env 
                    echo "POSTGRES_DB=pms_db" >> .env 
                    echo "POSTGRES_PORT=${env.POSTGRES_PORT_ENV}" >> .env 
                    echo "REDIS_PORT=${env.REDIS_PORT_ENV}" >> .env 
                    echo "RABBITMQ_DEFAULT_USER=user" >> .env 
                    echo "RABBITMQ_DEFAULT_PASS=password" >> .env 
                    echo "RABBITMQ_NODE_PORT=${env.RABBITMQ_NODE_PORT_ENV}" >> .env 
                    echo "RABBITMQ_MANAGEMENT_PORT=${env.RABBITMQ_MANAGEMENT_PORT_ENV}" >> .env 
                    echo "API_GATEWAY_PORT=${env.API_GATEWAY_PORT_ENV}" >> .env 
                    echo "AUTH_SERVICE_PORT=${env.AUTH_SERVICE_PORT_ENV}" >> .env 
                    echo "PATIENT_SERVICE_PORT=${env.PATIENT_SERVICE_PORT_ENV}" >> .env 
                    echo "JWT_SECRET=${env.JWT_SECRET_JENKINS ?: 'YOUR_VERY_SECRET_KEY_REPLACE_THIS_FOR_TESTS'}" >> .env 
                    echo "JWT_EXPIRATION_TIME=3600s" >> .env 
                    echo "PATIENT_SERVICE_URL=http://patient_service:${env.PATIENT_SERVICE_PORT_ENV}" >> .env 
                    echo "AUTH_SERVICE_URL=http://auth_service:${env.AUTH_SERVICE_PORT_ENV}/api/v1" >> .env 
                    echo "Generated .env file for docker-compose." 
                    type .env 
                    """ 
                } 
            } 
        } 

        stage('Lint and Unit Test Services') { 
            parallel { 
                stage('API Gateway: Lint & Test') { 
                    steps { 
                        dir('services/api-gateway') { 
                            echo "Running Lint & Unit Tests for API Gateway..." 
                            bat 'npm i' 
                            bat 'npm run lint' 
                            bat 'npm run test' 
                        } 
                    } 
                } 
                stage('Auth Service: Lint & Test') { 
                    steps { 
                        dir('services/auth-service') { 
                            echo "Running Lint & Unit Tests for Auth Service..." 
                            bat 'npm i' 
                            bat 'npm run lint' 
                            bat 'npm run test' 
                        } 
                    } 
                } 
                stage('Patient Service: Lint & Test') { 
                    steps { 
                        dir('services/patient-service') { 
                            echo "Running Lint & Unit Tests for Patient Service..." 
                            bat 'npm i' 
                            bat 'npm run lint' 
                            bat 'npm run test' 
                        } 
                    } 
                } 
            }
        } 

        stage('Build Docker Images') { 
            steps { 
                script { 
                    env.IMAGE_TAG = "${env.IMAGE_TAG_PREFIX}-${env.BUILD_NUMBER}" 
                    if (env.BRANCH_NAME == 'main') { 
                        env.IMAGE_TAG = "latest" 
                    } 

                    def registryPrefix = "sharduldev/patient-management-system" 
                    env.FULL_API_GATEWAY_IMAGE_NAME = "${registryPrefix}${API_GATEWAY_IMAGE_NAME}:${env.IMAGE_TAG}" 
                    env.FULL_AUTH_SERVICE_IMAGE_NAME = "${registryPrefix}${AUTH_SERVICE_IMAGE_NAME}:${env.IMAGE_TAG}" 
                    env.FULL_PATIENT_SERVICE_IMAGE_NAME = "${registryPrefix}${PATIENT_SERVICE_IMAGE_NAME}:${env.IMAGE_TAG}" 

                    echo "Building API Gateway image: ${env.FULL_API_GATEWAY_IMAGE_NAME}" 
                    bat "docker build -t ${env.FULL_API_GATEWAY_IMAGE_NAME} -f services/api-gateway/Dockerfile ./services/api-gateway" 

                    echo "Building Auth Service image: ${env.FULL_AUTH_SERVICE_IMAGE_NAME}" 
                    bat "docker build -t ${env.FULL_AUTH_SERVICE_IMAGE_NAME} -f services/auth-service/Dockerfile ./services/auth-service" 

                    echo "Building Patient Service image: ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}" 
                    bat "docker build -t ${env.FULL_PATIENT_SERVICE_IMAGE_NAME} -f services/patient-service/Dockerfile ./services/patient-service" 
                }
            } 
        } 

        stage('Integration Tests (Patient Service)') { 
            steps { 
                echo "Running Integration Tests for Patient Service..." 
                dir('services/patient-service') { 
                    bat """ 
                    echo "Creating .env for patient-service e2e tests..." 
                    echo "NODE_ENV=test" > .env 
                    echo "PORT=${env.PATIENT_SERVICE_PORT_ENV}" >> .env 
                    echo "DB_HOST=pms_postgres_db" >> .env 
                    echo "DB_PORT=${env.POSTGRES_PORT_ENV}" >> .env 
                    echo "DB_USERNAME=${env.POSTGRES_USER_JENKINS ?: 'admin'}" >> .env 
                    echo "DB_PASSWORD=${env.POSTGRES_PASSWORD_JENKINS ?: 'supersecret'}" >> .env 
                    echo "DB_DATABASE=pms_db_e2e_test" >> .env 
                    echo "REDIS_HOST=pms_redis_cache" >> .env 
                    echo "REDIS_PORT=${env.REDIS_PORT_ENV}" >> .env 
                    echo "RABBITMQ_URL=amqp://user:password@pms_rabbitmq_broker:${env.RABBITMQ_NODE_PORT_ENV}" >> .env 
                    echo "JWT_SECRET=${env.JWT_SECRET_JENKINS ?: 'YOUR_VERY_SECRET_KEY_REPLACE_THIS_FOR_TESTS'}" >> .env 
                    echo "RABBITMQ_QUEUE_PATIENT_EVENTS=patient_events_test" >> .env 
                    echo "RABBITMQ_QUEUE_APPOINTMENT_EVENTS=appointment_events_test" >> .env 
                    echo "Content of services/patient-service/.env for tests:" 
                    type .env 
                    """ 
                } 

               script { 
                    try { 
                        echo "Starting dependencies for integration tests (PostgreSQL, Redis, RabbitMQ)..." 
                        bat "docker-compose up -d postgres_db redis_cache rabbitmq_broker" 

                        // Wait for services to be ready (simple sleep)
                        bat "timeout /t 15" 

                        // Run e2e tests 
                        dir('services/patient-service') { 
                            bat 'npm i' 
                            bat 'npm run test:e2e' 
                        } 
                    } catch(Exception e) { 
                        echo "Testing failed" 
                    } finally { 
                        echo "Stopping and cleaning up integration test dependencies..." 
                        bat "docker-compose down -v" 
                    } 
               } 
            } 
        } 

        stage('Push Docker Images') { 
            when { 
                branch 'main' 
            } 
            steps { 
                script { 
                    bat "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin" 
                    echo "Pushing API Gateway image: ${env.FULL_API_GATEWAY_IMAGE_NAME}" 
                    bat "docker push ${env.FULL_API_GATEWAY_IMAGE_NAME}" 
             
                    echo "Pushing Auth Service image: ${env.FULL_AUTH_SERVICE_IMAGE_NAME}" 
                    bat "docker push ${env.FULL_AUTH_SERVICE_IMAGE_NAME}" 
             
                    echo "Pushing Patient Service image: ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}" 
                    bat "docker push ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}" 
                } 
            } 
        } 

        stage('Deploy') { 
            when { 
                branch 'main' 
            } 
            steps { 
                script { 
                    echo "Skipping Deploy: Deployment steps not configured in this example." 
                } 
            } 
        } 
    } 

    post { 
        always { 
            echo 'Pipeline finished.' 
            script { 
                bat "docker rmi ${env.FULL_API_GATEWAY_IMAGE_NAME} || true" 
                bat "docker rmi ${env.FULL_AUTH_SERVICE_IMAGE_NAME} || true" 
                bat "docker rmi ${env.FULL_PATIENT_SERVICE_IMAGE_NAME} || true" 
            } 
        } 
        success { 
            echo 'Pipeline Succeeded!' 
        } 
        failure { 
            echo 'Pipeline Failed!' 
        } 
    } 
}

// Jenkinsfile
// pipeline {
//     agent any // Or specify an agent with Docker, Docker Compose, Node.js: agent { label 'docker-node' }

//     environment {
//         // === Docker Image Configuration ===
//         // Optional: Define your Docker registry URL (e.g., 'yourusername' for Docker Hub, or a private registry URL)
//         // DOCKER_REGISTRY_URL = '' // Example: 'docker.io/yourusername' or 'your.private.registry.com'
//         IMAGE_TAG_PREFIX = "build"

//         // Service image base names
//         API_GATEWAY_IMAGE_NAME = "pms-api-gateway"
//         AUTH_SERVICE_IMAGE_NAME = "pms-auth-service"
//         PATIENT_SERVICE_IMAGE_NAME = "pms-patient-service"

//         // === Secret Management (Placeholders - Configure in Jenkins Credentials) ===
//         // These should be configured in Jenkins > Manage Jenkins > Credentials
//         DOCKER_REGISTRY_URL =  "sharduldev/patient-management-system"
//         DOCKER_HUB_CREDS  = credentials('docker-hub-credentials')
//         // SSH_CREDENTIALS_ID = 'your-deployment-ssh-credentials'
//         POSTGRES_USER_JENKINS = credentials('pms-postgres-user')
//         POSTGRES_PASSWORD_JENKINS = credentials('pms-postgres-password')
//         JWT_SECRET_JENKINS = credentials('pms-jwt-secret')

//         // === Ports (from your .env, used if .env is generated by pipeline) ===
//         POSTGRES_PORT_ENV = "5432"
//         REDIS_PORT_ENV = "6379"
//         RABBITMQ_NODE_PORT_ENV = "5672"
//         RABBITMQ_MANAGEMENT_PORT_ENV = "15672"
//         API_GATEWAY_PORT_ENV = "3000"
//         AUTH_SERVICE_PORT_ENV = "3001"
//         PATIENT_SERVICE_PORT_ENV = "3002"
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 echo "Checking out code..."
//                 checkout scm
//             }
//         }

//         stage('Prepare Environment (.env file)') {
//             steps {
//                 echo "Preparing .env file for Docker Compose..."
//                 script {
//                     // This creates a .env file in the workspace root for docker-compose.
//                     // In a real scenario, manage secrets more securely.
//                     // For services, their respective .env files inside service directories
//                     // will be used by `npm run start:dev` or picked up by ConfigModule.
//                     // The Dockerfiles themselves don't copy .env files; env vars are passed
//                     // via docker-compose.yml for container runtime.
//                     // This root .env is primarily for `docker-compose up` variables.
//                     bat """
//                     echo "POSTGRES_USER=${env.POSTGRES_USER_JENKINS_USR ?: 'admin'}" > .env
//                     echo "POSTGRES_PASSWORD=${env.POSTGRES_USER_JENKINS_PSW ?: 'supersecret'}" >> .env
//                     echo "POSTGRES_DB=pms_db" >> .env
//                     echo "POSTGRES_PORT=${env.POSTGRES_PORT_ENV}" >> .env

//                     echo "REDIS_PORT=${env.REDIS_PORT_ENV}" >> .env

//                     echo "RABBITMQ_DEFAULT_USER=user" >> .env
//                     echo "RABBITMQ_DEFAULT_PASS=password" >> .env
//                     echo "RABBITMQ_NODE_PORT=${env.RABBITMQ_NODE_PORT_ENV}" >> .env
//                     echo "RABBITMQ_MANAGEMENT_PORT=${env.RABBITMQ_MANAGEMENT_PORT_ENV}" >> .env

//                     echo "API_GATEWAY_PORT=${env.API_GATEWAY_PORT_ENV}" >> .env
//                     echo "AUTH_SERVICE_PORT=${env.AUTH_SERVICE_PORT_ENV}" >> .env
//                     echo "PATIENT_SERVICE_PORT=${env.PATIENT_SERVICE_PORT_ENV}" >> .env

//                     echo "JWT_SECRET=${env.JWT_SECRET_JENKINS ?: 'YOUR_VERY_SECRET_KEY_REPLACE_THIS_FOR_TESTS'}" >> .env
//                     echo "JWT_EXPIRATION_TIME=3600s" >> .env
                    
//                     echo "PATIENT_SERVICE_URL=http://patient_service:${env.PATIENT_SERVICE_PORT_ENV}" >> .env
//                     echo "AUTH_SERVICE_URL=http://auth_service:${env.AUTH_SERVICE_PORT_ENV}/api/v1" >> .env


//                     echo "Generated .env file for docker-compose."
//                     cat .env
//                     """

//                     // Create .env files for individual services if they are not committed
//                     // and are needed for local test runs (not containerized test runs via Dockerfile)
//                     // Example for auth-service:
//                     // sh """
//                     // cp services/auth-service/.env.example services/auth-service/.env
//                     // sed -i 's/DB_HOST=pms_postgres_db/DB_HOST=localhost/' services/auth-service/.env
//                     // sed -i 's/JWT_SECRET=.*/JWT_SECRET=${env.JWT_SECRET_JENKINS ?: 'test-secret'}/' services/auth-service/.env
//                     // """
//                     // This step might be complex depending on how tests consume env vars.
//                     // For tests running inside containers or against docker-compose services,
//                     // the container env vars are more relevant.
//                 }
//             }
//         }

//         stage('Lint and Unit Test Services') {
//             parallel {
//                 stage('API Gateway: Lint & Test') {
//                     steps {
//                         dir('services/api-gateway') {
//                             echo "Running Lint & Unit Tests for API Gateway..."
//                             bat 'npm ci'
//                             bat 'npm run lint'
//                             bat 'npm run test'
//                         }
//                     }
//                 }
//                 stage('Auth Service: Lint & Test') {
//                     steps {
//                         dir('services/auth-service') {
//                             echo "Running Lint & Unit Tests for Auth Service..."
//                             bat 'npm ci'
//                             bat 'npm run lint'
//                             bat 'npm run test'
//                         }
//                     }
//                 }
//                 stage('Patient Service: Lint & Test') {
//                     steps {
//                         dir('services/patient-service') {
//                             echo "Running Lint & Unit Tests for Patient Service..."
//                             bat 'npm ci'
//                             bat 'npm run lint'
//                             bat 'npm run test'
//                         }
//                     }
//                 }
//             }
//         }

//         stage('Build Docker Images') {
//             steps {
//                 script {
//                     env.IMAGE_TAG = "${env.IMAGE_TAG_PREFIX}-${env.BUILD_NUMBER}"
//                     if (env.BRANCH_NAME == 'main') {
//                         env.IMAGE_TAG = "latest" // Or a semantic version
//                     }

//                     def gatewayImageBase = env.API_GATEWAY_IMAGE_NAME
//                     def authImageBase = env.AUTH_SERVICE_IMAGE_NAME
//                     def patientImageBase = env.PATIENT_SERVICE_IMAGE_NAME

//                     // Prepend registry URL if defined
//                     def registryPrefix = env.DOCKER_REGISTRY_URL ? "${env.DOCKER_REGISTRY_URL}/" : "sharduldev/patient-management-system"
//                     env.FULL_API_GATEWAY_IMAGE_NAME = "${registryPrefix}${gatewayImageBase}:${env.IMAGE_TAG}"
//                     env.FULL_AUTH_SERVICE_IMAGE_NAME = "${registryPrefix}${authImageBase}:${env.IMAGE_TAG}"
//                     env.FULL_PATIENT_SERVICE_IMAGE_NAME = "${registryPrefix}${patientImageBase}:${env.IMAGE_TAG}"
                    
//                     // For local builds without pushing to a custom registry, use base names
//                     env.FULL_API_GATEWAY_IMAGE_NAME = "${gatewayImageBase}:${env.IMAGE_TAG}"
//                     env.FULL_AUTH_SERVICE_IMAGE_NAME = "${authImageBase}:${env.IMAGE_TAG}"
//                     env.FULL_PATIENT_SERVICE_IMAGE_NAME = "${patientImageBase}:${env.IMAGE_TAG}"


//                     echo "Building API Gateway image: ${env.FULL_API_GATEWAY_IMAGE_NAME}"
//                     bat "docker build -t ${env.FULL_API_GATEWAY_IMAGE_NAME} -f services/api-gateway/Dockerfile ./services/api-gateway"

//                     echo "Building Auth Service image: ${env.FULL_AUTH_SERVICE_IMAGE_NAME}"
//                     bat "docker build -t ${env.FULL_AUTH_SERVICE_IMAGE_NAME} -f services/auth-service/Dockerfile ./services/auth-service"

//                     echo "Building Patient Service image: ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}"
//                     bat "docker build -t ${env.FULL_PATIENT_SERVICE_IMAGE_NAME} -f services/patient-service/Dockerfile ./services/patient-service"
//                 }
//             }
//         }

//         stage('Integration Tests (Patient Service)') {
//             // This stage runs e2e tests for the patient-service.
//             // It requires dependencies (DB, Redis, RabbitMQ) to be running.
//             // The patient-service e2e tests create their own Nest app instance.
//             // This instance needs env vars to connect to the dependencies.
//             steps {
//                 echo "Running Integration Tests for Patient Service..."
//                 dir('services/patient-service') {
//                     // We need to ensure the test execution environment (Node.js process on Jenkins agent)
//                     // has access to environment variables for DB_HOST, REDIS_HOST, etc.
//                     // These should point to the services started by docker-compose.
//                     // If docker-compose maps ports, tests can use localhost:mapped_port.
//                     // The root .env file created earlier is for docker-compose itself.
//                     // The test process needs its own env vars.
//                     // We can pass them directly to the npm script if the test runner supports it,
//                     // or create a temporary .env in services/patient-service for the test run.
                    
//                     // Create a .env file specifically for the test execution context within patient-service
//                     // This tells the NestJS app (started by tests) how to connect to Dockerized dependencies.
//                     bat """
                    
//                     echo "Creating .env for patient-service e2e tests..."
//                     echo "NODE_ENV=test" > .env
//                     echo "PORT=${env.PATIENT_SERVICE_PORT_ENV}" >> .env
//                     echo "DB_HOST=pms_postgres_db" >> .env      # Docker service name
//                     echo "DB_PORT=${env.POSTGRES_PORT_ENV}" >> .env          # Internal Docker port
//                     echo "DB_USERNAME=${env.POSTGRES_USER_JENKINS_USR ?: 'admin'}" >> .env
//                     echo "DB_PASSWORD=${env.POSTGRES_USER_JENKINS_PSW ?: 'supersecret'}" >> .env
//                     echo "DB_DATABASE=pms_db_e2e_test" >> .env # Use a dedicated test database
//                     echo "REDIS_HOST=pms_redis_cache" >> .env    # Docker service name
//                     echo "REDIS_PORT=${env.REDIS_PORT_ENV}" >> .env        # Internal Docker port
//                     echo "RABBITMQ_URL=amqp://user:password@pms_rabbitmq_broker:${env.RABBITMQ_NODE_PORT_ENV}" >> .env
//                     echo "JWT_SECRET=${env.JWT_SECRET_JENKINS ?: 'YOUR_VERY_SECRET_KEY_REPLACE_THIS_FOR_TESTS'}" >> .env
//                     echo "RABBITMQ_QUEUE_PATIENT_EVENTS=patient_events_test" >> .env
//                     echo "RABBITMQ_QUEUE_APPOINTMENT_EVENTS=appointment_events_test" >> .env
                    
//                     echo "Content of services/patient-service/.env for tests:"
//                     cat .env
//                     """
//                 }

//                script {
//                      // Use a try-finally block to ensure docker-compose down is always called
//                     try {
//                         // Start dependencies using docker-compose from the project root
//                         // The .env file in the root directory will be used by docker-compose.
//                         echo "Starting dependencies for integration tests (PostgreSQL, Redis, RabbitMQ)..."
//                         bat "docker-compose up -d postgres_db redis_cache rabbitmq_broker"
                        
//                         // Wait for services to be ready (simple sleep, consider health checks)
//                         bat "sleep 15"

//                         // Run e2e tests from the patient-service directory
//                         dir('services/patient-service') {
//                             bat 'npm ci' // Ensure dependencies are installed
//                             bat 'npm run test:e2e'
//                         }
//                     } catch(Exception e) {
//                         echo "Testing failed"
//                     } finally {
//                         echo "Stopping and cleaning up integration test dependencies..."
//                         bat "docker-compose down -v" // -v removes volumes for a clean slate
//                     }
//                }
//             }
//         }

//         stage('Push Docker Images') {
//             when {
//                 branch 'main' // Or any other branch you want to push images from
//                 // environment name: 'DOCKER_CREDENTIALS_ID', value: '' // Only run if creds are set
//             }
//             steps {
//                 script {
//                     // if (env.DOCKER_CREDENTIALS_ID && env.DOCKER_CREDENTIALS_ID != '') {
//                     //     withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
//                     //         def registryUrl = env.DOCKER_REGISTRY_URL ?: 'docker.io' // Default to Docker Hub if no specific registry URL
//                     //         sh "docker login ${registryUrl} -u ${DOCKER_USER} -p ${DOCKER_PASS}"
//                     //
//                     //         echo "Pushing API Gateway image: ${env.FULL_API_GATEWAY_IMAGE_NAME}"
//                     //         sh "docker push ${env.FULL_API_GATEWAY_IMAGE_NAME}"
//                     //
//                     //         echo "Pushing Auth Service image: ${env.FULL_AUTH_SERVICE_IMAGE_NAME}"
//                     //         sh "docker push ${env.FULL_AUTH_SERVICE_IMAGE_NAME}"
//                     //
//                     //         echo "Pushing Patient Service image: ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}"
//                     //         sh "docker push ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}"
//                     //     }
//                     // } else {
//                     //     echo "Skipping Docker Push: DOCKER_CREDENTIALS_ID not configured."
//                     // }

//                     bat "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"
//                     echo "Pushing API Gateway image: ${env.FULL_API_GATEWAY_IMAGE_NAME}"
//                     bat "docker push ${env.FULL_API_GATEWAY_IMAGE_NAME}"
            
//                     echo "Pushing Auth Service image: ${env.FULL_AUTH_SERVICE_IMAGE_NAME}"
//                     bat "docker push ${env.FULL_AUTH_SERVICE_IMAGE_NAME}"
            
//                     echo "Pushing Patient Service image: ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}"
//                     bat "docker push ${env.FULL_PATIENT_SERVICE_IMAGE_NAME}"
//                     echo "Skipping Docker Push: Registry credentials and URL not configured in this example."
//                 }
//             }
//         }

//         stage('Deploy') {
//             when {
//                 branch 'main' // Deploy only from main branch
//                 // environment name: 'SSH_CREDENTIALS_ID', value: '' // Only run if creds are set
//             }
//             steps {
//                 script {
//                     // if (env.SSH_CREDENTIALS_ID && env.SSH_CREDENTIALS_ID != '') {
//                     //     // Example: SSH to a server and run docker-compose
//                     //     // Ensure the target server has its own .env file with production secrets.
//                     //     // The docker-compose.yml on the server should reference images from your registry.
//                     //     withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY_FILE')]) {
//                     //         def remoteUser = "your-ssh-user"
//                     //         def remoteHost = "your.deployment.server.ip"
//                     //         def remoteAppPath = "/opt/pms-app"
//                     //
//                     //         sh """
//                     //         ssh -i \${SSH_KEY_FILE} -o StrictHostKeyChecking=no ${remoteUser}@${remoteHost} << EOF
//                     //             echo "Deploying to ${remoteHost}..."
//                     //             cd ${remoteAppPath}
//                     //             
//                     //             # Ensure latest docker-compose.yml is present (e.g., via git pull or scp)
//                     //             # git pull origin main 
//                     //
//                     //             # Ensure .env file with production secrets is present on the server
//                     //             # (manage this securely, not typically via CI for production secrets)
//                     //
//                     //             echo "Pulling latest images from registry..."
//                     //             docker-compose pull 
//                     //             
//                     //             echo "Restarting services with new images..."
//                     //             docker-compose up -d --force-recreate --remove-orphans
//                     //             
//                     //             echo "Deployment complete."
//                     //         EOF
//                     //         """
//                     //     }
//                     // } else {
//                     //     echo "Skipping Deploy: SSH_CREDENTIALS_ID not configured."
//                     // }
//                     echo "Skipping Deploy: Deployment steps not configured in this example."
//                     echo "For Docker Compose deployment, this would typically involve:"
//                     echo "1. SSH to the target server."
//                     echo "2. Ensuring the server has a .env file with PRODUCTION secrets."
//                     echo "3. Ensuring the server has the latest docker-compose.yml (pointing to registry images)."
//                     echo "4. Running 'docker-compose pull' to get new images."
//                     echo "5. Running 'docker-compose up -d --force-recreate' to apply updates."
//                 }
//             }
//         }
//     }

//     post {
//         always {
//             echo 'Pipeline finished.'
//             // General cleanup
//             script {
//                 // Optionally remove locally built images if not pushed or needed
//                 bat "docker rmi ${env.FULL_API_GATEWAY_IMAGE_NAME} || true"
//                 bat "docker rmi ${env.FULL_AUTH_SERVICE_IMAGE_NAME} || true"
//                 bat "docker rmi ${env.FULL_PATIENT_SERVICE_IMAGE_NAME} || true"
                
//                 // Ensure all docker-compose services are down if any were left running by mistake
//                 // (Integration test stage should handle its own cleanup)
//                 // sh "docker-compose down -v || true"
//             }
//         }
//         success {
//             echo 'Pipeline Succeeded!'
//             // Add success notifications (e.g., Slack, Email)
//         }
//         failure {
//             echo 'Pipeline Failed!'
//             // Add failure notifications
//         }
//     }
// }