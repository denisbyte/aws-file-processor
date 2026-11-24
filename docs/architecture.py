
from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import User
from diagrams.onprem.iac import Terraform
from diagrams.aws.compute import EC2
from diagrams.aws.storage import S3
from diagrams.aws.security import IAM
from diagrams.aws.management import Cloudwatch


graph_attr = {
    "rankdir": "LR",
    "splines": "polyline",
    "nodesep": "0.7",
    "ranksep": "1.2",
    "pad": "0.5",
    "fontname": "Arial",
    "fontsize": "18",
    "compound": "true",
}

with Diagram(
    "AWS File Processor - Architecture",
    filename="docs/architecture",
    show=False,
    outformat="png",
    direction="LR",
    graph_attr=graph_attr,
):

    # Acteurs et outils externes
    user = User("Utilisateur\nNavigateur Web")
    terraform = Terraform("Terraform\nProvisionnement AWS")

    # Infrastructure AWS
    with Cluster("AWS Cloud"):

        with Cluster("Application"):
            iam = IAM(
                "IAM Role EC2\n"
                "Permissions S3"
            )

            ec2 = EC2(
                "Amazon EC2\n"
                "Node.js / Express\n"
                "Traitement CSV"
            )

        with Cluster("Stockage et supervision"):
            s3 = S3(
                "Amazon S3\n"
                "input/ : CSV\n"
                "output/ : JSON"
            )

            cloudwatch = Cloudwatch(
                "CloudWatch\n"
                "Metriques S3"
            )

        # Permissions IAM pour EC2
        iam >> Edge(
            color="#888888",
            penwidth="1.5"
        ) >> ec2

        # Supervision du stockage S3
        s3 >> Edge(
            color="#888888",
            penwidth="1.5"
        ) >> cloudwatch

    # Flux utilisateur vers application
    user >> Edge(
        label="HTTP / Upload CSV",
        color="#2874A6",
        penwidth="2"
    ) >> ec2

    # Stockage CSV et JSON
    ec2 >> Edge(
        color="#238B45",
        penwidth="2"
    ) >> s3

    # Provisionnement Terraform
    # Liaison symbolique vers l'infrastructure AWS
    terraform >> Edge(
        label="Provisionnement",
        color="#8056D9",
        style="dotted",
        penwidth="1.2",
        constraint="false",
        lhead="cluster_AWS Cloud"
    ) >> iam
