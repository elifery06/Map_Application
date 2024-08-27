
var map = new ol.Map({
    target: 'map', // 
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM() // OpenStreetMap katmanı
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([35.0, 39.0]), // TC
        zoom: 7 //ZOOM
    })
});


 // Tıklama ile işaretçileri eklemek için bir vektör katmanı oluştur
 const vectorSource = new ol.source.Vector();
 const vectorLayer = new ol.layer.Vector({
     source: vectorSource
 });
 map.addLayer(vectorLayer);

 // Nokta özelliklerini saklamak için bir dizi
 let features = [];

 // Haritaya tıklama olayını dinle
 map.on('click', function (event) {
     // Tıklama koordinatlarını al
     const coordinates = event.coordinate;

     // Eğer daha önce bir nokta eklendiyse, onu kaldır
     if (features.length > 0) {
         vectorSource.removeFeature(features.pop());
     }

     // Yeni bir nokta özelliği (feature) oluştur
     const pointFeature = new ol.Feature({
         geometry: new ol.geom.Point(coordinates)
     });

     // Noktayı stilize et ve boyutunu büyüt
     pointFeature.setStyle(new ol.style.Style({
         image: new ol.style.Icon({
             src: 'https://openlayers.org/en/latest/examples/data/icon.png',
             anchor: [0.5, 1],
             scale: 0.3  // Noktanın boyutunu artırmak için scale değerini büyüt
         })
     }));

     // Noktayı vektör kaynağına ekle
     vectorSource.addFeature(pointFeature);

     // Özelliği diziye ekle
     features.push(pointFeature);
 });