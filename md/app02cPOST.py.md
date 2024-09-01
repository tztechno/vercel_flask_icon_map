from flask import Flask, render_template, request, send_from_directory, flash, jsonify
import folium
import exifread
from PIL import Image
import os
import requests
import io
import tempfile

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

def download_image(url):
    response = requests.get(url)
    if response.status_code == 200:
        return io.BytesIO(response.content)
    return None

def get_gps_coordinates(image_data):
    exif_data = exifread.process_file(image_data)
    if 'GPS GPSLatitude' in exif_data and 'GPS GPSLongitude' in exif_data:
        lat_ref = exif_data['GPS GPSLatitudeRef'].values
        lon_ref = exif_data['GPS GPSLongitudeRef'].values
        lat = exif_data['GPS GPSLatitude'].values
        lon = exif_data['GPS GPSLongitude'].values
        lat = convert_to_degrees(lat, lat_ref)
        lon = convert_to_degrees(lon, lon_ref)
        print(f"GPS coordinates found: {lat}, {lon}")
        return lat, lon
    print("GPS coordinates not found in EXIF data")
    return None, None

def convert_to_degrees(value, ref):
    d = float(value[0].num) / float(value[0].den)
    m = float(value[1].num) / float(value[1].den)
    s = float(value[2].num) / float(value[2].den)
    decimal = d + (m / 60.0) + (s / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def create_map_with_photos(photo_urls):
    coordinates = []
    for i, photo_url in enumerate(photo_urls):
        try:
            image_data = download_image(photo_url)
            if image_data is None:
                print(f"Failed to download image: {photo_url}")
                continue

            lat, lon = get_gps_coordinates(image_data)
            if lat is None or lon is None:
                print(f"Position data not found: {photo_url}")
                continue
            coordinates.append((lat, lon, photo_url, i))
        except Exception as e:
            print(f"Error processing {photo_url}: {str(e)}")

    if coordinates:
        avg_lat = sum(lat for lat, _, _, _ in coordinates) / len(coordinates)
        avg_lon = sum(lon for _, lon, _, _ in coordinates) / len(coordinates)
        map = folium.Map(location=[avg_lat, avg_lon], zoom_start=8)
    else:
        map = folium.Map(location=[0, 0], zoom_start=2)
        print("No valid coordinates found. Creating empty map.")
        flash("No valid GPS data found in the uploaded images.")
        return

    for lat, lon, photo_url, i in coordinates:
        image_data = download_image(photo_url)
        if image_data is None:
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_data.getvalue())
            temp_file_path = temp_file.name

        img = Image.open(temp_file_path)
        img.thumbnail((100, 100))
        thumbnail_path = os.path.join('static', f'thumbnail_{i}.jpg')
        img.save(thumbnail_path)

        os.unlink(temp_file_path)  # 一時ファイルを削除

        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(f'<img src="/static/thumbnail_{i}.jpg" width="100" height="100">', max_width=200),
            icon=folium.Icon(icon="camera")
        ).add_to(map)

    map_html = map.get_root().render()
    with open('static/map_data.html', 'w') as f:
        f.write(map_html)
    print(f"Map created with {len(coordinates)} markers")

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', map_created=False)

@app.route('/process_image', methods=['POST'])
def process_image():
    image_urls = request.json.get('image_paths')
    if not image_urls:
        flash("No image URLs received.")
        return jsonify({'error': '画像URLが見つかりません', 'map_created': False}), 400
    
    try:
        create_map_with_photos(image_urls)
        return jsonify({'message': '画像の処理が完了しました。', 'map_created': True})
    except Exception as e:
        return jsonify({'error': str(e), 'map_created': False}), 500

@app.route('/map')
def show_map():
    map_path = 'static/map_data.html'
    if os.path.exists(map_path):
        with open(map_path, 'r') as f:
            map_html = f.read()
        return render_template('map.html', map_exists=True, map_html=map_html)
    else:
        flash("Map not created yet. Please process images first.")
        return render_template('map.html', map_exists=False)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    app.run(debug=True)