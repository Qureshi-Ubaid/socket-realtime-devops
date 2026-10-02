# Pipeline Execution Flow Chart

+------------------+       +-------------------+       +-----------------------+
|  1. Developer    | ----> | 2. GitHub Repo    | ----> | 3. GitHub Actions     |
|  (Git Push)      |       | (socket-realtime) |       |    (Ubuntu Runner)    |
+------------------+       +-------------------+       +-----------------------+
                                                                   |
                                                                   v
+------------------+       +-------------------+       +-----------------------+
| 6. Docker Hub    | <---- | 5. Build Docker   | <---- | 4. Setup Node.js &    |
|    Registry      |       |    Image          |       |    Install Deps       |
+------------------+       +-------------------+       +-----------------------+
         |
         v
+------------------+       +-------------------+       +-----------------------+
| 7. Setup         | ----> | 8. kubectl apply  | ----> | 9. Pods & Services    |
|    Minikube      |       |    Manifests      |       |    Running (Verified) |
+------------------+       +-------------------+       +-----------------------+

# Comprehensive Theory & Guide: CI/CD Pipeline with GitHub Actions, Docker & Kubernetes (Minikube)

Is project mein real-time Node.js/Socket.IO application ke liye end-to-end automated CI/CD pipeline implement ki gayi hai. Yeh document is pipeline mein istemaal hone wali saari technologies, unke architecture, aur workflow ki complete theoretical explanation hai.

---

## 📑 Table of Contents
1. Introduction to DevOps & CI/CD
2. GitHub Actions Fundamentals
3. Containerization with Docker
4. Kubernetes Orchestration & Minikube
5. Step-by-Step Pipeline Flow
6. Security & Secrets Management

---

## 1. Introduction to DevOps & CI/CD

### Continuous Integration (CI)
Continuous Integration ek software development practice hai jahan developers apne code changes ko frequently ek central repository (tulnaatmak roop se `main` branch) mein merge karte hain. 
* **Objective:** Code errors, syntax issues, aur integration bugs ko jaldi pakadna.
* **Process:** Jab bhi new code push hota hai, automated tools code ko test aur build karte hain.

### Continuous Deployment (CD)
Continuous Deployment CI ka agla step hai. Code push aur pass hone ke baad, automation pipeline application ko target environment (jaise Staging ya Production Cluster) par automatically deploy kar deti hai.
* **Objective:** Manual deployment effort ko zero karna aur rapid application release deliver karna.

---

## 2. GitHub Actions Fundamentals

GitHub Actions ek built-in CI/CD platform hai jo GitHub repository ke andar events (jaise `push`, `pull_request`) par automation workflows run karne ki suvidha deta hai.

### Key Components:
* **Workflow:** Automatic procedure jo `.github/workflows/*.yml` file ke zariye define hota hai.
* **Events:** Specific triggers (e.g., `git push origin main`) jo workflow ko start karte hain.
* **Jobs:** Pipeline ke andar discrete tasks (jaise `build-and-deploy`) jo ek specific runner par execute hote hain.
* **Steps:** Single commands ya reusable actions jo ek Job ke andar sequentially chalte hain.
* **Runner:** GitHub-hosted virtual server (e.g., `ubuntu-latest`) jo workflow tasks run karta hai.

---

## 3. Containerization with Docker

Application ko isolated environment mein package karne ke liye Docker ka use hota hai. Isse "it works on my machine" wala masla khatam ho jata hai.

### Key Concepts:
* **Dockerfile:** Blueprint file jo application image banane ke instructions hold karti hai (Node environment, dependencies installation, port exposure, entry command).
* **Docker Image:** Application code, runtime, libraries, aur configuration ka static snapshot.
* **Docker Registry (Docker Hub):** Cloud-based storage repository jahan Docker images push ki jati hain taake deployment servers (Kubernetes) unhe pull kar sakein.

---

## 4. Kubernetes Orchestration & Minikube

Kubernetes (K8s) ek container-orchestration platform hai jo containerized applications ki scaling, management, aur deployment ko automate karta hai.

### Key Components Used in Project:
* **Minikube:** Ek local Kubernetes cluster setup tool jo development aur testing ke liye production-like K8s environment simulate karta hai.
* **Pods:** Kubernetes ka sab se chota deployable unit jo ek ya zyada Docker containers ko wrap karta hai.
* **Deployments (`deployment.yaml`):** Desired state controller jo Pods ke replicas, updates, aur self-healing (agar Pod crash ho jaye toh naya spin up karna) ko manage karta hai.
* **Services (`service.yaml`):** Pods ko static IP aur network port allocation provide karta hai. Yeh Socket.IO ke real-time WebSockets traffic ko external access ke liye enable karta hai.

---

## 5. Step-by-Step Pipeline Flow

Workflow execution sequence is tarah kaam karta hai:

1. **Trigger Phase:** Developer `main` branch par code `git push` karta hai.
2. **Checkout & Environment Setup:** 
   * GitHub runner spin-up hota hai.
   * `actions/checkout@v4` code pull karta hai.
   * `actions/setup-node@v4` Node.js environment initialize karta hai.
3. **Registry Authentication:** `docker/login-action@v3` encrypted secrets ka use karke Docker Hub par secure login karta hai.
4. **Image Build & Push:** `docker/build-push-action@v5` Docker image build karke `DOCKERHUB_USERNAME/socket-realtime-app:latest` tag ke saath Docker Hub par publish kar deta hai.
5. **Cluster Initialization:** `medyagh/setup-minikube@master` runner ke andar single-node K8s cluster spin-up karta hai.
6. **Manifest Deployment:** `kubectl apply -f deployment.yaml` aur `kubectl apply -f service.yaml` execute ho kar cluster par pods rollout karte hain.
7. **Verification:** `kubectl get pods` aur `kubectl get svc` se resources ki deployment status verify hoti hai.

---

## 6. Security & Secrets Management

Pipeline Security ensure karne ke liye sensitive values ko code mein hardcode nahi kiya gaya:
* **GitHub Secrets:** Access tokens aur credentials repo level par encrypted format mein save kiye gaye hain (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
* **Scoped Tokens:** Docker Hub Par Read & Write permissions wale Personal Access Tokens (PAT) use kiye gaye hain taake unauthorized access na ho.
