
import addImageToCanvas from "./modules/addImageToCanvas.js"
import dotifyCanvas from "./modules/dotifyCanvas.js";
import getAverageColorOfPixels from "./modules/getAverageColor.js";
import exportCanvas from "./modules/exportCanvas.js";
import readImageFromInput from "./modules/readImageFromInput.js";


const outputCanvas = document.getElementById("screen");
const mainContext = outputCanvas.getContext("2d");

const cache = document.createElement("canvas");
const cacheContext = cache.getContext("2d");

let color, gui, dropbox, w, h;
let systemCache = new Map();
let pixels = [];


const imgTypes =[
    "image/png",
    "image/jpeg",
    "image/bmp",
];
let system = {
    fileName: "",
    imageScale: 1,
    downScaling: 1,
    imgType: "image/png",
    grid:true,
    exportCanvas
};
function buildGUI() {
    gui = new dat.GUI({
        name: 'GUI'
    });
    let controls = gui.addFolder('File Options');
    controls.open();
    controls.add(system,"fileName")
        .onChange((e) => system.fileName = stripExtensions(e));
    controls.add(system, "imgType", imgTypes)
        .onChange((e) => system.imgType = e);

    let downScaling = gui.addFolder('Scaling')
    downScaling.open();
    downScaling.add(system, 'imageScale', .1, 1, .1)
        .onFinishChange(update)
    downScaling.add(system, 'downScaling', 1, 10, 1)
        .onFinishChange(update);
    gui.add(system, "exportCanvas").name("Export");
}

function update() {
    let key = `${system.fileName}${system.downScaling}${system.imageScale}`;
    let img;
    if(systemCache.has(key)){
        img = systemCache.get(key);
        addImageToCanvas(img, outputCanvas, system.imageScale,pixels);
    }else{        
        img = dotifyCanvas(cacheContext, system.downScaling, cacheContext.getImageData(0, 0, cache.width, cache.height),pixels);
        systemCache.set(key, img);
        addImageToCanvas(img, outputCanvas, system.imageScale);
    }
}
async function init(f) {
    try {
        system = {
            fileName: "",
            imageScale: 1,
            downScaling: 1,
            imgType: "image/png",
            exportCanvas
        }
        let img = await readImageFromInput(f,system);
        cache.width = img.width;
        cache.height = img.height;
        if (!gui) {
            outputCanvas.classList.remove("visually-hidden");
            document.getElementById("label").classList.add("visually-hidden");
            document.getElementById("title").style.opacity = 0;
            buildGUI();
        }else{
            gui.destroy();
            buildGUI();
        }
        addImageToCanvas(img, cache);
        update();
        color = getAverageColorOfPixels(pixels);
        document.body.style.backgroundColor = color;
    } catch (err) {
        console.log(err);
    }

}
function setUpDropbox() {
    dropbox = document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);

    function dragenter(e) {
        e.stopPropagation();
        e.preventDefault();
    }
      
    function dragover(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    function drop(e) {
        e.stopPropagation();
        e.preventDefault();
      
        const dt = e.dataTransfer;
        
        init(dt);
    }
}

window.addEventListener("DOMContentLoaded",setUpDropbox)



