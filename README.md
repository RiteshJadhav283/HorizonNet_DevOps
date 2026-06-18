# HorizonNet Lite

A Node.js + Express + MongoDB satellite ground station monitoring dashboard.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally or accessible via URI

## Setup & Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy the example environment file and fill in your values (e.g. MongoDB Connection String):
   ```bash
   cp .env.example .env
   ```

3. Seed sample data into MongoDB:
   ```bash
   npm run seed
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Access the application in your browser:
   - Dashboard Login: `http://localhost:3000/login.html` (Use user `admin` with the password from your `.env` file, default is `changeme123`).
   - Health Check: `http://localhost:3000/health`
   - Prometheus Metrics: `http://localhost:3000/metrics`

## Running with Docker

1. Make sure Docker is installed (Docker Compose comes bundled with modern Docker Desktop installs).
2. Make sure a `.env` file exists in the project root with real values, including a working MongoDB Atlas `MONGO_URI` (reference `.env.example` for the list of required variables).
3. Run `docker compose up --build` to build the app image and start the container.
4. Wait for logs to show the app connected successfully to MongoDB Atlas:
   ```json
   {"timestamp":"...","level":"info","event":"db_connected","mongoUri":"..."}
   ```
5. Open a browser to `http://localhost:3000/login.html` (or the configured `PORT`).
6. If the database needs seeding with sample stations and hasn't been seeded already, run:
   ```bash
   docker compose exec app node seed.js
   ```
   *Note: `docker compose exec` runs a one-off command inside an already-running container. Since the database is hosted in MongoDB Atlas (not a local database container), the seed script deletes existing data before seeding. This means running it resets the database collection rather than adding duplicate entries.*
7. To stop the app container, run:
   ```bash
   docker compose down
   ```
   *Note: Since the database is hosted in MongoDB Atlas, stopping or removing containers has no effect on your data — it remains safely stored in Atlas.*

## Running on Kubernetes (local)

This section guides you through deploying the HorizonNet Lite application on a local Kubernetes cluster (Minikube).

### Prerequisites
- `kubectl` CLI installed
- `minikube` installed (automatically selected with the Docker driver)

### 1. Start the Local Cluster
Ensure your Docker Desktop (or chosen driver) is running, then start Minikube:
```bash
minikube start
```
Verify the cluster node is ready:
```bash
kubectl get nodes
```

### 2. Make the Docker Image Available to Minikube
Local Kubernetes clusters cannot access your host machine's Docker image cache by default. To build the image directly inside Minikube's internal Docker daemon registry:
```bash
# Point your shell's docker CLI to minikube's internal docker daemon
eval $(minikube docker-env)

# Build the image inside minikube's daemon environment
docker build -t horizonnet-app:local .
```
*Note: If you close the terminal window, you will need to re-run `eval $(minikube docker-env)` in the new terminal before executing Docker builds.*

### 3. Deploy manifests to Kubernetes
Apply the configuration and deployment resource definitions:
```bash
kubectl apply -f k8s/
```
This deploys the configmap, secret (ignored in git), deployment replicas, and NodePort service.

### 4. Access the Application
To get the URL to access the NodePort service in your local browser:
```bash
minikube service horizonnet-service --url
```
Navigate to the returned URL (e.g. `http://127.0.0.1:<PORT>/login.html`) to access the dashboard.

### 5. Troubleshooting & Log Inspection
To view stdout/stderr logs from one of the active application pods:
```bash
# Get the list of running pod names
kubectl get pods

# View logs from a specific pod
kubectl logs <pod-name>
```

### 6. Demonstrating Scalability & Self-Healing
These commands demonstrate Kubernetes cluster resilience during live demonstrations:

- **Self-Healing**:
  Delete one of the active Pods manually:
  ```bash
  kubectl delete pod <pod-name>
  ```
  Immediately fetch the pod list again. You will see that Kubernetes has already initiated a new container to replace the deleted one automatically:
  ```bash
  kubectl get pods
  ```

- **Resilient Scaling**:
  Scale the deployment from 2 up to 4 instances:
  ```bash
  kubectl scale deployment horizonnet-app --replicas=4
  kubectl get pods
  ```
  Observe the 4 active replicas serving traffic. Scale back down to 2 replicas:
  ```bash
  kubectl scale deployment horizonnet-app --replicas=2
  kubectl get pods
  ```

## Infrastructure as Code (Terraform)

This project includes Terraform configurations to automate provisioning of HorizonNet Lite on both local Docker and local Kubernetes environments. This replaces manual `docker compose` or `kubectl` steps with a declarative Infrastructure-as-Code (IaC) approach.

