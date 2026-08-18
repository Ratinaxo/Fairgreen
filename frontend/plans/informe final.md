## **DOCUMENTACIÓN TÉCNICA FAIRGREEN** 

**ÁLEX ARAVENA ÁLVARO CATALÁN GUILLERMO CASTILLO LEANDRO CHAMORRO PATRICIO HENRÍQUEZ MAXIMILIANO MIÑO RICARDO TORO BASTIÁN TREJO** 

**TALLER DE INGENIERÍA DE SOFTWARE** 

**JUNIO 2026** 

## **RESUMEN** 

El club de campo las Salinas tiene un campo de golf donde frecuentemente se le debe realizar un monitoreo a las tierras para consultar el estado de estas, sin embargo este proceso es manual, registrando datos en formato físico, retrasando procesos críticos de mantenimiento de mayor relevancia dificulta el acceso a un historial fidedigno del terreno. 

Para resolver esta problemática, se propone un sistema que facilite el registro y análisis del estado del suelo en las distintas zonas de un campo de golf. Permitiendo georeferenciar muestras, registrar parámetros técnicos y generar reportes históricos. 

Finalmente se crea una aplicación web donde se implementan todas las necesidades del cliente. 

**Palabras clave:** green, fairway, software, base de datos, sector(es). 

i 

## **ÍNDICE GENERAL** 

|**Resumen/Abstract**|**Resumen/Abstract**|**Resumen/Abstract**|**i**||
|---|---|---|---|---|
|**Índice General**|||**ii**||
|**Lista de Figuras**|||**v**||
|**Lista de Tablas**|||**vi**||
|**1**|**Introducción**||**1**||
|**Glosario**|||**1**||
|**2**|**Marco general del proyecto**||**2**||
||2.1|Descripción general del proyecto . . . . . . . . . . . . . . . . . . . . . . . . . . .|2||
||2.2|Objetivos del proyecto<br>. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|2||
|||2.2.1<br>Objetivo general<br>. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|2||
|||2.2.2<br>Objetivos específcos . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|2||
|**3**|**Situación de Estudio**||**3**||
||3.1|Descripción de la situación actual<br>. . . . . . . . . . . . . . . . . . . . . . . . . .|3||
||3.2|Problemas detectados . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|3||
||3.3|Estado del arte del tema . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|4||
|||3.3.1<br>Monitoreo de Suelo mediante IoT y Microcontroladores (Investigación Académica)||4|
|||3.3.2<br>Sistemas de Automatización y Gestión de Riego<br>. . . . . . . . . . . . . .|5||
|||3.3.3<br>Teledetección y Agricultura de Precisión con Drones (UAV). . . . . . . . .|5||
|||3.3.4<br>Inteligencia Artifcial y Modelos de Recomendación . . . . . . . . . . . .|5||
|||3.3.5<br>Soluciones Comerciales y Hardware de Alta Precisión (Turf Management)|6||
|||3.3.6<br>Componentes y Prácticas de Campo . . . . . . . . . . . . . . . . . . . . .|6||
|||3.3.7<br>Síntesis . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|7||



ii 

|**4**|**Propuesta de Solución**|**Propuesta de Solución**|||**8**|
|---|---|---|---|---|---|
||4.1|Descripción general de la solución . . . . . . . . . . . . . . .||. . . . . . . . . . .|8|
||4.2|Modelo de proceso de desarrollo . . . . . . . . . . . . . . . .||. . . . . . . . . . .|8|
||4.3|Herramientas de desarrollo . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|8|
||4.4|Arquitectura lógica y física . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|9|
|**5**|**Gestión del proyecto**||||**10**|
||5.1|Estudio de Factibilidad: técnica,|económica, legal y operacional|. . . . . . . . . .|10|
|||5.1.1<br>Factibilidad Técnica<br>.|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|10|
|||5.1.2<br>Factibilidad Económica|. . . . . . . . . . . . . . . .|. . . . . . . . . . .|10|
|||5.1.3<br>Factibilidad Legal<br>. .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|11|
|||5.1.4<br>Factibilidad Operacional . . . . . . . . . . . . . . . .||. . . . . . . . . . .|11|
||5.2|Planifcación del Proyecto<br>. .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|11|
||5.3|Identifcación del riesgo (probabilidad de ocurrencia/impacto)||. . . . . . . . . . .|11|
||5.4|Minutas de Reunión . . . . . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|12|
|**6**|**Desarrollo del proyecto**||||**14**|
||6.1|Identifcación de requerimientos|(funcionales y no funcionales)|. . . . . . . . . . .|14|
|||6.1.1<br>Requerimientos Funcionales (Historias de Usuario) . .||. . . . . . . . . . .|14|
|||6.1.2<br>Requerimientos No Funcionales (RNF) . . . . . . . .||. . . . . . . . . . .|18|
||6.2|Análisis de requerimientos (modelado del sistema)<br>. . . . . .||. . . . . . . . . . .|19|
|||6.2.1<br>Actores del Sistema . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|19|
|||6.2.2<br>Flujo del Proceso Principal . . . . . . . . . . . . . . .||. . . . . . . . . . .|20|
||6.3|Diseño del Sistema . . . . . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|20|
|||6.3.1<br>Componentes de SW .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|20|
|||6.3.2<br>Modelado del Sistema|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|21|
|||6.3.3<br>Diseño de BD . . . . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|21|
|||6.3.4<br>Interfaz . . . . . . . .|. . . . . . . . . . . . . . . . .|. . . . . . . . . . .|23|
||||||iii|



||6.4|Implementación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|25|
|---|---|---|---|
||6.5|Plan de Pruebas: Funcionales . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|25|
||6.6|Conclusiones del desarrollo del proyecto . . . . . . . . . . . . . . . . . . . . . . .|25|
|**7**|**Anexos**||**27**|



iv 

## **LISTA DE FIGURAS** 

|4.1|Arquitectura lógica y física . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|9|
|---|---|---|
|6.1|Componentes de SW. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|20|
|6.2|Modelo relacional de la base de datos. . . . . . . . . . . . . . . . . . . . . . . . .|22|



v 

## **LISTA DE TABLAS** 

|5.1|Factibilidad Económica<br>. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|10|
|---|---|---|
|5.2|Matriz de Gestión de Riesgos<br>. . . . . . . . . . . . . . . . . . . . . . . . . . . .|12|
|6.1|Historias de Usuario - Épica 1: Gestión de Usuario<br>. . . . . . . . . . . . . . . . .|14|
|6.2|Historias de Usuario - Épica 2: Gestionar los suelos del campo . . . . . . . . . . .|16|
|6.3|Historias de Usuario - Épica 3: Visualizar los datos del campo<br>. . . . . . . . . . .|17|
|6.4|Requerimientos No Funcionales (RNF)<br>. . . . . . . . . . . . . . . . . . . . . . .|19|



vi 

## **1. INTRODUCCIÓN** 

El Club de Campo Las Salinas es un centro recreativo supervisado por la Armada de Chile que cuenta con diversas instalaciones especializadas. Entre sus activos más complejos destaca un campo de golf de 16 hectáreas que demanda una supervisión constantemente. 

