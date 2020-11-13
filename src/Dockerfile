FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 80
CMD [ "npm", "start" ]
COPY . .
