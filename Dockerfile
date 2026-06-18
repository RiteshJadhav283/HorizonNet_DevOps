# Step 1: Use node:20-alpine as the base image for a lightweight production runtime
FROM node:20-alpine

# Step 2: Set the working directory inside the container to /app
WORKDIR /app

# Step 3: Copy only package.json and package-lock.json first.
# By doing this before copying the rest of the source code, Docker can cache the
# installed dependencies layer. The dependencies will only reinstall if package.json
# or package-lock.json changes, making subsequent builds much faster.
COPY package.json package-lock.json ./

# Step 4: Install only production dependencies.
# Using 'npm ci --omit=dev' ensures a clean, deterministic install of only production-needed
# packages based on package-lock.json, keeping the final image as small as possible.
RUN npm ci --omit=dev

# Step 5: Copy the rest of the application source code into the container
COPY . .

# Step 6: Expose port 3000 to the container network, matching our PORT config
EXPOSE 3000

# Step 7: Specify the command to start the application
CMD ["node", "server.js"]
