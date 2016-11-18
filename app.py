from flask import Flask, render_template, request, jsonify
import json
import pandas as pd

app = Flask(__name__)

origin_destination_df = pd.read_pickle('data/travel_matrix.pk')
warr_origins_df = pd.read_pickle('data/warr_origins.pk')

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
    selected_year = request.args.get('selected_year')
    if selected_year != 'All':
        origins_series = origin_destination_df[key_destination_lga][int(selected_year)].fillna(value=0)
        return json.dumps(origins_series.to_dict())
    elif selected_year == 'All':
        # Deals with errors in adding pandas series that may arise
        try:
            values_2015 = origin_destination_df[key_destination_lga][2015].fillna(value=0)
        except:
            return json.dumps(origin_destination_df[key_destination_lga][2016].fillna(value=0).to_dict())

        try:
            values_2016 = origin_destination_df[key_destination_lga][2016].fillna(value=0)
        except:
            return json.dumps(origin_destination_df[key_destination_lga][2015].fillna(value=0).to_dict())

        output = origin_destination_df[key_destination_lga][2015].fillna(value=0) + origin_destination_df[key_destination_lga][2016].fillna(value=0)
        return json.dumps(output.to_dict())



@app.route("/get_travel_destinations", methods = ['GET'])
def travel_destinations():
    key_origin_lga = request.args.get('key_lga')
    destinations_series = origin_destination_df.loc[key_origin_lga].fillna(value=0)
    return json.dumps(destinations_series.to_dict())


@app.route("/get_origin_coords", methods = ['GET'])
def get_origin_coords():
    key_destination_lga = request.args.get('key_destination_lga')
    selected_year = request.args.get('selected_year')
    if key_destination_lga == 'WARRNAMBOOL':
        output = warr_origins_df[['Gender','Literal','origin_lat','origin_lon','Dest_Vic_Cluster','Age_Group','Year','Count']].to_dict('records')
        return json.dumps(output)
    else:
        return not_found()


@app.route("/decision-analysis")
def decision_analysis():
    return render_template('decision-analysis.html')

@app.route("/warr_map")
def warr_map():
    with open('data/sa1.topo.json') as data_file:
        data = json.load(data_file)
        return json.dumps(data)



@app.errorhandler(404)
def not_found(error=None):
    message = {
            'status': 404,
            'message': 'There does not appear to be any data for that LGA.',
    }
    resp = jsonify(message)
    resp.status_code = 404

    return resp



if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
