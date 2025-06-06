# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# prisma 폴더와 generated 폴더를 명확히 복사
COPY prisma ./prisma
# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["sh", "-c", "npx prisma generate && node dist/main"]
