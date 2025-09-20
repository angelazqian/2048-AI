from flask import Flask, request, send_from_directory
from flask_cors import CORS
import json
from pathlib import Path
import webbrowser
import threading
import time

app = Flask(__name__)
CORS(app)

log_file = Path("data/raw/game.jsonl")
log_file.parent.mkdir(parents=True, exist_ok=True)
log_file.touch(exist_ok=True)

# the html file
@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

# other static files (CSS, JS, etc.)
@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)

@app.route("/log", methods=["POST"])
def log_move():
    data = request.json
    with log_file.open("a") as f:
        json.dump(data, f)
        f.write("\n")
    return {"status": "ok"}

@app.route("/undo", methods=["POST"])
def undo_move():
    if log_file.exists():
        with log_file.open("r") as f:
            lines = f.readlines()
        if lines:
            last_line = lines[-1]
            with log_file.open("w") as f:
                f.writelines(lines[:-1])
            last_state = json.loads(last_line)["state"]
            last_score = json.loads(last_line)["score"]
            return {"state": last_state, "score": last_score}
    return {"state": None, "score": None}

def open_browser():
    time.sleep(1)  # wait for server to start
    webbrowser.open("http://localhost:5500")

if __name__ == "__main__":
    # open browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(port=5500, debug=True)