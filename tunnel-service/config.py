from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Server Configuration
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/hexagon"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # SSH Configuration
    SSH_HOST: str = "0.0.0.0"
    SSH_PORT: int = 2222
    SSH_HOST_KEY_PATH: str = "./ssh_host_key"
    
    # Tunnel Configuration
    TUNNEL_BASE_PORT: int = 10000
    TUNNEL_MAX_PORT: int = 20000
    MAX_TUNNELS_PER_USER: int = 5
    MAX_VIEWERS_FREE: int = 10
    MAX_VIEWERS_PRO: int = 1000
    
    # Public Domain
    PUBLIC_DOMAIN: str = "localhost:8001"
    
    # Node.js Backend
    NODEJS_BACKEND_URL: str = "http://localhost:5003"
    
    # Security
    TUNNEL_SECRET_KEY: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

