# Base image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:prod"]
