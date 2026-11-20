#!/bin/bash
set -e

echo "=========================================="
echo "  Seedance 一键部署脚本"
echo "=========================================="
echo ""

# 检查是否在 ECS 上运行
if ! command -v curl &> /dev/null; then
    echo "⚠️  curl 未安装，正在安装..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y curl
    elif command -v yum &> /dev/null; then
        sudo yum install -y curl
    fi
fi

# 1. 检查 Docker
echo "📦 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker 未安装，正在使用国内镜像安装..."
    
    # 检测系统类型并使用对应包管理器安装
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu 系统
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL 系统
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    else
        echo "❌ 不支持的系统，请手动安装 Docker"
        exit 1
    fi
    
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # 配置 Docker 镜像加速器
    echo "⚡ 配置 Docker 镜像加速器..."
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    echo "✅ Docker 安装成功"
else
    echo "✅ Docker 已安装"
fi

# 2. 检查 Docker Compose
echo "📦 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Docker Compose 未安装，正在检查 docker compose plugin..."
    
    # 检查是否有 docker compose (plugin 版本)
    if docker compose version &> /dev/null; then
        echo "🔗 创建 docker-compose 软链接..."
        sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose || true
    else
        echo "🐳 正在使用国内镜像下载 Docker Compose..."
        # 使用国内镜像下载
        sudo curl -L "https://ghproxy.com/https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    echo "✅ Docker Compose 安装成功"
else
    echo "✅ Docker Compose 已安装"
fi

# 3. 停止旧容器
echo ""
echo "🛑 停止旧服务..."
docker-compose down 2>/dev/null || true

# 4. 构建并启动
echo ""
echo "🚀 开始构建并启动服务..."
docker-compose up -d --build

# 5. 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 8

# 6. 检查状态
echo ""
echo "🔍 检查服务状态..."
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 部署成功！"
    echo "=========================================="
    echo "🌐 访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo '<您的ECS公网IP>')"
    echo "📚 API 文档: http://$(curl -s ifconfig.me 2>/dev/null || echo '<您的ECS公网IP>')/docs"
    echo "=========================================="
    echo ""
    echo "📝 常用命令："
    echo "  查看日志: docker-compose logs -f"
    echo "  重启服务: docker-compose restart"
    echo "  停止服务: docker-compose down"
    echo ""
else
    echo ""
    echo "❌ 部署失败！请查看日志："
    docker-compose logs
    exit 1
fi
