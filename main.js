import stripExtensions from "./modules/strip.js";
import addImageToCanvas from "./modules/addImageToCanvas.js"
import dotifyCanvas from "./modules/dotifyCanvas.js";
import getAverageColorOfPixels from "./getAverageColor.js";


const outputCanvas = document.getElementById("screen");
const mainContext = outputCanvas.getContext("2d");

const cache = document.createElement("canvas");
const cacheContext = cache.getContext("2d");

let systemCache = new Map();


let pixels = [];
let color, gui,dropbox;

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

// strip dot extensions from file name but leave the file name



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

function readImageFromInput(f) {
    return new Promise((resolve, reject) => {
        const file = f.files[0];
        console.log(file.size);
        if (file.size > 500000) {
            let confirm = window.confirm(`
            The file is very big, 
            it will take a while to process.
             Are you sure you want to continue?
             We will scale the image to speed up the first render.
             `);
            if (!confirm) {
                reject("user Reject");
            } else {
                system.downScaling = 2;
                system.imageScale = .5;
                system.fileName = stripExtensions(file.name);
            }
        }
        system.fileName = stripExtensions(file.name);
        if (!file.type.startsWith('image/')) {
            return
        }
        const img = document.createElement("img");
        img.onload = function () {
            img.width = this.width;
            img.height = this.height;
            resolve(img);
        }
        img.file = file;
        const reader = new FileReader();
        reader.onload = (function (aImg) {
            return function (e) {
                aImg.src = e.target.result;
            }
        })(img);
        reader.readAsDataURL(file);

    })

}

function exportCanvas() {
    const {
        fileName
    } = system;
    const MIME_TYPE = system.imgType;
    let imgURL = outputCanvas.toDataURL(MIME_TYPE);
    if (imgURL.indexOf(MIME_TYPE) < 0) {  
        if(system.imgType === "image/bmp"){
            imgURL = CanvasToBMP.toDataURL(outputCanvas)
        }
    }    
    let downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.href = imgURL;
    downloadLink.dataset.downloadurl = ["MIME_TYPE", downloadLink.download, downloadLink.href].join();

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    


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
        let img = await readImageFromInput(f);
        cache.width = img.width;
        cache.height = img.height;
        if (!gui) {
            outputCanvas.classList.remove("visually-hidden");
            document.getElementById("label").classList.add("visually-hidden")
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



