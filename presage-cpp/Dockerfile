# 1. Force the amd64 architecture and use Ubuntu 22.04
FROM --platform=linux/amd64 ubuntu:22.04

# 2. Prevent Linux from pausing the build to ask you timezone/keyboard questions
ENV DEBIAN_FRONTEND=noninteractive

# 3. Update the system and install the basic tools Presage requires
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    lsb-release \
    libcurl4-openssl-dev \
    libssl-dev \
    pkg-config \
    libv4l-dev \
    libgles2-mesa-dev \
    libunwind-dev \
    gpg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. (Optional) Set up a working directory for your C++ code
WORKDIR /app

# 5. Keep the container running so you can connect to it
CMD ["tail", "-f", "/dev/null"]