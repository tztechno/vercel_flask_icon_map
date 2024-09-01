from flask import Flask, render_template, request, send_from_directory, flash, jsonify
import folium
import exifread
from PIL import Image
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # セッションのためのシークレットキーを設定

def get_gps_coordinates(exif_data):
    if 'GPS GPSLatitude' in exif_data and 'GPS GPSLongitude' in exif_data:
        lat_ref = exif_data['GPS GPSLatitudeRef'].values
        lon_ref = exif_data['GPS GPSLongitudeRef'].values
        lat = exif_data['GPS GPSLatitude'].values
        lon = exif_data['GPS GPSLongitude'].values
        lat = convert_to_degrees(lat, lat_ref)
        lon = convert_to_degrees(lon, lon_ref)
        print(f"GPS coordinates found: {lat}, {lon}")  # デバッグ用出力
        return lat, lon
    print("GPS coordinates not found in EXIF data")  # デバッグ用出力
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
        try:
            with open(photo_path, 'rb') as image_file:
                exif_data = exifread.process_file(image_file)
            lat, lon = get_gps_coordinates(exif_data)
            if lat is None or lon is None:
                print(f"Position data not found: {photo_path}")
                continue
            coordinates.append((lat, lon))
        except Exception as e:
            print(f"Error processing {photo_path}: {str(e)}")

    if coordinates:
        avg_lat = sum(lat for lat, _ in coordinates) / len(coordinates)
        avg_lon = sum(lon for _, lon in coordinates) / len(coordinates)
        map = folium.Map(location=[avg_lat, avg_lon], zoom_start=8)
    else:
        map = folium.Map(location=[0, 0], zoom_start=2)
        print("No valid coordinates found. Creating empty map.")  # デバッグ用出力
        flash("No valid GPS data found in the uploaded images.")
        return

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
    print(f"Map created with {len(coordinates)} markers")  # デバッグ用出力

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        uploaded_files = request.files.getlist('photos')
        if not uploaded_files:
            flash("No files uploaded.")
            return render_template('index.html', map_created=False)

        photo_paths = []
        for file in uploaded_files:
            if file.filename != '':
                photo_path = os.path.join('uploads', file.filename)
                file.save(photo_path)
                photo_paths.append(photo_path)
        
        if photo_paths:
            create_map_with_photos(photo_paths)
            return render_template('index.html', map_created=True)
        else:
            flash("No valid photos uploaded.")
            return render_template('index.html', map_created=False)
    return render_template('index.html', map_created=False)

@app.route('/process_image', methods=['POST'])
def process_image():
    # フロントエンドから送信された画像のパスを取得
    image_paths = request.json.get('image_paths')  # 複数画像対応
    if not image_paths:
        flash("No image paths received.")
        return jsonify({'error': '画像パスが見つかりません'}), 400
    
    # 取得した画像パスを使って地図を生成
    create_map_with_photos(image_paths)
    
    return jsonify({'message': '画像の処理が完了しました。'})

@app.route('/map')
def show_map():
    map_path = 'static/map_data.html'
    if os.path.exists(map_path):
        with open(map_path, 'r') as f:
            map_html = f.read()
        return render_template('map.html', map_exists=True, map_html=map_html)
    else:
        flash("Map not created yet. Please upload photos first.")
        return render_template('map.html', map_exists=False)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(debug=True)
