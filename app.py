from flask import Flask, render_template, request
import json
import pandas as pd

app = Flask(__name__)

origin_destination_df = pd.read_pickle('data/travel_matrix.pk')

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/lga_map")
def lga_map():
    with open('data/vic_lga.topo.json') as data_file:
        data = json.load(data_file)
        return json.dumps(data)

@app.route("/get_travel_origins", methods = ['GET'])
def travel_origins():
    key_destination_lga = request.args.get('key_destination_lga')
    origins_series = origin_destination_df[key_destination_lga].fillna(value=0)
    return json.dumps(origins_series.to_dict())

@app.route("/get_travel_destinations", methods = ['GET'])
def travel_destinations():
    key_origin_lga = request.args.get('key_lga')
    destinations_series = origin_destination_df.loc[key_origin_lga].fillna(value=0)
    return json.dumps(destinations_series.to_dict())


if __name__ == "__main__":
    app.run()
