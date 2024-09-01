<!-- templates/index.html (変更なし) -->
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Map</title>
</head>

<body>
    <h1>Photo Map</h1>
    <form action="/" method="post" enctype="multipart/form-data">
        <input type="file" name="photos" multiple>
        <input type="submit" value="Upload and Create Map">
    </form>
    {% if map_created %}
    <p>Map created successfully! <a href="/map">View Map</a></p>
    {% endif %}
</body>

</html>