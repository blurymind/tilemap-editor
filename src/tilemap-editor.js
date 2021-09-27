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
    // Call once on element to add behavior, toggle on/off isDraggable attr to enable
    const draggable = ({element, onElement = null, isDrag = false, onDrag = null,
                           limitX = false, limitY = false, onRelease = null}) => {
        element.setAttribute("isDraggable", isDrag);
        let isMouseDown = false;
        let mouseX;
        let mouseY;
        let elementX = 0;
        let elementY = 0;
        const onMouseMove = (event) => {
            if (!isMouseDown || element.getAttribute("isDraggable") === "false") return;
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            // element.style.position = "relative"
            if(!limitX) element.style.left = elementX + deltaX + 'px';
            if(!limitY) element.style.top = elementY + deltaY + 'px';
            console.log("DRAGGING", {deltaX, deltaY, x: elementX + deltaX, y:elementY + deltaY})
            if(onDrag) onDrag({deltaX, deltaY, x: elementX + deltaX, y:elementY + deltaY, mouseX, mouseY});
        }
        const onMouseDown = (event) => {
            if(element.getAttribute("isDraggable") === "false") return;

            mouseX = event.clientX;
            mouseY = event.clientY;
            console.log("MOUSEX", mouseX)
            isMouseDown = true;
        }
        const onMouseUp = () => {
            if(!element.getAttribute("isDraggable") === "false") return;
            isMouseDown = false;
            elementX = parseInt(element.style.left) || 0;
            elementY = parseInt(element.style.top) || 0;
            if(onRelease) onRelease({x:elementX,y:elementY})
        }
        (onElement || element).addEventListener('pointerdown', onMouseDown);
        document.addEventListener('pointerup', onMouseUp);
        document.addEventListener('pointermove', onMouseMove);
    }
     const drawGrid = (w, h,ctx, step = 16, color='rgba(0,255,217,0.5)') => {
         ctx.strokeStyle = color;
         ctx.lineWidth = 0.5;
         ctx.beginPath();
         for (let x = 0; x < w + 1; x += step) {
             ctx.moveTo(x,  0.5);
             ctx.lineTo(x, h + 0.5);
         }
         for (let y = 0; y < h +1; y += step) {
             ctx.moveTo(0, y + 0.5);
             ctx.lineTo(w, y + 0.5);
         }
         ctx.stroke();
    }
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
    const decoupleReferenceFromObj = (obj) => JSON.parse(JSON.stringify(obj));
    const getHtml = (width, height) =>{
        return `
       <div id="tilemapjs_root" class="card tilemapjs_root">
        <a id="downloadAnchorElem" style="display:none"></a>
       <div class="tileset_opt_field header">
       <div class="menu file">
            <span> File </span>
            <div class="dropdown" id="fileMenuDropDown">                            
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
                    <div>left-click - selects tile </div>
                </div>
                </div>
                </div>
            </div>
        </div>
        <div>
            <div id="toolButtonsWrapper" class="tool_wrapper">             
              <input id="tool0" type="radio" value="0" name="tool" checked class="hidden"/>
              <label for="tool0" title="paint tiles" data-value="0" class="menu">
                  <div id="flipBrushIndicator">🖌️</div>
                  <div class="dropdown">
                    <div class="item nohover">Brush tool options</div>
                    <div class="item">
                        <label for="toggleFlipX" class="">Flip tile on x</label>
                        <input type="checkbox" id="toggleFlipX" style="display: none"> 
                        <label class="toggleFlipX"></label>
                    </div>
                  </div>
              </label>
              <input id="tool1" type="radio" value="1" name="tool" class="hidden"/>
              <label for="tool1" title="erase tiles" data-value="1">🗑️</label>
              <input id="tool2" type="radio" value="2" name="tool" class="hidden"/> 
              <label for="tool2" title="pan" data-value="2">✋</label>
              <input id="tool3" type="radio" value="3" name="tool" class="hidden"/> 
              <label for="tool3" title="pick tile" data-value="3">🎨</label>
              <input id="tool4" type="radio" value="4" name="tool" class="hidden"/> 
              <label for="tool4" title="random from selected" data-value="4">🎲</label>
               <input id="tool5" type="radio" value="5" name="tool" class="hidden"/> 
              <label for="tool5" title="fill on layer" data-value="5">🌈</label>
            </div>
        </div>

        <div class="tool_wrapper">
            <label id="undoBtn" title="Undo">↩️️</label>
            <label id="redoBtn" title="Redo">🔁️</label>
            <label id="zoomIn" title="Zoom in">🔎️+</label>
            <label id="zoomOut" title="Zoom out">🔎️-</label>
            <label id="zoomLabel">️</label>
        </div>
            
        <div>
            <button class="primary-button" id="confirmBtn">"apply"</button>
        </div>

      </div>
      <div class="card_body">
        <div class="card_left_column">
        <details class="details_container sticky_left" id="tilesetDataDetails" open="true">
          <summary >
            <span  id="mapSelectContainer">
            | <select name="tileSetSelectData" id="tilesetDataSel" class="limited_select"></select>
            <button id="replaceTilesetBtn" title="replace tileset">r</button>
            <input id="tilesetReplaceInput" type="file" style="display: none" />
            <button id="addTilesetBtn" title="add tileset">+</button>
            <input id="tilesetReadInput" type="file" style="display: none" />
            <button id="removeTilesetBtn" title="remove">-</button>
            </span>
          </summary>
          <div>
              <div class="tileset_opt_field">
                <span>Tile size:</span>
                <input type="number" id="cropSize" name="crop" placeholder="32" min="1" max="128">
              </div>
              <div class="tileset_opt_field">
                <span>Tileset loader:</span>
                <select name="tileSetLoaders" id="tileSetLoadersSel"></select>
              </div>
              <div class="tileset_info" id="tilesetSrcLabel"></div>
              <div class="tileset_info" id="tilesetHomeLink"></div>
              <div class="tileset_info" id="tilesetDescriptionLabel"></div> 
          </div>

        </details>
        <div class="select_container layer sticky_top sticky_left" id="tilesetSelectContainer">
            <span id="setSymbolsVisBtn">👓️</span>

            <select name="tileData" id="tileDataSel">
                <option value="">Symbols</option>
            </select>
            <button id="addTileTagBtn" title="add">+</button>
            <button id="removeTileTagBtn" title="remove">-</button>
        </div>
        <div class="select_container layer sticky_top2 tileset_opt_field sticky_settings  sticky_left" style="display: none" id="tileFrameSelContainer">
            <select name="tileFrameData" id="tileFrameSel">
<!--            <option value="anim1">anim1rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr</option>-->
        </select>
        <button id="addTileFrameBtn" title="add">+</button>
        <button id="removeTileFrameBtn" title="remove">-</button>
        frames: <input id="tileFrameCount" value="1" type="number" min="1">
        
        <div title="Object parameters" class="menu parameters" id="objectParametersEditor">
            ⚙
            <div class="dropdown">
                <div class="item nohover">Object parameters</div>
                <div class="item">
                    coming soon...
<!--                    <label for="toggleFlipX" class="">Flip tile on x</label>-->
<!--                    <input type="checkbox" id="toggleFlipX" style="display: none"> -->
<!--                    <label class="toggleFlipX"></label>-->
                </div>
            </div>
        ️</div>
        </div>
        
      <div class="tileset-container">
        <div class="tileset-container-selection"></div>
        <canvas id="tilesetCanvas" />
<!--        <div id="tilesetGridContainer" class="tileset_grid_container"></div>-->
        
      </div>
        </div>
        <div class="card_right-column" style="position:relative" id="canvas_drag_area">
        <div class="canvas_wrapper" id="canvas_wrapper">
          <canvas id="mapCanvas" width="${width}" height="${height}"></canvas>
          <div class="canvas_resizer" resizerdir="y"><input value="1" type="number" min="1" resizerdir="y"><span>-y-</span></div>
          <div class="canvas_resizer vertical" resizerdir="x"><input value="${mapTileWidth}" type="number" min="1" resizerdir="x"><span>-x-</span></div>
        </div>
        </div>
      <div class="card_right-column layers">
      <div id="mapSelectContainer" class="tilemaps_selector">
            <select name="mapsData" id="mapsDataSel"></select>
            <button id="addMapBtn" title="Add tilemap">+</button>
            <button id="removeMapBtn" title="Remove tilemap">-</button>        
            <button id="duplicateMapBtn" title="Duplicate tilemap">📑</button>     
            <a class="button" href="#popup1">🎚️</a>
            <div id="popup1" class="overlay">
            <div class="popup">
            <h4>TileMap settings</h4>
            <a class="close" href="#">&times;</a>
            <div class="content">
                <span class="flex">Width: </span><input id="canvasWidthInp" value="1" type="number" min="1">
                <span class="flex">Height: </span><input id="canvasHeightInp" value="1" type="number" min="1">
                <br/><br/>
                <span class="flex">Grid tile size: </span><input type="number" id="gridCropSize" name="crop" placeholder="32" min="1" max="128">
                <span class="flex">Grid color: </span><input type="color" value="#ff0000" id="gridColorSel">
                <span class="flex">Show grid above: </span> <input type="checkbox" id="showGrid">
                <br/><br/>
                <div class="tileset_opt_field">
                    <button id="renameMapBtn" title="Rename map">Rename</button>
                    <button id="clearCanvasBtn" title="Clear map">Clear</button>
                </div>
            </div>
            </div>
            </div>
        </div>

        <label class="sticky add_layer">
            <label id="activeLayerLabel" class="menu">
            Editing Layer
            </label>
            <button id="addLayerBtn" title="Add layer">+</button>
        </label>
        <div class="layers" id="layers">
      </div>
      </div>
    </div>
        `
    }
    const getEmptyLayer = (name="layer")=> ({tiles:{}, visible: true, name, animatedTiles: {}, opacity: 1});
    let tilesetImage, canvas, tilesetContainer, tilesetSelection, cropSize,
        confirmBtn, tilesetGridContainer,
        layersElement, resizingCanvas, mapTileHeight, mapTileWidth, tileDataSel,tileFrameSel,
        tilesetDataSel, mapsDataSel, objectParametersEditor;

    let TILESET_ELEMENTS = [];
    let IMAGES = [{src:''}];
    let ZOOM = 1;
    let SIZE_OF_CROP = 32;
    let WIDTH = 0;
    let HEIGHT = 0;
    const TOOLS = {
        BRUSH: 0,
        ERASE: 1,
        PAN: 2,
        PICK: 3,
        RAND: 4,
        FILL: 5
    }
    let PREV_ACTIVE_TOOL = 0;
    let ACTIVE_TOOL = 0;
    let ACTIVE_MAP = "";
    let DISPLAY_SYMBOLS = false;
    let SHOW_GRID = false;
    const getEmptyMap = (name="map", mapWidth =20, mapHeight=20, tileSize = 32, gridColor="#00FFFF") =>
        ({layers: [getEmptyLayer("bottom"), getEmptyLayer("middle"), getEmptyLayer("top")], name,
            mapWidth, mapHeight, tileSize, width: mapWidth * SIZE_OF_CROP,height: mapHeight * SIZE_OF_CROP, gridColor });

    const getEmptyTilesetTag = (name, code, tiles ={}) =>({name,code,tiles});

    const getEmptyTileSet = ({
                                 src,
                                 name = "tileset",
                                 gridWidth,
                                 gridHeight,
                                 tileData = {},
                                 symbolStartIdx,
                                 tileSize = SIZE_OF_CROP,
                                 tags = {},
                                 frames = {},
                                 width,
                                 height,
                                 description = "n/a"
                             }) => {
        return { src, name, gridWidth, gridHeight, tileCount: gridWidth * gridHeight, tileData, symbolStartIdx,tileSize, tags, frames, description, width, height}
    }

    const getSnappedPos = (pos) => (Math.round(pos / (SIZE_OF_CROP)) * (SIZE_OF_CROP));
    let selection = [{}];
    let currentLayer = 0;
    let isMouseDown = false;
    let maps = {};
    let tileSets = {};

    let apiTileSetLoaders = {};
    let selectedTileSetLoader = {};
    let apiTileMapExporters = {};
    let apiTileMapImporters = {};

    let editedEntity

    const getContext = () =>  canvas.getContext('2d');

    const setLayer = (newLayer) => {
        currentLayer = Number(newLayer);

        const oldActivedLayer = document.querySelector('.layer.active');
        if (oldActivedLayer) {
            oldActivedLayer.classList.remove('active');
        }

        document.querySelector(`.layer[tile-layer="${newLayer}"]`)?.classList.add('active');
        document.getElementById("activeLayerLabel").innerHTML = `
            Editing Layer: ${maps[ACTIVE_MAP].layers[newLayer]?.name} 
            <div class="dropdown left">
                <div class="item nohover">Layer: ${maps[ACTIVE_MAP].layers[newLayer]?.name} </div>
                <div class="item">
                    <div class="slider-wrapper">
                      <label for="layerOpacitySlider">Opacity</label>
                      <input type="range" min="0" max="1" value="1" id="layerOpacitySlider" step="0.01">
                      <output for="layerOpacitySlider" id="layerOpacitySliderValue">${maps[ACTIVE_MAP].layers[newLayer]?.opacity}</output>
                    </div>
                </div>
            </div>
        `;
        document.getElementById("layerOpacitySlider").value = maps[ACTIVE_MAP].layers[newLayer]?.opacity;
        document.getElementById("layerOpacitySlider").addEventListener("change", e =>{
            addToUndoStack();
            document.getElementById("layerOpacitySliderValue").innerText = e.target.value;
            maps[ACTIVE_MAP].layers[currentLayer].opacity = Number(e.target.value);
            draw();
            updateLayers();
        })
    }


    const setLayerIsVisible = (layer, override = null) => {
        const layerNumber = Number(layer);
        maps[ACTIVE_MAP].layers[layerNumber].visible = override ?? !maps[ACTIVE_MAP].layers[layerNumber].visible;
        document
            .getElementById(`setLayerVisBtn-${layer}`)
            .innerHTML = maps[ACTIVE_MAP].layers[layerNumber].visible ? "👁️": "👓";
        draw();
    }

    const trashLayer = (layer) => {
        const layerNumber = Number(layer);
        maps[ACTIVE_MAP].layers.splice(layerNumber, 1);
        updateLayers();
        setLayer(maps[ACTIVE_MAP].layers.length - 1);
        draw();
    }

    const addLayer = () => {
        const newLayerName = prompt("Enter layer name", `Layer${maps[ACTIVE_MAP].layers.length + 1}`);
        if(newLayerName !== null) {
            maps[ACTIVE_MAP].layers.push(getEmptyLayer(newLayerName));
            updateLayers();
        }
    }

    const updateLayers = () => {
        layersElement.innerHTML = maps[ACTIVE_MAP].layers.map((layer, index)=>{
            return `
              <div class="layer">
                <div id="selectLayerBtn-${index}" class="layer select_layer" tile-layer="${index}" title="${layer.name}">${layer.name} ${layer.opacity < 1 ? ` (${layer.opacity})` : ""}</div>
                <span id="setLayerVisBtn-${index}" vis-layer="${index}"></span>
                <div id="trashLayerBtn-${index}" trash-layer="${index}" ${maps[ACTIVE_MAP].layers.length > 1 ? "":`disabled="true"`}>🗑️</div>
              </div>
            `
        }).reverse().join("\n")

        maps[ACTIVE_MAP].layers.forEach((_,index)=>{
            document.getElementById(`selectLayerBtn-${index}`).addEventListener("click",e=>{
                setLayer(e.target.getAttribute("tile-layer"));
                addToUndoStack();
            })
            document.getElementById(`setLayerVisBtn-${index}`).addEventListener("click",e=>{
                setLayerIsVisible(e.target.getAttribute("vis-layer"))
                addToUndoStack();
            })
            document.getElementById(`trashLayerBtn-${index}`).addEventListener("click",e=>{
                trashLayer(e.target.getAttribute("trash-layer"))
                addToUndoStack();
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
        ACTIVE_TOOL = toolIdx;
        const actTool = document.getElementById("toolButtonsWrapper").querySelector(`input[id="tool${toolIdx}"]`);
        if (actTool) actTool.checked = true;
        document.getElementById("canvas_wrapper").setAttribute("isDraggable", ACTIVE_TOOL === TOOLS.PAN);
        draw();
    }

    let selectionSize = [1,1];
    const updateSelection = () => {
        if(!tileSets[tilesetDataSel.value]) return;
        const selected = selection[0];
        if(!selected) return;
        const {x, y} = selected;
        const {x: endX, y: endY} = selection[selection.length - 1];
        const selWidth = endX - x + 1;
        const selHeight = endY - y + 1;
        selectionSize = [selWidth, selHeight]
        console.log(tileSets[tilesetDataSel.value].tileSize)
        const tileSize = tileSets[tilesetDataSel.value].tileSize;
        tilesetSelection.style.left = `${x * tileSize * ZOOM}px`;
        tilesetSelection.style.top = `${y * tileSize * ZOOM}px`;
        tilesetSelection.style.width = `${selWidth * tileSize * ZOOM}px`;
        tilesetSelection.style.height = `${selHeight * tileSize * ZOOM}px`;

        // Autoselect tool upon selecting a tile
        if(![TOOLS.BRUSH, TOOLS.RAND, TOOLS.FILL].includes(ACTIVE_TOOL)) setActiveTool(TOOLS.BRUSH);

        // show/hide param editor
       if(tileDataSel.value === "frames" && editedEntity) objectParametersEditor.classList.add('entity');
       else objectParametersEditor.classList.remove('entity');
    }

    const randomLetters = new Array(10680).fill(1).map((_, i) => String.fromCharCode(165 + i));

    const shouldHideSymbols = () => SIZE_OF_CROP < 10 && ZOOM < 2;
    const updateTilesetGridContainer = () =>{
        const viewMode = tileDataSel.value;
        const tilesetData = tileSets[tilesetDataSel.value];
        if(!tilesetData) return;

        const {tileCount, gridWidth, tileData, tags} = tilesetData;
        console.log("COUNT", tileCount)
        const hideSymbols = !DISPLAY_SYMBOLS || shouldHideSymbols();
        const canvas = document.getElementById("tilesetCanvas");
        const img = TILESET_ELEMENTS[tilesetDataSel.value];
        canvas.width = img.width * ZOOM;
        canvas.height = img.height * ZOOM;
        const ctx = canvas.getContext('2d');
        if (ZOOM !== 1){
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;
        }
        ctx.drawImage(img,0,0,canvas.width ,canvas.height);
        console.log("WIDTH EXCEEDS?", canvas.width % SIZE_OF_CROP)
        const tileSizeSeemsIncorrect = canvas.width % SIZE_OF_CROP !== 0;
        drawGrid(ctx.canvas.width, ctx.canvas.height, ctx,SIZE_OF_CROP * ZOOM, tileSizeSeemsIncorrect ? "red":"cyan");
        Array.from({length: tileCount}, (x, i) => i).map(tile=>{
            if (viewMode === "frames") {
                const frameData = getCurrentFrames();
                if(!frameData || Object.keys(frameData).length === 0) return;

                const {width, height, start, tiles,frameCount} = frameData;
                selection = [...tiles];
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = "red";
                ctx.strokeRect(SIZE_OF_CROP * ZOOM * (start.x + width), SIZE_OF_CROP * ZOOM * start.y, SIZE_OF_CROP * ZOOM * (width * (frameCount - 1)), SIZE_OF_CROP * ZOOM * height);
            } else if (!hideSymbols) {
                const x = tile % gridWidth;
                const y = Math.floor(tile / gridWidth);
                const tileKey = `${x}-${y}`;
                const innerTile = viewMode === "" ?
                    tileData[tileKey]?.tileSymbol :
                    viewMode === "frames" ? tile :tags[viewMode]?.tiles[tileKey]?.mark || "-";

                ctx.fillStyle = 'white';
                ctx.font = '11px arial';
                ctx.shadowColor="black";
                ctx.shadowBlur=4;
                ctx.lineWidth=2;
                const posX = (x * SIZE_OF_CROP * ZOOM) + ((SIZE_OF_CROP * ZOOM) / 3);
                const posY = (y * SIZE_OF_CROP * ZOOM) + ((SIZE_OF_CROP * ZOOM) / 2);
                ctx.fillText(innerTile,posX,posY);
            }
        })
    }

    let tileSelectStart = null;
    const getSelectedTile = (event) => {
        const { x, y } = event.target.getBoundingClientRect();
        const tileSize = tileSets[tilesetDataSel.value].tileSize * ZOOM;
        const tx = Math.floor(Math.max(event.clientX - x, 0) / tileSize);
        const ty = Math.floor(Math.max(event.clientY - y, 0) / tileSize);
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

    const draw = (shouldDrawGrid = true) =>{
        const ctx = getContext();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.canvas.width = WIDTH;
        ctx.canvas.height = HEIGHT;
        if(shouldDrawGrid && !SHOW_GRID)drawGrid(WIDTH, HEIGHT, ctx,SIZE_OF_CROP * ZOOM, maps[ACTIVE_MAP].gridColor);
        const shouldHideHud = shouldHideSymbols();

        maps[ACTIVE_MAP].layers.forEach((layer) => {
            if(!layer.visible) return;
            ctx.globalAlpha = layer.opacity;
            if (ZOOM !== 1){
                ctx.webkitImageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
                ctx.imageSmoothingEnabled = false;
            }
            //static tiles on this layer
            Object.keys(layer.tiles).forEach((key) => {
                const [positionX, positionY] = key.split('-').map(Number);
                const {x, y, tilesetIdx, isFlippedX} = layer.tiles[key];
                const tileSize = tileSets[tilesetIdx]?.tileSize || SIZE_OF_CROP;

                if(!(tilesetIdx in TILESET_ELEMENTS)) { //texture not found
                    ctx.fillStyle = 'red';
                    ctx.fillRect(positionX * SIZE_OF_CROP * ZOOM, positionY * SIZE_OF_CROP * ZOOM, SIZE_OF_CROP * ZOOM, SIZE_OF_CROP * ZOOM);
                    return;
                }
                if(isFlippedX){
                    ctx.save();//Special canvas crap to flip a slice, cause drawImage cant do it
                    ctx.translate(ctx.canvas.width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        TILESET_ELEMENTS[tilesetIdx],
                        x * tileSize,
                        y * tileSize,
                        tileSize,
                        tileSize,
                        ctx.canvas.width - (positionX * SIZE_OF_CROP * ZOOM) - SIZE_OF_CROP * ZOOM,
                        positionY * SIZE_OF_CROP * ZOOM,
                        SIZE_OF_CROP * ZOOM,
                        SIZE_OF_CROP * ZOOM
                    );
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        TILESET_ELEMENTS[tilesetIdx],
                        x * tileSize,
                        y * tileSize,
                        tileSize,
                        tileSize,
                        positionX * SIZE_OF_CROP * ZOOM,
                        positionY * SIZE_OF_CROP * ZOOM,
                        SIZE_OF_CROP * ZOOM,
                        SIZE_OF_CROP * ZOOM
                    );
                }
            });
            // animated tiles
            Object.keys(layer.animatedTiles || {}).forEach((key) => {
                const [positionX, positionY] = key.split('-').map(Number);
                const {start, width, height, frameCount, isFlippedX} = layer.animatedTiles[key];
                const {x, y, tilesetIdx} = start;
                const tileSize = tileSets[tilesetIdx]?.tileSize || SIZE_OF_CROP;

                if(!(tilesetIdx in TILESET_ELEMENTS)) { //texture not found
                    ctx.fillStyle = 'yellow';
                    ctx.fillRect(positionX * SIZE_OF_CROP * ZOOM, positionY * SIZE_OF_CROP * ZOOM, SIZE_OF_CROP  * ZOOM * width, SIZE_OF_CROP  * ZOOM * height);
                    ctx.fillStyle = 'blue';
                    ctx.fillText("X",positionX * SIZE_OF_CROP * ZOOM + 5,positionY * SIZE_OF_CROP  * ZOOM + 10);
                    return;
                }
                const frameIndex = tileDataSel.value === "frames" || frameCount === 1 ? Math.round(Date.now()/120) % frameCount : 1; //30fps

                if(isFlippedX) {
                    ctx.save();//Special canvas crap to flip a slice, cause drawImage cant do it
                    ctx.translate(ctx.canvas.width, 0);
                    ctx.scale(-1, 1);

                    const positionXFlipped = ctx.canvas.width - (positionX * SIZE_OF_CROP * ZOOM) - SIZE_OF_CROP * ZOOM;
                    if(shouldDrawGrid && !shouldHideHud) {
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(250,240,255, 0.7)';
                        ctx.rect(positionXFlipped, positionY * SIZE_OF_CROP * ZOOM, SIZE_OF_CROP * ZOOM * width, SIZE_OF_CROP * ZOOM * height);
                        ctx.stroke();
                    }
                    ctx.drawImage(
                        TILESET_ELEMENTS[tilesetIdx],
                        x * tileSize + (frameIndex * tileSize * width),
                        y * tileSize,
                        tileSize * width,// src width
                        tileSize * height, // src height
                        positionXFlipped,
                        positionY * SIZE_OF_CROP * ZOOM, //target y
                        SIZE_OF_CROP * ZOOM * width, // target width
                        SIZE_OF_CROP * ZOOM * height // target height
                    );
                    if(shouldDrawGrid && !shouldHideHud) {
                        ctx.fillStyle = 'white';
                        ctx.fillText("🔛",positionXFlipped + 5,positionY * SIZE_OF_CROP * ZOOM + 10);
                    }
                    ctx.restore();
                }else {
                    if(shouldDrawGrid && !shouldHideHud) {
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(250,240,255, 0.7)';
                        ctx.rect(positionX * SIZE_OF_CROP * ZOOM, positionY * SIZE_OF_CROP * ZOOM, SIZE_OF_CROP * ZOOM * width, SIZE_OF_CROP * ZOOM * height);
                        ctx.stroke();
                    }
                    ctx.drawImage(
                        TILESET_ELEMENTS[tilesetIdx],
                        x * tileSize + (frameIndex * tileSize * width),//src x
                        y * tileSize,//src y
                        tileSize * width,// src width
                        tileSize * height, // src height
                        positionX * SIZE_OF_CROP * ZOOM, //target x
                        positionY * SIZE_OF_CROP * ZOOM, //target y
                        SIZE_OF_CROP * ZOOM * width, // target width
                        SIZE_OF_CROP * ZOOM * height // target height
                    );
                    if(shouldDrawGrid && !shouldHideHud) {
                        ctx.fillStyle = 'white';
                        ctx.fillText("⭕",positionX * SIZE_OF_CROP * ZOOM + 5,positionY * SIZE_OF_CROP * ZOOM + 10);
                    }
                }
            })
        });
        if(SHOW_GRID)drawGrid(WIDTH, HEIGHT, ctx,SIZE_OF_CROP * ZOOM, maps[ACTIVE_MAP].gridColor);
    }

    const setMouseIsTrue=(e)=> {
        if(e.button === 0) {
            isMouseDown = true;
        }
        else if(e.button === 1){
            PREV_ACTIVE_TOOL = ACTIVE_TOOL;
            setActiveTool(TOOLS.PAN)
        }
    }

    const setMouseIsFalse=(e)=> {
        if(e.button === 0) {
            isMouseDown = false;
        }
        else if(e.button === 1 && ACTIVE_TOOL === TOOLS.PAN){
            setActiveTool(PREV_ACTIVE_TOOL)
        }
    }

    const removeTile=(key) =>{
        delete maps[ACTIVE_MAP].layers[currentLayer].tiles[key];
        if (key in (maps[ACTIVE_MAP].layers[currentLayer].animatedTiles || {})) delete maps[ACTIVE_MAP].layers[currentLayer].animatedTiles[key];
    }

    const isFlippedOnX = () => document.getElementById("toggleFlipX").checked;
    const addSelectedTiles = (key, tiles) => {
        const [x, y] = key.split("-");
        const tilesPatch = tiles || selection; // tiles is opt override for selection for fancy things like random patch of tiles
        const {x: startX, y: startY} = tilesPatch[0];// add selection override
        const selWidth = selectionSize[0];
        const selHeight = selectionSize[1];
        maps[ACTIVE_MAP].layers[currentLayer].tiles[key] = tilesPatch[0];
        const isFlippedX = isFlippedOnX();
        for (let ix = 0; ix < selWidth; ix++) {
            for (let iy = 0; iy < selHeight; iy++) {
                const tileX = isFlippedX ? Number(x)-ix : Number(x)+ix;//placed in reverse when flipped on x
                const coordKey = `${tileX}-${Number(y)+iy}`;
                maps[ACTIVE_MAP].layers[currentLayer].tiles[coordKey] = {
                    ...tilesPatch
                    .find(tile => tile.x === startX + ix && tile.y === startY + iy),
                    isFlippedX
                };
            }
        }
    }
    const getCurrentFrames = () => tileSets[tilesetDataSel.value]?.frames[tileFrameSel.value];
    const getSelectedFrameCount = () => getCurrentFrames()?.frameCount || 1;
    const shouldNotAddAnimatedTile = () => (tileDataSel.value !== "frames" && getSelectedFrameCount() !== 1) || Object.keys(tileSets[tilesetDataSel.value]?.frames).length === 0;
    const addTile = (key) => {
        if (shouldNotAddAnimatedTile()) {
            addSelectedTiles(key);
        } else {
            // if animated tile mode and has more than one frames, add/remove to animatedTiles
            if(!maps[ACTIVE_MAP].layers[currentLayer].animatedTiles) maps[ACTIVE_MAP].layers[currentLayer].animatedTiles = {};
            const isFlippedX = isFlippedOnX();
            const [x,y] = key.split("-");
            maps[ACTIVE_MAP].layers[currentLayer].animatedTiles[key] = {
                ...getCurrentFrames(),
                isFlippedX, layer: currentLayer,
                xPos: Number(x) * SIZE_OF_CROP, yPos: Number(y) * SIZE_OF_CROP
            };
        }
    }

    const addRandomTile = (key) =>{
        // TODO add probability for empty
        if (shouldNotAddAnimatedTile()) {
            maps[ACTIVE_MAP].layers[currentLayer].tiles[key] = selection[Math.floor(Math.random()*selection.length)];
        }else {
            // do the same, but add random from frames instead
            const tilesetTiles = tileSets[tilesetDataSel.value].tileData;
            const {frameCount, tiles, width} = getCurrentFrames();
            const randOffset = Math.floor(Math.random()*frameCount);
            const randXOffsetTiles = tiles.map(tile=>tilesetTiles[`${tile.x + randOffset * width}-${tile.y}`]);
            addSelectedTiles(key,randXOffsetTiles);
        }

    }

    const fillEmptyOrSameTiles = (key) => {
        const pickedTile = maps[ACTIVE_MAP].layers[currentLayer].tiles[key];
        Array.from({length: mapTileWidth * mapTileHeight}, (x, i) => i).map(tile=>{
            const x = tile % mapTileWidth;
            const y = Math.floor(tile / mapTileWidth);
            const coordKey = `${x}-${y}`;
            const filledTile = maps[ACTIVE_MAP].layers[currentLayer].tiles[coordKey];

            if(pickedTile && filledTile && filledTile.x === pickedTile.x && filledTile.y === pickedTile.y){
                maps[ACTIVE_MAP].layers[currentLayer].tiles[coordKey] = selection[0];// Replace all clicked on tiles with selected
            }
            else if(!pickedTile && !(coordKey in maps[ACTIVE_MAP].layers[currentLayer].tiles)) {
                maps[ACTIVE_MAP].layers[currentLayer].tiles[coordKey] = selection[0]; // when clicked on empty, replace all empty with selection
            }
        })
    }

    const selectMode = (mode = null) => {
        if (mode !== null) tileDataSel.value = mode;
        document.getElementById("tileFrameSelContainer").style.display = tileDataSel.value ===  "frames" ?
            "flex":"none"
        // tilesetContainer.style.top = tileDataSel.value ===  "frames" ? "45px" : "0";
        updateTilesetGridContainer();
    }
    const getTile =(key, allLayers = false)=> {
        const layers = maps[ACTIVE_MAP].layers;
        editedEntity = undefined;
        const clicked = allLayers ?
            [...layers].reverse().find((layer,index)=> {
                if(layer.animatedTiles && key in layer.animatedTiles) {
                    setLayer(layers.length - index - 1);
                    editedEntity = layer.animatedTiles[key];
                }
                if(key in layer.tiles){
                    setLayer(layers.length - index - 1);
                    return layer.tiles[key]
                }
            })?.tiles[key] //TODO this doesnt work on animatedTiles
            :
            layers[currentLayer].tiles[key];

        if (clicked && !editedEntity) {
            selection = [clicked];

            console.log("clicked", clicked, "entity data",editedEntity)
            document.getElementById("toggleFlipX").checked = !!clicked?.isFlippedX;
            // TODO switch to different tileset if its from a different one
            // if(clicked.tilesetIdx !== tilesetDataSel.value) {
            //     tilesetDataSel.value = clicked.tilesetIdx;
            //     reloadTilesets();
            //     updateTilesetGridContainer();
            // }
            selectMode("");
            updateSelection();
            return true;
        } else if (editedEntity){
            console.log("Animated tile found", editedEntity)
            selection = editedEntity.tiles;
            document.getElementById("toggleFlipX").checked = editedEntity.isFlippedX;
            setLayer(editedEntity.layer);
            tileFrameSel.value = editedEntity.name;
            updateSelection();
            selectMode("frames");
            return true;
        }else {
            return false;
        }
    }

    const toggleTile=(event)=> {
        if(ACTIVE_TOOL === TOOLS.PAN || !maps[ACTIVE_MAP].layers[currentLayer].visible) return;

        const {x,y} = getSelectedTile(event)[0];
        const key = `${x}-${y}`;

        console.log(event.button)
        if (event.shiftKey) {
            removeTile(key);
        } else if (event.ctrlKey || event.button === 2 || ACTIVE_TOOL === TOOLS.PICK) {
            const pickedTile = getTile(key, true);
            if(ACTIVE_TOOL === TOOLS.BRUSH && !pickedTile) setActiveTool(TOOLS.ERASE); //picking empty tile, sets tool to eraser
            else if(ACTIVE_TOOL === TOOLS.FILL || ACTIVE_TOOL === TOOLS.RAND) setActiveTool(TOOLS.BRUSH); //
        } else {
            if(ACTIVE_TOOL === TOOLS.BRUSH){
                addTile(key);// also works with animated
            } else if(ACTIVE_TOOL === TOOLS.ERASE) {
                removeTile(key);// also works with animated
            } else if (ACTIVE_TOOL === TOOLS.RAND){
                addRandomTile(key);
            } else if (ACTIVE_TOOL === TOOLS.FILL){
                fillEmptyOrSameTiles(key);
            }
        }
        draw();
        addToUndoStack();
    }

    const clearCanvas = () => {
        addToUndoStack();
        maps[ACTIVE_MAP].layers = [getEmptyLayer("bottom"), getEmptyLayer("middle"), getEmptyLayer("top")];
        setLayer(0);
        updateLayers();
        draw();
        addToUndoStack();
    }

    const downloadAsTextFile = (input, fileName = "tilemap-editor.json") =>{
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(typeof input === "string" ? input : JSON.stringify(input));
        const dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href",     dataStr     );
        dlAnchorElem.setAttribute("download", fileName);
        dlAnchorElem.click();
    }
    const exportJson = () => {
        downloadAsTextFile({tileSets, maps});
    }

    const exportImage = () => {
        draw(false);
        const data = canvas.toDataURL();
        const image = new Image();
        image.src = data;
        image.crossOrigin = "anonymous";
        const w = window.open('');
        w.document.write(image.outerHTML);
        draw();
    }

    const getTilesAnalisis = (ctx, width, height, sizeOfTile) =>{
        const analizedTiles = {};
        let uuid = 0;
        for (let y = 0; y < height; y += sizeOfTile) {
            for (let x = 0; x < width; x += sizeOfTile) {
                console.log(x, y);
                const tileData = ctx.getImageData(x, y, sizeOfTile, sizeOfTile);
                const index = tileData.data.toString();
                if (analizedTiles[index]) {
                    analizedTiles[index].coords.push({ x: x, y: y });
                    analizedTiles[index].times++;
                } else {
                    analizedTiles[index] = {
                        uuid: uuid++,
                        coords: [{ x: x, y: y }],
                        times: 1,
                        tileData: tileData
                    };
                }
            }
        }
        const uniqueTiles = Object.values(analizedTiles).length - 1;
        console.log("TILES:", {analizedTiles, uniqueTiles})
        return {analizedTiles, uniqueTiles};
    }
    const drawAnaliticsReport = () => {
        const prevZoom = ZOOM;
        ZOOM = 1;// needed for correct eval
        updateZoom();
        draw(false);
        const {analizedTiles, uniqueTiles} = getTilesAnalisis(getContext(), WIDTH, HEIGHT, SIZE_OF_CROP);
        const data = canvas.toDataURL();
        const image = new Image();
        image.src = data;
        const ctx = getContext();
        ZOOM = prevZoom;
        updateZoom();
        draw(false);
        Object.values(analizedTiles).map((t) => {
            // Fill the heatmap
            t.coords.forEach((c, i) => {
                const fillStyle = `rgba(255, 0, 0, ${(1/t.times) - 0.35})`;
                ctx.fillStyle = fillStyle;
                ctx.fillRect(c.x  * ZOOM, c.y  * ZOOM, SIZE_OF_CROP * ZOOM, SIZE_OF_CROP * ZOOM);
            });
        })
        drawGrid(WIDTH, HEIGHT, ctx,SIZE_OF_CROP * ZOOM,'rgba(255,213,0,0.5)')
        ctx.fillStyle = 'white';
        ctx.font = 'bold 17px arial';
        ctx.shadowColor="black";
        ctx.shadowBlur=5;
        ctx.lineWidth=3;
        ctx.fillText(`Unique tiles: ${uniqueTiles}`,4,HEIGHT - 30);
        ctx.fillText(`Map size: ${mapTileWidth}x${mapTileHeight}`,4,HEIGHT - 10);
    }
    const exportUniqueTiles = () => {
        const ctx = getContext();
        const prevZoom = ZOOM;
        ZOOM = 1;// needed for correct eval
        updateZoom();
        draw(false);
        const {analizedTiles} = getTilesAnalisis(getContext(), WIDTH, HEIGHT, SIZE_OF_CROP);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        const gridWidth = tilesetImage.width / SIZE_OF_CROP;
        Object.values(analizedTiles).map((t, i) => {
            const positionX = i % gridWidth;
            const positionY = Math.floor(i / gridWidth);
            const tileCanvas = document.createElement("canvas");
            tileCanvas.width = SIZE_OF_CROP;
            tileCanvas.height = SIZE_OF_CROP;
            const tileCtx = tileCanvas.getContext("2d");
            tileCtx.putImageData(t.tileData, 0, 0);
            ctx.drawImage(
                tileCanvas,
                0,
                0,
                SIZE_OF_CROP,
                SIZE_OF_CROP,
                positionX * SIZE_OF_CROP,
                positionY * SIZE_OF_CROP,
                SIZE_OF_CROP,
                SIZE_OF_CROP
            );
        });
        const data = canvas.toDataURL();
        const image = new Image();
        image.src = data;
        image.crossOrigin = "anonymous";
        const w = window.open('');
        w.document.write(image.outerHTML);
        ZOOM = prevZoom;
        updateZoom();
        draw();
    }

    exports.getLayers = ()=> {
        return maps[ACTIVE_MAP].layers;
    }

    const renameCurrentTileSymbol = ()=>{
            const {x, y, tileSymbol} = selection[0];
            const newSymbol = window.prompt("Enter tile symbol", tileSymbol || "*");
            if(newSymbol !== null) {
                setTileData(x,y,newSymbol, "tileSymbol");
                updateSelection();
                updateTilesetGridContainer();
                addToUndoStack();
            }
    }

    const getFlattenedData = () => {
        const result = Object.entries(maps).map(([key, map])=>{
            const layers = map.layers;
            const flattenedData = Array(layers.length).fill([]).map(()=>{
                return Array(map.mapHeight).fill([]).map(row=>{
                    return Array(map.mapWidth).fill([]).map(column => ({
                        tile: null,
                        tileSymbol: " "// a space is an empty tile
                    }))
                })
            });
            layers.forEach((layerObj,lrIndex) => {
                Object.entries(layerObj.tiles).forEach(([key,tile])=>{
                    const [x,y] = key.split("-");
                    if(Number(y) < map.mapHeight && Number(x) < map.mapWidth) {
                        flattenedData[lrIndex][Number(y)][Number(x)] = {tile, tileSymbol: tile.tileSymbol || "*"};
                    }
                })
            });
            return {map:key,flattenedData};
        });
        return result;
    };
    const getExportData = () => {
        const exportData = {maps, tileSets, flattenedData: getFlattenedData(), activeMap: ACTIVE_MAP, downloadAsTextFile};
        console.log("Exported ", exportData);
        return exportData;
    }

    const updateMapSize = (size) =>{
        if(size?.mapWidth && size?.mapWidth > 1){
            mapTileWidth = size?.mapWidth;
            WIDTH = mapTileWidth * SIZE_OF_CROP * ZOOM;
            maps[ACTIVE_MAP].mapWidth = mapTileWidth;
            document.querySelector(".canvas_resizer[resizerdir='x']").style=`left:${WIDTH}px`;
            document.querySelector(".canvas_resizer[resizerdir='x'] input").value = String(mapTileWidth);
            document.getElementById("canvasWidthInp").value  = String(mapTileWidth);
        }
        if(size?.mapHeight && size?.mapHeight > 1){
            mapTileHeight = size?.mapHeight;
            HEIGHT = mapTileHeight * SIZE_OF_CROP * ZOOM;
            maps[ACTIVE_MAP].mapHeight = mapTileHeight;
            document.querySelector(".canvas_resizer[resizerdir='y']").style=`top:${HEIGHT}px`;
            document.querySelector(".canvas_resizer[resizerdir='y'] input").value = String(mapTileHeight);
            document.getElementById("canvasHeightInp").value  = String(mapTileHeight);
        }
        draw();
    }

    const setActiveMap =(id) =>{
        ACTIVE_MAP = id;
        document.getElementById("gridColorSel").value = maps[ACTIVE_MAP].gridColor || "#00FFFF";
        draw();
        updateMapSize({mapWidth: maps[ACTIVE_MAP].mapWidth, mapHeight: maps[ACTIVE_MAP].mapHeight})
        updateLayers();
    }


    let undoStepPosition = -1;
    let undoStack = [];
    const clearUndoStack = () => {
        undoStack = [];
        undoStepPosition = -1;
    }
    const addToUndoStack = () => {
        if(Object.keys(tileSets).length === 0 || Object.keys(maps).length === 0) return;
        const oldState = undoStack.length > 0 ? JSON.stringify(
            {
                maps: undoStack[undoStepPosition].maps,
                tileSets: undoStack[undoStepPosition].tileSets,
                currentLayer:undoStack[undoStepPosition].currentLayer,
                ACTIVE_MAP:undoStack[undoStepPosition].ACTIVE_MAP,
                IMAGES:undoStack[undoStepPosition].IMAGES
            }) : undefined;
        const newState = JSON.stringify({maps,tileSets,currentLayer,ACTIVE_MAP,IMAGES});
        if (newState === oldState) return; // prevent updating when no changes are present in the data!

        undoStepPosition += 1;
        undoStack.length = undoStepPosition;
        undoStack.push(JSON.parse(JSON.stringify({maps,tileSets, currentLayer, ACTIVE_MAP, IMAGES, undoStepPosition})));
        // console.log("undo stack updated", undoStack, undoStepPosition)
    }
    const restoreFromUndoStackData = () => {
        maps = decoupleReferenceFromObj(undoStack[undoStepPosition].maps);
        const undoTileSets = decoupleReferenceFromObj(undoStack[undoStepPosition].tileSets);
        const undoIMAGES = decoupleReferenceFromObj(undoStack[undoStepPosition].IMAGES);
        if(JSON.stringify(IMAGES) !== JSON.stringify(undoIMAGES)){ // images needs to happen before tilesets
            IMAGES = undoIMAGES;
            reloadTilesets();
        }
        if(JSON.stringify(undoTileSets) !== JSON.stringify(tileSets)) { // done to prevent the below, which is expensive
            tileSets = undoTileSets;
            updateTilesetGridContainer();
        }
        tileSets = undoTileSets;
        updateTilesetDataList();

        const undoLayer = decoupleReferenceFromObj(undoStack[undoStepPosition].currentLayer);
        const undoActiveMap = decoupleReferenceFromObj(undoStack[undoStepPosition].ACTIVE_MAP);
        if(undoActiveMap !== ACTIVE_MAP){
            setActiveMap(undoActiveMap)
            updateMaps();
        }
        updateLayers(); // needs to happen after active map is set and maps are updated
        setLayer(undoLayer);
        draw();
    }
    const undo = () => {
        if (undoStepPosition === 0) return;
        undoStepPosition -= 1;
        restoreFromUndoStackData();
    }
    const redo = () => {
        if (undoStepPosition === undoStack.length - 1) return;
        undoStepPosition += 1;
        restoreFromUndoStackData();
    }
    const zoomLevels = [0.25, 0.5, 1, 2, 3, 4];
    let zoomIndex = 1
    const updateZoom = () => {
        tilesetImage.style = `transform: scale(${ZOOM});transform-origin: left top;image-rendering: auto;image-rendering: crisp-edges;image-rendering: pixelated;`;
        tilesetContainer.style.width = `${tilesetImage.width * ZOOM}px`;
        tilesetContainer.style.height = `${tilesetImage.height * ZOOM}px`;
        document.getElementById("zoomLabel").innerText = `${ZOOM}x`;
        updateTilesetGridContainer();
        updateSelection();
        updateMapSize({mapWidth: mapTileWidth, mapHeight: mapTileHeight});
        WIDTH = mapTileWidth * SIZE_OF_CROP * ZOOM;// needed when setting zoom?
        HEIGHT = mapTileHeight * SIZE_OF_CROP * ZOOM;
        zoomIndex = zoomLevels.indexOf(ZOOM) === -1 ? 0: zoomLevels.indexOf(ZOOM);
    }
    const zoomIn = () => {
        if(zoomIndex >= zoomLevels.length - 1) return;
        zoomIndex += 1;
        ZOOM = zoomLevels[zoomIndex];
        updateZoom();
    }
    const zoomOut = () => {
        if(zoomIndex === 0) return;
        zoomIndex -= 1;
        ZOOM = zoomLevels[zoomIndex];
        updateZoom();
    }

    const toggleSymbolsVisible = (override=null) => {
        if(override === null) DISPLAY_SYMBOLS = !DISPLAY_SYMBOLS;
        document.getElementById("setSymbolsVisBtn").innerHTML = DISPLAY_SYMBOLS ? "👁️": "👓";
        updateTilesetGridContainer();
    }

    const updateTilesetDataList = (populateFrames = false) => {
        const populateWithOptions = (selectEl, options, newContent)=>{
            if(!options) return;
            const value = selectEl.value + "";
            selectEl.innerHTML = newContent;
            Object.keys(options).forEach(opt=>{
                const newOption = document.createElement("option");
                newOption.innerText = opt;
                newOption.value = opt;
                selectEl.appendChild(newOption)
            })
            if (value in options || (["","frames"].includes(value) && !populateFrames)) selectEl.value = value;
        }

        if (!populateFrames) populateWithOptions(tileDataSel, tileSets[tilesetDataSel.value]?.tags, `<option value="">Symbols (${tileSets[tilesetDataSel.value]?.tileCount || "?"})</option><option value="frames">Objects</option>`);
        else populateWithOptions(tileFrameSel, tileSets[tilesetDataSel.value]?.frames, '');

        document.getElementById("tileFrameCount").value = getCurrentFrames()?.frameCount || 1;
    }

    const reevaluateTilesetsData = () =>{
        let symbolStartIdx = 0;
        Object.entries(tileSets).forEach(([key,old])=>{
            const tileData = {};
            console.log("OLD DATA",old)
            const tileSize = old.tileSize || SIZE_OF_CROP;
            const gridWidth = Math.ceil(old.width / tileSize);
            const gridHeight = Math.ceil(old.height / tileSize);
            const tileCount = gridWidth * gridHeight;

            Array.from({length: tileCount}, (x, i) => i).map(tile=>{
                const x = tile % gridWidth;
                const y = Math.floor(tile / gridWidth);
                const oldTileData = old?.[`${x}-${y}`]?.tileData;
                const tileSymbol = randomLetters[Math.floor(symbolStartIdx + tile)];
                tileData[`${x}-${y}`] = {
                    ...oldTileData, x, y, tilesetIdx: key, tileSymbol
                }
                tileSets[key] = {...old, tileSize, gridWidth, gridHeight, tileCount, symbolStartIdx, tileData};
            })
            if(key === 0){
                console.log({gridWidth,gridHeight,tileCount, tileSize})
            }
            symbolStartIdx += tileCount;

        })
        console.log("UPDATED TSETS", tileSets)
    }
    const setCropSize = (newSize) => {
        if(newSize === SIZE_OF_CROP && cropSize.value === newSize) return;
        tileSets[tilesetDataSel.value].tileSize = newSize;
        IMAGES.forEach((ts,idx)=> {
            if (ts.src === tilesetImage.src) IMAGES[idx].tileSize = newSize;
        });
        SIZE_OF_CROP = newSize;
        cropSize.value = SIZE_OF_CROP;
        document.getElementById("gridCropSize").value = SIZE_OF_CROP;
        console.log("NEW SIZE", tilesetDataSel.value,tileSets[tilesetDataSel.value], newSize,ACTIVE_MAP, maps)
        updateZoom()
        updateTilesetGridContainer();
        console.log(tileSets, IMAGES)
        reevaluateTilesetsData()
        updateTilesetDataList()
        draw();
    }

    // Note: only call this when tileset images have changed
    const reloadTilesets = () =>{
        TILESET_ELEMENTS = [];
        tilesetDataSel.innerHTML = "";
        // Use to prevent old data from erasure
        const oldTilesets = {...tileSets};
        tileSets = {};
        let symbolStartIdx = 0;
        // Generate tileset data for each of the loaded images
        IMAGES.forEach((tsImage, idx)=>{
            const newOpt = document.createElement("option");
            newOpt.innerText = tsImage.name || `tileset ${idx}`;
            newOpt.value = idx;
            tilesetDataSel.appendChild(newOpt);
            const tilesetImgElement = document.createElement("img");
            tilesetImgElement.src = tsImage.src;
            tilesetImgElement.crossOrigin = "Anonymous";
            TILESET_ELEMENTS.push(tilesetImgElement);
        })

        Promise.all(Array.from(TILESET_ELEMENTS).filter(img => !img.complete)
            .map(img => new Promise(resolve => { img.onload = img.onerror = resolve; })))
            .then(() => {
                console.log("TILESET ELEMENTS", TILESET_ELEMENTS)
                TILESET_ELEMENTS.forEach((tsImage,idx)  => {
                    const tileSize = tsImage.tileSize || SIZE_OF_CROP;
                    tileSets[idx] = getEmptyTileSet(
                        {
                            tags: oldTilesets[idx]?.tags, frames: oldTilesets[idx]?.frames, tileSize,
                            src: tsImage.src, name: `tileset ${idx}`, width: tsImage.width, height: tsImage.height
                        }
                    );
                })
                console.log("POPULATED", tileSets)
                reevaluateTilesetsData();
                tilesetImage.src = TILESET_ELEMENTS[0].src;
                tilesetImage.crossOrigin = "Anonymous";
                updateSelection();
                updateTilesetGridContainer();
            });
        // finally current tileset loaded
        tilesetImage.addEventListener('load', () => {
            draw();
            updateLayers();
            selection = [getTileData(0, 0)];
            updateSelection();
            updateTilesetDataList();
            updateTilesetDataList(true);
            updateTilesetGridContainer();
            document.getElementById("tilesetSrcLabel").innerHTML = `src: <a href="${tilesetImage.src}">${tilesetImage.src}</a>`;
            document.getElementById("tilesetSrcLabel").title = tilesetImage.src;
            const tilesetExtraInfo = IMAGES.find(ts=>ts.src === tilesetImage.src);

            console.log("CHANGED TILESET", tilesetExtraInfo, IMAGES)

            if(tilesetExtraInfo) {
                if (tilesetExtraInfo.link) {
                    document.getElementById("tilesetHomeLink").innerHTML = `link: <a href="${tilesetExtraInfo.link}">${tilesetExtraInfo.link}</a> `;
                    document.getElementById("tilesetHomeLink").title = tilesetExtraInfo.link;
                } else {
                    document.getElementById("tilesetHomeLink").innerHTML = "";
                }
                if (tilesetExtraInfo.description) {
                    document.getElementById("tilesetDescriptionLabel").innerText = tilesetExtraInfo.description;
                    document.getElementById("tilesetDescriptionLabel").title = tilesetExtraInfo.description;
                } else {
                    document.getElementById("tilesetDescriptionLabel").innerText = "";
                }
                if (tilesetExtraInfo.tileSize ) {
                    setCropSize(tilesetExtraInfo.tileSize);
                }
            }
            setCropSize(tileSets[tilesetDataSel.value].tileSize);
            updateZoom();
            document.querySelector('.canvas_resizer[resizerdir="x"]').style = `left:${WIDTH}px;`;

            if (undoStepPosition === -1) addToUndoStack();//initial undo stack entry
        });
    }

    const updateMaps = ()=>{
        mapsDataSel.innerHTML = "";
        let lastMap = ACTIVE_MAP;
        Object.keys(maps).forEach((key, idx)=>{
            const newOpt = document.createElement("option");
            newOpt.innerText = maps[key].name//`map ${idx}`;
            newOpt.value = key;
            mapsDataSel.appendChild(newOpt);
            if (idx === Object.keys(maps).length - 1) lastMap = key;
        });
        mapsDataSel.value = lastMap;
        setActiveMap(lastMap);
        document.getElementById("removeMapBtn").disabled = Object.keys(maps).length === 1;
    }
    const loadData = (data) =>{
        try {
            clearUndoStack();
            WIDTH = canvas.width * ZOOM;
            HEIGHT = canvas.height * ZOOM;
            selection = [{}];
            ACTIVE_MAP = data ? Object.keys(data.maps)[0] : "Map_1";
            maps = data ? {...data.maps} : {[ACTIVE_MAP]: getEmptyMap("Map 1", mapTileWidth, mapTileHeight)};
            tileSets = data ? {...data.tileSets} : {};
            reloadTilesets();
            tilesetDataSel.value = "0";
            cropSize.value = data ? tileSets[tilesetDataSel.value]?.tileSize || maps[ACTIVE_MAP].tileSize : SIZE_OF_CROP;
            document.getElementById("gridCropSize").value = cropSize.value;
            updateMaps();
            updateMapSize({mapWidth: maps[ACTIVE_MAP].mapWidth, mapHeight: maps[ACTIVE_MAP].mapHeight})
        }
        catch(e){
            console.error(e)
        }
    }

    // Create the tilemap-editor in the dom and its events
    exports.init = (
        attachToId,
        {
            tileMapData,
            tileSize,
            mapWidth,
            mapHeight,
            tileSetImages,
            applyButtonText,
            onApply,
            tileSetLoaders,
            tileMapExporters,
            tileMapImporters
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
            name: "Export Map as image",
            transformer: exportImage
        }
        apiTileMapExporters.saveData = {
            name: "Download Json file",
            transformer: exportJson
        }
        apiTileMapExporters.analizeTilemap = {
            name: "Analize tilemap",
            transformer: drawAnaliticsReport
        }
        apiTileMapExporters.exportTilesFromMap = {
            name: "Extract tileset from map",
            transformer: exportUniqueTiles
        }
        apiTileMapImporters = tileMapImporters;
        apiTileMapImporters.openData = {
            name: "Open Json file",
            onSelectFiles: (setData, files) => {
                const readFile = new FileReader();
                readFile.onload = (e) => {
                    const json = JSON.parse(e.target.result);
                    setData(json);
                };
                readFile.readAsText(files[0]);
            },
            acceptFile: "application/JSON"
        }

        const importedTilesetImages =  (tileMapData?.tileSets && Object.values(tileMapData?.tileSets)) || tileSetImages;
        IMAGES = importedTilesetImages;
        SIZE_OF_CROP = importedTilesetImages?.[0]?.tileSize || tileSize || 32;//to the best of your ability, predict the init tileSize
        mapTileWidth = mapWidth || 12;
        mapTileHeight = mapHeight || 12;
        const canvasWidth = mapTileWidth * tileSize * ZOOM;
        const canvasHeight = mapTileHeight * tileSize * ZOOM;

        if (SIZE_OF_CROP < 12) ZOOM = 2;// Automatically start with zoom 2 when the tilesize is tiny
        // Attach elements
        attachTo.innerHTML = getHtml(canvasWidth, canvasHeight);
        attachTo.className = "tilemap_editor_root";
        tilesetImage = document.createElement('img');
        cropSize = document.getElementById('cropSize');

        confirmBtn = document.getElementById("confirmBtn");
        if(onApply){
            confirmBtn.innerText = applyButtonText || "Ok";
        } else {
            confirmBtn.style.display = "none";
        }
        canvas = document.getElementById('mapCanvas');
        tilesetContainer = document.querySelector('.tileset-container');
        tilesetSelection = document.querySelector('.tileset-container-selection');
        tilesetGridContainer = document.getElementById("tilesetGridContainer");
        layersElement = document.getElementById("layers");
        objectParametersEditor = document.getElementById("objectParametersEditor");

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

        const setFramesToSelection = (animName) =>{
            if(animName === "" || typeof animName !== "string") return;
            tileSets[tilesetDataSel.value].frames[animName] = {
                ...(tileSets[tilesetDataSel.value].frames[animName]||{}),
                width: selectionSize[0], height:selectionSize[1], start: selection[0], tiles: selection,
                name: animName,
                //To be set when placing tile
                layer: undefined, isFlippedX: false, xPos: 0, yPos: 0//TODO free position
            }
        }
        tilesetContainer.addEventListener('pointerup', (e) => {
            setTimeout(()=>{
                document.getElementById("tilesetDataDetails").open = false;
            },100);

            selection = getSelectedTile(e);
            updateSelection();
            selection = getSelectedTile(e);
            tileSelectStart = null;

            const viewMode = tileDataSel.value;
            if(viewMode === "" && e.button === 2){
                renameCurrentTileSymbol();
                return;
            }
            if (e.button === 0) {
                if(viewMode !== "" && viewMode !== "frames"){
                    selection.forEach(selected=>{
                        addToUndoStack();
                        const {x, y} = selected;
                        const tileKey = `${x}-${y}`;
                        const tagTiles = tileSets[tilesetDataSel.value]?.tags[viewMode]?.tiles;
                        if (tagTiles){
                            if(tileKey in tagTiles) {
                                delete tagTiles[tileKey]
                            }else {
                                tagTiles[tileKey] = { mark: "O"};
                            }
                        }
                    });
                } else if (viewMode === "frames") {
                    setFramesToSelection(tileFrameSel.value);
                }
                updateTilesetGridContainer();
            }
        });
        tilesetContainer.addEventListener('dblclick', (e) => {
            const viewMode = tileDataSel.value;
            if(viewMode === "") {
                renameCurrentTileSymbol();
            }
        });
        document.getElementById("addLayerBtn").addEventListener("click",()=>{
            addToUndoStack();
            addLayer();
        });
        // Maps DATA callbacks
        mapsDataSel = document.getElementById("mapsDataSel");
        mapsDataSel.addEventListener("change", e=>{
            addToUndoStack();
            setActiveMap(e.target.value);
            addToUndoStack();
        })
        document.getElementById("addMapBtn").addEventListener("click",()=>{
            const suggestMapName = `Map ${Object.keys(maps).length + 1}`;
            const result = window.prompt("Enter new map key...", suggestMapName);
            if(result !== null) {
                addToUndoStack();
                const newMapKey = result.trim().replaceAll(" ","_") || suggestMapName;
                if (newMapKey in maps){
                    alert("A map with this key already exists.")
                    return
                }
                maps[newMapKey] = getEmptyMap(result.trim());
                addToUndoStack();
                updateMaps();
            }
        })
        document.getElementById("duplicateMapBtn").addEventListener("click",()=>{
            const makeNewKey = (key) => {
                const suggestedNew = `${key}_copy`;
                if (suggestedNew in maps){
                    return makeNewKey(suggestedNew)
                }
                return suggestedNew;
            }
            addToUndoStack();
            const newMapKey = makeNewKey(ACTIVE_MAP);
            maps[newMapKey] = {...JSON.parse(JSON.stringify(maps[ACTIVE_MAP])), name: newMapKey};// todo prompt to ask for name
            updateMaps();
            addToUndoStack();
        })
        document.getElementById("removeMapBtn").addEventListener("click",()=>{
            addToUndoStack();
            delete maps[ACTIVE_MAP];
            setActiveMap(Object.keys(maps)[0])
            updateMaps();
            addToUndoStack();
        })
        // Tileset DATA Callbacks //tileDataSel
        tileDataSel = document.getElementById("tileDataSel");
        tileDataSel.addEventListener("change",()=>{
            selectMode();
        })
        document.getElementById("addTileTagBtn").addEventListener("click",()=>{
            const result = window.prompt("Name your tag", "solid()");
            if(result !== null){
                if (result in tileSets[tilesetDataSel.value].tags) {
                    alert("Tag already exists");
                    return;
                }
                tileSets[tilesetDataSel.value].tags[result] = getEmptyTilesetTag(result, result);
                updateTilesetDataList();
                addToUndoStack();
            }
        });
        document.getElementById("removeTileTagBtn").addEventListener("click",()=>{
            if (tileDataSel.value && tileDataSel.value in tileSets[tilesetDataSel.value].tags) {
                delete tileSets[tilesetDataSel.value].tags[tileDataSel.value];
                updateTilesetDataList();
                addToUndoStack();
            }
        });
        // Tileset frames
        tileFrameSel = document.getElementById("tileFrameSel");
        tileFrameSel.addEventListener("change", e =>{
            document.getElementById("tileFrameCount").value = getCurrentFrames()?.frameCount || 1;
            updateTilesetGridContainer();
        });
        document.getElementById("addTileFrameBtn").addEventListener("click",()=>{
            const result = window.prompt("Name your object", `obj${Object.keys(tileSets[tilesetDataSel.value]?.frames||{}).length}`);
            if(result !== null){
                if (result in tileSets[tilesetDataSel.value].frames) {
                    alert("Object already exists");
                    return;
                }
                tileSets[tilesetDataSel.value].frames[result] = {frameCount: Number(document.getElementById("tileFrameCount").value)}
                setFramesToSelection(result);
                updateTilesetDataList(true);
                tileFrameSel.value = result;
                updateTilesetGridContainer();
            }
        });
        document.getElementById("removeTileFrameBtn").addEventListener("click",()=>{
            if (tileFrameSel.value && tileFrameSel.value in tileSets[tilesetDataSel.value].frames) {
                delete tileSets[tilesetDataSel.value].frames[tileFrameSel.value];
                updateTilesetDataList(true);
                updateTilesetGridContainer();
            }
        });
        document.getElementById("tileFrameCount").addEventListener("change", e=>{
            if(tileFrameSel.value === "") return;
            getCurrentFrames().frameCount = Number(e.target.value);
            updateTilesetGridContainer();
        })
        // Tileset SELECT callbacks
        tilesetDataSel = document.getElementById("tilesetDataSel");
        tilesetDataSel.addEventListener("change",e=>{
            tilesetImage.src = TILESET_ELEMENTS[e.target.value].src;
            tilesetImage.crossOrigin = "Anonymous";
            updateTilesetDataList();
        })

        const replaceSelectedTileSet = (src) => {
            addToUndoStack();
            IMAGES[Number(tilesetDataSel.value)].src = src;
            reloadTilesets();
        }
        const addNewTileSet = (src) => {
            addToUndoStack();
            IMAGES.push({src});
            reloadTilesets();
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
        tileSetLoadersSel.value = "base64";
        selectedTileSetLoader = apiTileSetLoaders[tileSetLoadersSel.value];
        tileSetLoadersSel.addEventListener("change", e=>{
            selectedTileSetLoader = apiTileSetLoaders[e.target.value];
        })
        document.getElementById("removeTilesetBtn").addEventListener("click",()=>{
            //Remove current tileset
            if (tilesetDataSel.value !== "0") {
                addToUndoStack();
                IMAGES.splice(Number(tilesetDataSel.value),1);
                reloadTilesets();
            }
        });

        // Canvas callbacks
        canvas.addEventListener('pointerdown', setMouseIsTrue);
        canvas.addEventListener('pointerup', setMouseIsFalse);
        canvas.addEventListener('pointerleave', setMouseIsFalse);
        canvas.addEventListener('pointerdown', toggleTile);
        canvas.addEventListener("contextmenu", e => e.preventDefault());
        draggable({ onElement: canvas, element: document.getElementById("canvas_wrapper")});
        canvas.addEventListener('pointermove', (e) => {
            if (isMouseDown && ACTIVE_TOOL !== 2) toggleTile(e)
        });
        // Canvas Resizer ===================
        document.getElementById("canvasWidthInp").addEventListener("change", e=>{
            updateMapSize({mapWidth: Number(e.target.value)})
        })
        document.getElementById("canvasHeightInp").addEventListener("change", e=>{
            updateMapSize({mapHeight: Number(e.target.value)})
        })
        // draggable({
        //     element: document.querySelector(".canvas_resizer[resizerdir='x']"),
        //     onElement: document.querySelector(".canvas_resizer[resizerdir='x'] span"),
        //     isDrag: true, limitY: true,
        //     onRelease: ({x}) => {
        //         const snappedX = getSnappedPos(x);
        //         console.log("SNAPPED GRID", x,snappedX)
        //         updateMapSize({mapWidth: snappedX })
        //     },
        // });

        document.querySelector(".canvas_resizer[resizerdir='y'] input").addEventListener("change", e=>{
            updateMapSize({mapHeight: Number(e.target.value)})
        })
        document.querySelector(".canvas_resizer[resizerdir='x'] input").addEventListener("change", e=>{
            updateMapSize({mapWidth: Number(e.target.value) })
        })
        document.getElementById("toolButtonsWrapper").addEventListener("click",e=>{
            console.log("ACTIVE_TOOL", e.target.value)
            if(e.target.getAttribute("name") === "tool") setActiveTool(Number(e.target.value));
        })
        document.getElementById("gridCropSize").addEventListener('change', e=>{
            setCropSize(Number(e.target.value));
        })
        cropSize.addEventListener('change', e=>{
            setCropSize(Number(e.target.value));
        })

        document.getElementById("clearCanvasBtn").addEventListener('click', clearCanvas);
        if(onApply){
            confirmBtn.addEventListener('click', () => onApply.onClick(getExportData()));
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
        const makeMenuItem = (name, value, description) =>{
            const menuItem = document.createElement("span");
            menuItem.className = "item";
            menuItem.innerText = name;
            menuItem.title = description || name;
            menuItem.value = value;
            fileMenuDropDown.appendChild(menuItem);
            return menuItem;
        }
        Object.entries(tileMapExporters).forEach(([key, exporter])=>{
            makeMenuItem(exporter.name, key,exporter.description).onclick = () => {
                exporter.transformer(getExportData());
            }
        })
        Object.entries(apiTileMapImporters).forEach(([key, importer])=>{
            makeMenuItem(importer.name, key,importer.description).onclick = () => {
                if(importer.onSelectFiles) {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.id = `importerInput-${key}`;
                    if(importer.acceptFile) input.accept = importer.acceptFile;
                    input.style.display = "none";
                    input.addEventListener("change",e=> {
                        importer.onSelectFiles(loadData, e.target.files);
                    })
                    input.click();
                }
            }
        })
        document.getElementById("toggleFlipX").addEventListener("change",(e)=>{
            document.getElementById("flipBrushIndicator").style.transform = e.target.checked ? "scale(-1, 1)": "scale(1, 1)"
        })
        document.addEventListener('keypress', e =>{
            if(e.ctrlKey){
                if(e.code === "KeyZ") undo();
                if(e.code === "KeyY") redo();
            }
        })
        document.getElementById("gridColorSel").addEventListener("change", e=>{
            console.log("grid col",e.target.value)
            maps[ACTIVE_MAP].gridColor = e.target.value;
            draw();
        })
        document.getElementById("showGrid").addEventListener("change", e => {
            SHOW_GRID = e.target.checked;
            draw();
        })

        document.getElementById("undoBtn").addEventListener("click", undo);
        document.getElementById("redoBtn").addEventListener("click", redo);
        document.getElementById("zoomIn").addEventListener("click", zoomIn);
        document.getElementById("zoomOut").addEventListener("click", zoomOut);
        document.getElementById("setSymbolsVisBtn").addEventListener("click", ()=>toggleSymbolsVisible())
        // Scroll zoom in/out - use wheel instead of scroll event since theres no scrollbar on the map
        canvas.addEventListener('wheel', e=> {
            if (e.deltaY < 0) zoomIn();
            else zoomOut();
        });
        loadData(tileMapData); // loads even if tileMapData is not present

        // Animated tiles when on frames mode
        const animateTiles = () => {
            if (tileDataSel.value === "frames") draw();
            requestAnimationFrame(animateTiles);
        }
        requestAnimationFrame(animateTiles);
    };
});