Actualmente, la supervisión del campo está a cargo de una profesional agrónoma que semanalmente recorre las diferentes áreas del terreno para analizar los greens y los fairways asociados al hoyo. El green es el sector del campo que rodea inmediatamente al hoyo, caracterizado por un césped de corte extremadamente bajo y uniforme que exige condiciones óptimas de humedad y salinidad para garantizar el correcto rodamiento de la bola. Por otro lado, el fairway es el sector que conecta la zona de salida con el green, una extensión más amplia de pasto con un corte intermedio que requiere un control riguroso de la conductividad y temperatura del suelo para evitar plagas o zonas de sequía. El proceso actual de mantenimiento es manual; la agrónoma extrae muestras físicas en terreno, las analiza de forma aislada y, con base en su experiencia técnica, determina los procedimientos de riego o fertilización a seguir. 

Todo este flujo operativo se registra de forma manuscrita empleando lápiz y papel. Este método tradicional genera serios problemas asociados a la trazabilidad y centralización de los datos. 

Como respuesta a esta problemática, surge la plataforma Fairgreen, una solución web-móvil diseñada para digitalizar la gestión agronómica del club, estructurar la información histórica y optimizar la toma de decisiones preventivas en terreno. 

1 

## **2. MARCO GENERAL DEL PROYECTO** 

## **2.1. Descripción general del proyecto** 

El proyecto consiste en el diseño, desarrollo e implementación de una plataforma de software móvil-web llamada Fairgreen orientada a la gestión agronómica de precisión. El sistema centraliza el registro, análisis y georreferenciación de muestras de suelo extraídas en las diversas zonas del campo de golf del Club de Campo Las Salinas, proporcionando módulos estadísticos y alertas automatizadas para transformar los datos crudos del suelo en estrategias eficientes de mantenimiento preventivo. 

## **2.2. Objetivos del proyecto** 

## **2.2.1. Objetivo general** 

Digitalizar y automatizar el proceso de toma de registros, monitoreo de variables agro-técnicas y georreferenciación de muestras de suelo en el campo de golf del Club de Campo Las Salinas, proveyendo una plataforma web-móvil integral que unifique la información histórica, optimice los tiempos de respuesta operativa y elimine los flujos manuales de papel. 

## **2.2.2. Objetivos específicos** 

- Desarrollar un mapa interactivo georreferenciado de alta fidelidad que permita localizar muestras y puntos de interés de forma visual e intuitiva en terreno. 

- Implementar módulos digitales de validación matemática para registrar en tiempo real los cuatro parámetros clave del suelo: humedad, temperatura, salinidad y conductividad eléctrica. 

- Diseñar un motor automático de notificaciones y alertas que identifique de manera inmediata desvíos en las zonas de riesgo técnico denominadas Puntos Críticos. 

2 

## **3. SITUACIÓN DE ESTUDIO** 

## **3.1. Descripción de la situación actual** 

El Club de Campo Las Salinas opera bajo un esquema tradicional descentralizado en el mantenimiento de sus 16 hectáreas de terreno. El ciclo de toma de decisiones agronómicas depende enteramente del recorrido visual y el muestreo transaccional en terreno que realiza la agrónoma. Debido a la inexistencia de sensores IoT permanentes, las evaluaciones del suelo se registran a mano empleando lápiz y papel. Esta recolección en bitácoras físicas aísla la información en carpetas de archivo, impidiendo cualquier tipo de procesamiento estadístico o análisis comparativo histórico. A esta problemática se suma una desconexión crítica en la gestión operativa del campo: la agrónoma carece de mecanismos de supervisión y control directo sobre las actividades de riego que ejecutan los trabajadores y cancheros en el día a día. Los operarios realizan los riegos basándose en su propia rutina o criterios informales, pero no anotan en ninguna plataforma o soporte físico qué zonas han intervenido, bajo qué caudal, ni los horarios de ejecución de las tareas. Al no existir un canal formal de registro para las órdenes de trabajo ni para las acciones ejecutadas por el personal de mantenimiento, la agrónoma no puede contrastar los parámetros técnicos del suelo medidos en sus muestras con las acciones reales de riego aplicadas sobre el césped, lo que fragmenta por completo la consistencia de las decisiones de mantenimiento preventivo. 

## **3.2. Problemas detectados** 

- **Inexistencia de trazabilidad histórica y correlación:** Dificultad extrema para vincular la degradación actual de un green o fairway con su comportamiento hídrico de meses anteriores debido a la fragmentación de las notas en papel. Esto imposibilita determinar si un foco de sequía o salinidad se debe a un problema del suelo o a una deficiencia en los ciclos de riego aplicados previamente. 

- **Ausencia de control e invisibilidad operativa:** Falta de supervisión sobre las faenas de los operarios debido a que no anotan en ningún formato las labores que realizan ni las zonas que riegan. Esto genera una brecha de información donde la agrónoma desconoce el estado de cumplimiento de las pautas de cuidado sugeridas. 

- **Falta de registro y orden en el flujo de muestras:** El formato físico y manual de lápiz y papel dificulta mantener un orden secuencial fidedigno de las muestras recolectadas. Al no estar estandarizadas ni centralizadas, las fichas técnicas se traspapelan, se mezclan o carecen de una nomenclatura uniforme que permita identificar rápidamente a qué hoyo o sector corresponden. 

- **Latencia en la comunicación interna y asignación de tareas:** El desfase temporal entre el diagnóstico manuscrito de la agrónoma y la notificación verbal o informal de las instrucciones hacia el equipo de cancheros retrasa significativamente la mitigación de focos críticos en el césped. 

- **Vulnerabilidad y deterioro de la información:** Riesgo inminente de pérdida, extravío o 

3 

daño físico del soporte documental de papel al estar expuesto de forma directa a las condiciones climáticas y la humedad propias del trabajo en terreno. 

- **Inconsistencia interpretativa del estado del campo:** Falta de umbrales digitales parametrizados que estandarice y alerten de manera automática cuándo una muestra entra en un rango técnico de peligro (estrés hídrico, exceso de salinidad o conductividad). 

## **3.3. Estado del arte del tema** 

Para poder solucionar este problema, se puede resolver de distintas aristas, las cuales se clasificaron y en cada una de ellas se encontró lo siguiente: 

## **3.3.1. Monitoreo de Suelo mediante IoT y Microcontroladores (Investigación Académica)** 

Esta categoría agrupa los desarrollos que utilizan arquitecturas abiertas (Arduino, ESP32) para crear nodos sensores que miden múltiples parámetros. 

1. "Tamagotchi" de plantas 

   - Video Tik Tok donde muestran un tamagotchi para plantas haciendo uso de una pantalla, un sensor de medición de suelos y un arduino para que se vea el estado de las plantas. 

   - Link Tamagotchi from a plant (Sensor de suelo) 

