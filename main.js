// YouTube Explanation of Mandelbrot Set: https://www.youtube.com/watch?v=7MotVcGvFMg
// Better Simulation: https://math.hws.edu/eck/js/mandelbrot/MB.html
// Wikipedia Article: https://en.wikipedia.org/wiki/Mandelbrot_set

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth*0.99;
canvas.height = window.innerHeight*0.98;


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
            //let orbit = inMandelbrotSet(num, accuracy);
            let orbit = inJuliaSet(num, new ComplexNumber(cR, cI), accuracy);

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



 
let startX = -2;
let startY = -1;
let viewWidth = 4;
let resolution = 400;
let accuracy = 200;

let cR = 0.4;
let cI = 0.2;

let endX = startX + viewWidth
let endY = startY + viewWidth*(canvas.height/canvas.width)


let qualityStep = 5;
let moveStep = 0.2;
let zoomStep = 1.25;
let cStep = 0.1;


let gradient = new LinearGradient([
    new Color(  0,   7, 100),
    new Color( 32, 107, 203),
    new Color(237, 255, 255),
    new Color(255, 170,   0),
    new Color(  0,   2,   0)
]);


let boxStart = { x: 0, y: 0 };
let boxEnd = { x: 0, y: 0 };

document.addEventListener("mousedown", (e) => {
    boxStart.x = e.offsetX;
    boxStart.y = e.offsetY;
    console.log("Down");
})

document.addEventListener("mouseup", (e) => {
    console.log("Up");
    boxEnd.x = e.offsetX;
    boxEnd.y = e.offsetY;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxStart.x, boxStart.y, boxEnd.x-boxStart.x, (boxEnd.x-boxStart.x)*(canvas.height/canvas.width));

})



document.addEventListener("keydown", e => {
    if (e.key == "Enter") {
        let start = {
            x: boxStart.x / (canvas.width/Math.abs(endX-startX)) + startX,
            y: boxStart.y / (canvas.height/Math.abs(endY-startY)) + startY
        };
    
        let end = {
            x: boxEnd.x / (canvas.width/Math.abs(endX-startX)) + startX,
            y: 0
        };
    
        end.y = start.y + (end.x-start.x)*(canvas.height/canvas.width);
        
        boxStart = { x: 0, y: 0 };
        boxEnd = { x: 0, y: 0 };

        startX = start.x;
        startY = start.y;
        viewWidth = (end.x-start.x);   
    }



    switch (e.key) {
        case "ArrowLeft":
            startX -= viewWidth*moveStep;
            break;
        case "ArrowRight":
            startX += viewWidth*moveStep;
            break;
        case "ArrowUp":
            startY -= viewWidth*moveStep;
            break;
        case "ArrowDown":
            startY += viewWidth*moveStep;
            break;
        case "a":
            viewWidth *= zoomStep;
            break;
        case "d":
            viewWidth /= zoomStep;
            break;
        case "s":
            if (resolution < qualityStep) break;
            resolution -= qualityStep;
            break;
        case "w":
            resolution += qualityStep;
            break;
        case "q":
            if (accuracy < qualityStep) break;
            accuracy -= qualityStep;
            break;
        case "e":
            accuracy += qualityStep;
            break;
        case "i":
            cI += cStep;
            break;
        case "k":
            cI -= cStep;
            break;
        case "j":
            cR -= cStep;
            break;
        case "l":
            cR += cStep;
            break;
    }

    endX = startX + viewWidth
    endY = startY + viewWidth*(canvas.height/canvas.width)



    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let start = Date.now();
    let data = runSimulation(resolution, accuracy, startX, endX, startY, endY, cR, cI);
    let elapsedEval = Date.now()-start;

    start = Date.now();
    plotData(data, gradient);
    let elapsedRender = Date.now()-start;

    console.log("Evaluation Took " + elapsedEval + " Milliseconds, Rendering Took " + elapsedRender + " Milliseconds");
})


let data = runSimulation(resolution, accuracy, startX, endX, startY, endY, cR, cI);
plotData(data, gradient);