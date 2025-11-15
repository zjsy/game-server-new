# Dev Container Dockerfile
FROM node:22-alpine

# 安装系统依赖
RUN apk add --no-cache \
    git \
    curl \
    bash \
    sudo \
    openssh-client \
    docker-cli \
    python3 \
    make \
    g++

# 安装 pnpm
# RUN npm install -g pnpm

# 创建开发用户
RUN addgroup -g 1001 -S fastify && \
    adduser -S fastify -u 1001 -G fastify && \
    echo "fastify ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/fastify

# 设置工作目录
WORKDIR /app

# windows bind mount 到 Linux 容器时,文件通常映射为 root:root 或容器内的默认用户
# Change ownership to fastify user
# RUN chown -R fastify:fastify /app

# 切换到开发用户
USER fastify

# 暴露端口
EXPOSE 3000 9229

# 设置默认命令
CMD ["bash"]
