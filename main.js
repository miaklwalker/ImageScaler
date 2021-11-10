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
    exportCanvas
};

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

/*! canvas-to-bmp version 1.0 ALPHA
    (c) 2015 Ken "Epistemex" Fyrstenberg
    MIT License (this header required)
    ***************************
    from this answer on stackoverflow
    https://stackoverflow.com/a/29652507
    ***************************
    
*/

let CanvasToBMP = {

    /**
     * Convert a canvas element to ArrayBuffer containing a BMP file
     * with support for 32-bit (alpha).
     *
     * Note that CORS requirement must be fulfilled.
     *
     * @param {HTMLCanvasElement} canvas - the canvas element to convert
     * @return {ArrayBuffer}
     */
    toArrayBuffer:(canvas) => {
  
      let w = canvas.width,
          h = canvas.height,
          w4 = w * 4,
          idata = canvas.getContext("2d").getImageData(0, 0, w, h),
          data32 = new Uint32Array(idata.data.buffer), // 32-bit representation of canvas
  
          stride = Math.floor((32 * w + 31) / 32) * 4, // row length incl. padding
          pixelArraySize = stride * h,                 // total bitmap size
          fileLength = 122 + pixelArraySize,           // header size is known + bitmap
  
          file = new ArrayBuffer(fileLength),          // raw byte buffer (returned)
          view = new DataView(file),                   // handle endian, reg. width etc.
          pos = 0, x, y = 0, p, s = 0, a, v;
  
      // write file header
      setU16(0x4d42);          // BM
      setU32(fileLength);      // total length
      pos += 4;                // skip unused fields
      setU32(0x7a);            // offset to pixels
  
      // DIB header
      setU32(108);             // header size
      setU32(w);
      setU32(-h >>> 0);        // negative = top-to-bottom
      setU16(1);               // 1 plane
      setU16(32);              // 32-bits (RGBA)
      setU32(3);               // no compression (BI_BITFIELDS, 3)
      setU32(pixelArraySize);  // bitmap size incl. padding (stride x height)
      setU32(2835);            // pixels/meter h (~72 DPI x 39.3701 inch/m)
      setU32(2835);            // pixels/meter v
      pos += 8;                // skip color/important colors
      setU32(0xff0000);        // red channel mask
      setU32(0xff00);          // green channel mask
      setU32(0xff);            // blue channel mask
      setU32(0xff000000);      // alpha channel mask
      setU32(0x57696e20);      // " win" color space
  
      // bitmap data, change order of ABGR to BGRA
      while (y < h) {
        p = 0x7a + y * stride; // offset + stride x height
        x = 0;
        while (x < w4) {
          v = data32[s++];                     // get ABGR
          a = v >>> 24;                        // alpha channel
          view.setUint32(p + x, (v << 8) | a); // set BGRA
          x += 4;
        }
        y++
      }
  
      return file;
  
      // helper method to move current buffer position
      function setU16(data) {view.setUint16(pos, data, true); pos += 2}
      function setU32(data) {view.setUint32(pos, data, true); pos += 4}
    },
  
    /**
     * Converts a canvas to BMP file, returns a Blob representing the
     * file. This can be used with URL.createObjectURL().
     * Note that CORS requirement must be fulfilled.
     *
     * @param {HTMLCanvasElement} canvas - the canvas element to convert
     * @return {Blob}
     */
    toBlob: function(canvas) {
      return new Blob([this.toArrayBuffer(canvas)], {
        type: "image/bmp"
      });
    },
  
    /**
     * Converts the canvas to a data-URI representing a BMP file.
     * Note that CORS requirement must be fulfilled.
     *
     * @param canvas
     * @return {string}
     */
    toDataURL: function(canvas) {
      var buffer = new Uint8Array(this.toArrayBuffer(canvas)),
          bs = "", i = 0, l = buffer.length;
      while (i < l) bs += String.fromCharCode(buffer[i++]);
      return "data:image/bmp;base64," + btoa(bs);
    }
  };

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
    if(systemCache.has(key)){
        let img = systemCache.get(key);
        addImageToCanvas(img, outputCanvas, system.imageScale);
    }else{        
        let img = dotifyCanvas(cacheContext, system.downScaling, cacheContext.getImageData(0, 0, cache.width, cache.height));
        systemCache.set(key, img);
        addImageToCanvas(img, outputCanvas, system.imageScale);

    }
    let img = dotifyCanvas(cacheContext, system.downScaling, cacheContext.getImageData(0, 0, cache.width, cache.height));
    addImageToCanvas(img, outputCanvas, system.imageScale);
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
setUpDropbox();



