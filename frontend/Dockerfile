FROM node:22-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto de Angular
EXPOSE 4200

# Ejecutar el servidor de desarrollo en 0.0.0.0
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]
