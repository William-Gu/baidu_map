window.onload = function(){
  //创建和初始化地图函数：
  var SmartGo_Style =[
    {"featureType": "educationlabel","elementType": "all","stylers": { "visibility": "off"}},
    {"featureType": "medicallabel","elementType": "all","stylers": { "visibility": "off"}},
    {"featureType": "country","elementType": "labels.text.stroke","stylers": { "color": "#abaada00","visibility": "on"}},
    {"featureType": "town","elementType": "labels","stylers": { "visibility": "off"}},
    {"featureType": "land","elementType": "all","stylers": { "color": "#454c94ff", "visibility": "on"}},
    {"featureType": "water","elementType": "all","stylers": { "color": "#4c9cd1ff"}},
    {"featureType": "subway","elementType": "all","stylers": {}},
    {"featureType": "building","elementType": "all","stylers": { "color": "#5a4e8eff", "visibility": "on" } },
    {"featureType": "green","elementType": "all","stylers": { "color": "#5a4e8eff", "visibility": "on" } },
    {"featureType": "highway","elementType": "all","stylers": { "color": "#5a4e8eff", "visibility": "on" } },
    {"featureType": "arterial","elementType": "all","stylers": { "color": "#525896ff", "visibility": "on" }},
    {"featureType": "local", "elementType": "all", "stylers": { "visibility": "off" }},
    {"featureType": "railway","elementType": "all","stylers": { "visibility": "off" }},
    {"featureType": "subway","elementType": "all","stylers": { "visibility": "off" }},
    {"featureType": "manmade","elementType": "all","stylers": { "visibility": "off" }},
    {"featureType": "town","elementType": "all","stylers": { "visibility": "off" }},
    {"featureType": "district","elementType": "all","stylers": {"visibility": "off"}},
    {"featureType": "scenicspotslabel", "elementType": "all", "stylers": { "visibility": "off"}},
    {"featureType": "city", "elementType": "labels.text.stroke", "stylers": { "color": "#abaadaff", "visibility": "on"}},
    {"featureType": "boundary","elementType": "geometry.fill","stylers": { "color": "#444888ff"}},
    {"featureType": "city","elementType": "labels.text.fill","stylers": { "color": "#15143eff"}},
    {"featureType": "city","elementType": "labels.text.stroke","stylers": { "color": "#abaadaff" }},
    {"featureType": "country","elementType": "all","stylers": { "visibility": "off" }},
    {"featureType": "continent","elementType": "labels.text.stroke","stylers": { "color": "#abaadaff" }}
  ]

  var map;
  var _showInfo = false;
  var _showHL = false;
  var _showHL_hover = false;

  var config = {
    mapStyle: "midnight",
    initialShow:{
      lng: 108.991021,
      lat: 34.229875,
      scale: 5
    },
    scaleList:[ 5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 ],
    // scaleList:[ 5,6,7,8,9,10,11,12,13,14,15,16,17 ],
    markIcon:{
      imgUrl: 'http://smartgoh5test.xiaoyi.com/static/img/label_rank01@2x.3003436.png',
      size:[50, 50]
    }
  }
  var currentConfig = {
    scale: config.initialShow.scale
  }
  
  // var markList= ["北京","上海市环科路515号"];
  var markList= ["北京","深圳","南京","上海"];
  function initMap(){
    createMap();//创建地图
    setMapEvent();//设置地图事件
    addMapControl();//向地图添加控件
    addMapOverlay();//向地图添加覆盖物
    _setMarkInterval();
  }
  function createMap(){ 
    map = new BMap.Map("map"); 
    //地图风格
    map.setMapStyle({
      // style: config.mapStyle
      styleJson: SmartGo_Style
    }); 
    //初始化展示中心
    var initialPoint = new BMap.Point(config.initialShow.lng, config.initialShow.lat);
    map.centerAndZoom(initialPoint, currentConfig.scale);
    _setMarkSize(currentConfig.scale)
  }
  function setMapEvent(){
    map.enableScrollWheelZoom();
    map.enableKeyboard();
    map.enableDragging();
    map.enableDoubleClickZoom()
    map.enableScrollWheelZoom();   //启用滚轮放大缩小，默认禁用
    map.enableContinuousZoom();  
    map.addEventListener("zoomend", function(){    
      currentConfig.scale = this.getZoom()
      console.log("zoomend 地图缩放至：" + this.getZoom() + "级");    
  });
  }
  // function addClickHandler(target,window){
  //   target.addEventListener("click",function(){
  //     target.openInfoWindow(window);
  //   });
  // }
  function addMapOverlay(){
    // Mark标志
    var newArray = markList.map(e => {
      return _getPointFromAddress(e)
    })

    Promise.all(newArray).then(data=>{
      var markers = data.map(item=>{
        if (item.point) {
          var marker = _setMarkStyle(item);
          map.addOverlay(marker);

          // 鼠标点击事件
          marker.addEventListener("click", _clickMarkFn);

          var myCompOverlay = _showTips(item)
          // hover事件
          marker.addEventListener("mouseover", function(e){
            if(currentConfig.scale>10){//显示名称
              map.addOverlay(myCompOverlay);
            }else{//激活状态
              var label = e.currentTarget.V;
              var marks = label.querySelectorAll('.baidu-mark');
              if(marks.length >= 0){
                addClass(marks[0],'baidu-mark-HL')
              }
            }
          });
          marker.addEventListener("mouseout", function(e){
            if(currentConfig.scale>10){//显示名称
              map.removeOverlay(myCompOverlay);
            }else{
              var label = e.currentTarget.V;
              var marks = label.querySelectorAll('.baidu-mark');
              if(marks.length >= 0){
                removeClass(marks[0],'baidu-mark-HL')
              }
            }
          })
        }
      })
      // _addMark(markers)
    })
  }
  function _getPointFromAddress(address){
    var myGeo = new BMap.Geocoder();
    return new Promise((res,rej)=>{
      myGeo.getPoint(address, function(point){
        res({text: address, point: point})
      })
    })
  }
  function _showTips(item){
    function ComplexCustomOverlay(point, text){
      this._point = point;
      this._text = text;
    }
    ComplexCustomOverlay.prototype = new BMap.Overlay();
    ComplexCustomOverlay.prototype.initialize = function(map){
      this._map = map;
      var div = this._div = document.createElement("div");
      div.className = "tips";
      div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);

      var span = this._span = document.createElement("span");
          span.appendChild(document.createTextNode(this._text));      
      div.appendChild(span);
      var that = this;

     
      div.onmouseover = function(){
        // this.style.backgroundColor = "#6BADCA";
        // this.style.borderColor = "#0000ff";
        // this.getElementsByTagName("span")[0].innerHTML = that._overText;
        // arrow.style.backgroundPosition = "0px -20px";
      }

      div.onmouseout = function(){
        // this.style.backgroundColor = "#EE5D5B";
        // this.style.borderColor = "#BC3B3A";
        // this.getElementsByTagName("span")[0].innerHTML = that._text;
        // arrow.style.backgroundPosition = "0px 0px";
      }

      map.getPanes().labelPane.appendChild(div);
      
      return div;
    }
    ComplexCustomOverlay.prototype.draw = function(){
      var map = this._map;
      var pixel = map.pointToOverlayPixel(this._point);
      this._div.style.left = pixel.x + "px";
      this._div.style.top  = pixel.y - 30 + "px";
    }

        
    return new ComplexCustomOverlay(new BMap.Point(item.point.lng, item.point.lat), item.text);
  }
  function _addMark(markers){

  //   var marker = new BMap.Label(`<div class='baidu-mark'}></div>`);
  //       marker.setStyle({ 
  //         transform:'translate(-50%,-50%)',
  //         // width:'px',
  //         // height:'50px',
  //         border: 'none', 
  //         backgroundColor: 'rgba(0,0,0,0)', 
  //     });
    var myStyles = [{
      url: "http://es6.ruanyifeng.com/images/cover_thumbnail_3rd.jpg",
      size: new BMap.Size(30, 26),
      opt_anchor: [16, 0],
      textColor: '#fff',
      opt_textSize: 10
  
  }];
  var markerClusterer = new BMapLib.MarkerClusterer(map, {markers:markers});
  markerClusterer.setGridSize(10,10)
    // markerClusterer.setStyles(myStyles);

  }
  //向地图添加控件
  function addMapControl(){
    var scaleControl = new BMap.ScaleControl({anchor:BMAP_ANCHOR_BOTTOM_LEFT});
    scaleControl.setUnit(BMAP_UNIT_IMPERIAL);
    map.addControl(scaleControl);
    var navControl = new BMap.NavigationControl({anchor:BMAP_ANCHOR_BOTTOM_RIGHT,type:0});
    map.addControl(navControl);
  }
  
  initMap();
  
  // 方法
  function _clickMarkFn(e){
    if(map && e){
      var scale = currentConfig.scale;
      var scaleIndex = config.scaleList.indexOf(scale)
      var currentScale = config.scaleList[scaleIndex+7]
      if(currentScale){
        map.centerAndZoom(new BMap.Point(e.target.point.lng, e.target.point.lat), currentScale);
        currentConfig.scale = currentScale
        _setMarkSize(currentScale);
      }
    }
  }
  function _setMarkSize(scale){
    if(!scale){
      scale = currentConfig.scale;
    }
    var body = document.body || document.getElementsByTagName("body")[0];
        body.setAttribute('class','baidu-zoom-' + scale)
  }
  function _setMarkStyle(el){
    //Icon
    // var icon = new BMap.Icon(config.markIcon.imgUrl, new BMap.Size(...config.markIcon.size))
    // 1. ICON
    // var marker = new BMap.Marker(point,{title:'123',icon:icon});  // 创建标注
    // 2. 自定义
    var marker = new BMap.Label(`<div class='baidu-mark'}></div>`, { position: el.point });
        marker.setStyle({ 
          transform:'translate(-50%,-50%)',
          border: 'none', 
          backgroundColor: 'rgba(0,0,0,0)', 
      });
      marker.setTitle(el.text)
    return marker
  }
  function _setMarkInterval(){
    setInterval(() => {
      // if(_showHL){
        var markList = document.querySelectorAll('.baidu-mark');
        for (let i = 0; i < markList.length; i++) {
          const element = markList[i];
          if(hasClass(element,'baidu-mark-HL')){
            removeClass(element,'baidu-mark-HL')
          }
        }
        var random = randomNum(0,markList.length-1)
        
        addClass(markList[random], 'baidu-mark-HL')
      // }
    }, 2000);
  }
  function randomNum(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
          return parseInt(Math.random()*minNum+1,10);
          break; 
        case 2: 
          return parseInt(Math.random()*(maxNum - minNum+1)+minNum,10); 
          break; 
        default: 
          return 0; 
          break; 
    } 
  } 
  function hasClass(elem, cls) {
    cls = cls || '';
    if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
    return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
  }
  function addClass(elem, cls) {
    if (!hasClass(elem, cls)) {
      elem.className = elem.className == '' ? cls : elem.className + ' ' + cls;
    }
  }
  function removeClass(elem, cls) {
    if (hasClass(elem, cls)) {
      var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
      while (newClass.indexOf(' ' + cls + ' ') >= 0) {
        newClass = newClass.replace(' ' + cls + ' ', ' ');
      }
      elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
  }
    //icon
  //   var icon = new BMap.Symbol(BMap_Symbol_SHAPE_CIRCLE, {
  //     scale: 10,//图标缩放大小
  //     fillColor: "red",//填充颜色
  //     fillOpacity: 0.8//填充透明度
  // })

      /** 
      // http://lbsyun.baidu.com/index.php?title=jspopular/guide/mark
      //通过Icon类可实现自定义标注的图标，下面示例通过参数MarkerOptions的icon属性进行设置，您也可以使用marker.setIcon()方法。
    
      var map = new BMap.Map("container");    
    var point = new BMap.Point(116.404, 39.915);    
    map.centerAndZoom(point, 15);  // 编写自定义函数，创建标注   
    function addMarker(point, index){  // 创建图标对象   
    var myIcon = new BMap.Icon("markers.png", new BMap.Size(23, 25), {    
        // 指定定位位置。   
        // 当标注显示在地图上时，其所指向的地理位置距离图标左上    
        // 角各偏移10像素和25像素。您可以看到在本例中该位置即是   
        // 图标中央下端的尖角位置。    
        anchor: new BMap.Size(10, 25),    
        // 设置图片偏移。   
        // 当您需要从一幅较大的图片中截取某部分作为标注图标时，您   
        // 需要指定大图的偏移位置，此做法与css sprites技术类似。    
        imageOffset: new BMap.Size(0, 0 - index * 25)   // 设置图片偏移    
    });      
    // 创建标注对象并添加到地图   
    var marker = new BMap.Marker(point, {icon: myIcon});    
    map.addOverlay(marker);    
    }    
    // 随机向地图添加10个标注    
    var bounds = map.getBounds();    
    var lngSpan = bounds.maxX - bounds.minX;    
    var latSpan = bounds.maxY - bounds.minY;    
    for (var i = 0; i < 10; i ++) {    
    var point = new BMap.Point(bounds.minX + lngSpan * (Math.random() * 0.7 + 0.15),    
                                  bounds.minY + latSpan * (Math.random() * 0.7 + 0.15));    
    addMarker(point, i);    
    }*/
  
}