2. Monitoreo de Suelo mediante IoT y Microcontroladores 

   - Propone un sistema autónomo de un monitoreo vertical del suelo para poder mitigar la desertificación mediante el analisis de tendencias en la aridez. Su solución se basa en una arquitectura de multisensores que mide los parámetros fisicoquímicos como el NPK, pH, la humedad, etc. a profundidades de hasta 80 cm. Además, procesa los datos para su visualización en tiempo real ya que utiliza microcontroladores como Arduino Nano 

   - Link https://www.mdpi.com/2624-7402/7/1/18 

3. Sistema de monitoreo de bajo costo para mejorar la eficiencia del nitrógeno en el suelo 

   - Propone un sistema de monitoreo del suelo para poder optimizar los cultivos mediante sensores de bajo costo que se integran en una Raspberry Pi . La solución se validó mediante experimentos en laboratorios utilizando la comunicación Modbus-RTU (RS485) y Python para poder medir diferentes variables y la humedad. Además en este estudio existe una dependencia crítica entre la precisión de los datos y la calidad del sensor por lo que requieren calibración y tienen un consumo de energía contacto que requiere alguna gestión externa. 

   - Link https://www.sciencedirect.com/science/article/pii/S240589632502508X 

4. Monitoreo económico de suelo y cultivos para mejorar el rendimiento y la sostenibilidad. 

   - Se propone un sistema de monitoreo de bajo costo para la agricultura en precisión que es orientado para optimizar el uso de los recursos en granjas pequeñas y medianas. Su solución es integrar una red de sensores con un algoritmo basado en las reglas que generan alertas automáticas. Se utiliza un microcontrolador ESP32 conectado vía wifi a 

4 

plataformas como ThingSpeak y Firebase y se emplean sensores para la humedad como el DHT22. 

   - Link https://www.mdpi.com/2624-7402/7/1/18 

5. Sistema económico de monitoreo para evitar el riego excesivo o insuficiente. 

   - Se propone un monitor de la humedad de bajo costo para poder optimizar el riesgo y poder prevenir el estrés hídrico en los cultivos. Su solución se basa en la medición de la resistencia eléctrica del suelo en tiempo real mediante sondas logrando así poder procesar los datos para poder enviarlos a una base de datos en la que la nube puede permitir una supervisión remota y poder alertar al usuario. Se utiliza un microcontrolador Arduino Uno y un módulo Wifi ESP8266, una pantalla LCD 16x2 para poder visualizar localmente y el uso de la plataforma ThingSpeak para la gestión de la . 

   - Link https://knowledge.lancashire.ac.uk/id/eprint/40206/1/40206%20IoT%20Moisture% 20Monitor%20RAJS%20%20CORRECTED%20CLEAN_.pdf 

## **3.3.2. Sistemas de Automatización y Gestión de Riego** 

Fuentes enfocadas no solo en el monitoreo, sino en la ejecución de acciones (riego automático) basadas en los datos recolectados. 

1. Monitoreo de suelos usando IOT 

   - Uso de IOT con microcontroladores, sensores de humedad y transmisión inalámbrica de datos, el sistema permite monitorear en tiempo real a través de una interfaz web e integra un mecanismo automático de riego, activado según umbrales de humedad definidos. 

   - Link https://journal.usg.ac.id/index.php/jssct/en/article/view/418 

2. Uso de sensores de monitoreos y comunicación inalámbrica: 

   - Diseñar un sistema electrónico para riego de césped de jardín empleando un sensor de humedad de suelos y comunicación inalámbrica. 

   - Link https://tesis.pucp.edu.pe/items/a6d7c395-bfd7-489c-ab5e-9f594ce54e21 

## **3.3.3. Teledetección y Agricultura de Precisión con Drones (UAV).** 

Enfoque en la obtención de datos desde el aire para cubrir grandes extensiones (como campos de golf o cultivos extensivos) mediante imágenes multiespectrales. 

1. Agricultura de precisión 

   - Implementar agricultura de precisión usando drones y sensores permitiendo la eficiencia de la gestión de riego. 

   - Link http://areaverde.es/wp-content/uploads/2021/12/09-20.pdf 

## **3.3.4. Inteligencia Artificial y Modelos de Recomendación** 

Fuentes que añaden una capa de procesamiento avanzado (Machine Learning) para convertir los datos crudos en consejos accionables para el usuario. 

5 

1. Apoyo a tomas de desiciones 

   - Se propone un sistema inteligente de apoyo a la toma de decisiones agrícolas que automatiza la selección de cultivos para optimizar la productividad y poder prevenir la degradación del suelo. Se implementan modelos de ML para procesar siete variables crítico-ambientales en tiempo real. Además se utiliza una arquitectura de nube para poder ejecutar modelos de clasificación que logran predecir el cultivo óptimo y calcula el déficit de fertilizantes. Utiliza algoritmos de random forest, google colab para el procesamiento de modelos IA y Blyn Iot para la interfaz de las recomendaciones. 

   - Link https://www.researchgate.net/publication/381359704_Smart_Soil_Monitoring_System_ With_Crop_and_Fertilizer_Recommendation_Features 

2. Machine learning para la ver la calidad del pasto 

   - El paper propone el uso de machine learning haciendo uso de imágenes entregadas por drones UAV para la predicción de la calidad del césped y el contenido de agua en el suelo. 

   - Link https://acsess.onlinelibrary.wiley.com/doi/full/10.1002/csc2.70265 

## **3.3.5. Soluciones Comerciales y Hardware de Alta Precisión (Turf Management)** 

Tecnología profesional diseñada específicamente para el mantenimiento de césped deportivo (campos de golf) con altos estándares de precisión y robustez. 

1. Metos, empresa de monitoreo de pastos 

   - Metos es una empresa especializada en campos de golf, estos hacen uso de herramientas que monitorean de forma continua parámetros como la humedad del suelo, temperatura, condiciones meteorológicas para que los dueños de los campos de golf puedan tomar decisiones que minimicen el uso del agua, optimizar la fertilización y mejorar la salud de la cancha. 

   - Link https://metos.global/es/turf-management-made-easy/ 

2. Sensor de recopilación de datos POGO: 

   - Los sensores patentados por la empresa POGO realizan el monitoreo de suelos sin la necesidad de calibración,donde puede obtener la información relacionado a la humedad y la salinidad del suelo. 

   - Link https://pogoturfpro.com/resources/POGO%20Golf%20Brochure%20-%20web.pdf 

## **3.3.6. Componentes y Prácticas de Campo** 

Fuentes relacionadas con elementos base de hardware o técnicas mecánicas de manejo de suelo. 

- Sensor de Humedad del Suelo Capacitivo 3,3-5V 

   - Consta de una ficha técnica de un componente de hardware que es esencial para la medición de la humedad que es diseñado para integrarse en sistema de monitoreo y el riesgo automatizado. Se suele utilizar par evitar una corrosión prematura de los electrodos extendiendo su vida util a mas de 3 años en condiciones de uso continuo. 

6 

- Link https://hubot.cl/producto/sensor-humedad-del-suelo-capacitivo-33-5v-sku-5004/ 

