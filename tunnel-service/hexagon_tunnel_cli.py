#!/usr/bin/env python3
"""
Hexagon Tunnel CLI - Easy localhost sharing for creators
Usage: python hexagon_tunnel_cli.py --port 3000 --project my-app
"""

import argparse
import subprocess
import sys
import os
import json
import requests
from pathlib import Path
import signal
import time

# Configuration
CONFIG_FILE = Path.home() / ".hexagon_tunnel" / "config.json"
API_BASE_URL = "http://localhost:5003"  # Node.js backend
SSH_HOST = "localhost"
SSH_PORT = 2222


class Colors:
    """Terminal colors"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def print_colored(text, color=Colors.GREEN):
    """Print colored text"""
    print(f"{color}{text}{Colors.END}")


def print_banner():
    """Print CLI banner"""
    banner = """
╔═══════════════════════════════════════════════╗
║                                               ║
║     🚀 Hexagon LocalHost Social 🚀            ║
║     Share Your Localhost with the World       ║
║                                               ║
╚═══════════════════════════════════════════════╝
    """
    print_colored(banner, Colors.CYAN)


def load_config():
    """Load configuration from file"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_config(config):
    """Save configuration to file"""
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


def login(api_url=None):
    """Login and save auth token"""
    global API_BASE_URL
    if api_url:
        API_BASE_URL = api_url
    
    print_colored("\n🔐 Login to Hexagon", Colors.HEADER)
    print("Enter your credentials:")
    
    email = input("Email: ")
    password = input("Password: ")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user', {})
            
            config = {
                'token': token,
                'user_id': user.get('_id'),
                'username': user.get('username'),
                'email': email,
                'api_url': API_BASE_URL
            }
            save_config(config)
            
            print_colored(f"\n✅ Logged in as {user.get('username')}", Colors.GREEN)
            return config
        else:
            print_colored(f"\n❌ Login failed: {response.json().get('error', 'Unknown error')}", Colors.RED)
            return None
            
    except Exception as e:
        print_colored(f"\n❌ Error: {e}", Colors.RED)
        return None


def create_tunnel(project_name, local_port, description="", framework="", language="", category="web-app"):
    """Create a tunnel via API"""
    config = load_config()
    
    if not config.get('token'):
        print_colored("❌ Not logged in. Run: python hexagon_tunnel_cli.py login", Colors.RED)
        return None
    
    api_url = config.get('api_url', API_BASE_URL)
    
    try:
        response = requests.post(
            f"{api_url}/api/tunnels/create",
            headers={"Authorization": f"Bearer {config['token']}"},
            json={
                "projectName": project_name,
                "localPort": local_port,
                "description": description,
                "framework": framework,
                "language": language,
                "category": category,
                "isPublic": True
            }
        )
        
        if response.status_code == 201:
            return response.json()
        else:
            error = response.json().get('error', 'Unknown error')
            print_colored(f"❌ Failed to create tunnel: {error}", Colors.RED)
            return None
            
    except Exception as e:
        print_colored(f"❌ Error: {e}", Colors.RED)
        return None


