import CanvasToBMP from "./modules/canvasToBitmap.js";

const outputCanvas = document.getElementById("screen");
const mainContext = outputCanvas.getContext("2d");

const cache = document.createElement("canvas");
const cacheContext = cache.getContext("2d");


let pixels = [];
let color, gui,dropbox;
const imgTypes =[
    "image/png",
    "image/jpeg",
    "image/bmp",
]
let system = {
    fileName: "",
    imageScale: 1,
    downScaling: 1,
    imgType: "image/png",
    grid:true,
    exportCanvas
}

// strip dot extensions from file name but leave the file name
function stripExtensions(fileName) {
    let name = fileName.split(".");
    name.pop();
    return name.join(".");
}

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
        if (size = file.size > 500000) {
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

function addImageToCanvas(img, canvas, scale = 1) {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
}

function dotifyCanvas(ctx, downScaling, imageData) {
    let temp = document.createElement("canvas");
    let tempCtx = temp.getContext("2d");
    let width = ctx.canvas.width;
    let height = ctx.canvas.height;
    temp.width = width;
    temp.height = height;
    let data = imageData.data;
    for (let y = 0; y < height; y += downScaling) {
        for (let x = 0; x < width; x += downScaling) {
            let index = (x + y * width) * 4;
            let r = data[index];
            let g = data[index + 1];
            let b = data[index + 2];
            let a = data[index + 3];
            if (a > 0) {
                pixels.push({
                    r,
                    g,
                    b,
                    a
                });
                tempCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
                tempCtx.fillRect(x, y, downScaling, downScaling);
            }
        }
    }
    return temp;
}

let getAverageColorOfPixels = (pixels) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (let i = 0; i < pixels.length; i++) {
        r += pixels[i].r;
        g += pixels[i].g;
        b += pixels[i].b;
        a += pixels[i].a;
    }
    r = Math.floor(r / pixels.length);
    g = Math.floor(g / pixels.length);
    b = Math.floor(b / pixels.length);
    a = Math.floor(a / pixels.length);
    return `rgba(${r},${g},${b})`
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
    let img = dotifyCanvas(cacheContext, system.downScaling, cacheContext.getImageData(0, 0, cache.width, cache.height));
    console.log(img.width, img.height);
    addImageToCanvas(img, outputCanvas, system.imageScale);
}

async function init(f) {
    try {
        let img = await readImageFromInput(f);
        cache.width = img.width;
        cache.height = img.height;

        outputCanvas.classList.remove("visually-hidden");
        document.getElementById("dropbox").classList.add("visually-hidden")


        addImageToCanvas(img, cache);
        update();
        if (!gui) {
            buildGUI();
        }else{
            gui.destroy();
            system = {
                fileName: "",
                imageScale: 1,
                downScaling: 1,
                imgType: "image/png",
                exportCanvas
            }
            buildGUI();
        }
        color = getAverageColorOfPixels(pixels);
        document.body.style.backgroundColor = color;
    } catch (err) {
        console.log(err);
    }

}



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

