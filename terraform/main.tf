# ==============================================================================
# HorizonNet Lite IaC - Local Docker Provisioning
# ==============================================================================
# LESSON: Terraform uses Providers to translate declarative HCL declarations into
# API calls. By changing this provider block from 'docker' to 'aws', 'google',
# or 'azure', the same tool and workflow can provision cloud infrastructure
# (such as AWS ECS, GCP Cloud Run, or Azure App Services) instead of a local container.
# The Infrastructure-as-Code (IaC) approach scales seamlessly from a developer's
# laptop to global data centers.
# ==============================================================================

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

# The Docker provider configuration. It automatically connects to the host's 
# Docker daemon using the default local unix socket.
provider "docker" {}

# Re-build the local Dockerfile as a Docker image managed by Terraform
resource "docker_image" "horizonnet_app" {
  name = "horizonnet-app:terraform"
  build {
    context    = abspath("${path.module}/..")
    dockerfile = "Dockerfile"
  }
}

# Declaratively run the container using the built image, mapping ports and env vars
resource "docker_container" "horizonnet_app_container" {
  name  = "horizonnet-app-tf"
  image = docker_image.horizonnet_app.image_id

  ports {
    internal = 3000
    external = var.port
  }

  env = [
    "PORT=3000",
    "MONGO_URI=${var.mongo_uri}",
    "SESSION_SECRET=${var.session_secret}",
    "ADMIN_PASSWORD=${var.admin_password}"
  ]
}
