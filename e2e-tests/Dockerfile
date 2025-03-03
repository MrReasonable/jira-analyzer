# E2E tests base stage
FROM node-base AS e2e-base

# Install additional e2e-specific dependencies if needed
# RUN apt-get update && \
#     apt-get install -y \
#     some-package && \
#     rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack prepare pnpm@${PNPM_VERSION} --activate && \
    pnpm install

# Copy source code
COPY . .

# Development stage with non-root user
FROM node-base AS development-nonroot-base

# Install additional e2e-specific dependencies if needed
# RUN apt-get update && \
#     apt-get install -y \
#     some-package && \
#     rm -rf /var/lib/apt/lists/*

# Add non-root user
ARG USER_ID=1000
ARG GROUP_ID=1000

# Create user and handle group more gracefully
# First, check if a user with UID 1000 exists (likely the node user)
RUN if [ "${USER_ID}" = "1000" ] && getent passwd 1000 > /dev/null; then \
        # Use the existing node user
        usermod -d /home/node -s /bin/sh node && \
        # Ensure node user has the right group
        if [ "${GROUP_ID}" = "1000" ]; then \
            # Group ID is also 1000, we're good
            echo "Using existing node user and group"; \
        else \
            # Need to change the group
            if getent group ${GROUP_ID} > /dev/null; then \
                usermod -g ${GROUP_ID} node; \
            else \
                groupadd -g ${GROUP_ID} appgroup && \
                usermod -g ${GROUP_ID} node; \
            fi; \
        fi && \
        # Create a symlink from appuser to node for script compatibility
        ln -sf /usr/local/bin/node /usr/local/bin/appuser; \
    else \
        # Create a new user with the specified UID/GID
        if getent group ${GROUP_ID} > /dev/null; then \
            useradd -u ${USER_ID} -g ${GROUP_ID} -s /bin/sh -m appuser; \
        else \
            groupadd -g ${GROUP_ID} appuser && \
            useradd -u ${USER_ID} -g appuser -s /bin/sh -m appuser; \
        fi; \
    fi && \
    # Ensure app directory has the right permissions
    chown -R ${USER_ID}:${GROUP_ID} /app

# Install global npm packages
RUN npm install -g npm && \
    npm -g update

FROM development-nonroot-base AS development-nonroot

# Switch to non-root user
USER appuser

# Copy package files and install dependencies
COPY --chown=appuser:appuser package.json pnpm-lock.yaml ./
RUN corepack prepare pnpm@${PNPM_VERSION} --activate && \
    pnpm install

# Copy source code
COPY --chown=appuser:appuser . .

# CI stage for testing and linting
FROM node-base-ci AS ci

# Install additional e2e-specific dependencies if needed
# RUN apt-get update && \
#     apt-get install -y \
#     some-package && \
#     rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack prepare pnpm@${PNPM_VERSION} --activate && \
    pnpm install

# Copy source code
COPY . .

# Default command for CI
CMD ["pnpm", "run", "test"]
