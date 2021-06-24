// @ts-check
(function (root, factory) {
    // @ts-ignore
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        // @ts-ignore
        factory((root.TilemapEditor = {}));
    }
})(typeof self !== 'undefined' ? self : this, function (exports) {
     const drawGrid = (w, h, step = 16) => {
        const ctx = getContext();
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 1;
        for (x = step; x <= w; x += step) {
            ctx.moveTo(x, 0.5);
            ctx.lineTo(x, h + 0.5);
            for (y = step; y <= h; y += step) {
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(w, y + 0.5);

            }
        }
        ctx.stroke();
    }
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
    const getHtml = (width, height) =>{
        return `
       <div id="tilemapjs_root" class="card tilemapjs_root">
 
       <div class="tileset_opt_field header">
       <div class="menu">
            <span> File </span>
            <div class="dropdown" id="fileMenuDropDown">
                <span class="item" onclick="alert('TODO')">Open json</span>
                <span class="item" onclick="alert('TODO')">Save json</span>
                                 
                <a class="button item button-as-link" href="#popup2">About</a>
                <div id="popup2" class="overlay">
                <div class="popup">
                <h4>Tilemap editor</h4>
                <a class="close" href="#">&times;</a>
                <div class="content"> 
                    <div>Created by Todor Imreorov (blurymind@gmail.com)</div>
                    <br/>
                    <div><a class="button-as-link" href="https://github.com/blurymind/tilemap-editor">Project page (Github)</a></div>
                    <div><a class="button-as-link" href="https://ko-fi.com/blurymind">Donate page (ko-fi)</a></div>
                    <br/>
                    <div>Instructions:</div>
                    <div>right click on map - picks tile</div>
                    <div>mid-click - erases tile</div>
                    <div>left-click adds tile</div> 
                    <div>right-click on tileset - lets you change tile symbol or metadata</div>
                    <div>left-click - selects tile</div>
 
                </div>
                </div>
                </div>
            </div>
        </div>
        <div id="toolButtonsWrapper">
          <button class="button-as-link active-tool" id="paintToolBtn" value="0" title="paint tiles">🖌️</button>
          <button class="button-as-link" id="eraseToolBtn" value="1" title="erase tiles">🗑️</button>
          <button class="button-as-link" id="panToolBtn" value="2" title="pan">✋</button> 
        </div>
        <div>
            <button class="primary-button" id="confirmBtn">${confirmBtnText || "apply"}</button>
        </div>

      </div>
      <div class="card_body">
        <div class="card_left_column">
        <details class="details_container" open="true">
          <summary >
            <span  id="mapSelectContainer">
            | <select name="tileSetSelectData" id="tilesetDataSel" class="limited_select"></select>
            <button id="replaceTilesetBtn" title="replace">r</button>
            <input id="tilesetReplaceInput" type="file" style="display: none" />
            <button id="addTilesetBtn" title="add">+</button>
            <input id="tilesetReadInput" type="file" style="display: none" />
            <button id="removeTilesetBtn" title="remove">-</button>
            </span>
          </summary>
          <div>
              <div class="tileset_opt_field">
                <span>Tile size:</span>
                <input type="number" id="cropSize" name="crop" placeholder="32" min="1" max="128">
<!--                <span class="flex">width: </span><input id="canvasWidthInp" value="1" type="number" min="1">-->
<!--                <span class="flex">height: </span><input id="canvasHeightInp" value="1" type="number" min="1">-->
              </div>
              <div class="tileset_opt_field">
                <span>Tileset loader:</span>
                <select name="tileSetLoaders" id="tileSetLoadersSel"></select>
              </div>
              <div class="tileset_opt_field">
                <button id="renameMapBtn" title="Rename map">🏷️ Rename map</button>
                <button id="clearCanvasBtn" title="Clear map">💥 Clear map</button>
              </div>
          </div>

        </details>
        <div class="select_container layer" id="tilesetSelectContainer">
            <select name="tileData" id="tileDataSel">
                <option value="">Symbols</option>
                <option value="hurt">hurt</option>
            </select>
            <button id="addTileTagBtn" title="add">+</button>
            <button id="removeTileTagBtn" title="remove">-</button>
        </div>
      <div class="tileset-container">
        <img id="tileset-source" crossorigin />
        <div id="tilesetGridContainer" class="tileset_grid_container"></div>
        <div class="tileset-container-selection"></div>
      </div>
        </div>
        <div class="card_right-column" style="position:relative">
        <div class="canvas_wrapper" id="canvas_wrapper">
          <canvas id="mapCanvas" width="${width}" height="${height}"></canvas>
          <div class="canvas_resizer" resizerdir="y"><input value="1" type="number" min="1" resizerdir="y"><span>-y-</span></div>
          <div class="canvas_resizer vertical" resizerdir="x"><input value="${mapTileWidth}" type="number" min="1" resizerdir="x"><span>-x-</span></div>
        </div>
        </div>
      <div class="card_right-column layers">
      <div id="mapSelectContainer" class="tilemaps_selector">
            <select name="mapsData" id="mapsDataSel"></select>
            <button id="addMapBtn">+</button>
            <button id="removeMapBtn">-</button>
<!--            <button id="removeMapBtn">📏</button>-->
            
            <a class="button" href="#popup1">📏</a>
            <div id="popup1" class="overlay">
            <div class="popup">
            <h4>TileMap settings</h4>
            <a class="close" href="#">&times;</a>
            <div class="content">
                <span class="flex">width: </span><input id="canvasWidthInp" value="1" type="number" min="1">
                <span class="flex">height: </span><input id="canvasHeightInp" value="1" type="number" min="1">
            </div>
            </div>
            </div>
        </div>

        <label class="sticky add_layer">
        <label id="activeLayerLabel">Editing Layer </label><button id="addLayerBtn" title="Add layer"> ➕</button></label>
        <div class="layers" id="layers">
      </div>
      </div>
    </div>
        `
    }
    const getEmptyLayer = (name="layer")=> ({tiles:{}, visible: true, name});
    let tilesetImage, canvas, tilesetContainer, tilesetSelection, cropSize,
        clearCanvasBtn, confirmBtn, confirmBtnText, tilesetGridContainer,
        layersElement, resizingCanvas, mapTileHeight, mapTileWidth, tileDataSel,
        tilesetDataSel, mapsDataSel;

    // let IMG_SOURCE = '';
    let TILESET_ELEMENTS = [];
    let IMAGES = [''];
    let SIZE_OF_CROP = 32;
    let WIDTH = 0;
    let HEIGHT = 0;
    let ACTIVE_TOOL = 0;
    let ACTIVE_MAP = "";
    const getEmptyMap = (name="map", mapWidth =10, mapHeight=10, tileSize = 32) =>
        ({layers: [getEmptyLayer("bottom"), getEmptyLayer("middle"), getEmptyLayer("top")], name,
            mapWidth, mapHeight, tileSize, width: mapWidth * SIZE_OF_CROP,height: mapHeight * SIZE_OF_CROP });

    const getSnappedPos = (pos) => Math.round(pos / SIZE_OF_CROP) * SIZE_OF_CROP;
    let selection = [{}];
    let currentLayer = 2;
    let isMouseDown = false;
    let layers = [];
    let maps = {};
    let tileSets = {};
    let stateHistory = [{}, {}, {}];

    let apiTileSetLoaders = {};
    let selectedTileSetLoader = {};
    let apiTileMapExporters = {};

    function getContext() {
        const ctx = canvas.getContext('2d');

        return ctx;
    }

    function setLayer(newLayer) {
        currentLayer = Number(newLayer);

        const oldActivedLayer = document.querySelector('.layer.active');
        if (oldActivedLayer) {
            oldActivedLayer.classList.remove('active');
        }

        document.querySelector(`.layer[tile-layer="${newLayer}"]`)?.classList.add('active');
        document.getElementById("activeLayerLabel").innerText = `Editing Layer: ${layers[newLayer]?.name}`;
    }

    function setLayerIsVisible(layer, override = null) {
        const layerNumber = Number(layer);
        layers[layerNumber].visible = override ?? !layers[layerNumber].visible;
        document
            .getElementById(`setLayerVisBtn-${layer}`)
            .innerHTML = layers[layerNumber].visible ? "👁️": "👓";
        draw();
    }

    function trashLayer(layer) {
        const layerNumber = Number(layer);
        // isLayerVisible[layerNumber] = !isLayerVisible[layerNumber];

        const result = window.confirm("Are you sure? Undo is not implemented!");
        if(result) {
            layers.splice(layerNumber, 1);
            stateHistory.splice(layerNumber, 1);
            updateLayers();
            setLayer(layers.length - 1);
            draw();
        }

    }

    function addLayer() {
        const newLayerName = prompt("Enter layer name", `Layer${layers.length + 1}`);
        if(newLayerName !== null) {
            layers.push(getEmptyLayer(newLayerName));
            stateHistory.push({});//TODO merge all of these into one damn array
            updateLayers();
        }
    }

    function updateLayers(){
        layersElement.innerHTML = layers.map((layer, index)=>{
            return `
              <div class="layer">
                <button id="selectLayerBtn-${index}" class="layer select_layer" tile-layer="${index}" title="${layer.name}">${layer.name}</button>
                <span id="setLayerVisBtn-${index}" vis-layer="${index}"></span>
                <button id="trashLayerBtn-${index}" trash-layer="${index}" ${layers.length > 1 ? "":`disabled="true"`}>🗑️</button>
              </div>
            `
        }).reverse().join("\n")

        layers.forEach((_,index)=>{
            document.getElementById(`selectLayerBtn-${index}`).addEventListener("click",e=>{
                setLayer(e.target.getAttribute("tile-layer"));
            })
            document.getElementById(`setLayerVisBtn-${index}`).addEventListener("click",e=>{
                setLayerIsVisible(e.target.getAttribute("vis-layer"))
            })
            document.getElementById(`trashLayerBtn-${index}`).addEventListener("click",e=>{
                trashLayer(e.target.getAttribute("trash-layer"))
            })
            setLayerIsVisible(index, true);
        })
        setLayer(currentLayer);
    }

    const getTileData = (x= null,y= null) =>{
        const tilesetTiles = tileSets[tilesetDataSel.value].tileData;
        let data;
        if(x === null && y === null){
            const {x: sx, y: sy} = selection[0];
            return tilesetTiles[`${sx}-${sy}`];
        } else {
            data = tilesetTiles[`${x}-${y}`]
        }
        return data;
    }
    const setTileData = (x = null,y = null,newData, key= "") =>{
        const tilesetTiles = tileSets[tilesetDataSel.value].tileData;
        if(x === null && y === null){
            const {x:sx, y:sy} = selection[0];
            tilesetTiles[`${sx}-${sy}`] = newData;
        }
        if(key !== ""){
            tilesetTiles[`${x}-${y}`][key] = newData;
        }else{
            tilesetTiles[`${x}-${y}`] = newData;
        }
    }

    const setActiveTool = (toolIdx) => {
        ACTIVE_TOOL = Number(toolIdx);
        document.getElementById("toolButtonsWrapper").childNodes.forEach((child, idx)=>{
            child.className = "button-as-link"
        });
        document.getElementById("toolButtonsWrapper").querySelector(`[value="${toolIdx}"]`)
            .className = "button-as-link active-tool"
    }

    const updateSelection = () => {
        const selected = selection[0];
        if(!selected) return;
        const {x, y} = selected;
        const {x: endX, y: endY} = selection[selection.length - 1];
        const selWidth = endX - x + 1;
        const selHeight = endY - y + 1;

        tilesetSelection.style.left = `${x * SIZE_OF_CROP}px`;
        tilesetSelection.style.top =  `${y * SIZE_OF_CROP}px`;
        tilesetSelection.style.width = `${selWidth * SIZE_OF_CROP}px`;
        tilesetSelection.style.height = `${selHeight * SIZE_OF_CROP}px`;

        const viewMode = tileDataSel.value;
        tilesetSelection.innerText = "";
        if(viewMode !== ""){
            const tileData = getTileData();
            tilesetSelection.innerText = tileData?.tileSymbol || "";
        }

        setActiveTool(0);
    }

    const randomLetters = new Array(10680).fill(1).map((_, i) => String.fromCharCode(165 + i));

    // TODO move all tileset data set stuff to updateTilesets
    function updateTilesetGridContainer(){
        const viewMode = tileDataSel.value;
        const tilesetData  = tileSets[tilesetDataSel.value];
        if(!tilesetData) return;

        const {tileCount, gridWidth, tileData} = tilesetData;
        // console.log("Tilesets data", tileSets, tileSets[tilesetDataSel.value], tilesetDataSel.value)
        const newGrid = Array.from({length: tileCount}, (x, i) => i).map(tile=>{
            const x = tile % gridWidth;
            const y = Math.floor(tile / gridWidth);
            const innerTile = viewMode === "" ? tileData[`${x}-${y}`]?.tileSymbol : "";
            return `<div style="width:${SIZE_OF_CROP}px;height:${SIZE_OF_CROP}px" class="tileset_grid_tile">${innerTile}</div>`
        }).join("\n")
        tilesetGridContainer.innerHTML = newGrid;
    }

    let tileSelectStart = null;
    function getSelectedTile(event) {
        const { x, y } = event.target.getBoundingClientRect();
        const tx = Math.floor(Math.max(event.clientX - x, 0) / SIZE_OF_CROP);
        const ty = Math.floor(Math.max(event.clientY - y, 0) / SIZE_OF_CROP);
        // add start tile, add end tile, add all tiles inbetween
        const newSelection = [];
        if (tileSelectStart !== null){
            for (let ix = tileSelectStart.x; ix < tx + 1; ix++) {
                for (let iy = tileSelectStart.y; iy < ty + 1; iy++) {
                    const data = getTileData(ix,iy);
                    newSelection.push({...data, x:ix,y:iy})
                }
            }
        }
        if (newSelection.length > 0) return newSelection;

        const data = getTileData(tx, ty);
        return [{...data, x:tx,y:ty}];
    }

    // the tile needs to use the image of the tileset it came from
    function draw(shouldDrawGrid = true) {
        const ctx = getContext();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        if(shouldDrawGrid)drawGrid(WIDTH, HEIGHT, SIZE_OF_CROP);

        layers.forEach((layer) => {
            Object.keys(layer.tiles).forEach((key) => {
                if(!layer.visible) return;

                const [positionX, positionY] = key.split('-').map(Number);
                const {x, y, tilesetIdx} = layer.tiles[key];
                ctx.drawImage(
                    TILESET_ELEMENTS[tilesetIdx],
                    x * SIZE_OF_CROP,
                    y * SIZE_OF_CROP,
                    SIZE_OF_CROP,
                    SIZE_OF_CROP,
                    positionX * SIZE_OF_CROP,
                    positionY * SIZE_OF_CROP,
                    SIZE_OF_CROP,
                    SIZE_OF_CROP
                );
            });
        });

    }

    function setMouseIsTrue(e) {
        if(e.button === 0) {
            isMouseDown = true;
        }
    }

    function setMouseIsFalse(e) {
        if(e.button === 0) {
            isMouseDown = false;
        }
    }

    function toggleTile(event) {
        if(ACTIVE_TOOL === 2) return;

        if (!layers[currentLayer].visible) {
            return;
        }

        const {x,y} = getSelectedTile(event)[0];
        const key = `${x}-${y}`;

        const isArray = (likely) => Array.isArray(likely) && likely[0] !== undefined;

        if (event.altKey) {
            if (event.type === 'pointerdown' || event.type === 'pointermove') {
                applyCtrlZ(key, isArray);
            }
            return;
        }
        updateStateHistory(key, isArray);

        if (event.shiftKey || event.button === 1) {
            removeTile(key);
        } else if (event.ctrlKey || event.button === 2) {
            const pickedTile = getTile(key);
            if(ACTIVE_TOOL === 0 && !pickedTile) setActiveTool(1)
        } else {
            if(ACTIVE_TOOL === 0){
                addTile(key);
            } else if(ACTIVE_TOOL === 1) {
                removeTile(key);
            }
        }

        draw();
    }

    function addTile(key) {
        const [x, y] = key.split("-")
        const {x: startX, y: startY} = selection[0];
        const {x: endX, y: endY} = selection[selection.length - 1];
        const selWidth = endX - startX + 1;
        const selHeight = endY - startY + 1;

        layers[currentLayer].tiles[key] = selection[0];
        for (let ix = 0; ix < selWidth; ix++) {
            for (let iy = 0; iy < selHeight; iy++) {
                const coordKey = `${Number(x)+ix}-${Number(y)+iy}`
                layers[currentLayer].tiles[coordKey] = selection.find(tile => tile.x === startX + ix && tile.y === startY + iy);
            }
        }
    }

    function getTile(key) {
        const clicked = layers[currentLayer].tiles[key];

        if (clicked) {
            selection = [clicked];
            // TODO switch to different tileset if its from a different one
            // if(clicked.tilesetIdx !== tilesetDataSel.value) {
            //     tilesetDataSel.value = clicked.tilesetIdx;
            //     updateTilesets();
            //     updateTilesetGridContainer();
            // }
            updateSelection();
            return true;
        } else {
            return false;
        }
    }

    function removeTile(key) {
        delete layers[currentLayer].tiles[key];
    }

    function applyCtrlZ(key, isArray) {
        const tileHistory = stateHistory[currentLayer][key];

        if (isArray(tileHistory)) {
            const lastSelected = stateHistory[currentLayer][key].pop();

            if (isArray(lastSelected)) {
                selection[0] = lastSelected;
                updateSelection();
                addTile(key);
                draw();
            }
        }
    }

    function updateStateHistory(key, isArray) {
        const tileHistory = stateHistory[currentLayer][key];

        const selected = layers[currentLayer].tiles[key];
        if (isArray(tileHistory)) {
            if (selected && !(selected.x === selection[0].x && selected.y === selection[0].y)) {
                stateHistory[currentLayer][key].push(selected);
            }
        } else {
            stateHistory[currentLayer][key] = [{coords: [5, 17]}];
        }
    }

    function clearCanvas() {
        const result = window.confirm("This will clear the map...\nAre you sure you want to do this?");
        if (result) {
            initDataAfterLoad();
            draw();
        }
    }

    function exportImage() {
        draw(false);
        const data = canvas.toDataURL();

        const image = new Image();
        image.src = data;
        image.crossOrigin = "anonymous";

        const w = window.open('');
        w.document.write(image.outerHTML);
        draw();
    }

    exports.getLayers = ()=> {
        return layers;
    }

    const renameCurrentTileSymbol = ()=>{
        if(tileDataSel.value === "") {
            const {x, y, tileSymbol} = selection[0];
            const newSymbol = window.prompt("Enter tile symbol", tileSymbol || "*");
            if(newSymbol !== null) {
                setTileData(x,y,newSymbol, "tileSymbol");
                updateSelection();
                updateTilesetGridContainer();
            }
        }
    }

    const getFlattenedData = () => {
        const flattenedData = Array(layers.length).fill([]).map(()=>{
           return Array(mapTileHeight).fill([]).map(row=>{
               return Array(mapTileWidth).fill([]).map(column => ({
                   tile: null,
                   tileSymbol: " "// a space is an empty tile
               }))
           })
       });
        layers.forEach((layerObj,lrIndex) => {
            Object.entries(layerObj.tiles).forEach(([key,tile])=>{
                const [x,y] = key.split("-");
                if(Number(y) < mapTileHeight && Number(x) < mapTileWidth) {
                    flattenedData[lrIndex][Number(y)][Number(x)] = {tile, tileSymbol: tile.tileSymbol || "*"};
                }
            })
        });
        return flattenedData;
    };
    const getExportData = () => {
        const exportData = {maps, tileSets, flattenedData: getFlattenedData(), layers, topLayer: layers.length - 1};
        console.log("Exported ", exportData);
        return exportData;
    }

    const updateMapSize = (size) =>{
        if(size?.mapWidth && size?.mapWidth > 1){
            mapTileWidth = size?.mapWidth;
            WIDTH = mapTileWidth * SIZE_OF_CROP;
            maps[ACTIVE_MAP].mapWidth = mapTileWidth;
            document.querySelector(".canvas_resizer[resizerdir='x']").style=`left:${WIDTH}px`;
        }
        if(size?.mapHeight && size?.mapHeight > 1){
            mapTileHeight = size?.mapHeight;
            HEIGHT = mapTileHeight * SIZE_OF_CROP;
            maps[ACTIVE_MAP].mapHeight = mapTileHeight;
            document.querySelector(".canvas_resizer[resizerdir='y']").style=`top:${HEIGHT}px`;
        }
        document.querySelector(".canvas_resizer[resizerdir='x'] input").value = String(mapTileWidth);
        document.getElementById("canvasWidthInp").value  = String(mapTileWidth);
        document.querySelector(".canvas_resizer[resizerdir='y'] input").value = String(mapTileHeight);
        document.getElementById("canvasHeightInp").value  = String(mapTileHeight);
        draw();
    }

    const setActiveMap =(id) =>{
        ACTIVE_MAP = id;
        layers = maps[ACTIVE_MAP].layers;
        setCropSize(maps[ACTIVE_MAP].tileSize);
        updateMapSize({mapWidth: maps[ACTIVE_MAP].mapWidth, mapHeight: maps[ACTIVE_MAP].mapHeight})
        updateLayers();
        updateTilesetGridContainer();
        draw();
    }

    // Note: only call this when tileset images have changed
    const updateTilesets = () =>{
        TILESET_ELEMENTS = [];
        tilesetDataSel.innerHTML = "";
        // Use to prevent old data from erasure
        const oldTilesets = {...tileSets};
        tileSets = {};
        let symbolStartIdx = 0;
        // Generate tileset data for each of the loaded images
        IMAGES.forEach((tsImage, idx)=>{
            const newOpt = document.createElement("option");
            newOpt.innerText = `tileset ${idx}`;
            newOpt.value = idx;
            tilesetDataSel.appendChild(newOpt);
            const tilesetImgElement = document.createElement("img");
            tilesetImgElement.src = tsImage;
            tilesetImgElement.crossOrigin = "Anonymous";
            // Add tileset data for all tiles
            tilesetImgElement.addEventListener("load",()=>{
                const gridWidth = tilesetImgElement.width / SIZE_OF_CROP;
                const gridHeight = Math.ceil(tilesetImgElement.height / SIZE_OF_CROP);
                const tileCount = gridWidth * gridHeight;
                const tilesetTileData = {};
                Array.from({length: tileCount}, (x, i) => i).map(tile=>{
                    const x = tile % gridWidth;
                    const y = Math.floor(tile / gridWidth);
                    const oldTileData = oldTilesets[idx]?.[`${x}-${y}`]?.tileData;
                    const tileSymbol = oldTileData?.tileSymbol || randomLetters[Math.floor(symbolStartIdx + tile)] || tile
                    tilesetTileData[`${x}-${y}`] = {
                        x, y, tilesetIdx: idx, tileSymbol
                    }
                })
                tileSets[idx] = {src: tsImage, name: `tileset ${idx}`, gridWidth, gridHeight, tileCount,
                    tileData: tilesetTileData, symbolStartIdx};

                symbolStartIdx += tileCount;
            })

            TILESET_ELEMENTS.push(tilesetImgElement);
        })
        Promise.all(Array.from(TILESET_ELEMENTS).filter(img => !img.complete)
            .map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })))
            .then(() => {
                tilesetImage.src = TILESET_ELEMENTS[0].src;
                tilesetImage.crossOrigin = "Anonymous";
                updateSelection();
                updateTilesetGridContainer();
            });

        tilesetImage.addEventListener('load', function () {
            draw();
            updateLayers();
            selection = [getTileData(0, 0)];
            updateSelection();
            updateTilesetGridContainer();
            document.querySelector('.canvas_resizer[resizerdir="x"]').style = `left:${WIDTH}px;`;
        });
    }

    const setCropSize = (newSize) =>{
        maps[ACTIVE_MAP].tileSize = newSize;
        SIZE_OF_CROP = newSize;
        cropSize.value = SIZE_OF_CROP;
        updateTilesets();
        updateTilesetGridContainer();
        draw();
    }

    const updateMaps = ()=>{
        mapsDataSel.innerHTML = "";
        Object.keys(maps).forEach((key, idx)=>{
            const newOpt = document.createElement("option");
            newOpt.innerText = maps[key].name//`map ${idx}`;
            newOpt.value = key;
            mapsDataSel.appendChild(newOpt);
        })
        document.getElementById("removeMapBtn").disabled = Object.keys(maps).length === 1;
    }
    const initDataAfterLoad = () =>{
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
        selection = [{}];
        stateHistory = [{}, {}, {}];
        ACTIVE_MAP = "Map_1";
        maps = {[ACTIVE_MAP]: getEmptyMap("Map 1")};
        layers = maps["Map_1"].layers;
        updateTilesets();
        tilesetDataSel.value = "0";
        cropSize.value = SIZE_OF_CROP;
        updateMaps();
        updateMapSize();
    }

    exports.init = (
        attachToId,
        {
            tileSize,
            mapWidth,
            mapHeight,
            tileSetImages,
            applyButtonText,
            onApply,
            tileSetLoaders,
            tileMapExporters
        }
    ) => {
        // Attach
        const attachTo = document.getElementById(attachToId);
        if(attachTo === null) return;

        apiTileSetLoaders = tileSetLoaders || {};
        apiTileSetLoaders.base64 = {
            name: "Fs (as base64)",
            onSelectImage: (setSrc, file, base64) => {
                setSrc(base64);
            },
        }
        apiTileMapExporters = tileMapExporters;
        apiTileMapExporters.exportAsImage = {
            name: "Export as image",
            transformer: exportImage
        }

        IMAGES = tileSetImages;
        SIZE_OF_CROP = tileSize || 32;
        mapTileWidth = mapWidth || 10;
        mapTileHeight = mapHeight || 10;
        const canvasWidth = mapTileWidth * tileSize;
        const canvasHeight = mapTileHeight * tileSize;


        // Attach elements
        attachTo.innerHTML = getHtml(canvasWidth, canvasHeight);
        attachTo.className = "tilemap_editor_root";
        tilesetImage = document.getElementById('tileset-source');
        cropSize = document.getElementById('cropSize');
        clearCanvasBtn = document.getElementById("clearCanvasBtn");

        confirmBtn = document.getElementById("confirmBtn");
        if(onApply){
            confirmBtnText = applyButtonText || "Ok";
            confirmBtn.innerText = confirmBtnText;
        } else {
            confirmBtn.style.display = "none";
        }
        canvas = document.querySelector('canvas');
        tilesetContainer = document.querySelector('.tileset-container');
        tilesetSelection = document.querySelector('.tileset-container-selection');
        tilesetGridContainer = document.getElementById("tilesetGridContainer");
        layersElement = document.getElementById("layers");

        tilesetContainer.addEventListener("contextmenu", e => {
            e.preventDefault();
        });

        tilesetContainer.addEventListener('pointerdown', (e) => {
            tileSelectStart = getSelectedTile(e)[0];
        });
        tilesetContainer.addEventListener('pointermove', (e) => {
            if(tileSelectStart !== null){
                selection = getSelectedTile(e);
                updateSelection();
            }
        });

        tilesetContainer.addEventListener('pointerup', (e) => {
            selection = getSelectedTile(e);
            updateSelection();
            tileSelectStart = null;
            if(e.button !== 2) return;
            selection = getSelectedTile(e);
            renameCurrentTileSymbol();
        });
        tilesetContainer.addEventListener('dblclick', (e) => {
            renameCurrentTileSymbol();
        });
        document.getElementById("addLayerBtn").addEventListener("click",()=>{
            addLayer();
        });
        // Maps DATA callbacks
        mapsDataSel = document.getElementById("mapsDataSel");
        mapsDataSel.addEventListener("change", e=>{
            setActiveMap(e.target.value);
        })
        document.getElementById("addMapBtn").addEventListener("click",()=>{
            const suggestMapName = `Map ${Object.keys(maps).length + 1}`;
            const result = window.prompt("Enter new map key...", suggestMapName);
            if(result !== null) {

                const newMapKey = result.trim().replaceAll(" ","_") || suggestMapName;
                if (newMapKey in maps){
                    alert("A map with this key already exists.")
                    return
                }
                maps[newMapKey] = getEmptyMap(result.trim());
            }
            updateMaps();
        })
        document.getElementById("removeMapBtn").addEventListener("click",()=>{
            delete maps[ACTIVE_MAP];
            setActiveMap(Object.keys(maps)[0])
            updateMaps();
        })
        // Tileset DATA Callbacks //tileDataSel
        tileDataSel = document.getElementById("tileDataSel");
        tileDataSel.addEventListener("change",()=>{
            updateTilesetGridContainer();
        })
        document.getElementById("addTileTagBtn").addEventListener("click",()=>{
            const result = window.prompt("Name your tag", "solid()");
            if(result !== null){
                const newOption = document.createElement("option");
                newOption.innerText = result;
                newOption.value = result;
                tileDataSel.appendChild(newOption)
            }
        });
        document.getElementById("removeTileTagBtn").addEventListener("click",()=>{
            if (tileDataSel.value) {
                document.querySelector(`#tileDataSel>option[value='${tileDataSel.value}']`).remove();
            }
        });
        // Tileset SELECT callbacks
        tilesetDataSel = document.getElementById("tilesetDataSel");
        tilesetDataSel.addEventListener("change",e=>{
            tilesetImage.src = TILESET_ELEMENTS[e.target.value].src;
            tilesetImage.crossOrigin = "Anonymous";
        })

        const replaceSelectedTileSet = (src) => {
            IMAGES[Number(tilesetDataSel.value)] = src;
            updateTilesets();
        }
        const addNewTileSet = (src) => {
            IMAGES.push(src);
            updateTilesets();
        }
        // replace tileset
        document.getElementById("tilesetReplaceInput").addEventListener("change",e=>{
            toBase64(e.target.files[0]).then(base64Src=>{
                if (selectedTileSetLoader.onSelectImage) {
                    selectedTileSetLoader.onSelectImage(replaceSelectedTileSet, e.target.files[0], base64Src);
                }
            })
        })
        document.getElementById("replaceTilesetBtn").addEventListener("click",()=>{
            if (selectedTileSetLoader.onSelectImage) {
                document.getElementById("tilesetReplaceInput").click();
            }
            if (selectedTileSetLoader.prompt) {
                selectedTileSetLoader.prompt(replaceSelectedTileSet);
            }
        });
        // add tileset
        document.getElementById("tilesetReadInput").addEventListener("change",e=>{
           toBase64(e.target.files[0]).then(base64Src=>{
               if (selectedTileSetLoader.onSelectImage) {
                   selectedTileSetLoader.onSelectImage(addNewTileSet, e.target.files[0], base64Src)
               }
            })
        })
        // remove tileset
        document.getElementById("addTilesetBtn").addEventListener("click",()=>{
            if (selectedTileSetLoader.onSelectImage) {
                document.getElementById("tilesetReadInput").click();
            }
            if (selectedTileSetLoader.prompt) {
                selectedTileSetLoader.prompt(addNewTileSet);
            }
        });
        const tileSetLoadersSel = document.getElementById("tileSetLoadersSel");
        Object.entries(apiTileSetLoaders).forEach(([key,loader])=>{
            const tsLoaderOption = document.createElement("option");
            tsLoaderOption.value = key;
            tsLoaderOption.innerText = loader.name;
            tileSetLoadersSel.appendChild(tsLoaderOption);
        });
        selectedTileSetLoader = apiTileSetLoaders[tileSetLoadersSel.value];
        tileSetLoadersSel.addEventListener("change", e=>{
            selectedTileSetLoader = apiTileSetLoaders[e.target.value];
        })
        document.getElementById("removeTilesetBtn").addEventListener("click",()=>{
            //Remove current tileset
            if (tilesetDataSel.value !== "0") {
                IMAGES.splice(Number(tilesetDataSel.value),1);
                initDataAfterLoad();
            }
        });

        // Canvas callbacks
        canvas.addEventListener('pointerdown', setMouseIsTrue);
        canvas.addEventListener('pointerup', setMouseIsFalse);
        canvas.addEventListener('pointerleave', setMouseIsFalse);
        canvas.addEventListener('pointerdown', toggleTile);
        canvas.addEventListener("contextmenu", e => e.preventDefault());
        canvas.addEventListener('pointermove', (e) => {
            if (isMouseDown) {
                if (ACTIVE_TOOL === 2){
                    const rect = e.target.getBoundingClientRect();
                    document.getElementById("canvas_wrapper").style = `transform: translate(${e.clientX-rect.width/2}px,${e.clientY - rect.height}px)`
                } else {
                    toggleTile(e);
                }

            }
        });
        // Canvas Resizer ===================
        document.getElementById("canvasWidthInp").addEventListener("change", e=>{
            updateMapSize({mapWidth: Number(e.target.value)})
        })
        document.getElementById("canvasHeightInp").addEventListener("change", e=>{
            updateMapSize({mapHeight: Number(e.target.value)})
        })
        document.querySelector(".canvas_resizer[resizerdir='y'] span").addEventListener("pointerdown", e=>{
            resizingCanvas = e.target.parentNode;
        })
        document.querySelector(".canvas_resizer[resizerdir='x'] span").addEventListener("pointerdown", e=>{
            resizingCanvas = e.target.parentNode;
        })
        document.querySelector(".canvas_resizer[resizerdir='y'] input").addEventListener("change", e=>{
            updateMapSize({mapHeight: Number(e.target.value)})
        })
        document.querySelector(".canvas_resizer[resizerdir='x'] input").addEventListener("change", e=>{
            updateMapSize({mapWidth: Number(e.target.value) })
        })
        document.addEventListener("pointermove", e=>{
            if(resizingCanvas){
                const isVertical = resizingCanvas.getAttribute("resizerdir") === "y";
                const snappedPos = getSnappedPos(isVertical? (e.y - 40): (e.x - tilesetImage.width));
                if(isVertical){
                    updateMapSize({mapHeight: snappedPos / SIZE_OF_CROP})
                } else {
                    updateMapSize({mapWidth: snappedPos / SIZE_OF_CROP})
                }
                draw();
            }
        })
        document.addEventListener("pointerup", ()=>{
            resizingCanvas = false;
        })

        document.getElementById("toolButtonsWrapper").addEventListener("click",e=>{
            if (e.target.nodeName !== 'BUTTON') return;
            setActiveTool(e.target.value);
        })

        cropSize.addEventListener('change', e=>{
            setCropSize(Number(e.target.value));
            draw();
        })

        clearCanvasBtn.addEventListener('click', clearCanvas);
        if(onApply){
            confirmBtn.addEventListener('click', () => onApply.onClick({data: getExportData()}));
        }

        document.getElementById("renameMapBtn").addEventListener("click",()=>{
            const newName = window.prompt("Change map name:", maps[ACTIVE_MAP].name || "Map");
            if(newName !== null && maps[ACTIVE_MAP].name !== newName){
                if(Object.values(maps).map(map=>map.name).includes(newName)){
                    alert(`${newName} already exists`);
                    return
                }
                maps[ACTIVE_MAP].name = newName;
                updateMaps();
            }
        })
        const fileMenuDropDown = document.getElementById("fileMenuDropDown");

        Object.entries(tileMapExporters).forEach(([key, exporter])=>{
            const menuItem = document.createElement("span");
            menuItem.className = "item";
            menuItem.innerText = exporter.name;
            menuItem.title = exporter.description;
            menuItem.value = key;
            menuItem.onclick = () => {
                exporter.transformer(getExportData());
            }
            console.log("ADD exporter", menuItem)
            fileMenuDropDown.appendChild(menuItem);
        })

        initDataAfterLoad();
    };
});
