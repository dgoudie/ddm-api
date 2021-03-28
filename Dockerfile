
FROM node:8

WORKDIR /usr/src/app

COPY . .

EXPOSE 8080
CMD [ "npm", "run", "prod" ]