import asyncio
import logging
from datetime import datetime
import aiohttp
from config import settings

logger = logging.getLogger(__name__)


class TunnelHealthMonitor:
    """Monitors tunnel health and handles auto-reconnection"""
    
    def __init__(self, tunnel_manager):
        self.tunnel_manager = tunnel_manager
        self.check_interval = 30  # Check every 30 seconds
        self.max_failures = 3  # Max consecutive failures before marking unhealthy
        self.running = False
        
    async def start(self):
        """Start the health monitoring service"""
        self.running = True
        logger.info("🏥 Tunnel Health Monitor started")
        
        while self.running:
            try:
                await self._check_all_tunnels()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in health monitor: {e}")
                await asyncio.sleep(self.check_interval)
    
    async def stop(self):
        """Stop the health monitoring service"""
        self.running = False
        logger.info("🛑 Tunnel Health Monitor stopped")
    
    async def _check_all_tunnels(self):
        """Check health of all active tunnels"""
        for tunnel_id, tunnel in list(self.tunnel_manager.tunnels.items()):
            try:
                # Check 1: SSH connection alive
                if not await self._check_ssh_connection(tunnel):
                    tunnel.health_check_failures += 1
                    logger.warning(
                        f"⚠️  Tunnel {tunnel_id} SSH connection check failed "
                        f"({tunnel.health_check_failures}/{self.max_failures})"
                    )
                    
                    if tunnel.health_check_failures >= self.max_failures:
                        logger.error(f"❌ Tunnel {tunnel_id} marked unhealthy, closing")
                        await self.tunnel_manager.close_tunnel(tunnel_id)
                        await self._notify_tunnel_unhealthy(tunnel)
                    continue
                
                # Check 2: Port still accessible
                if not await self._check_port_accessible(tunnel):
                    tunnel.health_check_failures += 1
                    logger.warning(
                        f"⚠️  Tunnel {tunnel_id} port check failed "
                        f"({tunnel.health_check_failures}/{self.max_failures})"
                    )
                    
                    if tunnel.health_check_failures >= self.max_failures:
                        logger.error(f"❌ Tunnel {tunnel_id} marked unhealthy, closing")
                        await self.tunnel_manager.close_tunnel(tunnel_id)
                        await self._notify_tunnel_unhealthy(tunnel)
                    continue
                
                # Check 3: Tunnel age (auto-close after 8 hours)
                age_hours = (datetime.now().timestamp() - tunnel.created_at) / 3600
                if age_hours > 8:
                    logger.info(f"⏰ Tunnel {tunnel_id} expired (8 hours), closing")
                    await self.tunnel_manager.close_tunnel(tunnel_id)
                    await self._notify_tunnel_expired(tunnel)
                    continue
                
                # All checks passed - reset failure counter
                if tunnel.health_check_failures > 0:
                    logger.info(f"✅ Tunnel {tunnel_id} health restored")
                    tunnel.health_check_failures = 0
                
            except Exception as e:
                logger.error(f"Error checking tunnel {tunnel_id}: {e}")
    
    async def _check_ssh_connection(self, tunnel) -> bool:
        """Check if SSH connection is still alive"""
        try:
            if not tunnel.ssh_connection:
                return False
            
            # Check if connection is closing or closed
            if tunnel.ssh_connection.is_closing():
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking SSH connection: {e}")
            return False
    
    async def _check_port_accessible(self, tunnel) -> bool:
        """Check if the tunnel's remote port is accessible"""
        try:
            # Try to connect to the remote port
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection('localhost', tunnel.remote_port),
                timeout=5.0
            )
            writer.close()
            await writer.wait_closed()
            return True
            
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return False
        except Exception as e:
            logger.error(f"Error checking port accessibility: {e}")
            return False
    
    async def _notify_tunnel_unhealthy(self, tunnel):
        """Notify backend that tunnel is unhealthy"""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{settings.NODEJS_BACKEND_URL}/api/tunnels/webhook/unhealthy",
                    json={
                        "tunnel_id": tunnel.tunnel_id,
                        "user_id": tunnel.user_id,
                        "reason": "Health check failed",
                        "failures": tunnel.health_check_failures
                    },
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            logger.warning(f"Failed to notify backend about unhealthy tunnel: {e}")
    
    async def _notify_tunnel_expired(self, tunnel):
        """Notify backend that tunnel expired"""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{settings.NODEJS_BACKEND_URL}/api/tunnels/webhook/expired",
                    json={
                        "tunnel_id": tunnel.tunnel_id,
                        "user_id": tunnel.user_id,
                        "reason": "8 hour time limit reached"
                    },
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            logger.warning(f"Failed to notify backend about expired tunnel: {e}")


class TunnelMetricsCollector:
    """Collects and reports tunnel metrics"""
    
    def __init__(self, tunnel_manager):
        self.tunnel_manager = tunnel_manager
        self.collection_interval = 60  # Collect every minute
        self.running = False
    
    async def start(self):
        """Start metrics collection"""
        self.running = True
        logger.info("📊 Tunnel Metrics Collector started")
        
        while self.running:
            try:
                await self._collect_metrics()
                await asyncio.sleep(self.collection_interval)
            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")
                await asyncio.sleep(self.collection_interval)
    
    async def stop(self):
        """Stop metrics collection"""
        self.running = False
        logger.info("🛑 Tunnel Metrics Collector stopped")
    
    async def _collect_metrics(self):
        """Collect metrics from all tunnels"""
        total_tunnels = len(self.tunnel_manager.tunnels)
        total_viewers = sum(
            len(t.viewers) for t in self.tunnel_manager.tunnels.values()
        )
        total_bandwidth = sum(
            t.bytes_transferred for t in self.tunnel_manager.tunnels.values()
        )
        
        logger.info(
            f"📊 Metrics: {total_tunnels} tunnels, "
            f"{total_viewers} viewers, "
            f"{total_bandwidth / (1024*1024):.2f} MB transferred"
        )
        
        # Send metrics to backend
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{settings.NODEJS_BACKEND_URL}/api/tunnels/webhook/metrics",
                    json={
                        "total_tunnels": total_tunnels,
                        "total_viewers": total_viewers,
                        "total_bandwidth": total_bandwidth,
                        "timestamp": datetime.now().isoformat(),
                        "tunnels": [
                            {
                                "tunnel_id": t.tunnel_id,
                                "viewers": len(t.viewers),
                                "bandwidth": t.bytes_transferred,
                                "requests": t.requests_count,
                                "uptime": datetime.now().timestamp() - t.created_at
                            }
                            for t in self.tunnel_manager.tunnels.values()
                        ]
                    },
                    timeout=aiohttp.ClientTimeout(total=5)
                )
        except Exception as e:
            logger.warning(f"Failed to send metrics to backend: {e}")

