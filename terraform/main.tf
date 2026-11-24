# Récupération du compte AWS courant

data "aws_caller_identity" "current" {}

# Récupération du VPC par défaut
data "aws_vpc" "default" {
  default = true
}

# Récupération des sous-réseaux publics du VPC
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }

  filter {
    name = "availability-zone"
    values = [
      "us-east-1a",
      "us-east-1b",
      "us-east-1c",
      "us-east-1d",
      "us-east-1f"
    ]
  }

}

# Récupération de la dernière AMI Amazon
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]


  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }


}