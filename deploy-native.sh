#!/bin/bash
set -e

echo "=========================================="
echo "  Seedance 原生一键部署脚本（无 Docker）"
echo "=========================================="
echo ""

# 1. 检查并安装系统依赖
echo "📦 检查系统依赖..."

# 更新包管理器
if command -v apt-get &> /dev/null; then
    echo "🐧 检测到 Debian/Ubuntu 系统"
    sudo apt-get update
    sudo apt-get install -y curl git python3 python3-pip python3-venv nodejs npm
elif command -v yum &> /dev/null; then
    echo "🐧 检测到 CentOS/RHEL 系统"
    sudo yum install -y curl git python3 python3-pip nodejs npm
else
    echo "❌ 不支持的系统"
    exit 1
fi

# 2. 检查 Node.js 版本，过低的话升级
echo "📦 检查 Node.js..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js 版本过低，正在升级..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi
echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"

# 3. 配置国内镜像源
echo "⚡ 配置国内镜像源..."
npm config set registry https://registry.npmmirror.com
pip3 config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 4. 构建前端
echo ""
echo "🔨 构建前端..."
if [ ! -d "node_modules" ]; then
    npm ci
fi
npm run build

# 5. 设置 Python 虚拟环境
echo ""
echo "🐍 设置 Python 环境..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 6. 创建 systemd 服务
echo ""
echo "🔧 配置系统服务..."
sudo tee /etc/systemd/system/seedance.service > /dev/null <<EOF
[Unit]
Description=Seedance Video Generation Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
Environment="PATH=$(pwd)/.venv/bin"
ExecStart=$(pwd)/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 7. 启动服务
echo ""
echo "🚀 启动服务..."
sudo systemctl daemon-reload
sudo systemctl enable seedance
sudo systemctl restart seedance

# 8. 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 9. 检查状态
if systemctl is-active --quiet seedance; then
    echo ""
    echo "🎉 部署成功！"
    echo "=========================================="
    echo "🌐 访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo '<您的ECS公网IP>')"
    echo "📚 API 文档: http://$(curl -s ifconfig.me 2>/dev/null || echo '<您的ECS公网IP>')/docs"
    echo "=========================================="
    echo ""
    echo "📝 常用命令："
    echo "  查看状态: sudo systemctl status seedance"
    echo "  查看日志: sudo journalctl -u seedance -f"
    echo "  重启服务: sudo systemctl restart seedance"
    echo "  停止服务: sudo systemctl stop seedance"
    echo ""
else
    echo ""
    echo "❌ 部署失败！请查看日志："
    sudo journalctl -u seedance -n 50
    exit 1
fi