### 1. Local Docker Provisioning (Single Container)
Managed under the `terraform/` directory. It uses the `kreuzwerker/docker` provider to build the `Dockerfile` and run a Docker container.

- **Initialize & Apply**:
  ```bash
  cd terraform
  terraform init
  terraform apply
  ```
- **Destroy**:
  ```bash
  terraform destroy
  ```

### 2. Local Kubernetes Provisioning (Multi-Replica Deployment)
Managed under the `terraform/k8s/` directory. It uses the `hashicorp/kubernetes` provider to configure the exact same configmap, secrets, deployment (2 replicas), and NodePort service.

- **Initialize & Apply**:
  ```bash
  cd terraform/k8s
  terraform init
  terraform apply
  ```
- **Destroy**:
  ```bash
  terraform destroy
  ```

### Real-World Transition to Cloud Infrastructure
In a real production environment, we swap out local providers (Docker/local Kubernetes) for cloud providers like AWS, GCP, or Azure. The rest of the Terraform configuration remains structurally identical, proving the scalability of IaC. 

For instance, to deploy to AWS, you would define the AWS provider block instead of Docker:
```hcl
provider "aws" {
  region = "us-west-2"
}
```
And instead of running a local container, you would declare resources like `aws_ecs_cluster` and `aws_ecs_service`.

## CI/CD Pipeline (Jenkins)

This project features a fully automated CI/CD pipeline defined in a declarative [Jenkinsfile](file:///Users/riteshjadhav/Projects/HorizonNet_DevOps/Jenkinsfile) running on a local Jenkins instance.

### Pipeline Stages
1. **Checkout**: Automatically pulls the latest code from the GitHub repository (`https://github.com/RiteshJadhav283/HorizonNet_DevOps.git`).
2. **Build**: Builds the Docker image from the root `Dockerfile` and tags it with both the current build number (`riteshjadhav283/horizonnet-app:<BUILD_NUMBER>`) and `latest`.
3. **Push**: Logs in to Docker Hub and pushes both tags. Credentials are securely fetched using Jenkins' credentials store, ensuring secrets are never hardcoded.
4. **Deploy**: Triggers a rolling update to the Kubernetes cluster by dynamically setting the deployment container image to the new tag:
   ```bash
   kubectl set image deployment/horizonnet-app horizonnet-container=riteshjadhav283/horizonnet-app:<BUILD_NUMBER>
   ```
   *Note: Using an imperative `kubectl set image` command avoids changing and committing code changes back to the repository from within the pipeline, preventing recursive loop triggers.*
5. **Verify**: Spins up a temporary test pod inside the cluster, curls the internal Kubernetes DNS name (`http://horizonnet-service:3000/health`), and fails the build if a `200 OK` status response is not returned.

---

### One-Time Manual Setup Steps

1. **Unlocking Jenkins**:
   - Navigate to `http://localhost:8081` in your browser.
   - Unlock using the initial admin password: `3ce4d4b9fe0c49048d7b252866ef4d89` (already retrieved).
   - Select **Install suggested plugins** and wait for it to complete. Skip user creation or configure one to log in.

2. **Docker Hub Credentials in Jenkins**:
   - From the Jenkins dashboard, go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**.
   - Click **Add Credentials**.
   - **Kind**: Select `Username with password`.
   - **ID**: Enter `docker-hub-credentials` (must match the Jenkinsfile environment variable).
   - **Username**: Enter `riteshjadhav283`.
   - **Password**: Enter your Docker Hub password or Access Token.
   - Click **Create**.

3. **Pipeline Job Configuration**:
   - On the Jenkins dashboard, click **New Item**, enter `horizonnet-pipeline`, select **Pipeline**, and click **OK**.
   - Under **Build Triggers**, check **Poll SCM** and enter schedule `H/2 * * * *` (polls GitHub every 2 minutes for new commits).
   - Under **Pipeline**:
     - **Definition**: Select `Pipeline script from SCM`.
     - **SCM**: Select `Git`.
     - **Repository URL**: `https://github.com/RiteshJadhav283/HorizonNet_DevOps.git`.
     - **Branch Specifier**: `*/main`.
     - **Script Path**: `Jenkinsfile`.
   - Click **Save**.

4. **Webhooks vs. Polling on Localhost**:
   - Typically, production environments use GitHub webhooks where GitHub sends a POST request to Jenkins on every commit. However, because our Jenkins instance is running on `localhost`, the public internet (and GitHub servers) cannot route to it directly.
   - Therefore, **SCM Polling** is used as a local network fallback. Polling means that Jenkins regularly queries the GitHub API on an interval (every 2 minutes) to check if any new commits have been pushed, and triggers a build if changes are found.

