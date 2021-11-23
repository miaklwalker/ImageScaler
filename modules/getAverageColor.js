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

export default getAverageColorOfPixels;