## **3.3.7. Síntesis** 

Si bien las tecnologías y métodos que se presentan son útiles para la propuesta de solución, lamentablemente ninguna de las ideas son aptas para el producto final. 

7 

## **4. PROPUESTA DE SOLUCIÓN** 

## **4.1. Descripción general de la solución** 

Sistema servirá para realizar registro de datos del estado del suelo del campo de golf del Club Naval Las Salinas, mejorando la trazabilidad de los datos. 

El sistema contará con distintos roles entre los que se incluyen administrador que tendrá un rol de supervisor que tendrá todos los privilegios de la agrónoma, además de poder asignar roles a otros usuarios. Por su parte, la agrónoma es el encargado de ejecutar las muestras, registrar los puntos críticos y detallar las condiciones técnicas de cada sector, mientras que el canchero tiene un perfil orientado a la revisión de estos detalles para ejecutar las tareas de mantenimiento indicadas. 

En el sistema se podrá georreferenciar distintos puntos críticos en las zonas de Fairway y Green, haciendo énfasis en esta última. Además, el sistema contará con un módulo de registro de muestra, en donde se completarán los datos de la misma, la ubicación, evidencia fotográfica y recomendaciones para los jardineros. 

Por último, se integrará un módulo que le permitirá al administrador y el agrónoma generar diferentes gráficos y documentos [pdf, word, excel] de los datos históricos sobre cada punto crítico para que los interesados puedan realizar las comparaciones que estimen convenientes. 

## **4.2. Modelo de proceso de desarrollo** 

El modelo del proceso de desarrollo que utilizaremos estará centrado en un modelo tradicional. Esto es debido a que mediante reuniones con el cliente, conoceremos las necesidades de este, para finalmente presentarle el producto final. 

## **4.3. Herramientas de desarrollo** 

Las herramientas para el desarrollo del software son las siguientes: 

- Para el desarrollo del frontend se hará uso de Angular dado a la modularización de las páginas, que mejora la organización del código. 

- Para el desarrollo del backend se hará uso de django por su módulo GeoDjango, ya que nos permite procesar y consultar de forma nativa los polígonos irregulares del campo de golf en PostGIS, resolviendo toda la compleja matemática espacial sin tener que programarla desde cero. 

- Se utilizará el motor de base de datos PostgreSQL, al ser un motor de código abierto, no se requiere gastos monetarios, como puede ser Oracle SQL por ejemplo. 

- Con el fin de organizar el equipo y sus tareas a desarrollar, se hace uso de Jira, aplicación cuya utilidad es la organización y seguimiento del proyecto. 

8 

- Para poder diagramar la arquitectura lógica y física, además de los casos de uso, diagramas de secuencia se usa draw.io por su facilidad de uso y además que todo el equipo tiene acceso a este. 

## **4.4. Arquitectura lógica y física** 

Figure 4.1: Arquitectura lógica y física 

- Esta es la arquitectura física y lógica del sistema, la tabla será explicada mas adelante en la sección 6.3.1 relacionada con el diseño del sistema. 

9 

## **5. GESTIÓN DEL PROYECTO** 

La correcta planificación y administración de un proyecto de software es fundamental para garantizar su viabilidad, el cumplimiento de los plazos y la calidad del producto final. En esta sección se detalla la estrategia de gestión adoptada para el desarrollo de la plataforma. 

## **5.1. Estudio de Factibilidad: técnica, económica, legal y operacional** 

## **5.1.1. Factibilidad Técnica** 

El proyecto es viable gracias a la experiencia del equipo entero para el desarrollo de aplicaciones web en el que se utilizara Python (Django) para el backend y para el frontend se usará Angular (framework utilizado anteriormente en materias pasadas de la universidad) lo que nos permite poder construir una solución más robusta y escalable. 

En base a la gestión de datos se utiliza PostgreSQL como nuestro sistema de base de datos, utilizaremos este porque es bueno para manejar grandes volúmenes de información histórica relacionada con el suelo lo que nos garantiza la integridad, el rendimiento y la capacidad de consultas avanzadas. 

El sistema tendrá funcionalidades clave como la georreferenciación de muestras, el registro de los datos en tiempo real y la generación automatizada de los informes y eso nos permitirá una gestión más eficiente sobre la información recopilada en el terreno. 

También el proyecto contará con herramientas de gestión y seguimiento como JIRA logrando así facilitar la organización de las tareas de cada uno y poder tener un control de avance del equipo y la correcta coordinación entre las etapas de desarrollo. 

## **5.1.2. Factibilidad Económica** 

El proyecto presenta costos bajos y controlados mediante el uso de tecnologías de código abierto y desarrollo interno. 

|**Componente**|**Servicio AWS**|**Especifcación**|**Costo Mensual(USD)**|
|---|---|---|---|
|Backend|EC2|t4g.small,linux|12.20|
|Frontend|CDN|Amazon CloudFront|0.00|
|Base de datos|RDS|Amazon RDS for<br>PostgreSQL|28.30|
|Almacenamiento<br>+ Estáticos|S3|10 GB/Mes|0.24|



Table 5.1: Factibilidad Económica 

Total Mensual Estimado: 40 _._ 74 Considerando una tasa de cambio de 1 USD = 900 CLP, el 

10 

costo mensual es de 36 _,_ 666 CLP. La proyección anual de infraestructura alcanza los 488 _._ 88 USD ( 439 _,_ 992 CLP). 

## **5.1.3. Factibilidad Legal** 

- Tratamiento de Datos y Uso de RUT: El sistema cumple con la normativa vigente de protección de datos al limitar la recolección de información personal al RUT de los usuarios internos. Este dato se utiliza exclusivamente para fines de autenticación, control de acceso y trazabilidad de las muestras, asegurando que no se procesen datos personales sensibles y manteniendo el enfoque en datos técnicos de suelo 

- Seguridad de la Información: Se implementa un control de acceso basado en roles (RBAC), lo que garantiza que solo el personal autorizado pueda interactuar con la plataforma y visualizar los registros técnicos, protegiendo la integridad y confidencialidad de la información operativa. 

- Reducción de Riesgos Externos: Al ser una herramienta de uso exclusivo y privado para el Club Naval de Campo Las Salinas, se minimizan los riesgos legales asociados a la exposición de datos hacia terceros o al manejo de información de clientes externos. 

## **5.1.4. Factibilidad Operacional** 

El sistema esta diseñado para usuarios que nos sean técnico como la agrónoma, cancheros y el administrador, por lo que no se requiere conocimientos informáticos avanzados para su uso ya que su enfoque está más en la simplicidad y en la eficiencia del terreno. 

La interfaz es altamente intuitiva y optimizada para el registro rápido de la información logrando así ingresar datos en el terreno. 

También el sistema aporta un valor agregado y es que se incorporan visualizaciones mediante gráficos y reportes logrando así una mejor capacidad del análisis de las muestras y pudiendo facilitar las decisiones. 

## **5.2. Planificación del Proyecto** 

