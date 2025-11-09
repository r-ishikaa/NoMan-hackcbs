from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional
import aiohttp
from pydantic import BaseModel

from config import settings
from tunnel_manager import tunnel_manager
from health_monitor import TunnelHealthMonitor, TunnelMetricsCollector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Tunnel Service...")
    
    # Start SSH server
    await tunnel_manager.start_ssh_server()
    
    # Start health monitor
    health_monitor = TunnelHealthMonitor(tunnel_manager)
    health_monitor_task = asyncio.create_task(health_monitor.start())
    
    # Start metrics collector
    metrics_collector = TunnelMetricsCollector(tunnel_manager)
    metrics_task = asyncio.create_task(metrics_collector.start())
    
    logger.info("✅ Tunnel Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Tunnel Service...")
    
    # Stop monitors
    await health_monitor.stop()
    await metrics_collector.stop()
    health_monitor_task.cancel()
    metrics_task.cancel()
    
    # Close all tunnels
    for tunnel_id in list(tunnel_manager.tunnels.keys()):
        await tunnel_manager.close_tunnel(tunnel_id)
    
    logger.info("✅ Tunnel Service shutdown complete")


app = FastAPI(
    title="Hexagon Tunnel Service",
    description="SSH Reverse Tunnel Manager for LocalHost Social",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Models
class TunnelCreateRequest(BaseModel):
    user_id: str
    username: str
    project_name: str
    local_port: int


class TunnelResponse(BaseModel):
    tunnel_id: str
    username: str
    project_name: str
    remote_port: int
    public_url: str
    ssh_command: str
    status: str
    viewers_count: int
    created_at: float


class TunnelStatsResponse(BaseModel):
    tunnel_id: str
    viewers_count: int
    bytes_transferred: int
    requests_count: int
    uptime_seconds: float
    status: str


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Hexagon Tunnel Service",
        "version": "1.0.0",
        "active_tunnels": len(tunnel_manager.tunnels),
        "ssh_server": f"{settings.SSH_HOST}:{settings.SSH_PORT}"
    }


@app.get("/tunnels")
async def list_tunnels():
    """List all active tunnels"""
    tunnels = []
    for tunnel in tunnel_manager.tunnels.values():
        tunnels.append({
            "tunnel_id": tunnel.tunnel_id,
            "username": tunnel.username,
            "project_name": tunnel.project_name,
            "remote_port": tunnel.remote_port,
            "public_url": f"http://{settings.PUBLIC_DOMAIN}/live/{tunnel.username}/{tunnel.project_name}",
            "viewers_count": len(tunnel.viewers),
            "status": tunnel.status,
            "created_at": tunnel.created_at
        })
    return {"tunnels": tunnels, "count": len(tunnels)}


@app.get("/tunnels/user/{user_id}")
async def get_user_tunnels(user_id: str):
    """Get all tunnels for a specific user"""
    tunnels = await tunnel_manager.get_user_tunnels(user_id)
    return {
        "user_id": user_id,
        "tunnels": [
            {
                "tunnel_id": t.tunnel_id,
                "project_name": t.project_name,
                "remote_port": t.remote_port,
                "public_url": f"http://{settings.PUBLIC_DOMAIN}/live/{t.username}/{t.project_name}",
                "viewers_count": len(t.viewers),
                "status": t.status,
                "created_at": t.created_at
            }
            for t in tunnels
        ],
        "count": len(tunnels)
    }


@app.get("/tunnels/{tunnel_id}")
async def get_tunnel(tunnel_id: str):
    """Get tunnel details"""
    tunnel = await tunnel_manager.get_tunnel(tunnel_id)
    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    return TunnelResponse(
        tunnel_id=tunnel.tunnel_id,
        username=tunnel.username,
        project_name=tunnel.project_name,
        remote_port=tunnel.remote_port,
        public_url=f"http://{settings.PUBLIC_DOMAIN}/live/{tunnel.username}/{tunnel.project_name}",
        ssh_command=f"ssh -R {tunnel.remote_port}:localhost:{tunnel.local_port} {tunnel.user_id}:{tunnel.tunnel_id}:{tunnel.project_name}@{settings.SSH_HOST} -p {settings.SSH_PORT}",
        status=tunnel.status,
        viewers_count=len(tunnel.viewers),
        created_at=tunnel.created_at
    )


@app.get("/tunnels/{tunnel_id}/stats")
async def get_tunnel_stats(tunnel_id: str):
    """Get tunnel statistics"""
    tunnel = await tunnel_manager.get_tunnel(tunnel_id)
    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    import time
    return TunnelStatsResponse(
        tunnel_id=tunnel.tunnel_id,
        viewers_count=len(tunnel.viewers),
        bytes_transferred=tunnel.bytes_transferred,
        requests_count=tunnel.requests_count,
        uptime_seconds=time.time() - tunnel.created_at,
        status=tunnel.status
    )


@app.delete("/tunnels/{tunnel_id}")
async def close_tunnel(tunnel_id: str):
    """Close a tunnel"""
    tunnel = await tunnel_manager.get_tunnel(tunnel_id)
    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    await tunnel_manager.close_tunnel(tunnel_id)
    return {"message": "Tunnel closed successfully", "tunnel_id": tunnel_id}


@app.post("/tunnels/{tunnel_id}/viewers/{viewer_id}")
async def add_viewer(tunnel_id: str, viewer_id: str):
    """Add a viewer to a tunnel"""
    success = await tunnel_manager.add_viewer(tunnel_id, viewer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    return {"message": "Viewer added", "tunnel_id": tunnel_id, "viewer_id": viewer_id}


@app.delete("/tunnels/{tunnel_id}/viewers/{viewer_id}")
async def remove_viewer(tunnel_id: str, viewer_id: str):
    """Remove a viewer from a tunnel"""
    await tunnel_manager.remove_viewer(tunnel_id, viewer_id)
    return {"message": "Viewer removed", "tunnel_id": tunnel_id, "viewer_id": viewer_id}


# Proxy endpoint for accessing tunnels
@app.api_route("/live/{username}/{project_name}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_tunnel(username: str, project_name: str, path: str, request: Request):
    """Proxy requests to the creator's localhost through the tunnel"""
    
    # Find the tunnel
    tunnel = await tunnel_manager.get_tunnel_by_username_project(username, project_name)
    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found or offline")
    
    # Check viewer limits
    # TODO: Implement tier-based viewer limits
    
    # Construct the target URL (tunnel's remote port)
    target_url = f"http://localhost:{tunnel.remote_port}/{path}"
    
    # Get request body
    body = await request.body()
    
    # Forward the request
    try:
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=request.method,
                url=target_url,
                headers={k: v for k, v in request.headers.items() if k.lower() not in ['host', 'content-length']},
                data=body,
                allow_redirects=False,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                # Update stats
                content = await response.read()
                await tunnel_manager.update_stats(tunnel.tunnel_id, len(content))
                
                # Return response
                return Response(
                    content=content,
                    status_code=response.status,
                    headers=dict(response.headers),
                    media_type=response.content_type
                )
                
    except aiohttp.ClientError as e:
        logger.error(f"Error proxying request to tunnel {tunnel.tunnel_id}: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to tunnel")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Tunnel request timeout")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )

