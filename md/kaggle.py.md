from datetime import datetime

def get_gps_coordinates(exif_data):

    if 'GPS GPSLatitude' in exif_data and 'GPS GPSLongitude' in exif_data:
        lat_ref = exif_data['GPS GPSLatitudeRef'].values
        lon_ref = exif_data['GPS GPSLongitudeRef'].values

        lat = exif_data['GPS GPSLatitude'].values
        lon = exif_data['GPS GPSLongitude'].values

        lat = convert_to_degrees(lat, lat_ref)
        lon = convert_to_degrees(lon, lon_ref)
    else:
        lat, lon = None, None

    if 'EXIF DateTimeOriginal' in exif_data:
        date_time_str = exif_data['EXIF DateTimeOriginal'].values
        try:
            date_time = datetime.strptime(date_time_str, '%Y:%m:%d %H:%M:%S')
        except ValueError:
            date_time = None
    else:
        date_time = None

    return lat, lon, date_time