La planificación del proyecto se realizó mediante una Carta Gantt, la cual permitió organizar las actividades, tareas, hitos y responsables involucrados en el desarrollo de la solución. Esta planificación facilitó el seguimiento del avance del proyecto, la distribución de responsabilidades dentro del equipo y el cumplimiento de los plazos establecidos para cada etapa del desarrollo. La Carta Gantt completa se encuentra disponible en el **Anexo 1: Tabla Gantt del proyecto** . 

## **5.3. Identificación del riesgo (probabilidad de ocurrencia/impacto)** 

11 

|**Riesgo**|**Probabilidad**|**Impacto**|**Justifcación**|**Mitigación**|**Contingencia**|
|---|---|---|---|---|---|
|Descoordinación<br>del equipo|Alta|Crítico|Equipo de 8<br>integrantes.|Uso de JIRA y<br>reuniones<br>periódicas para<br>seguimiento.|Reasignación de<br>tareas y revisión de<br>prioridades.|
|Retrasos en<br>tareas Jira|Alta|Crítico|Tareas en To<br>Do / In<br>Progress.|Monitoreo<br>constante de<br>estados (To Do /<br>In Progress).|Priorizar<br>funcionalidades<br>críticas (registro de<br>muestras).|
|Cambios en<br>requerimientos|Media|Alto|Participación<br>de agrónoma y<br>cliente.|Validación<br>constante con<br>agrónoma y<br>cliente.|Postergar features<br>secundarias<br>(reportes<br>avanzados).|
|Problemas de<br>integración|Media|Crítico|Módulos<br>Backend +<br>Frontend +<br>BD.|División clara de<br>módulos y<br>contratos de API.|Apoyo cruzado<br>entre<br>desarrolladores<br>backend y frontend<br>(todo el equipo).|



Table 5.2: Matriz de Gestión de Riesgos 

## **5.4. Minutas de Reunión** 

1. Minuta 1 (09-04-2026): Levantamiento Inicial y Diagnóstico 

   - **Participantes:** Equipo PUCV y Cliente (Felipe Sepúlveda - Gerencia). 

   - **Temas Clave:** Se realizó una visita a terreno para diagnosticar las condiciones actuales de mantenimiento. Se identificó la necesidad crítica de digitalizar el plano del campo integrando los marcadores de yardas. Se definieron las 4 variables a monitorizar: humedad, temperatura, profundidad y conductividad eléctrica. Se analizó el riego actual (medido por tiempo de ejecución y caudal) y la dificultad técnica en sectores alejados. 

   - **Acuerdos y Compromisos:** Fuerte enfoque en la experiencia de usuario (UX) para el personal de campo (jardineros). Se acordó la integración de la agrónoma en futuras sesiones. El equipo se comprometió a investigar sensores para las variables críticas y realizar benchmarking de soluciones. 

2. Minuta 2 (23-04-2026): Definición Técnica y Arquitectura 

   - **Participantes:** Equipo PUCV y Cliente (Felipe Sepúlveda - Gerencia, Carol Barría - Agrónoma). 

   - **Temas Clave:** Se estableció una "arquitectura dual" (geolocalización de datos en el campo + procesamiento estadístico). Se analizó detalladamente el proceso de muestreo de la agrónoma para estandarizar la terminología técnica y determinar áreas de cobertura. 

   - **Acuerdos y Compromisos:** Definir umbrales técnicos para la configuración de alertas 

12 

automáticas sobre la salud del pasto. El equipo de desarrollo asumió el compromiso de entregar un prototipo funcional para la próxima sesión y solicitar detalles específicos para la generación de los reportes. 

3. Minuta 3: Revisión de arquitectura Django/Angular y planificación del desarrollo por módulo 

   - **Participantes:** Equipo PUCV, Equipo de Informática del Club de Campo (Maximiliano). 

   - **Temas Clave:** Se exhibió el prototipo funcional comprometido en la sesión anterior, validando los requerimientos generales del software y la interfaz de usuario. 

      - **Definición de Arquitectura:** Se revisó en detalle la planificación del desarrollo estructurado por módulos, ratificando el uso del stack Django (Backend) y Angular (Frontend). 

      - **Infraestructura y Herramientas:** Se consultó y analizó con el área de informática la viabilidad de la arquitectura de servidores, evaluando los instrumentos y herramientas óptimas para la implementación y despliegue del sistema. 

   - **Acuerdos y Compromisos:** Definir umbrales técnicos para la configuración de alertas automáticas sobre la salud del pasto. El equipo de desarrollo asumió el compromiso de entregar un prototipo funcional para la próxima sesión y solicitar detalles específicos para la generación de los reportes. 

      - **Validación de Feedback:** Consolidar las observaciones realizadas al prototipo para su integración en el diseño definitivo de los módulos. 

      - **Compatibilidad de Infraestructura:** El equipo de desarrollo e informática (Maximiliano) coordinarán los requisitos técnicos finales del servidor para asegurar el correcto despliegue del stack seleccionado. 

      - **Detalle de Reportes:** Continuar con el levantamiento de los campos específicos requeridos para la generación de reportes automáticos basados en los umbrales de salud del pasto. 

13 

## **6. DESARROLLO DEL PROYECTO** 

## **6.1. Identificación de requerimientos (funcionales y no funcionales)** 

A continuación, se formalizan los requerimientos del sistema divididos en funcionales (basados en Historias de Usuario bajo metodologías ágiles) y no funcionales, los cuales definen los atributos de calidad de la plataforma Fairgreen para el Club Naval de Campo Las Salinas. 

## **6.1.1. Requerimientos Funcionales (Historias de Usuario)** 

## **Épica 1: Gestión de Usuario** 

|**ID**|**Nombre**|**Requerimiento funcional**|**Criterios de aceptación**|
|---|---|---|---|
|HU-01-01|Inicio de Sesión|Como usuario, quiero<br>iniciar sesión para<br>identifcarme<br>correctamente y hacer mi<br>trabajo asignado|• Las credenciales del usuario<br>serán un correo y una<br>contraseña de mínimo 8<br>caracteres, un número y un<br>carácter especial (., „ ?, ¿, !, ¡,<br>etc).<br>• No existe una plataforma de<br>registro, el encargado de<br>realizar estos será el<br>administrador del sistema<br>mediante un panel especial.|
|HU-01-02|Gestión de<br>Perfles|Como administrador,<br>quiero modifcar los<br>perfles de los trabajadores<br>registrados dentro de la<br>plataforma para que estén<br>correctamente<br>identifcados en el<br>sistema.|• El sistema permite al<br>Administrador asignar una<br>foto tipo carnet al usuario.<br>• El sistema permite añadir<br>nombre, apellido y RUT a<br>cada usuario.<br>• El sistema permite asignar un<br>perfl al usuario (Agrónomo/a,<br>Canchero/a).|



Table 6.1: Historias de Usuario - Épica 1: Gestión de Usuario 

**Épica 2: Gestionar los suelos del campo** 

14 

