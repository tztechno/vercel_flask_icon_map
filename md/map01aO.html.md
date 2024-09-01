
<!-- templates/map.html (新規作成) -->
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Map</title>
</head>

<body>
    <h1>Photo Map</h1>
    <div id="map">
        {% if map_exists %}
        {{ map_html|safe }}
        {% else %}
        <p>Map not created yet. Please upload photos first.</p>
        {% endif %}
    </div>
    <p><a href="/">Back to Upload</a></p>
</body>

</html>