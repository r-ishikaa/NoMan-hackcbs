import asyncio
import asyncssh
import logging
import time
from typing import Dict, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
import aiohttp
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TunnelConnection:
    """Represents an active tunnel connection"""
    tunnel_id: str
    user_id: str
    username: str
    project_name: str
    local_port: int
    remote_port: int
    ssh_connection: Optional[asyncssh.SSHServerConnection] = None
    listener: Optional[asyncssh.SSHListener] = None
    created_at: float = field(default_factory=time.time)
    viewers: Set[str] = field(default_factory=set)
    bytes_transferred: int = 0
    requests_count: int = 0
    status: str = "active"
    health_check_failures: int = 0


class TunnelManager:
    """Manages SSH reverse tunnels for localhost sharing"""
    
    def __init__(self):
        self.tunnels: Dict[str, TunnelConnection] = {}
        self.port_pool: Set[int] = set(range(settings.TUNNEL_BASE_PORT, settings.TUNNEL_MAX_PORT))
        self.used_ports: Set[int] = set()
        self.ssh_server: Optional[asyncssh.SSHServer] = None
        self._lock = asyncio.Lock()
        
    async def start_ssh_server(self):
        """Start the SSH server for accepting reverse tunnels"""
        try:
            # Generate or load SSH host key
            try:
                host_key = asyncssh.read_private_key(settings.SSH_HOST_KEY_PATH)
                logger.info(f"Loaded existing SSH host key from {settings.SSH_HOST_KEY_PATH}")
            except FileNotFoundError:
                logger.info("Generating new SSH host key...")
                host_key = asyncssh.generate_private_key('ssh-rsa')
                host_key.write_private_key(settings.SSH_HOST_KEY_PATH)
                logger.info(f"Generated and saved SSH host key to {settings.SSH_HOST_KEY_PATH}")
            
            # Start SSH server
            self.ssh_server = await asyncssh.listen(
                host=settings.SSH_HOST,
                port=settings.SSH_PORT,
                server_host_keys=[host_key],
                server_factory=lambda: SSHTunnelServer(self),
                encoding=None
            )
            
            logger.info(f"✅ SSH Tunnel Server started on {settings.SSH_HOST}:{settings.SSH_PORT}")
            logger.info(f"📡 Ready to accept reverse SSH tunnels")
            
        except Exception as e:
            logger.error(f"❌ Failed to start SSH server: {e}")
            raise
    
    async def allocate_port(self) -> Optional[int]:
        """Allocate an available port for a new tunnel"""
        async with self._lock:
            if not self.port_pool:
                logger.error("No available ports in the pool")
                return None
            
            port = self.port_pool.pop()
            self.used_ports.add(port)
            return port
    
    async def release_port(self, port: int):
        """Release a port back to the pool"""
        async with self._lock:
            if port in self.used_ports:
                self.used_ports.remove(port)
                self.port_pool.add(port)
    
    async def create_tunnel(
        self,
        tunnel_id: str,
        user_id: str,
        username: str,
        project_name: str,
        local_port: int,
        ssh_connection: asyncssh.SSHServerConnection
    ) -> Optional[TunnelConnection]:
        """Create a new reverse tunnel"""
        try:
            # Allocate a remote port
            remote_port = await self.allocate_port()
            if not remote_port:
                logger.error(f"Failed to allocate port for tunnel {tunnel_id}")
                return None
            
            # Create tunnel connection object
            tunnel = TunnelConnection(
                tunnel_id=tunnel_id,
                user_id=user_id,
                username=username,
                project_name=project_name,
                local_port=local_port,
                remote_port=remote_port,
                ssh_connection=ssh_connection
            )
            
            # Create the reverse tunnel (remote port forwarding)
            try:
                listener = await ssh_connection.forward_remote_port(
                    '0.0.0.0',  # Listen on all interfaces
                    remote_port,
                    'localhost',  # Forward to localhost on creator's machine
                    local_port
                )
                tunnel.listener = listener
                logger.info(f"✅ Created reverse tunnel: {remote_port} -> localhost:{local_port}")
                
            except Exception as e:
                logger.error(f"Failed to create reverse tunnel: {e}")
                await self.release_port(remote_port)
                return None
            
            # Store tunnel
            self.tunnels[tunnel_id] = tunnel
            
            # Notify Node.js backend
            await self._notify_backend_tunnel_created(tunnel)
            
            logger.info(f"🚀 Tunnel {tunnel_id} created for {username}/{project_name}")
            logger.info(f"   Public URL: http://{settings.PUBLIC_DOMAIN}/live/{username}/{project_name}")
            
            return tunnel
            
        except Exception as e:
            logger.error(f"Error creating tunnel {tunnel_id}: {e}")
            return None
    
    async def close_tunnel(self, tunnel_id: str):
        """Close an existing tunnel"""
        tunnel = self.tunnels.get(tunnel_id)
        if not tunnel:
            logger.warning(f"Tunnel {tunnel_id} not found")
            return
        
        try:
            # Close the listener
            if tunnel.listener:
                tunnel.listener.close()
                await tunnel.listener.wait_closed()
            
            # Release the port
            await self.release_port(tunnel.remote_port)
            
            # Remove from active tunnels
            del self.tunnels[tunnel_id]
            
            # Notify backend
            await self._notify_backend_tunnel_closed(tunnel)
            
            logger.info(f"🛑 Tunnel {tunnel_id} closed")
            
        except Exception as e:
            logger.error(f"Error closing tunnel {tunnel_id}: {e}")
    
    async def get_tunnel(self, tunnel_id: str) -> Optional[TunnelConnection]:
        """Get tunnel by ID"""
        return self.tunnels.get(tunnel_id)
    
    async def get_tunnel_by_username_project(
        self,
        username: str,
        project_name: str
    ) -> Optional[TunnelConnection]:
        """Get tunnel by username and project name"""
        for tunnel in self.tunnels.values():
            if tunnel.username == username and tunnel.project_name == project_name:
                return tunnel
        return None
    
    async def get_user_tunnels(self, user_id: str) -> list[TunnelConnection]:
        """Get all tunnels for a user"""
        return [t for t in self.tunnels.values() if t.user_id == user_id]
    
    async def add_viewer(self, tunnel_id: str, viewer_id: str) -> bool:
        """Add a viewer to a tunnel"""
        tunnel = self.tunnels.get(tunnel_id)
        if not tunnel:
            return False
        
        tunnel.viewers.add(viewer_id)
        logger.info(f"👁️  Viewer {viewer_id} joined tunnel {tunnel_id} ({len(tunnel.viewers)} viewers)")
        return True
    
    async def remove_viewer(self, tunnel_id: str, viewer_id: str):
        """Remove a viewer from a tunnel"""
        tunnel = self.tunnels.get(tunnel_id)
        if tunnel and viewer_id in tunnel.viewers:
            tunnel.viewers.discard(viewer_id)
            logger.info(f"👋 Viewer {viewer_id} left tunnel {tunnel_id} ({len(tunnel.viewers)} viewers)")
    
    async def update_stats(self, tunnel_id: str, bytes_count: int):
        """Update tunnel statistics"""
        tunnel = self.tunnels.get(tunnel_id)
        if tunnel:
            tunnel.bytes_transferred += bytes_count
            tunnel.requests_count += 1
    
    async def health_check(self):
        """Periodic health check for all tunnels"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                for tunnel_id, tunnel in list(self.tunnels.items()):
                    # Check if SSH connection is still alive
                    if tunnel.ssh_connection and tunnel.ssh_connection.is_closing():
                        logger.warning(f"⚠️  Tunnel {tunnel_id} SSH connection closed")
                        await self.close_tunnel(tunnel_id)
                        continue
                    
                    # Check tunnel age (auto-close after 8 hours)
                    age_hours = (time.time() - tunnel.created_at) / 3600
                    if age_hours > 8:
                        logger.info(f"⏰ Tunnel {tunnel_id} expired (8 hours)")
                        await self.close_tunnel(tunnel_id)
                        
            except Exception as e:
                logger.error(f"Error in health check: {e}")
    
    async def _notify_backend_tunnel_created(self, tunnel: TunnelConnection):
        """Notify Node.js backend that a tunnel was created"""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{settings.NODEJS_BACKEND_URL}/api/tunnels/webhook/created",
                    json={
                        "tunnel_id": tunnel.tunnel_id,
                        "user_id": tunnel.user_id,
                        "username": tunnel.username,
                        "project_name": tunnel.project_name,
                        "remote_port": tunnel.remote_port,
                        "public_url": f"http://{settings.PUBLIC_DOMAIN}/live/{tunnel.username}/{tunnel.project_name}",
                        "created_at": tunnel.created_at
                    },
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            logger.warning(f"Failed to notify backend about tunnel creation: {e}")
    
    async def _notify_backend_tunnel_closed(self, tunnel: TunnelConnection):
        """Notify Node.js backend that a tunnel was closed"""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{settings.NODEJS_BACKEND_URL}/api/tunnels/webhook/closed",
                    json={
                        "tunnel_id": tunnel.tunnel_id,
                        "user_id": tunnel.user_id,
                        "stats": {
                            "bytes_transferred": tunnel.bytes_transferred,
                            "requests_count": tunnel.requests_count,
                            "viewers_count": len(tunnel.viewers),
                            "duration_seconds": time.time() - tunnel.created_at
                        }
                    },
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            logger.warning(f"Failed to notify backend about tunnel closure: {e}")


class SSHTunnelServer(asyncssh.SSHServer):
    """Custom SSH server for handling tunnel authentication"""
    
    def __init__(self, tunnel_manager: TunnelManager):
        self.tunnel_manager = tunnel_manager
    
    def connection_made(self, conn: asyncssh.SSHServerConnection):
        """Called when a new SSH connection is established"""
        logger.info(f"🔌 New SSH connection from {conn.get_extra_info('peername')}")
    
    def connection_lost(self, exc):
        """Called when SSH connection is lost"""
        if exc:
            logger.warning(f"⚠️  SSH connection lost: {exc}")
        else:
            logger.info("SSH connection closed normally")
    
    def password_auth_supported(self):
        """Enable password authentication"""
        return True
    
    def validate_password(self, username: str, password: str):
        """Validate tunnel credentials
        
        Format: username = "userid:tunnelid:projectname"
                password = "localport:secretkey"
        """
        try:
            # Parse username (userid:tunnelid:projectname)
            parts = username.split(':')
            if len(parts) != 3:
                logger.warning(f"Invalid username format: {username}")
                return False
            
            user_id, tunnel_id, project_name = parts
            
            # Parse password (localport:secretkey)
            pass_parts = password.split(':')
            if len(pass_parts) != 2:
                logger.warning(f"Invalid password format")
                return False
            
            local_port, secret_key = pass_parts
            
            # Validate secret key
            if secret_key != settings.TUNNEL_SECRET_KEY:
                logger.warning(f"Invalid secret key for tunnel {tunnel_id}")
                return False
            
            # Store connection info for later use
            self._tunnel_info = {
                'user_id': user_id,
                'tunnel_id': tunnel_id,
                'project_name': project_name,
                'local_port': int(local_port),
                'username': user_id  # Will be replaced with actual username from DB
            }
            
            logger.info(f"✅ Authenticated tunnel: {tunnel_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error validating password: {e}")
            return False
    
    async def server_requested(self, listen_host, listen_port):
        """Handle remote port forwarding request"""
        try:
            if not hasattr(self, '_tunnel_info'):
                logger.error("No tunnel info available")
                return False
            
            info = self._tunnel_info
            
            # Create the tunnel
            tunnel = await self.tunnel_manager.create_tunnel(
                tunnel_id=info['tunnel_id'],
                user_id=info['user_id'],
                username=info['username'],
                project_name=info['project_name'],
                local_port=info['local_port'],
                ssh_connection=self._conn
            )
            
            if tunnel:
                logger.info(f"✅ Remote port forwarding approved for tunnel {info['tunnel_id']}")
                return True
            else:
                logger.error(f"Failed to create tunnel {info['tunnel_id']}")
                return False
                
        except Exception as e:
            logger.error(f"Error in server_requested: {e}")
            return False


# Global tunnel manager instance
tunnel_manager = TunnelManager()

