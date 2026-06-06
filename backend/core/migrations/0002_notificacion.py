# Generated manually - Adds Notificacion model

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id_notificacion', models.AutoField(primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=150)),
                ('mensaje', models.TextField()),
                ('tipo', models.CharField(
                    choices=[
                        ('PUNTO_CRITICO', 'Punto Crítico Registrado'),
                        ('SISTEMA', 'Sistema'),
                    ],
                    default='SISTEMA',
                    max_length=20,
                )),
                ('leida', models.BooleanField(default=False)),
                ('fecha_hora', models.DateTimeField(auto_now_add=True)),
                ('rut_usuario', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notificaciones',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('id_seccion', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notificaciones',
                    to='core.seccion',
                )),
                ('id_muestra', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notificaciones',
                    to='core.muestra',
                )),
            ],
            options={
                'ordering': ['-fecha_hora'],
            },
        ),
    ]
