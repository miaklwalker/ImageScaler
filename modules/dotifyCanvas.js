export default function dotifyCanvas(ctx, downScaling, imageData,pixels) {
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