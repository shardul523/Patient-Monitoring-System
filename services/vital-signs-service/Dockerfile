FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm i 

COPY . .

EXPOSE 8082

CMD ["npm", "start"]