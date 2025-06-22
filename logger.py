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

@app.route("/undo", methods=["POST"])
def undo_move():
    if log_file.exists():
        with log_file.open("r") as f:
            lines = f.readlines()
        if lines:
            last_line = lines[-1]
            with log_file.open("w") as f:
                f.writelines(lines[:-1])  #remove last line
            last_state = json.loads(last_line)["state"]
            last_score = json.loads(last_line)["score"]
            return {"state": last_state, "score": last_score}
    return {"state": None, "score": None}

if __name__ == "__main__":
    relative = Path("index.html")
    absolute = relative.resolve().as_uri()
    webbrowser.open(absolute)
    app.run(port=5500)