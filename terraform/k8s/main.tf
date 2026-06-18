# ==============================================================================
# HorizonNet Lite IaC - Local Kubernetes Provisioning
# ==============================================================================
# LESSON: This file manages the same Kubernetes resources currently in k8s/*.yaml
# (Deployment, Service, Secret, ConfigMap) using Terraform instead of plain kubectl.
# Real organizations choose Terraform (or Helm/Kustomize via Terraform) for this
# task so that infrastructure changes go through the exact same code review,
# linting, testing, and version-control processes as the application code.
# ==============================================================================

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23.0"
    }
  }
}

# The Kubernetes provider configuration, pointed at the local Minikube kubeconfig
provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

# 1. ConfigMap for non-sensitive values
resource "kubernetes_config_map" "horizonnet_config" {
  metadata {
    name = "horizonnet-config"
  }

  data = {
    PORT = tostring(var.port)
  }
}

# 2. Secret for sensitive values
resource "kubernetes_secret" "horizonnet_secrets" {
  metadata {
    name = "horizonnet-secrets"
  }

  data = {
    MONGO_URI      = var.mongo_uri
    SESSION_SECRET = var.session_secret
    ADMIN_PASSWORD = var.admin_password
  }

  type = "Opaque"
}

# 3. Application Deployment (2 replicas for resilience and scalability)
resource "kubernetes_deployment" "horizonnet_app" {
  metadata {
    name = "horizonnet-app"
    labels = {
      app = "horizonnet"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "horizonnet"
      }
    }

    template {
      metadata {
        labels = {
          app = "horizonnet"
        }
      }

      spec {
        container {
          name              = "horizonnet-container"
          image             = "horizonnet-app:local"
          image_pull_policy = "Never" # Uses local Minikube registry image

          port {
            container_port = 3000
          }

          # Load environment variables directly from Secret and ConfigMap refs
          env_from {
            secret_ref {
              name = kubernetes_secret.horizonnet_secrets.metadata[0].name
            }
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.horizonnet_config.metadata[0].name
            }
          }

          # Liveness check triggers pod restart if app becomes unresponsive
          liveness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          # Readiness check controls traffic routing into the service endpoint
          readiness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

# 4. Service exposing port 3000 to external NodePort 30080
resource "kubernetes_service" "horizonnet_service" {
  metadata {
    name = "horizonnet-service"
  }

  spec {
    type = "NodePort"

    port {
      port        = 3000
      target_port = 3000
      node_port   = 30080
    }

    selector = {
      app = "horizonnet"
    }
  }
}