def start_ssh_tunnel(ssh_command, ssh_password):
    """Start SSH tunnel using sshpass"""
    print_colored("\n🔌 Connecting to tunnel server...", Colors.YELLOW)
    
    # Check if sshpass is installed
    try:
        subprocess.run(["which", "sshpass"], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print_colored("\n⚠️  sshpass not found. Installing...", Colors.YELLOW)
        print("On macOS: brew install sshpass")
        print("On Linux: sudo apt-get install sshpass")
        print("\nOr run the SSH command manually:")
        print_colored(f"\n{ssh_command}", Colors.CYAN)
        print_colored(f"Password: {ssh_password}", Colors.CYAN)
        return None
    
    # Use sshpass to automate password entry
    cmd = ["sshpass", "-p", ssh_password] + ssh_command.split()
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit to see if connection succeeds
        time.sleep(2)
        
        if process.poll() is None:
            print_colored("✅ Tunnel connected!", Colors.GREEN)
            return process
        else:
            stdout, stderr = process.communicate()
            print_colored(f"❌ Connection failed: {stderr.decode()}", Colors.RED)
            return None
            
    except Exception as e:
        print_colored(f"❌ Error starting tunnel: {e}", Colors.RED)
        return None


def go_live(args):
    """Main function to go live"""
    print_banner()
    
    # Create tunnel via API
    print_colored(f"\n📡 Creating tunnel for '{args.project}'...", Colors.YELLOW)
    
    tunnel_data = create_tunnel(
        project_name=args.project,
        local_port=args.port,
        description=args.description or "",
        framework=args.framework or "",
        language=args.language or "",
        category=args.category or "web-app"
    )
    
    if not tunnel_data:
        return
    
    connection = tunnel_data.get('connection', {})
    tunnel_info = tunnel_data.get('tunnel', {})
    
    print_colored("\n✅ Tunnel created!", Colors.GREEN)
    print(f"\n{Colors.BOLD}Project:{Colors.END} {args.project}")
    print(f"{Colors.BOLD}Local Port:{Colors.END} {args.port}")
    print(f"{Colors.BOLD}Tunnel ID:{Colors.END} {tunnel_info.get('tunnelId')}")
    
    # Display SSH connection info
    print_colored("\n" + "="*50, Colors.CYAN)
    print_colored("SSH Connection Details:", Colors.HEADER)
    print_colored("="*50, Colors.CYAN)
    print(f"\n{Colors.BOLD}Command:{Colors.END}")
    print_colored(connection.get('sshCommand'), Colors.CYAN)
    print(f"\n{Colors.BOLD}Password:{Colors.END}")
    print_colored(connection.get('sshPassword'), Colors.CYAN)
    
    # Start SSH tunnel
    if args.auto_connect:
        process = start_ssh_tunnel(
            connection.get('sshCommand'),
            connection.get('sshPassword')
        )
        
        if process:
            print_colored("\n" + "="*50, Colors.GREEN)
            print_colored("🎉 YOU'RE LIVE!", Colors.GREEN + Colors.BOLD)
            print_colored("="*50, Colors.GREEN)
            
            config = load_config()
            username = config.get('username', 'unknown')
            public_url = f"http://localhost:8001/live/{username}/{args.project}"
            
            print(f"\n{Colors.BOLD}Public URL:{Colors.END}")
            print_colored(public_url, Colors.CYAN + Colors.BOLD)
            
            print(f"\n{Colors.BOLD}Share this link with your audience!{Colors.END}")
            print("\n💡 Tips:")
            print("  • Keep this terminal open while sharing")
            print("  • Press Ctrl+C to stop sharing")
            print("  • Your app must be running on port", args.port)
            
            # Handle graceful shutdown
            def signal_handler(sig, frame):
                print_colored("\n\n🛑 Stopping tunnel...", Colors.YELLOW)
                process.terminate()
                process.wait()
                print_colored("✅ Tunnel closed. Thanks for using Hexagon!", Colors.GREEN)
                sys.exit(0)
            
            signal.signal(signal.SIGINT, signal_handler)
            
            # Keep running
            try:
                process.wait()
            except KeyboardInterrupt:
                signal_handler(None, None)
    else:
        print_colored("\n💡 Run the SSH command above to start sharing!", Colors.YELLOW)


def list_tunnels():
    """List user's active tunnels"""
    config = load_config()
    
    if not config.get('token'):
        print_colored("❌ Not logged in. Run: python hexagon_tunnel_cli.py login", Colors.RED)
        return
    
    api_url = config.get('api_url', API_BASE_URL)
    
    try:
        response = requests.get(
            f"{api_url}/api/tunnels/my-tunnels",
            headers={"Authorization": f"Bearer {config['token']}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get('tunnels', [])
            
            if not tunnels:
                print_colored("\n📭 No active tunnels", Colors.YELLOW)
                return
            
            print_colored(f"\n📡 Your Active Tunnels ({len(tunnels)}):", Colors.HEADER)
            print_colored("="*60, Colors.CYAN)
            
            for tunnel in tunnels:
                print(f"\n{Colors.BOLD}Project:{Colors.END} {tunnel['projectName']}")
                print(f"{Colors.BOLD}Status:{Colors.END} {tunnel['status']}")
                print(f"{Colors.BOLD}Viewers:{Colors.END} {tunnel['stats']['viewersCount']}")
                print(f"{Colors.BOLD}Public URL:{Colors.END} {tunnel.get('publicUrl', 'N/A')}")
                print("-"*60)
        else:
            print_colored(f"❌ Error: {response.json().get('error')}", Colors.RED)
            
    except Exception as e:
        print_colored(f"❌ Error: {e}", Colors.RED)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Hexagon Tunnel CLI - Share your localhost with the world",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Login first
  python hexagon_tunnel_cli.py login
  
  # Go live with your React app
  python hexagon_tunnel_cli.py live --project my-app --port 3000
  
  # Go live with auto-connect
  python hexagon_tunnel_cli.py live --project my-app --port 3000 --auto
  
  # List your active tunnels
  python hexagon_tunnel_cli.py list
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Login command
    login_parser = subparsers.add_parser('login', help='Login to Hexagon')
    login_parser.add_argument('--api-url', help='API URL (default: http://localhost:5003)')
    
    # Live command
    live_parser = subparsers.add_parser('live', help='Go live with your project')
    live_parser.add_argument('--project', '-p', required=True, help='Project name')
    live_parser.add_argument('--port', '-P', type=int, required=True, help='Local port')
    live_parser.add_argument('--description', '-d', help='Project description')
    live_parser.add_argument('--framework', '-f', help='Framework (react, vue, etc.)')
    live_parser.add_argument('--language', '-l', help='Language (javascript, python, etc.)')
    live_parser.add_argument('--category', '-c', help='Category (web-app, api, game, etc.)')
    live_parser.add_argument('--auto', '--auto-connect', action='store_true', help='Auto-connect SSH tunnel')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List your active tunnels')
    
    args = parser.parse_args()
    
    if args.command == 'login':
        login(args.api_url)
    elif args.command == 'live':
        go_live(args)
    elif args.command == 'list':
        list_tunnels()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

