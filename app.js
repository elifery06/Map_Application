// WKT formatında geometrileri almak için WKT formatlayıcısını oluşturuyoruz
const wktFormat = new ol.format.WKT();

// Haritayı oluşturma
const raster = new ol.layer.Tile({
    source: new ol.source.OSM(),
});

const vector = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2,
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33',
            }),
        }),
    }),
});

const map = new ol.Map({
    layers: [raster, vector],
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([35.0, 39.0]),
        zoom: 7,
    }),
});

// Global değişken paneli saklamak için
let currentPanel = null;

const ExampleModify = {
    init: function () {
        this.select = new ol.interaction.Select();
        map.addInteraction(this.select);

        this.modify = new ol.interaction.Modify({
            features: this.select.getFeatures(),
        });
        map.addInteraction(this.modify);

        this.setEvents();
    },
    setEvents: function () {
        const selectedFeatures = this.select.getFeatures();

        this.select.on('change:active', function () {
            selectedFeatures.forEach(function (each) {
                selectedFeatures.remove(each);
            });
        });
    },
    setActive: function (active) {
        this.select.setActive(active);
        this.modify.setActive(active);
    },
};
ExampleModify.init();

const ExampleDraw = {
    init: function () {
        map.addInteraction(this.Point);
        this.Point.setActive(false);
        map.addInteraction(this.LineString);
        this.LineString.setActive(false);
        map.addInteraction(this.Polygon);
        this.Polygon.setActive(false);
        map.addInteraction(this.Circle);
        this.Circle.setActive(false);

        this.addDrawEndListener(this.Point);
        this.addDrawEndListener(this.LineString);
        this.addDrawEndListener(this.Polygon);
        this.addDrawEndListener(this.Circle);
    },
    addDrawEndListener: function (interaction) {
        interaction.on('drawend', function (event) {
            vector.getSource().clear();
            let geom = event.feature.getGeometry();

            // Eğer geometri tipi 'Circle' ise, bunu Polygon'a dönüştür
            if (geom.getType() === 'Circle') {
                geom = ol.geom.Polygon.fromCircle(geom);
            }

            
            const wkt = wktFormat.writeGeometry(geom);
            console.log("WKT:", wkt);

            // Önceden oluşturulmuş panel varsa kapat
            if (currentPanel) {
                currentPanel.close();
            }

            // Yeni jsPanel oluşturuluyor ve WKT formatı panele ekleniyor
            currentPanel = jsPanel.create({
                headerTitle: 'Coordinates',
                contentSize: '400 200',
                content: `
                    <div>
                        <label for="wktInput">WKT:</label>
                        <input id="wktInput" type="text" value="${wkt}" readonly style="width: 100%; margin-bottom: 10px;">
                    </div>
                    <div>
                        <label for="nameInput">Name:</label>
                        <input id="nameInput" type="text" style="width: 100%; margin-bottom: 10px;">
                    </div>
                    <button id="saveButton" style="width: 100%;">Save</button>
                `,
                position: 'center 0 58',
                callback: function () {
                    // Save butonuna tıklama olayı ekleyin
                    // Save butonuna tıklama olayı ekleyin
                    document.getElementById('saveButton').addEventListener('click', function () {
                        const wktValue = document.getElementById('wktInput').value;
                        const nameValue = document.getElementById('nameInput').value;
                    
                        const data = {
                            Name: nameValue,
                            WKT: wktValue
                        };
                    
                        fetch('https://localhost:7183/api/WktCoordinates', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        })
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => { throw new Error(text) });
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('Başarıyla kaydedildi:', data);
                            alert('Shape saved successfully!');
                           // Kaydedildikten sonra paneli kapat
                           if (currentPanel) {
                            currentPanel.close();
                        }
                        
                        // Çizim işlemini yeniden etkinleştir
                        ExampleDraw.setActive(false);
                        })
                        .catch(error => {
                            console.error('Hata:', error);
                            alert('An error occurred while saving the shape.');
                        });
                    });
                    

                }
            });
   
                // Çizim işlemini devre dışı bırak
        ExampleDraw.setActive(false);
        });
    },
    Point: new ol.interaction.Draw({
        source: vector.getSource(),
        type: 'Point',
    }),
    LineString: new ol.interaction.Draw({
        source: vector.getSource(),
        type: 'LineString',
    }),
    Polygon: new ol.interaction.Draw({
        source: vector.getSource(),
        type: 'Polygon',
    }),
    Circle: new ol.interaction.Draw({
        source: vector.getSource(),
        type: 'Circle',
    }),
    activeDraw: null,
    setActive: function (active) {
        if (this.activeDraw) {
            this.activeDraw.setActive(false);
            this.activeDraw = null;
        }
        if (active) {
            vector.getSource().clear(); // Önceki çizimleri temizle
            const type = document.querySelector('.dropdown-content a.active')?.getAttribute('data-value');
            if (type) {
                this.activeDraw = this[type];
                this.activeDraw.setActive(true);
            }
        }
    },
};
ExampleDraw.init();

const snap = new ol.interaction.Snap({
    source: vector.getSource(),
});
map.addInteraction(snap);