|**ID**|**Nombre**|**Requerimiento funcional**|**Criterios de aceptación**|
|---|---|---|---|
|HU-02-01|Registrar muestra|Como agrónoma, quiero<br>registrar los datos del<br>terreno en un módulo<br>digital para poder tener<br>trazabilidad en el<br>aseguramiento del estado<br>del campo.|• El sistema debe permitir<br>seleccionar automáticamente<br>si la muestra pertenece a la<br>zona de Green o Fairway.<br>• El formulario debe poder<br>validar el ingreso de los<br>parámetros técnicos:<br>humedad, temperatura,<br>salinidad y conductividad.<br>• El sistema debe poder<br>capturar las coordenadas<br>mediante la<br>georreferenciación al<br>momento de hacer click en el<br>mapa.<br>• El sistema debe poder<br>permitir marcar la muestra<br>como Punto Crítico y poder<br>adjuntar evidencia fotográfca.<br>• El sistema debe poder incluir<br>un campo de texto para<br>ingresar recomendaciones o<br>instrucciones de cuidado para<br>los jardineros.<br>• Cada registro debe poder<br>guardar automáticamente la<br>fecha y la hora en la que se<br>realizó la toma.<br>• El sistema debe permitir<br>guardar el registro sólo si<br>todos los campos están<br>completos.|
|HU-02-02|Designar pruebas<br>fotográfcas a una<br>muestra|Como agrónoma, quiero<br>agregar fotografías para<br>cada registro de muestra<br>para tener una referencia<br>visual clara del estado<br>actual del césped.|• El sistema debe poder permitir<br>subir mínimo 1 fotografía por<br>cada registro de muestra.<br>• El sistema debe poder permitir<br>añadir una breve descripción<br>para la fotografía adjunta.|



15 

|**ID**|**Nombre**|**Requerimiento funcional**|**Criterios de aceptación**|
|---|---|---|---|
|HU-02-03|Editar Muestra|Como agrónoma, quiero<br>editar los datos de cada<br>muestra registrada para<br>poder corregir cualquier<br>dato que se haya<br>ingresado de forma<br>errónea.|• La agrónoma puede cambiar<br>todos los campos del registro<br>que estime conveniente.<br>• El sistema debe validar que<br>ningún campo se encuentre<br>vacío al momento de<br>confrmar los cambios.<br>• El sistema actualizará los<br>datos del registro en el<br>momento que se confrmen<br>los cambios.|
|HU-02-04|Registrar puntos<br>de interés al<br>registrar muestra|Como Agrónoma, quiero<br>marcar los puntos en el<br>mapa para poder señalar<br>el lugar exacto de la toma<br>de una muestra.|• La agrónoma debe poder<br>colocar un punto en el mapa<br>para poder señalar el lugar<br>exacto de la toma de muestra.<br>• El sistema debe permitir<br>señalar el lugar exacto de la<br>muestra dentro de las zonas de<br>Green o Fairway.|



Table 6.2: Historias de Usuario - Épica 2: Gestionar los suelos del campo 

16 

**Épica 3: Visualizar los datos del campo** 

|**ID**|**Nombre**|**Requerimiento funcional**|**Criterios de aceptación**|
|---|---|---|---|
|HU-03-01|Consultar datos<br>históricos|Como usuario, quiero ver<br>los datos históricos de<br>cada punto del campo<br>como el punto crítico,<br>green y fairway para<br>poder tener un<br>seguimiento de cómo se<br>ha administrado el campo<br>en los últimos tiempos.|• El usuario al seleccionar un<br>punto del campo, el sistema<br>mostrará el registro de todas<br>las muestras recolectadas.<br>• El usuario puede seleccionar<br>uno de los registros y el<br>sistema mostrará de forma<br>detallada todos los datos de la<br>muestra en específco.|
|HU-03-02|Generación de<br>reportes e<br>informes de<br>interés|Como usuario, quiero<br>poder observar gráfcos<br>comparativos de los<br>distintos parámetros del<br>campo para así poder<br>analizar la evolución<br>histórica y detectar<br>posibles anomalías.|• Por cada punto del campo, se<br>generará un gráfco de línea<br>que indicará la evolución del<br>estado del campo asociados a<br>los parámetros de las<br>muestras.|



Table 6.3: Historias de Usuario - Épica 3: Visualizar los datos del campo 

17 

## **6.1.2. Requerimientos No Funcionales (RNF)** 

|**ID**|**Requerimiento No Funcional**|**Criterios de aceptación**|
|---|---|---|
|RNF_001|El sistema debe garantizar que el<br>acceso y las funcionalidades estén<br>restringidos según el rol del usuario.|• El Administrador debe tener<br>privilegios de supervisor y la<br>capacidad de asignar roles a<br>otros usuarios.<br>• La Agrónoma debe ser la única<br>responsable de ejecutar las<br>muestras y registrar los puntos<br>críticos.<br>• El Canchero solo debe tener un<br>perfl de revisión para ejecutar<br>sus tareas de mantenimiento.|
|RNF_002|El sistema debe permitir el registro de<br>datos en tiempo real para apoyar la<br>labor de la Agrónoma durante la toma<br>de muestras.|• El tiempo de respuesta para<br>guardar un registro de muestra<br>debe ser inferior a 3 segundos, ya<br>que un desfase puede causar<br>errores dentro del sistema.|
|RNF_003|La visualización de datos históricos y<br>la generación de gráfcos deben ser<br>rápidas para facilitar la toma de<br>decisiones.|• La carga de cualquier gráfco<br>comparativo o listado histórico<br>debe ser inferior a 5 segundos.|
|RNF_004|El sistema debe estar disponible para<br>las personas que lo requieran en<br>cualquier momento.|• La disponibilidad del sistema<br>debe ser del 99% del tiempo para<br>asegurar el registro de datos en el<br>campo y su correcta<br>visualización.|
|RNF_005|El sistema debe ser accesible a través<br>de navegadores web y estar<br>optimizado para el uso en terreno.|• La plataforma debe ser accesible<br>vía web.<br>• La interfaz para el registro de<br>muestras debe ser intuitiva, con<br>el objetivo de hacer el trabajo de<br>la Agrónoma “más sencillo y<br>ordenado”.|



18 

|**ID**|**Requerimiento No Funcional**|**Criterios de aceptación**|
|---|---|---|
|RNF_006|El sistema debe ser desarrollado<br>utilizando la pila tecnológica defnida<br>por el equipo.|• El backend debe ser desarrollado<br>en Python con el framework<br>Django, y el frontend debe usar<br>HTML, SCSS, TypeScript y<br>Angular.<br>• Las bases de datos a utilizar<br>deben ser PostgreSQL.|
|RNF_007|La aplicación debe poder ser alojada<br>en una infraestructura externa.|• El sistema debe ser desplegado<br>en un sistema externo debido a la<br>escalabilidad que tendrá el<br>sistema fnal.|
|RNF_008|El sistema debe garantizar la<br>persistencia de los registros para<br>mantener la trazabilidad de los datos<br>históricos.|• Todos los registros de muestras,<br>incluyendo coordenadas,<br>parámetros técnicos y evidencias<br>fotográfcas, deben almacenarse<br>de forma fdedigna y ser<br>accesibles para una consulta<br>histórica posterior.|



