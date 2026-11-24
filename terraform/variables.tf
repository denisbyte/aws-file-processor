variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Région AWS de déploiement"
}

variable "project_name" {
  type        = string
  default     = "aws-file-processor"
  description = "Project Name"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "Type de l'instance EC2"
}

variable "app_port" {
  type        = number
  default     = 3000
  description = "Port du serveur Express"
}

variable "ssh_public_key_path" {
  description = "Chemin de la clé publique SSH"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
variable "allowed_cidr" {
  description = "Adresse IP autorisée à accéder au serveur"
  type        = string
}

