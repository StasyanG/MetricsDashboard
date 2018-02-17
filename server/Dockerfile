FROM node:carbon

# Create app directory
RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If building for production
# RUN npm install --only=production
RUN npm install

# Bundle app source
COPY . .

EXPOSE 4000
CMD [ "npm", "start" ]