Table 6.4: Requerimientos No Funcionales (RNF) 

## **6.2. Análisis de requerimientos (modelado del sistema)** 

A partir de las Historias de Usuario y los RNF identificados, se establece el comportamiento del sistema mediante la definición de sus actores y las interacciones clave que constituyen el modelo funcional del software. 

## **6.2.1. Actores del Sistema** 

- **Administrador:** Encargado de la creación de usuarios, asignación de perfiles, modificación de datos de trabajadores y supervisión general. 

- **Agrónoma:** Actriz principal en terreno, responsable de interactuar con el mapa, georreferenciar puntos, ingresar los parámetros técnicos de las muestras, subir evidencias fotográficas y editar registros dentro de las primeras 4 horas. 

- **Canchero:** Usuario técnico de mantenimiento con permisos de lectura para revisar el historial, el estado actual de los sectores, comentarios y recomendaciones de cuidado dejados por la agrónoma. 

19 

## **6.2.2. Flujo del Proceso Principal** 

- **Autenticación:** El usuario accede mediante la URL web e ingresa su correo y contraseña. El sistema procesa el rol de manera interna para adaptar la interfaz web móvil. 

- **Muestreo en Terreno:** La Agrónoma se posiciona en el campo de golf (10 hoyos) y selecciona un punto en el mapa interactivo. El sistema captura las coordenadas de georreferenciación y discrimina de forma automática si corresponde a la zona de Green o Fairway. 

- **Captura y Validación:** Se digitan las variables técnicas (humedad, temperatura, salinidad y conductividad). Si la zona posee problemas, se marca como Punto Crítico y se obliga a subir al menos una imagen descriptiva. El sistema valida en menos de 3 segundos contra la base de datos PostgreSQL alojada en AWS. 

- **Consulta y Análisis:** Cualquier usuario puede hacer clic sobre un sector del mapa para abrir una barra lateral (sidebar) con el estado actual, comentarios o el último riego. Para análisis avanzados, el sistema extrae los datos históricos y genera un gráfico de líneas cronológico. 

## **6.3. Diseño del Sistema** 

## **6.3.1. Componentes de SW** 

Figure 6.1: Componentes de SW. 

A continuación, se detalla la interacción y responsabilidad de cada componente visualizado en el modelo arquitectónico: 

- **Capa de Presentación (Frontend / Angular):** Es la interfaz web optimizada para terreno con la que interactúan directamente los actores del sistema (Administrador, Agrónoma y Canchero). Su función principal es capturar el ingreso de datos en terreno, gestionar las solicitudes de información y renderizar los módulos interactivos. Para acelerar los tiempos de carga, los recursos y assets estáticos de la interfaz son distribuidos eficientemente a través de la red de contenidos de AWS (Amazon CDN / CloudFront). 

20 

- **Capa de Negocio (Backend / Django):** Implementada sobre el framework Django y alojada en una instancia virtual Amazon EC2. Actúa como el núcleo del sistema, recibiendo las peticiones estructuradas (operaciones CRUD) enviadas por el Frontend mediante formato JSON. Se encarga de procesar las reglas de negocio, validar los parámetros técnicos recolectados en el campo de golf y aplicar el control de acceso basado en roles (RBAC). 

- **Base de Datos Relacional (PostgreSQL):** Alojada de forma administrada en Amazon RDS. Recibe y procesa de manera fidedigna la información de los usuarios, las coordenadas georreferenciadas y las variables del suelo. 

- **Almacenamiento de Objetos (Amazon S3):** Repositorio dedicado exclusivamente a guardar los archivos binarios pesados (imágenes y evidencias fotográficas del estado del pasto) subidos por la Agrónoma, aliviando la carga de la base de datos principal y asegurando alta disponibilidad. 

## **6.3.2. Modelado del Sistema** 

A partir de los requerimientos identificados, se elaboraron distintos modelos de análisis que permiten representar el comportamiento y funcionamiento del sistema. Para ello, se desarrollaron diagramas de casos de uso, con el fin de identificar las funcionalidades disponibles para cada actor; diagramas de secuencia, para modelar la interacción entre los distintos componentes durante la ejecución de los procesos; y diagramas de actividades, para describir el flujo de trabajo asociado a las operaciones principales de la plataforma. Estos diagramas se encuentran disponibles en el **Anexo 2: Diagramas de casos de uso, secuencia y actividades** . 

## **6.3.3. Diseño de BD** 

El almacenamiento y la persistencia de la plataforma se estructuran mediante el motor relacional PostgreSQL en el entorno de producción (utilizando SQLite de manera local para el ambiente de desarrollo). Con el fin de garantizar la trazabilidad histórica de los suelos del Club Naval de Campo Las Salinas, la gestión de alertas y el control de acceso, se implementa el modelo físico relacional detallado a continuación: 

21 

Figure 6.2: Modelo relacional de la base de datos. 

## **Diccionario de Entidades y Relaciones del Sistema** 

## **Sección** 

- **Propósito:** Representa la división física y técnica de las zonas del campo de golf (ej. Greens y Fairways). 

- **Atributos:** IdSección (PK), Poligono (definición geográfica de la zona), Tipo de Tierra y Numero de Hoyo. 

## **Punto crítico** 

- **Propósito:** Almacena los sectores específicos dentro de una sección que presentan anomalías o requieren atención urgente. 

22 

- **Atributos:** IdPuntoCritico (PK), IdSección (FK), Ubicacion. 

## **Usuario** 

- **Propósito:** Gestionar las credenciales, datos de identificación y roles del personal del club. 

- **Atributos:** RUT (PK), Nombre, Apellido, Correo electrónico (identificador único), Contraseña (encriptada por el backend), Rol (RBAC para control de acceso) y RutaFoto (enlace al asset en Amazon S3). 

## **Muestra** 

- **Propósito:** Entidad central transaccional que consolida las mediciones técnicas tomadas por la agrónoma en terreno. 

- **Atributos:** IdMuestra (PK), IdSección (FK), IdPuntoCritico (FK, admite valores NULL si la muestra se toma en una zona sana), RutUsuario (FK)Parámetros Técnicos: Salinidad, Humedad, Conductividad, TemperaturaMetadata y Trazabilidad: Ubicacion (coordenadas georreferenciadas), Recomendaciones (instrucciones para el canchero) y Fecha_Hora (captura automática del servidor). 

## **Foto** 

- **Propósito:** Soporte y evidencia visual de los estados de las muestras, obligatorio si se trata de un punto crítico. 

- **Atributos:** IdFoto (PK), IdMuestra (FK), RutaArchivo (puntero al archivo físico guardado en Amazon S3) y fecha_hora_captura. 

## **Notificación** 

- **Propósito:** Gestionar las alertas del sistema (ej. advertencias de puntos críticos detectados o falta de actualización de riegos diarios) para mantener comunicados a los administradores, agrónomas y cancheros. 

