import CanvasToBMP from "./canvasToBitmap.js";

export default function exportCanvas(canvas,system) {
    const {
        fileName
    } = system;
    const MIME_TYPE = system.imgType;
    let imgURL = canvas.toDataURL(MIME_TYPE);
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