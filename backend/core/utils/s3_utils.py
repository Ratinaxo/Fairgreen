import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import uuid

def upload_file_to_s3(file_obj, filename, folder='fotos'):
    """
    Sube un archivo a Amazon S3 y devuelve su URL pública.
    
    :param file_obj: El archivo en memoria o temporal (ej. In-Memory Uploaded File)
    :param filename: Nombre base del archivo
    :param folder: Carpeta dentro del bucket
    :return: URL pública en S3 o None si hubo error
    """
    bucket_name = os.getenv('AWS_STORAGE_BUCKET_NAME')
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region_name = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')

    # Si no hay credenciales, abortar (útil para desarrollo local sin S3)
    if not all([bucket_name, aws_access_key, aws_secret_key]):
        return None

    # Inicializar cliente S3
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=region_name
    )

    # Generar un nombre único seguro
    # Separar extensión
    ext = os.path.splitext(filename)[1]
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    s3_key = f"{folder}/{safe_filename}"

    try:
        s3_client.upload_fileobj(
            file_obj,
            bucket_name,
            s3_key,
            ExtraArgs={
                'ContentType': file_obj.content_type if hasattr(file_obj, 'content_type') else 'image/jpeg',
                'ACL': 'public-read'
            }
        )
        
        # Construir URL
        url = f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{s3_key}"
        return url

    except (NoCredentialsError, ClientError) as e:
        print(f"Error subiendo a S3: {e}")
        return None