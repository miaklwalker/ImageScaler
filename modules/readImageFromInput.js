import stripExtensions from "./strip.js";
export default function readImageFromInput(f,system) {
    return new Promise((resolve, reject) => {
        const file = f.files[0];
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