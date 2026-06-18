variable "port" {
  type        = number
  description = "The port the Express app runs on internally and externally"
  default     = 3000
}

variable "mongo_uri" {
  type        = string
  description = "MongoDB connection string"
  sensitive   = true
}

variable "session_secret" {
  type        = string
  description = "Express session secret"
  sensitive   = true
}

variable "admin_password" {
  type        = string
  description = "Administrator login password"
  sensitive   = true
}
