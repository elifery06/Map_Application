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
            console.log("Çizilen şeklin WKT formatı: ", wkt);

            // Önceden oluşturulmuş panel varsa kapat
            if (currentPanel) {
                currentPanel.close();
            }

            // Yeni jsPanel oluşturuluyor ve WKT formatı panele ekleniyor
            currentPanel = jsPanel.create({
                headerTitle: 'Coordinates',
                contentSize: '400 200',
                content: `<p>WKT: ${wkt}</p>`,
                position: 'center 0 58',
            });
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
            dropdownLinks.forEach(link => link.classList.remove('active')); // Remove active class from all links
            this.classList.add('active'); // Add active class to the clicked link
            const drawType = this.getAttribute('data-value');
            ExampleDraw.setActive(false);  // Mevcut çizimi durdur
            ExampleModify.setActive(false);  // Düzenlemeyi durdur
            
            ExampleDraw.activeDraw = ExampleDraw[drawType];
            ExampleDraw.setActive(true);  // Seçili çizim türünü etkinleştir
        });
    });
});
