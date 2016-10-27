from flask import Flask, render_template
import json

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/lga_map")
def lga_map():
    with open('data/vic_lga.topo.json') as data_file:
        data = json.load(data_file)
        return json.dumps(data)



if __name__ == "__main__":
    app.run()