- **Atributos:** IdNotificacion (PK), RUT (FK del usuario destino), IdSección (FK, NULL), IdMuestra (FK, NULL), Título, Mensaje, Fecha_Hora, Leida (booleano de control) y Tipo. 

## **6.3.4. Interfaz** 

El diseño de la interfaz de usuario (UI) de la plataforma Fairgreen está orientado bajo un enfoque de Diseño Centrado en el Usuario (DCU), priorizando la usabilidad en terreno (Mobile-First / Diseño Responsivo). Esto responde directamente al hecho de que la Agrónoma y el Canchero operan el sistema en exteriores, bajo condiciones de alta luminosidad y movilidad, utilizando dispositivos móviles Android. 

23 

A continuación, se detallan los aspectos clave de usabilidad y heurísticas de diseño implementados en la solución: 

## **Reducción de la Carga Cognitiva y Facilidad de Uso** 

- **Interfaz Basada en Mapas:** En lugar de obligar a los usuarios a navegar por complejos menús de texto o tablas densas, la pantalla principal despliega un mapa interactivo digitalizado que representa fielmente los 10 hoyos del campo de golf. 

- **Georreferenciación Intuitiva:** El registro de una Muestra se activa simplemente haciendo clic o pulsando sobre el punto exacto del mapa. El sistema abstrae la complejidad técnica capturando las coordenadas geográficas de forma automática y discriminando internamente si el sector corresponde a un Green o a un Fairway, reduciendo al mínimo la cantidad de interacciones requeridas por la Agrónoma. 

## **Consistencia y Visibilidad del Estado del Sistema** 

- **Despliegue Contextual (Sidebar):** Al seleccionar una Sección o un Punto crítico en el mapa, la plataforma evita las redirecciones o la apertura de ventanas emergentes (pop-ups) invasivas. En su lugar, se despliega una barra lateral fluida (sidebar). Esta barra muestra de manera limpia y ordenada la información crítica del sector: estado actual, parámetros técnicos, comentarios de mantenimiento y los datos del último riego. 

- **Uso de Metáforas Visuales y Pines:** Los puntos del campo se categorizan visualmente mediante marcadores o pines diferenciados en el mapa. Si una muestra es catalogada como Punto Crítico, el sistema altera visualmente el marcador para alertar al Canchero y a la Agrónoma a simple vista, cumpliendo con el principio de visibilidad de la información. 

## **Prevención y Control de Errores (Flexibilidad de Uso)** 

- **Ventana de Modificación Temporal:** Entendiendo que en el trabajo de campo pueden ocurrir errores de digitación, se otorga flexibilidad a la Agrónoma mediante la opción de Editar Muestra. Sin embargo, para resguardar la integridad e inalterabilidad de los datos históricos, el sistema restringe esta función por software, bloqueando la edición de manera automática una vez transcurridas 4 horas desde la creación del registro. 

- **Validación Activa de Formularios:** Al ingresar los parámetros técnicos (Salinidad, Humedad, Conductividad y Temperatura), los campos del formulario validan los rangos numéricos en tiempo real. Si existen datos erróneos o campos obligatorios vacíos, el botón de guardado se deshabilita dinámicamente y el sistema notifica el error antes de intentar enviar la petición al servidor, previniendo fallas de consistencia. 

24 

## **Sistema de Alertas y Notificaciones Eficientes** 

- **Comunicación Directa en Terreno:** La incorporación de la entidad Notificación en la base de datos se traduce en la interfaz como un panel de alertas centralizado. El sistema genera avisos automáticos y visuales cuando se detecta un nuevo Punto Crítico o si los datos de riego diario no han sido actualizados en la plataforma, asegurando que el canchero reciba las recomendaciones de cuidado de manera oportuna y sin retrasos de comunicación. 

## **6.4. Implementación** 

La construcción técnica del software se materializa mediante la separación estricta de entornos y un despliegue distribuido en la nube para garantizar alta disponibilidad y escalabilidad: 

- **Metodología de Trabajo:** El equipo utiliza la plataforma JIRA para la asignación de tareas, seguimiento de actividades y control del avance del proyecto. 

- **Ambiente de Desarrollo:** Se trabaja de manera local empleando el motor ligero SQLite, lo que facilita y agiliza las pruebas e iteraciones en la estructura de datos. 

- **Despliegue en Producción (Infraestructura AWS):** 

   - **Frontend (Angular):** Compilado de forma estática y distribuido mediante Amazon CloudFront (CDN) para optimizar los tiempos de carga en terreno. 

   - **Backend (Django):** Alojado en un servidor virtual Linux a través de Amazon EC2 para procesar la lógica de negocio y las peticiones REST. 

   - **Base de Datos (PostgreSQL):** Gestionada en Amazon RDS para asegurar la integridad, persistencia y trazabilidad de los datos históricos. 

   - **Almacenamiento (Amazon S3):** Repositorio dedicado para hospedar los archivos estáticos y las evidencias fotográficas capturadas por la agrónoma. 

## **6.5. Plan de Pruebas: Funcionales** 

Con el objetivo de verificar el correcto funcionamiento de las funcionalidades implementadas, se definió un conjunto de pruebas funcionales orientadas a validar el cumplimiento de los requerimientos del sistema y el comportamiento esperado de cada módulo desarrollado. Estas pruebas permiten comprobar la correcta interacción entre los componentes, la validación de datos y la ejecución de los procesos principales de la plataforma. El detalle de los casos de prueba se encuentra disponible en el **Anexo 3: Tablas de planes de prueba** . 

## **6.6. Conclusiones del desarrollo del proyecto** 

El desarrollo de la plataforma Fairgreen para el Club Naval de Campo Las Salinas consolidó con éxito el ciclo de vida del software enfocado en el trabajo en terreno. Desde la perspectiva técnica, el uso de la arquitectura dual basada en Django y Angular cumplió con creces los tiempos de respuesta exigidos en terreno, logrando que el mapa interactivo con georreferenciación automatizada simplificará el registro de muestras de la agrónoma, asegurando la persistencia de los datos, la trazabilidad histórica y un control estricto de accesos por rol (RBAC). 

25 

Por otra parte, coordinar a un equipo de 8 integrantes implicó un alto riesgo de desfases operativos; sin embargo, el uso riguroso de la plataforma JIRA y la realización de reuniones periódicas mitigaron la descoordinación, permitiendo un monitoreo constante de las tareas, una división clara de los módulos de software y un flujo de apoyo cruzado efectivo para asegurar las entregas críticas. 

Finalmente, como equipo concluimos que la innovación principal del proyecto radica en la automatización del cuidado del césped, donde el sistema aporta un alto valor agregado al transformar datos técnicos de suelo en gráficos evolutivos e históricos para prevenir anomalías, conectando directamente los hallazgos de la agrónoma con alertas e instrucciones oportunas para la labor de los cancheros. 

26 

## **7. ANEXOS** 

1. Tabla gantt del proyecto 

2. Diagramas de casos de uso, secuencia y actividades 

3. Tablas de planes de prueba 

27 

