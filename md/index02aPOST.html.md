<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photo Map</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
</head>

<body>
    <h1>Photo Map v7</h1>
    <script>
        var write_path = 'https://script.google.com/macros/s/AKfycbwVN1GXP5sWKRab3-4pksPkwsQd9opC-NCoC_FL5WtCNRRR0QnU_326ssXEJCTSsMQB/exec?action=summarize';
        var display_map = 'https://script.google.com/macros/s/AKfycbwVN1GXP5sWKRab3-4pksPkwsQd9opC-NCoC_FL5WtCNRRR0QnU_326ssXEJCTSsMQB/exec?action=getData';

        function writePaths() {
            window.open(write_path, '_blank');
        }

        function getAndProcessImageData() {
            fetch(display_map)
                .then(response => response.json())
                .then(data => {
                    // 取得したデータをFlaskサーバーに送信
                    fetch('/process_image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ image_paths: data.map(item => item.path) }),
                    })
                        .then(response => response.json())
                        .then(result => {
                            document.getElementById('result').textContent = result.message;
                            if (result.map_created) {
                                document.getElementById('view-map').style.display = 'inline';
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            document.getElementById('result').textContent = 'エラーが発生しました。';
                        });
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('result').textContent = 'データの取得に失敗しました。';
                });
        }
    </script>

    <button onclick="writePaths()">Write Paths to Spreadsheet</button>
    <button onclick="getAndProcessImageData()">Display Map with Icons</button>
    <br><br>
    <div id="result"></div>
    <a id="view-map" href="/map" style="display: none;">View Map</a>

    {% if map_created %}
    <p>Map created successfully! <a href="/map">View Map</a></p>
    {% endif %}
</body>

</html>