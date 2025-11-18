from flask import Flask, render_template, jsonify, request
import requests
import logging
import socket

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s [%(name)s] %(message)s')
logger = logging.getLogger('frontend.proxy')
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
    """Proxy para o backend Spring Boot"""
    url = f"{BACKEND_URL}/api/{path}"

    try:
        timeout = 8
        logger.info("Proxy %s %s -> %s", request.method, request.path, url)
        if request.method == 'GET':
            response = requests.get(url, timeout=timeout)
        elif request.method == 'POST':
            payload = request.get_json(silent=True)
            logger.debug("Payload: %s", payload)
            response = requests.post(url, json=payload, timeout=timeout)
        elif request.method == 'DELETE':
            response = requests.delete(url, timeout=timeout)

        # Tentar repassar JSON ou texto bruto
        try:
            data = response.json()
        except ValueError:
            data = {"message": response.text}
        logger.info("Proxy resp %s: %s", response.status_code, (data if isinstance(data, dict) else str(data)[:200]))
        return jsonify(data), response.status_code
    except requests.ConnectionError:
        logger.error("Backend indisponível em %s", BACKEND_URL)
        return jsonify({"detail": "Backend indisponível em " + BACKEND_URL}), 502
    except Exception as e:
        logger.exception("Erro no proxy")
        return jsonify({"detail": f"Erro no proxy: {str(e)}"}), 500

if __name__ == '__main__':
    # Bind em 0.0.0.0 para permitir acesso de outros dispositivos na rede
    app.run(host='0.0.0.0', debug=True, port=5000)
