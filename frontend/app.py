from flask import Flask, render_template, jsonify, request
import requests
import socket

app = Flask(__name__)

# URL do backend Spring Boot
BACKEND_URL = "http://localhost:8080"


def _get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        finally:
            s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

LOCAL_IP = _get_local_ip()

@app.route('/')
def index():
    """Página principal do jogo"""
    return render_template('index.html', local_ip=LOCAL_IP)

@app.route('/api/proxy/<path:path>', methods=['GET', 'POST', 'DELETE'])
def proxy_to_backend(path):
    """Proxy para o backend FastAPI"""
    url = f"{BACKEND_URL}/api/{path}"
    
    try:
        if request.method == 'GET':
            response = requests.get(url)
        elif request.method == 'POST':
            response = requests.post(url, json=request.get_json())
        elif request.method == 'DELETE':
            response = requests.delete(url)
        
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Bind em 0.0.0.0 para permitir acesso de outros dispositivos na rede
    app.run(host='0.0.0.0', debug=True, port=5000)
