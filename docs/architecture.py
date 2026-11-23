
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import EC2, Lambda
from diagrams.aws.storage import S3
from diagrams.aws.security import IAM
from diagrams.aws.management import Cloudwatch
from diagrams.onprem.client import Users
from diagrams.onprem.iac import Terraform


graph_attr = {
    "fontsize": "18",
    "pad": "0.6",
    "nodesep": "0.9",
    "ranksep": "1.3",
    "splines": "spline",
    "compound": "true",
}

with Diagram(
    "Plateforme AWS de traitement automatise de fichiers CSV",
    filename="docs/architecture",
    show=False,
    direction="LR",
    outformat="png",
    graph_attr=graph_attr,
):

    user = Users("Utilisateur")

    with Cluster("Infrastructure AWS") as aws:

        with Cluster("Application web"):
            ec2_role = IAM("Role IAM EC2")
            ec2 = EC2("EC2\nNode.js / Express")

        with Cluster("Traitement serverless"):
            lambda_role = IAM("Role IAM Lambda")
            processor = Lambda("Lambda Node.js\nTraitement CSV")

        with Cluster("Stockage Amazon S3"):
            bucket = S3("Bucket S3\ninput/ et output/")

        cloudwatch = Cloudwatch("CloudWatch\nLogs et monitoring")

        # Permissions IAM
        ec2_role >> Edge(
            style="dashed",
            color="gray"
        ) >> ec2

        lambda_role >> Edge(
            style="dashed",
            color="gray"
        ) >> processor

    # Flux applicatif
    user >> Edge(
    label="Upload CSV",
    labeldistance="2",
    minlen="2"
    ) >> ec2

    ec2 >> Edge(
        label="PutObject : input/"
    ) >> bucket

    bucket >> Edge(
        label="ObjectCreated : input/"
    ) >> processor

    processor >> Edge(
        label="PutObject : output/"
    ) >> bucket

    bucket >> Edge(
        label="GetObject : output/",
        style="dashed"
    ) >> ec2

    processor >> Edge(
        label="Logs"
    ) >> cloudwatch

    # Terraform : une seule liaison vers le groupe AWS
    terraform = Terraform("Terraform\nInfrastructure as Code")

    terraform >> Edge(
        label="Provisionnement AWS",
        style="dotted",
        color="blue",
        lhead=aws.name,
        constraint="false"
    ) >> ec2
