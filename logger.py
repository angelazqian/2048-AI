from flask import Flask, request
from flask_cors import CORS
import json
from pathlib import Path
import webbrowser

app = Flask(__name__)
CORS(app)

log_file = Path("data/easygame.jsonl")  #jsonl is apparently better for appending
log_file.parent.mkdir(parents=True, exist_ok=True)
log_file.touch(exist_ok=True)

@app.route("/log", methods=["POST"])
def log_move():
    data = request.json
    with log_file.open("a") as f:
        json.dump(data, f)
        f.write("\n")
    return {"status": "ok"}

if __name__ == "__main__":
    relative = Path("index.html")
    absolute = relative.resolve().as_uri()
    webbrowser.open(absolute)
    app.run(port=5500)