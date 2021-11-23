export default function addImageToCanvas(img, canvas, scale = 1) {
    canvas.width = img.width * scale;
    canvas.height = img.height * scale
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
}