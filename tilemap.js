// @ts-check
(function (root, factory) {
    // @ts-ignore
    if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        // @ts-ignore
        factory((root.TilemapJs = {}));
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
 
       <div class="tileset_opt_field">
<!--       <div>map:</div>-->
        <div class="select_container layer" id="mapSelectContainer">
            <select name="mapsData" id="mapsDataSel">
            </select>
            <button id="addMapBtn">+</button>
            <button id="removeMapBtn">-</button>
        </div>
        <div>tile size:</div>
        <input type="number" id="cropSize" name="crop" placeholder="32" min="1" max="128">
        <div id="toolButtonsWrapper">
          <button class="button-as-link active-tool" id="paintToolBtn" value="0" title="paint tiles">🖌️</button>
          <button class="button-as-link" id="eraseToolBtn" value="1" title="erase tiles">🗑️</button>
          <button class="button-as-link" id="panToolBtn" value="2" title="pan">✋</button> 
        </div>
|
         <button class="button-as-link" id="clearCanvasBtn" title="clear map">💥</button>
        <button class="primary-button" id="confirmBtn">${confirmBtnText  || "Export image"}</button>
      </div>
      <div class="card_body">
        <div class="card_left_column">
        <div class="select_container layer" id="tilesetSelectContainer">
            <select name="tileSetSelectData" id="tilesetDataSel">
<!--                <option value="0">tileset 0</option>-->
            </select>
            <button id="replaceTilesetBtn" title="replace">r</button>
            <input id="tilesetReplaceInput" type="file" style="display: none" />
            <button id="addTilesetBtn" title="add">+</button>
            <input id="tilesetReadInput" type="file" style="display: none" />
            <button id="removeTilesetBtn" title="remove">-</button>
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
          <div class="canvas_resizer" resizerdir="y"><input value="1" type="number" min="1" resizerdir="y"></input><span>-y-</span></div>
          <div class="canvas_resizer vertical" resizerdir="x"><input value="${mapTileWidth}" type="number" min="1" resizerdir="x"></input><span>-x-</span></div>
        </div>
        </div>
        
        
      <div class="card_right-column layers">
        <label class="sticky add_layer"><div>Editing Layer: </div><button id="addLayerBtn">➕ Add</button></label>
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

    let IMG_SOURCE = '';
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
    let tiles = [];
    let layers = [];
    let maps = {};
    let stateHistory = [{}, {}, {}];

    function getContext() {
        const ctx = canvas.getContext('2d');

        return ctx;
    }

    function setLayer(newLayer) {
        currentLayer = Number(newLayer);

        oldActivedLayer = document.querySelector('.layer.active');
        if (oldActivedLayer) {
            oldActivedLayer.classList.remove('active');
        }

        document.querySelector(`.layer[tile-layer="${newLayer}"]`)?.classList.add('active');
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
                <button id="selectLayerBtn-${index}" class="layer select_layer" tile-layer="${index}">${layer.name}</button>
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

    const getTileData = (x="",y="") =>{
        const tilesetTiles = tiles[Number(tilesetDataSel.value)];
        if(!x && !y){
            const {x: sx, y: sy} = selection[0];
            return tilesetTiles[`${sx}-${sy}`];
        }
        return tilesetTiles[`${x}-${y}`];
    }
    const setTileData = (x,y,newData, key= "") =>{
        const tilesetTiles = tiles[Number(tilesetDataSel.value)];
        if(!x && !y){
            const {x:sx, y:sy} = selection[0];
            tilesetTiles[`${sx}-${sy}`] = newData;
        }
        if(key !== ""){
            tilesetTiles[`${x}-${y}`][key] = newData;
        }else{
            tilesetTiles[`${x}-${y}`] = newData;
        }
    }
    function updateSelection() {
        const {x, y} = selection[0];
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
    }

    const randomLetters = new Array(10680).fill(1).map((_, i) => String.fromCharCode(165 + i));
    function updateTilesetGridContainer(){
        const gridWidth = tilesetImage.width / SIZE_OF_CROP;
        const gridHeight = tilesetImage.height / SIZE_OF_CROP;
        const viewMode = tileDataSel.value;
        const tilesetIdx = Number(tilesetDataSel.value);
        const tileCount = gridWidth * gridHeight;

        // get all previous array elements lengths
        let symbolStartIdx = 0;
        if(tilesetIdx !== 0) {
            tiles.forEach((tile,idx)=>{
                if(idx < tilesetIdx) symbolStartIdx += Object.keys(tile).length;
            })
        }
        const newGrid = Array.from({length: tileCount}, (x, i) => i).map(tile=>{
            const x = tile % gridWidth;
            const y = Math.floor(tile / gridWidth);
            let tileData = getTileData(x,y);
            if(!tileData?.tileSymbol){
                setTileData(x,y, {x,y,tilesetIdx, tileSymbol: randomLetters[symbolStartIdx + tile] || tile});
            }
            tileData = getTileData(x,y);

            const innerTile = viewMode === "" ? tileData?.tileSymbol : "";
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
    function draw() {
        const ctx = getContext();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        drawGrid(WIDTH, HEIGHT, SIZE_OF_CROP);

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
            getTile(key);
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
            updateSelection();
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
            tiles = [{}];
            // layers = [{}, {}, {}];
            // stateHistory = [{}, {}, {}];
            initDataAfterLoad();
            draw();
        }
    }

    function exportImage() {
        const data = canvas.toDataURL();

        const image = new Image();
        image.src = data;

        const w = window.open('');
        w.document.write(image.outerHTML);
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

    const getExportData = () => {
        const flattenedData = Array(layers.length).fill([]).map(()=>{
            return Array(mapTileHeight).fill([]).map(row=>{
                return Array(mapTileWidth).fill([]).map(column => ({
                    tile: null,
                    tileSymbol: " "// a space is an empty tile
                }))
            })
        })

        layers.forEach((layerObj,lrIndex) => {
            Object.entries(layerObj.tiles).forEach(([key,tile])=>{
                const [x,y] = key.split("-");
                if(Number(y) < mapTileHeight && Number(x) < mapTileWidth) {
                    flattenedData[lrIndex][Number(y)][Number(x)] = {tile, tileSymbol: tile.tileSymbol || "*"};
                }
            })
        });

        const activeLayer = layers.length - 1; // Top layer is automatically used as the player map
        const asciiMap = `\n${flattenedData[activeLayer].map((row,rowIndex) => "'" + row.map(tile => tile.tileSymbol).join("")).join("',\n") + "'"}
        `

        //TODO tileset generation code
        const kaboomTileset = ``;
        //TODO tilemap background generation code for all layers below the top one
        const kaboomBGLayers = ``;
        // generate map code for kaboomjs
        const kaboomJsCode = `
        layers([${layers.map(layer=>layer.name).join(",")}]);
        // slice the image into 12 x 3 = 36 frames with equal sizes
        // need to name the tileset here, path is the base64
        loadSprite("tileset", "path_to_image.png", {
            sliceX: 12,
            sliceY: 3,
        });
        add([
            sprite("tileset", { frame: 12, }),
        ]);
        
        // https://kaboomjs.com/examples#rpg
        // kaboom maps can take from multiple tilesets
        addLevel(levels[levelIdx], {
            width: 11,
            height: 11,
            pos: vec2(20, 20),
            "=": [
                sprite("tileset", { frame: 1, }),
                solid(),
            ],
            "$": [
                sprite("tileset", { frame: 2, }),
                "key",
             ],
        });
        // will only draw the rectangle area of x: 0, y: 0, w: 0.2, h: 0.2 of the image
        add([
            sprite("tileset", { quad: quad(0, 0, 0.2, 0.2), }),
        ]);
        
        //tilemap code
        const level = [
            ${asciiMap}
        ];
        `;

        console.log("FLATTENED", flattenedData, kaboomJsCode);
        const exportData = {asciiMap, kaboomJsCode, flattenedData, maps};
        console.log("Exported ", exportData);
        return exportData;
    }

    const updateMapSize = ({mapWidth, mapHeight, updateField} ) =>{
        if(mapWidth && mapWidth > 1){
            mapTileWidth = mapWidth;
            WIDTH = mapTileWidth * SIZE_OF_CROP;
            maps[ACTIVE_MAP].mapWidth = mapTileWidth;
            document.querySelector(".canvas_resizer[resizerdir='x']").style=`left:${WIDTH}px`;
            if(updateField) document.querySelector(".canvas_resizer[resizerdir='x'] input").value = String(mapHeight);
        }
        if(mapHeight && mapHeight > 1){
            mapTileHeight = mapHeight;
            HEIGHT = mapTileHeight * SIZE_OF_CROP;
            maps[ACTIVE_MAP].mapHeight = mapTileHeight;
            document.querySelector(".canvas_resizer[resizerdir='y']").style=`top:${HEIGHT}px`;
            if(updateField) document.querySelector(".canvas_resizer[resizerdir='y'] input").value = String(mapWidth);
        }
        draw();
        updateTilesetGridContainer();
    }

    const setActiveMap =(id) =>{
        ACTIVE_MAP = id;
        layers = maps[ACTIVE_MAP].layers;
        setCropSize(maps[ACTIVE_MAP].tileSize);
        updateMapSize({mapWidth: maps[ACTIVE_MAP].mapWidth, mapHeight: maps[ACTIVE_MAP].mapHeight, updateField:true})
        updateLayers();
        updateTilesetGridContainer();
        draw();
    }
    const setCropSize = (newSize) =>{
        maps[ACTIVE_MAP].tileSize = newSize;
        SIZE_OF_CROP = newSize;
        cropSize.value = SIZE_OF_CROP;
    }
    const updateTilesets = () =>{
        TILESET_ELEMENTS = [];
        tilesetDataSel.innerHTML = "";
        IMAGES.forEach((tsImage, idx)=>{
            const newOpt = document.createElement("option");
            newOpt.innerText = `tileset ${idx}`;
            newOpt.value = idx;
            tilesetDataSel.appendChild(newOpt);
            tiles.push({});
            const tilesetImgElement = document.createElement("img");
            tilesetImgElement.src = tsImage;
            TILESET_ELEMENTS.push(tilesetImgElement);
        })
        tilesetImage.src = IMAGES[Number(tilesetDataSel.value)];
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
        tiles = [];
        stateHistory = [{}, {}, {}];
        ACTIVE_MAP = "Map_1";
        maps = {[ACTIVE_MAP]: getEmptyMap("Map 1")};
        layers = maps["Map_1"].layers;
        console.log("MAPS",maps)
        updateTilesets();
        tilesetDataSel.value = "0";
        IMG_SOURCE = IMAGES[0];
        tilesetImage.src = IMG_SOURCE;
        cropSize.value = SIZE_OF_CROP;
        updateMaps();
        document.querySelector(".canvas_resizer[resizerdir='y'] input").value = mapTileHeight;
        document.querySelector(".canvas_resizer[resizerdir='x'] input").value = mapTileWidth;
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
        }
    ) => {
        // Attach
        const attachTo = document.getElementById(attachToId);
        if(attachTo === null) return;

        IMAGES = tileSetImages;
        IMG_SOURCE = tileSetImages[0];
        SIZE_OF_CROP = tileSize || 32;
        mapTileWidth = mapWidth || 10;
        mapTileHeight = mapHeight || 10;
        const canvasWidth = mapTileWidth * tileSize;
        const canvasHeight = mapTileHeight * tileSize;


        // Attach elements
        attachTo.innerHTML = getHtml(canvasWidth, canvasHeight);
        attachTo.className = "tileme_root";

        tilesetImage = document.getElementById('tileset-source');
        cropSize = document.getElementById('cropSize');
        clearCanvasBtn = document.getElementById("clearCanvasBtn");
        confirmBtn = document.getElementById("confirmBtn");
        confirmBtnText = applyButtonText;
        confirmBtn.innerText = confirmBtnText;
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
            const result = window.prompt("Enter new map name...", suggestMapName);
            if(result !== null) {

                const newMapKey = result.trim().replaceAll(" ","_") || suggestMapName;
                if (newMapKey in maps){
                    alert("A map with this name already exists.")
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
        tileDataSel.addEventListener("change",e=>{
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
            IMG_SOURCE = IMAGES[e.target.value];
            tilesetImage.src = IMG_SOURCE;
        })

        // replace tileset
        document.getElementById("tilesetReplaceInput").addEventListener("change",e=>{
            toBase64(e.target.files[0]).then(base64Src=>{
                IMAGES[Number(tilesetDataSel.value)] = base64Src;
                updateTilesets();
            })
        })
        document.getElementById("replaceTilesetBtn").addEventListener("click",()=>{
            document.getElementById("tilesetReplaceInput").click();
        });
        // add tileset
        document.getElementById("tilesetReadInput").addEventListener("change",e=>{
           toBase64(e.target.files[0]).then(base64Src=>{
                IMAGES.push(base64Src);
                updateTilesets();
            })
        })
        // remove tileset
        document.getElementById("addTilesetBtn").addEventListener("click",()=>{
            //Opens a file selector to load its data (tileset file name and base64)
            document.getElementById("tilesetReadInput").click();
        });
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
        document.querySelector(".canvas_resizer[resizerdir='y'] span").addEventListener("pointerdown", e=>{
            resizingCanvas = e.target.parentNode;
        })
        document.querySelector(".canvas_resizer[resizerdir='x'] span").addEventListener("pointerdown", e=>{
            resizingCanvas = e.target.parentNode;
        })
        document.querySelector(".canvas_resizer[resizerdir='y'] input").addEventListener("change", e=>{
            updateMapSize({mapHeight: Number(e.target.value) })
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
                updateTilesetGridContainer();
            }
        })
        document.addEventListener("pointerup", e=>{
            resizingCanvas = false;
        })

        document.getElementById("toolButtonsWrapper").addEventListener("click",e=>{
            if (e.target.nodeName !== 'BUTTON') return;
            ACTIVE_TOOL = Number(e.target.value);
            document.getElementById("toolButtonsWrapper").childNodes.forEach((child, idx)=>{
                child.className = "button-as-link"
            });
            e.target.className = "button-as-link active-tool"
        })
        tilesetImage.addEventListener('load', function () {
            draw();
            updateLayers();
            updateTilesetGridContainer();
            document.querySelector('.canvas_resizer[resizerdir="x"]').style = `left:${WIDTH}px;`;
            selection[0] = getTileData(0, 0);
            updateSelection();
            updateTilesetGridContainer();
        });

        cropSize.addEventListener('change', e=>{
            setCropSize(Number(e.target.value));
            draw();
            updateSelection();
            updateTilesetGridContainer();
        })

        clearCanvasBtn.addEventListener('click', clearCanvas);
        if(onApply){
            confirmBtn.addEventListener('click', () => onApply(getExportData()));
        } else {
            confirmBtn.addEventListener('click', exportImage);
        }

        initDataAfterLoad();

    };
});
