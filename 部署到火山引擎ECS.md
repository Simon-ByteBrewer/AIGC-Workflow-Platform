# 火山引擎 ECS 一键部署指南

## 🚀 两种部署方案

### 方案一：原生部署（推荐，无 Docker） ⭐ 新
完全绕过 Docker，直接在 ECS 上部署，避免网络拉取镜像问题。

### 方案二：Docker 部署
使用容器化部署，适合有 Docker 使用经验的用户。

---

## 🎯 方案一：原生一键部署（推荐）

### 第一步：准备 ECS 实例
1. 登录[火山引擎控制台](https://console.volcengine.com/)
2. 购买一台 ECS 实例（推荐配置：2核4G，Ubuntu 22.04）
3. **安全组配置**：开放 **80 端口**（入方向规则）
4. 记录您的 ECS **公网 IP**

### 第二步：上传代码到 ECS

在您的本地电脑终端执行：

```bash
# 1. 打包代码
cd /Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web
tar -czvf seedance-app.tar.gz . --exclude='node_modules' --exclude='.git' --exclude='__pycache__' --exclude='.venv'

# 2. 上传到 ECS（替换为您的实际IP）
scp seedance-app.tar.gz root@<您的ECS公网IP>:/opt/
```

### 第三步：一键部署

SSH 登录到您的 ECS，然后执行：

```bash
# 1. SSH 登录
ssh root@<您的ECS公网IP>

# 2. 解压代码
cd /opt
tar -xzvf seedance-app.tar.gz
cd seedance-app

# 3. 原生一键部署（就这一条命令！）
./deploy-native.sh
```

### 第四步：访问应用

部署完成后，打开浏览器访问：
```
http://<您的ECS公网IP>
```

API 文档地址：
```
http://<您的ECS公网IP>/docs
```

---

## 🐳 方案二：Docker 部署

### 第一步：准备 ECS 实例
1. 登录[火山引擎控制台](https://console.volcengine.com/)
2. 购买一台 ECS 实例（推荐配置：2核4G，Ubuntu 22.04）
3. **安全组配置**：开放 **80 端口**（入方向规则）
4. 记录您的 ECS **公网 IP**

### 第二步：上传代码到 ECS

在您的本地电脑终端执行：

```bash
# 1. 打包代码
cd /Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web
tar -czvf seedance-app.tar.gz . --exclude='node_modules' --exclude='.git' --exclude='__pycache__' --exclude='.venv'

# 2. 上传到 ECS（替换为您的实际IP）
scp seedance-app.tar.gz root@<您的ECS公网IP>:/opt/
```

### 第三步：一键部署

SSH 登录到您的 ECS，然后执行：

```bash
# 1. SSH 登录
ssh root@<您的ECS公网IP>

# 2. 解压代码
cd /opt
tar -xzvf seedance-app.tar.gz
cd seedance-app

# 3. 一键部署（就这一条命令！）
./deploy.sh
```

### 第四步：访问应用

部署完成后，打开浏览器访问：
```
http://<您的ECS公网IP>
```

API 文档地址：
```
http://<您的ECS公网IP>/docs
```

---

## 📝 常用管理命令

### 原生部署方案
```bash
# 查看服务状态
sudo systemctl status seedance

# 查看实时日志
sudo journalctl -u seedance -f

# 重启服务
sudo systemctl restart seedance

# 停止服务
sudo systemctl stop seedance

# 启动服务
sudo systemctl start seedance

# 更新代码后重新部署
./deploy-native.sh
```

### Docker 部署方案
```bash
# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 更新代码后重新部署
./deploy.sh
```

---

## 🔧 部署文件说明

| 文件 | 作用 |
|------|------|
| [deploy-native.sh](file:///Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web/deploy-native.sh) | 原生一键部署脚本（推荐，无 Docker） |
| [deploy.sh](file:///Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web/deploy.sh) | Docker 一键部署脚本 |
| [Dockerfile](file:///Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web/Dockerfile) | 多阶段构建镜像 |
| [docker-compose.yml](file:///Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web/docker-compose.yml) | 容器编排配置 |
| [main.py](file:///Users/bytedance/Desktop/agentkit/seedance2.0/seedance2.0 web/main.py) | 已修改，支持静态文件服务 |

---

## 💡 特性说明

- ✅ **自动安装 Docker**：脚本会自动检测并安装 Docker 和 Docker Compose
- ✅ **单容器部署**：前端和后端整合在一个容器中，简单易用
- ✅ **数据持久化**：上传的文件保存在宿主机 `./uploads` 目录
- ✅ **自动重启**：容器崩溃后自动重启
- ✅ **端口 80**：直接访问，无需加端口号

---

## ⚠️ 注意事项

1. **安全组**：务必开放 80 端口
2. **API Key**：在 Web 界面输入您的火山引擎 API Key 和 AK/SK
3. **数据备份**：定期备份 `./uploads` 目录
4. **HTTPS**：如需 HTTPS，可配置火山引擎 CDN 或负载均衡

---

## 🆘 故障排查

### 常见问题：网络连接错误

如果遇到 `curl: (35) OpenSSL SSL_connect: Connection reset` 错误，这是网络问题。脚本已更新使用国内镜像源，重新运行即可：

```bash
./deploy.sh
```

### 手动安装 Docker（备选方案）

如果自动安装仍失败，可以手动安装：

**Ubuntu/Debian 系统：**
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置稳定版仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 配置镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 创建 docker-compose 软链接
sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
```

**CentOS/RHEL 系统：**
```bash
# 安装 yum-utils
sudo yum install -y yum-utils

# 设置仓库
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 配置镜像加速器（同上）
```

安装完成后，重新运行部署脚本：
```bash
./deploy.sh
```

### 其他排查命令

```bash
# 查看详细日志
docker-compose logs

# 检查容器状态
docker-compose ps

# 手动构建镜像
docker-compose build
```

如有问题，查看日志中的错误信息即可定位。
