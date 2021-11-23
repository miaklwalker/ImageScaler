export default function stripExtensions(fileName) {
    let name = fileName.split(".");
    name.pop();
    return name.join(".");
}