document.addEventListener('DOMContentLoaded', function () {
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    
    dropdownLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active'); 
            const drawType = this.getAttribute('data-value');
            ExampleDraw.setActive(false);  // Mevcut çizimi durdur
            ExampleModify.setActive(false);  // Düzenlemeyi durdur
            
            ExampleDraw.activeDraw = ExampleDraw[drawType];
            ExampleDraw.setActive(true);  // Seçili çizim türünü etkinleştir
        });
    });
});


// Global değişkenler
let currentShowPanel = null;
let currentUpdatePanel = null;
let currentDeletePanel = null;

document.getElementById('query').addEventListener('click', function () {

    // Önceden oluşturulmuş panelleri kapat
    if (currentShowPanel) {
        currentShowPanel.close();
    }
    if (currentUpdatePanel) {
        currentUpdatePanel.close();
    }
    if (currentDeletePanel) {
        currentDeletePanel.close();
    }
    
    // Yeni jsPanel oluşturuluyor
    currentShowPanel = jsPanel.create({
        headerTitle: 'Data Table',
        contentSize: '700 550', // Tabloyu büyüt
        content: '<div id="dataTableContainer" style="width: 100%; height: 100%; overflow: auto;"></div>',
        position: 'center 0 58',
        callback: function () {
            // DataTables tablosunu oluştur
            const tableContainer = document.getElementById('dataTableContainer');

            // Var olan tabloyu temizle
            const existingTable = document.getElementById('myTable');
            if (existingTable) {
                existingTable.parentNode.removeChild(existingTable); // Tabloyu kaldırma
            }

            // Yeni tabloyu oluştur
            const table = document.createElement('table');
            table.id = 'myTable';
            table.classList.add('display');
            table.style.width = '100%';

            tableContainer.appendChild(table);

            // Verileri fetch ile al
            fetch('https://localhost:7183/api/WktCoordinates')
                .then(response => response.json())
                .then(data => {
                    const tableData = data.value || [];

                    // DataTable'ı oluştur
                    const dataTable = new DataTable('#myTable', {
                        data: tableData,
                        columns: [
                            { title: 'Name', data: 'name' },
                            { title: 'WKT', data: 'wkt' },
                            {
                                title: 'Actions',
                                data: null,
                                className: "center actions-btns",
                                defaultContent: `
                                    <button class="show-btn">Show</button>
                                    <button class="update-btn">Update</button>
                                    <button class="delete-btn">Delete</button>
                                `
                            }
                        ]
                    });

                     // Butonlara tıklama işlevselliği ekleme
                     tableContainer.addEventListener('click', function (event) {
                        const row = event.target.closest('tr');
                        const data = dataTable.row(row).data();
                        if (event.target.classList.contains('show-btn')) {
                            const wkt = data.wkt;
                            const geom = wktFormat.readGeometry(wkt);

                            if (geom) {
                                vector.getSource().clear();
                                vector.getSource().addFeature(new ol.Feature(geom));

                                const extent = geom.getExtent();
                                map.getView().fit(extent, { duration: 1500, padding: [50, 50, 50, 50], maxZoom: 15 });

                                // Paneli kapat
                                if (currentShowPanel) {
                                    currentShowPanel.close();
                                }
                            }
                        }
                        
                            
                           
                        
                        if (event.target.classList.contains('update-btn')) {
                            const id = data.id;
                            const wkt = data.wkt;

                            const geom = wktFormat.readGeometry(wkt);
                            if (geom) {
                                vector.getSource().clear();
                                vector.getSource().addFeature(new ol.Feature(geom));

                                const extent = geom.getExtent();
                                map.getView().fit(extent, { duration: 1000, padding: [25, 25, 25, 25],maxZoom:15 });

                                // Önceki update panelini kapat
                                if (currentUpdatePanel) {
                                    currentUpdatePanel.close();
                                }

                                // Yeni update panelini oluştur
                                currentUpdatePanel = jsPanel.create({
                                    headerTitle: 'Update Coordinates',
                                    contentSize: '400 200',
                                    content: `
                                        <div>
                                            <label for="updateMethod">Select update method:</label>
                                            <select id="updateMethod" style="width: 100%; margin-bottom: 10px;">
                                                <option value="drag">Update by dragging on map</option>
                                                <option value="wkt">Update by editing WKT</option>
                                            </select>
                                        </div>
                                        <div id="wktEditor" style="display: none;">
                                            <label for="wktInput">WKT:</label>
                                            <input id="wktInput" type="text" value="${wkt}" style="width: 100%; margin-bottom: 10px;">
                                        </div>
                                        <div>
                                            <label for="nameInput">Name:</label>
                                            <input id="nameInput" type="text" value="${data.name}" style="width: 100%; margin-bottom: 10px;">
                                        </div>
                                        <button id="updateButton" style="width: 100%;">Update</button>
                                    `,
                                    position: 'center 0 58',
                                    callback: function () {
                                        const updateMethod = document.getElementById('updateMethod');
                                        const wktEditor = document.getElementById('wktEditor');

                                        // Seçenek değiştiğinde WKT düzenleme alanını göster/gizle
                                        updateMethod.addEventListener('change', function () {
                                            if (this.value === 'wkt') {
                                                wktEditor.style.display = 'block';
                                            } else {
                                                wktEditor.style.display = 'none';
                                            }
                                        });

                                        // Update butonuna tıklama olayı
                                        document.getElementById('updateButton').addEventListener('click', function () {
                                            const nameValue = document.getElementById('nameInput').value;
                                            let updatedData;

                                            if (updateMethod.value === 'wkt') {
                                                const wktValue = document.getElementById('wktInput').value;
                                                updatedData = {
                                                    Id: id,
                                                    Name: nameValue,
                                                    WKT: wktValue
                                                };
                                            } else {
                                                // Geometriyi haritadan al
                                                const modifiedFeature = vector.getSource().getFeatures()[0];
                                                const modifiedGeom = modifiedFeature.getGeometry();
                                                const modifiedWkt = wktFormat.writeGeometry(modifiedGeom);

                                                updatedData = {
                                                    Id: id,
                                                    Name: nameValue,
                                                    WKT: modifiedWkt
                                                };
                                            }

                                            fetch(`https://localhost:7183/api/WktCoordinates/${id}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(updatedData)
                                            })
                                            .then(response => response.json())
                                            .then(data => {
                                                console.log('Successfully updated:', data);
                                                alert('Shape updated successfully!');
                                                dataTable.destroy(); // Tabloyu temizle
                                                document.getElementById('query').click(); // Tabloyu yeniden yükle
                                                if (currentUpdatePanel) {
                                                    currentUpdatePanel.close(); // Paneli güncellemeyi tamamladıktan sonra kapat
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Error:', error);
                                                alert('An error occurred while updating the shape.');
                                            });
                                        });
                                    }
                                });

                                // Drag olaylarını ayarlamak için
                                const modifyInteraction = new ol.interaction.Modify({
                                    features: new ol.Collection([vector.getSource().getFeatures()[0]])
                                });
                                map.addInteraction(modifyInteraction);
                            }
                        }

                        if (event.target.classList.contains('delete-btn')) {
                            const id = data.id;

                            if (id) {
                                // Önceki delete panelini kapat
                                if (currentDeletePanel) {
                                    currentDeletePanel.close();
                                }

                                // Yeni delete panelini oluştur
                                currentDeletePanel = jsPanel.create({
                                    headerTitle: 'Delete Confirmation',
                                    contentSize: '300 150',
                                    content: `
                                        <div>
                                            <p>Are you sure you want to delete this item?</p>
                                            <button id="confirmDeleteButton" style="width: 100%;">Yes, Delete</button>
                                        </div>
                                    `,
                                    position: 'center 0 58',
                                    callback: function () {
                                        document.getElementById('confirmDeleteButton').addEventListener('click', function () {
                                            fetch(`https://localhost:7183/api/WktCoordinates/${id}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                }
                                            })
                                            .then(response => response.json())
                                            .then(data => {
                                                console.log('Successfully deleted:', data);
                                                alert('Shape deleted successfully!');
                                                dataTable.destroy(); // Tabloyu temizle
                                                document.getElementById('query').click(); // Tabloyu yeniden yükle
                                                if (currentDeletePanel) {
                                                    currentDeletePanel.close(); // Paneli silmeyi tamamladıktan sonra kapat
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Error:', error);
                                                alert('An error occurred while deleting the shape.');
                                            });
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
        }
    });
});
fetch('https://localhost:7183/api/WktCoordinates')
.then(response => response.json())
.then(data => {
    const tableData = data.value || [];
    vector.getSource().clear(); // Mevcut çizimleri temizle

    // Her WKT geometrisini haritaya ekleme
    tableData.forEach(function (item) {
        const geom = wktFormat.readGeometry(item.wkt);
        if (geom) {
            const feature = new ol.Feature(geom);
            vector.getSource().addFeature(feature);
        }
    });
});

// Popup elementi ve overlay oluşturma
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250,
    },
});

map.addOverlay(overlay);

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

// Haritada tıklama olayını dinleyin
map.on('singleclick', function (event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, function (feature) {
        return feature;
    });

    if (feature) {
        const coordinate = event.coordinate;
        const featureName = feature.get('name'); // Feature'ın adını al
        const wkt = wktFormat.writeGeometry(feature.getGeometry()); // Feature'ın WKT formatında geometrisini al

        // Veritabanındaki WKT ile eşleşen kaydı getir
        fetch('https://localhost:7183/api/WktCoordinates')
            .then(response => response.json())
            .then(data => {
                const matchedFeature = data.value.find(item => item.wkt === wkt);

                if (matchedFeature) {
                    const hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));

                    content.innerHTML = `
                        <p>Adı: <code>${matchedFeature.name || 'Bilinmiyor'}</code></p>
                        <p>Koordinat: <code>${hdms}</code></p>
                    `;
                    overlay.setPosition(coordinate);
                }
            })
            .catch(error => {
                console.error('Error fetching feature data:', error);
            });
    } else {
        overlay.setPosition(undefined); // Eğer tıklanan yerde feature yoksa popup'ı kapat
    }
});


















