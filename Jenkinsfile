pipeline {
    agent any
    
    environment {
        // Docker registry credentials
        DOCKER_REGISTRY = credentials('docker-registry-credentials')
        REGISTRY_URL = 'your-registry.example.com'
        
        // Kubernetes deployment credentials and config
        KUBECONFIG = credentials('kubeconfig-credentials')
        NAMESPACE = 'patient-monitoring'
        
        // Version management
        VERSION = "${env.BUILD_NUMBER}"
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        
        // Service directories
        SERVICES = ['patient-service', 'vitals-ingestion-service', 'vitals-processing-service', 'alert-service', 'notification-service', 'api-gateway']
        
        // SonarQube configuration
        SONARQUBE_SCANNER = tool 'SonarQubeScanner'
        SONARQUBE_SERVER = 'SonarQube'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Define environment based on branch
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_ENV = 'production'
                    } else if (env.BRANCH_NAME == 'staging') {
                        env.DEPLOY_ENV = 'staging'
                    } else {
                        env.DEPLOY_ENV = 'development'
                    }
                    
                    echo "Building for environment: ${env.DEPLOY_ENV}"
                    echo "Version: ${VERSION}"
                    echo "Git commit: ${GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    for (service in SERVICES) {
                        dir("services/${service}") {
                            sh 'npm ci'
                        }
                    }
                    
                    dir("services/data-generator") {
                        sh 'pip install -r requirements.txt'
                    }
                }
            }
        }
        
        stage('Lint & Code Quality') {
            parallel {
                stage('ESLint') {
                    steps {
                        script {
                            for (service in SERVICES) {
                                dir("services/${service}") {
                                    sh 'npm run lint'
                                }
                            }
                        }
                    }
                }
                
                stage('Python Lint') {
                    steps {
                        dir("services/data-generator") {
                            sh 'flake8 .'
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                script {
                    for (service in SERVICES) {
                        dir("services/${service}") {
                            sh 'npm test'
                        }
                    }
                    
                    dir("services/data-generator") {
                        sh 'python -m pytest'
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv(SONARQUBE_SERVER) {
                    script {
                        for (service in SERVICES) {
                            dir("services/${service}") {
                                sh """
                                ${SONARQUBE_SCANNER}/bin/sonar-scanner \
                                -Dsonar.projectKey=patient-monitoring-${service} \
                                -Dsonar.projectName="Patient Monitoring - ${service}" \
                                -Dsonar.projectVersion=${VERSION} \
                                -Dsonar.sources=src \
                                -Dsonar.tests=test \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                                """
                            }
                        }
                        
                        dir("services/data-generator") {
                            sh """
                            ${SONARQUBE_SCANNER}/bin/sonar-scanner \
                            -Dsonar.projectKey=patient-monitoring-data-generator \
                            -Dsonar.projectName="Patient Monitoring - Data Generator" \
                            -Dsonar.projectVersion=${VERSION} \
                            -Dsonar.sources=. \
                            -Dsonar.python.coverage.reportPaths=coverage.xml
                            """
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Login to Docker registry
                    sh "docker login -u ${DOCKER_REGISTRY_USR} -p ${DOCKER_REGISTRY_PSW} ${REGISTRY_URL}"
                    
                    // Build and tag each service
                    for (service in SERVICES) {
                        def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
                        def latestTag = "${REGISTRY_URL}/${service}:latest"
                        
                        dir("services/${service}") {
                            sh "docker build -t ${imageTag} -t ${latestTag} ."
                            sh "docker push ${imageTag}"
                            
                            // Only push latest tag for main branch
                            if (env.BRANCH_NAME == 'main') {
                                sh "docker push ${latestTag}"
                            }
                        }
                    }
                    
                    // Build Python data generator
                    def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
                    def dataGenLatestTag = "${REGISTRY_URL}/data-generator:latest"
                    
                    dir("services/data-generator") {
                        sh "docker build -t ${dataGenImageTag} -t ${dataGenLatestTag} ."
                        sh "docker push ${dataGenImageTag}"
                        
                        if (env.BRANCH_NAME == 'main') {
                            sh "docker push ${dataGenLatestTag}"
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Scan each Docker image for vulnerabilities
                    for (service in SERVICES) {
                        def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
                        sh "trivy image --severity HIGH,CRITICAL ${imageTag}"
                    }
                    
                    def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
                    sh "trivy image --severity HIGH,CRITICAL ${dataGenImageTag}"
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                script {
                    // Run integration tests using Docker Compose
                    sh "docker-compose -f docker-compose.test.yml up --abort-on-container-exit"
                    sh "docker-compose -f docker-compose.test.yml down -v"
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    script {
                        // Update Kubernetes deployment manifests with new image tags
                        for (service in SERVICES) {
                            def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
                            
                            // Replace image tag in YAML file
                            sh """
                            sed -i 's|${REGISTRY_URL}/${service}:.*|${imageTag}|g' kubernetes/05-services/${service}.yaml
                            """
                            
                            // Apply the updated deployment
                            sh "kubectl apply -f kubernetes/05-services/${service}.yaml --namespace=${NAMESPACE}"
                            
                            // Wait for deployment to complete
                            sh "kubectl rollout status deployment/${service} --namespace=${NAMESPACE} --timeout=5m"
                        }
                        
                        // Create ConfigMap with version info
                        sh """
                        kubectl create configmap version-info \
                        --namespace=${NAMESPACE} \
                        --from-literal=version=${VERSION} \
                        --from-literal=git-commit=${GIT_COMMIT_SHORT} \
                        --from-literal=build-date=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                        -o yaml --dry-run=client | kubectl apply -f -
                        """
                    }
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    script {
                        // Set up port forwarding to API Gateway
                        sh "kubectl port-forward service/api-gateway 3000:3000 --namespace=${NAMESPACE} &"
                        sh "sleep 5" // Wait for port-forwarding to establish
                        
                        // Run basic health check tests
                        sh "curl -f http://localhost:3000/health"
                        
                        // Kill the port-forwarding process
                        sh "pkill -f 'port-forward'"
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Archive test reports
            junit 'services/*/test-results/*.xml'
            
            // Clean up Docker images
            script {
                try {
                    for (service in SERVICES) {
                        def imageTag = "${REGISTRY_URL}/${service}:${VERSION}-${GIT_COMMIT_SHORT}"
                        sh "docker rmi ${imageTag} || true"
                    }
                    
                    def dataGenImageTag = "${REGISTRY_URL}/data-generator:${VERSION}-${GIT_COMMIT_SHORT}"
                    sh "docker rmi ${dataGenImageTag} || true"
                } catch (Exception e) {
                    echo "Warning: Failed to clean up Docker images: ${e.message}"
                }
            }
        }
        
        success {
            slackSend(
                color: 'good',
                message: "✅ Build #${env.BUILD_NUMBER} of *Patient Monitoring System* successful on branch ${env.BRANCH_NAME}\nVersion: ${VERSION}\nCommit: ${GIT_COMMIT_SHORT}\nDeployed to: ${env.DEPLOY_ENV}"
            )
        }
        
        failure {
            slackSend(
                color: 'danger',
                message: "❌ Build #${env.BUILD_NUMBER} of *Patient Monitoring System* failed on branch ${env.BRANCH_NAME}\nVersion: ${VERSION}\nCommit: ${GIT_COMMIT_SHORT}\nCheck the logs: ${env.BUILD_URL}"
            )
        }
    }
}