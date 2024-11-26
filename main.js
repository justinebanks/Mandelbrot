// YouTube Explanation of Mandelbrot Set: https://www.youtube.com/watch?v=7MotVcGvFMg
// Better Simulation: https://math.hws.edu/eck/js/mandelbrot/MB.html
// Wikipedia Article: https://en.wikipedia.org/wiki/Mandelbrot_set

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth*0.99;
canvas.height = window.innerHeight*0.98;


let qualityStep = 25;
let moveStep = 0.2;
let zoomStep = 1.25;
let cStep = 0.025;

let boxStart = { x: 0, y: 0 };
let boxEnd = { x: 0, y: 0 };


// HTML Inputs
let controller = document.querySelector("div.controller")
let toggleBtn = document.getElementById("toggle-menu");

let resolution = document.getElementById("resolution");
let accuracy = document.getElementById("accuracy");
let startX = document.getElementById("startx");
let startY = document.getElementById("starty");
let viewWidth = document.getElementById("viewwidth");
let cR = document.getElementById("realc");
let cI = document.getElementById("imaginaryc");
let mode = document.getElementById("mode");


let endX = parseFloat(startX.value) + parseFloat(viewWidth.value);
let endY = parseFloat(startY.value) + parseFloat(viewWidth.value)*(canvas.height/canvas.width);


class ComplexNumber {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    add(n) {
        let nR = this.real + n.real;
        let nI = this.imaginary + n.imaginary;

        return new ComplexNumber(nR, nI);
    }

    multiply(n) {
        // (a+bi)(c+di) = ac + adi + bci + bdi2 = (ac - bd) + i(ad + bc)

        let term1 = this.real*n.real;
        let term2 = this.real*n.imaginary;
        let term3 = this.imaginary*n.real;
        let term4 = this.imaginary*n.imaginary;

        return new ComplexNumber(term1-term4, term2+term3);
    }

    toString(places=null) {
        let real = this.real;
        let imag = this.imaginary;
    
        if (places != null) {
            real = parseFloat(real.toFixed(places));
            imag = parseFloat(imag.toFixed(places));
        }

        let sign = this.real < 0 ? "-" : "+";
        return `${real} ${sign} ${Math.abs(imag)}i`;
    }   
}


class ComplexPlane {
    constructor(startX, endX, startY, endY, pointSize) {
        this.start = { x: startX, y: startY };
        this.end = { x: endX, y: endY };
        this.pointSize = pointSize;
    }

    plot(complexNum, color="black") {
        // -1, 1 --> 0, width

        let canvasX = (complexNum.real - this.start.x) * (canvas.width/Math.abs(this.end.x-this.start.x));
        let canvasY = (complexNum.imaginary - this.start.y) * (canvas.height/Math.abs(this.end.y-this.start.y));

        ctx.fillStyle = color;
        ctx.fillRect(canvasX, canvasY, this.pointSize.x, this.pointSize.y)
    }
}

class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toString() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }
}

class LinearGradient {
    constructor(colors) {
        this.colors = colors;
    }

    get(n) {
        // 0 <= n <= 100
        if (n > 100) {
            n = n % 100;
        }

        let x = n / (100 / (this.colors.length-1))

        let color1 = this.colors[Math.floor(x)];
        let color2 = this.colors[Math.ceil(x)];

        let rVal = color1.r + (color2.r-color1.r) * (x - Math.floor(x));
        let gVal = color1.g + (color2.g-color1.g) * (x - Math.floor(x));
        let bVal = color1.b + (color2.b-color1.b) * (x - Math.floor(x));

        return new Color(rVal, gVal, bVal);
    }
}


function inMandelbrotSet(c, maxI=50) {
    let z = new ComplexNumber(0, 0);

    for (let i = 0; i < maxI; i++) { 
        z = z.multiply(z).add(c);

        if (z.real >= 2) {
            return i;
        }
    }

    return -1;
}

function inJuliaSet(z, c, maxI=50) {
    for (let i = 0; i < maxI; i++) {
        z = z.multiply(z).add(c);

        if (z.real >= 2) {
            return i;
        }
    }

    return -1;
}



function runSimulation(resolution, accuracy, startX, endX, startY, endY, cR=0, cI=0) {
    let xStep = (endX-startX) / resolution;
    let yStep = (endY-startY) / resolution;

    let data = { resolution, accuracy, startX, endX, startY, endY, rows: [] }

    for (let y = startY; y < endY; y+=yStep) {
        let row = [];

        for (let x = startX; x < endX; x+=xStep) {
            let num = new ComplexNumber(x, y);
            let orbit = mode.value == "mandelbrot" ? inMandelbrotSet(num, accuracy) : inJuliaSet(num, new ComplexNumber(cR, cI), accuracy);

            if (orbit != -1) {
                row.push({num, orbit});
            }            
        }

        data.rows.push(row)
    }

    return data;
}


