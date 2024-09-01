# app.py
from flask import Flask, render_template, request, send_from_directory
import folium
import exifread
from PIL import Image
import os

app = Flask(__name__)

def get_gps_coordinates(exif_data):
    if 'GPS GPSLatitude' in exif_data and 'GPS GPSLongitude' in exif_data:
        lat_ref = exif_data['GPS GPSLatitudeRef'].values
        lon_ref = exif_data['GPS GPSLongitudeRef'].values
        lat = exif_data['GPS GPSLatitude'].values
        lon = exif_data['GPS GPSLongitude'].values
        lat = convert_to_degrees(lat, lat_ref)
        lon = convert_to_degrees(lon, lon_ref)
        return lat, lon
    return None, None

def convert_to_degrees(value, ref):
    d = float(value[0].num) / float(value[0].den)
    m = float(value[1].num) / float(value[1].den)
    s = float(value[2].num) / float(value[2].den)
    decimal = d + (m / 60.0) + (s / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def create_map_with_photos(photo_paths):
    coordinates = []
    for photo_path in photo_paths:
        with open(photo_path, 'rb') as image_file:
            exif_data = exifread.process_file(image_file)
        lat, lon = get_gps_coordinates(exif_data)
        if lat is None or lon is None:
            print(f"Position data not found: {photo_path}")
            continue
        coordinates.append((lat, lon))

    if coordinates:
        avg_lat = sum(lat for lat, _ in coordinates) / len(coordinates)
        avg_lon = sum(lon for _, lon in coordinates) / len(coordinates)
        map = folium.Map(location=[avg_lat, avg_lon], zoom_start=8)
    else:
        map = folium.Map(location=[0, 0], zoom_start=2)

    for i, (lat, lon) in enumerate(coordinates):
        photo_path = photo_paths[i]
        img = Image.open(photo_path)
        img.thumbnail((100, 100))
        thumbnail_path = os.path.join('static', f'thumbnail_{i}.jpg')
        img.save(thumbnail_path)

        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(f'<img src="/static/thumbnail_{i}.jpg" width="100" height="100">', max_width=200),
            icon=folium.Icon(icon="camera")
        ).add_to(map)

    map_html = map.get_root().render()
    with open('static/map_data.html', 'w') as f:
        f.write(map_html)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        uploaded_files = request.files.getlist('photos')
        photo_paths = []
        for file in uploaded_files:
            if file.filename != '':
                photo_path = os.path.join('uploads', file.filename)
                file.save(photo_path)
                photo_paths.append(photo_path)
        
        create_map_with_photos(photo_paths)
        return render_template('index.html', map_created=True)
    return render_template('index.html', map_created=False)

@app.route('/map')
def show_map():
    map_path = 'static/map_data.html'
    if os.path.exists(map_path):
        with open(map_path, 'r') as f:
            map_html = f.read()
        return render_template('map.html', map_exists=True, map_html=map_html)
    else:
        return render_template('map.html', map_exists=False)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(debug=True)