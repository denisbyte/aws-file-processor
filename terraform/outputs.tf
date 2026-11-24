output "bucket_name" {
  description = "Nom du bucket S3"
  value       = aws_s3_bucket.files.bucket
}

output "ec2_instance_id" {
  description = "Identifiant de l'instance EC2"
  value       = aws_instance.server.id
}

output "ec2_public_ip" {
  description = "Adresse IP publique du serveur"
  value       = aws_instance.server.public_ip
}

output "application_url" {
  description = "URL de l'application web"
  value       = "http://${aws_instance.server.public_ip}:${var.app_port}"
}

output "ssh_command" {
  description = "Commande de connexion SSH"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_instance.server.public_ip}"
}