function plotData(data, gradient) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { accuracy, resolution, startX, endX, startY, endY, rows } = data;

    let graph = new ComplexPlane(startX, endX, startY, endY, { x: canvas.width/resolution, y: canvas.height/resolution });



    for (let row of rows) {
        for (let point of row) {
            graph.plot(point.num, gradient.get(point.orbit).toString()); // `hsl(${point.orbit}, 100%, 40%)`
        }  
    }
}


// Code for Different Gradient Presets
let defaultGradient = new LinearGradient([
    new Color(  0,   7, 100),
    new Color( 32, 107, 203),
    new Color(237, 255, 255),
    new Color(255, 170,   0),
    new Color(  0,   2,   0)
]);

let grayscaleGradient = new LinearGradient([
    new Color(0, 0, 0),
    new Color(255, 255, 255)
])

let gradient = defaultGradient;





// Onclick Event Listener for All the +/i Buttons
function changeVar(id, sign) {
    if (id == "startx" || id == "starty") {
        let startN = document.getElementById(id)
        startN.value = parseFloat(startN.value) + parseFloat(viewWidth.value)*moveStep*sign;
    }

    if (id == "resolution" || id == "accuracy") {
        let quality = document.getElementById(id)
        quality.value = parseFloat(quality.value) + qualityStep*sign;
    }
    
    if (id == "realc" || id == "imaginaryc") {
        let cX = document.getElementById(id);
        cX.value = parseFloat(cX.value) + cStep*sign;
    }

    if (id == "viewwidth") {
        let zoom = document.getElementById(id);
        zoom.value = sign == 1 ? parseFloat(zoom.value) * zoomStep : parseFloat(zoom.value) / zoomStep;
    }

    document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Space'}));
}


toggleBtn.addEventListener("click", () => {
    if (controller.style.display == "none") {
        controller.style.display = "block";
    }
    else {
        controller.style.display = "none"
    }
})


canvas.addEventListener("mousedown", (e) => {
    boxStart.x = e.offsetX;
    boxStart.y = e.offsetY;
    console.log("Down");
})


canvas.addEventListener("mouseup", (e) => {
    console.log("Up");
    boxEnd.x = e.offsetX;
    boxEnd.y = e.offsetY;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxStart.x, boxStart.y, boxEnd.x-boxStart.x, (boxEnd.x-boxStart.x)*(canvas.height/canvas.width));

})


let previousState = [startX.value, startY.value, viewWidth.value];


document.addEventListener("keydown", e => {
    if (e.key == "Enter") {
        previousState = [startX.value, startY.value, viewWidth.value];

        let start = {
            x: boxStart.x / (canvas.width/Math.abs(endX-parseFloat(startX.value))) + parseFloat(startX.value),
            y: boxStart.y / (canvas.height/Math.abs(endY-parseFloat(startY.value))) + parseFloat(startY.value)
        };
    
        let end = {
            x: boxEnd.x / (canvas.width/Math.abs(endX-parseFloat(startX.value))) + parseFloat(startX.value),
            y: 0
        };
    
        end.y = start.y + (end.x-start.x)*(canvas.height/canvas.width);
        
        if (boxEnd.x-boxStart.x > 0) {
            
            startX.value = start.x;
            startY.value = start.y;
            viewWidth.value = (end.x-start.x);
        }

        boxStart = { x: 0, y: 0 };
        boxEnd = { x: 0, y: 0 };
    }

    // Rewind
    if (e.key == "z") {
        startX.value = previousState[0];
        startY.value = previousState[1];
        viewWidth.value = previousState[2];
    }


    if (e.key == "Enter" || e.key == "Space" || e.key == "z")
    endX = parseFloat(startX.value) + parseFloat(viewWidth.value)
    endY = parseFloat(startY.value) + parseFloat(viewWidth.value)*(canvas.height/canvas.width)


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let start = Date.now();
    let data = runSimulation(parseFloat(resolution.value), parseFloat(accuracy.value), parseFloat(startX.value), endX, parseFloat(startY.value), endY, parseFloat(cR.value), parseFloat(cI.value));
    let elapsedEval = Date.now()-start;

    start = Date.now();
    plotData(data, gradient);
    let elapsedRender = Date.now()-start;

    console.log("Evaluation Took " + elapsedEval + " Milliseconds, Rendering Took " + elapsedRender + " Milliseconds");

})


let data = runSimulation(parseFloat(resolution.value), parseFloat(accuracy.value), parseFloat(startX.value), endX, parseFloat(startY.value), endY, parseFloat(cR.value), parseFloat(cI.value));
plotData(data, gradient);