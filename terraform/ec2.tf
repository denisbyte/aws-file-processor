resource "aws_key_pair" "ec2" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

# Groupe de sécurité EC2
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-sg"
  description = "Security group for File Processor"
  vpc_id      = data.aws_vpc.default.id

  # Accès SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  # Accès à l'application Express
  ingress {
    description = "Express HTTP"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  # Trafic sortant
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg"
  }
}


# Instance EC2
resource "aws_instance" "server" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = sort(data.aws_subnets.public.ids)[0]
  associate_public_ip_address = true

  key_name               = aws_key_pair.ec2.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  depends_on = [
    aws_iam_role_policy_attachment.s3_access
  ]

  tags = {
    Name    = "${var.project_name}-ec2"
    Project = var.project_name
  }
}