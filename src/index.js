var gl, program;
var myTorus;
var myphi = 5, zeta = 30, radius = 15, fovy = Math.PI / 10;
var selectedPrimitive = exampleCone;

function getWebGLContext() {
  var canvas = document.getElementById("myCanvas");
  var width = window.innerWidth;
  var height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  for (var i = 0; i < names.length; ++i) {
    try {
      return canvas.getContext(names[i]);
    }
    catch (e) {
    }
  }
  return null;
}

function initShaders() {
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
  gl.compileShader(vertexShader);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
  gl.compileShader(fragmentShader);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  program.vertexPositionAttribute = gl.getAttribLocation(program, "VertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  program.modelViewMatrixIndex = gl.getUniformLocation(program, "modelViewMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation(program, "projectionMatrix");

  // normales
  program.vertexNormalAttribute = gl.getAttribLocation(program, "VertexNormal");
  program.normalMatrixIndex = gl.getUniformLocation(program, "normalMatrix");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  // material
  program.KaIndex = gl.getUniformLocation(program, "Material.Ka");
  program.KdIndex = gl.getUniformLocation(program, "Material.Kd");
  program.KsIndex = gl.getUniformLocation(program, "Material.Ks");
  program.alphaIndex = gl.getUniformLocation(program, "Material.alpha");

  // fuente de luz
  program.LaIndex = gl.getUniformLocation(program, "Light.La");
  program.LdIndex = gl.getUniformLocation(program, "Light.Ld");
  program.LsIndex = gl.getUniformLocation(program, "Light.Ls");
  program.PositionIndex = gl.getUniformLocation(program, "Light.Position");

}

function initRendering() {

  gl.clearColor(0.15, 0.15, 0.15, 1.0);
  gl.enable(gl.DEPTH_TEST);

  setShaderLight();
}

function initBuffers(model) {

  model.idBufferVertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);

  model.idBufferIndices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
}

function initPrimitives() {
  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);

  myTorus = makeTorus(0.002, 0.5, 100, 100);
  initBuffers(myTorus);
}

function setShaderProjectionMatrix(projectionMatrix) {
  gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
}

function setShaderModelViewMatrix(modelViewMatrix) {
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
}

function setShaderNormalMatrix(normalMatrix) {
  gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
}

function getNormalMatrix(modelViewMatrix) {
  var normalMatrix = mat3.create();

  mat3.fromMat4(normalMatrix, modelViewMatrix);
  mat3.invert(normalMatrix, normalMatrix);
  mat3.transpose(normalMatrix, normalMatrix);

  return normalMatrix;
}

function getProjectionMatrix() {
  var projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fovy, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

  return projectionMatrix;
}

function getCameraMatrix() {
  var _phi = myphi * Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;

  var x = 0, y = 0, z = 0;
  z = radius * Math.cos(_zeta) * Math.cos(_phi);
  x = radius * Math.cos(_zeta) * Math.sin(_phi);
  y = radius * Math.sin(_zeta);

  var cameraMatrix = mat4.create();
  mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);

  return cameraMatrix;
}

function setShaderMaterial(material) {
  gl.uniform3fv(program.KaIndex, material.mat_ambient);
  gl.uniform3fv(program.KdIndex, material.mat_diffuse);
  gl.uniform3fv(program.KsIndex, material.mat_specular);
  gl.uniform1f(program.alphaIndex, material.alpha);
}

function setShaderLight() {
  gl.uniform3f(program.LaIndex, 1.0, 1.0, 1.0);
  gl.uniform3f(program.LdIndex, 1.0, 1.0, 1.0);
  gl.uniform3f(program.LsIndex, 1.0, 1.0, 1.0);
  gl.uniform3f(program.PositionIndex, 10.0, 10.0, 0.0); // en coordenadas del ojo
}

function drawSolid(model) {
  gl.bindBuffer(gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 2 * 3 * 4, 0);
  gl.vertexAttribPointer(program.vertexNormalAttribute, 3, gl.FLOAT, false, 2 * 3 * 4, 3 * 4);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}
var animacion = 0
var animacion2 = 0

function animation() {
  animacion += Math.PI / VELOCIDAD;
  animacion2 += Math.PI / 90;
  drawScene();
  requestAnimationFrame(animation);
}

function drawCenterSphere() {
  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity(modelMatrix);
  mat4.scale(modelMatrix, modelMatrix, [0.2, 0.2, 0.2]);

  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);

  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);

  // se envia al Shader el material
  setShaderMaterial(CORE_MATERIAL);

  // se dibuja la primitiva seleccionada
  drawSolid(selectedPrimitive)
}

var distancia = 3
var orbita = 0
var tiempo = 0

function drawElectrons(numero) {
  for (let i = 0; i < numero; i++) {
    var modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 0.1]);

    mat4.rotateY(modelMatrix, modelMatrix, animacion);
    mat4.translate(modelMatrix, modelMatrix, [distancia, 0, 0]);
    // mat4.rotateZ(modelMatrix, modelMatrix, tiempo);

    var modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
    setShaderModelViewMatrix(modelViewMatrix);

    var normalMatrix = mat3.create();
    normalMatrix = getNormalMatrix(modelViewMatrix);
    setShaderNormalMatrix(normalMatrix);

    var projectionMatrix = mat4.create();
    projectionMatrix = getProjectionMatrix();
    setShaderProjectionMatrix(projectionMatrix);

    setShaderMaterial(Silver);

    drawSolid(selectedPrimitive);

    var modelMatrix2 = mat4.create();
    mat4.identity(modelMatrix2);
    mat4.scale(modelMatrix2, modelMatrix2, [0.01, 0.01, 0.01]);

    mat4.translate(modelMatrix2, modelMatrix2, [modelMatrix[17], modelMatrix[18], modelMatrix[19]]);

    var modelViewMatrix2 = mat4.create();
    mat4.multiply(modelViewMatrix2, getCameraMatrix(), modelMatrix2);
    setShaderModelViewMatrix(modelViewMatrix2);

    var normalMatrix2 = mat3.create();
    normalMatrix2 = getNormalMatrix(modelViewMatrix2);
    setShaderNormalMatrix(normalMatrix2);

    var projectionMatrix2 = mat4.create();
    projectionMatrix2 = getProjectionMatrix();
    setShaderProjectionMatrix(projectionMatrix2);

    setShaderMaterial(White_plastic);

    drawSolid(selectedPrimitive);

    orbita = orbita + (Math.PI * 2 / numero);
    tiempo = tiempo + 0.01
    distancia = distancia + 0.1
  }
}

const generateAngle = (angle) => Math.PI * angle / 180;

const drawElectron = (radius, orbitAngle, direction = 1, velocidad) => {
  var modelMatrix = mat4.create();
  mat4.identity(modelMatrix);
  mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 0.1]);

  mat4.rotateX(modelMatrix, modelMatrix, orbitAngle);
  mat4.rotateZ(modelMatrix, modelMatrix, animacion * direction * velocidad);

  mat4.translate(modelMatrix, modelMatrix, [10 + radius, 0, 0]);

  var modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);

  var projectionMatrix = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  setShaderMaterial(ELECTRON_MATERIAL);
  drawSolid(selectedPrimitive);
}

const drawNumberElectron = () => {
  var modelMatrix = mat4.create();
  mat4.identity(modelMatrix);
  mat4.scale(modelMatrix, modelMatrix, [0.1, 0.1, 0.1]);


  mat4.translate(modelMatrix, modelMatrix, [20, 0, 0]);

  var modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);

  var projectionMatrix = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);
  setShaderMaterial(Silver);
  drawSolid(selectedPrimitive);
}

var TOTAL_ELECTRONS = 1
var SHOW_ORBITS = true
var VELOCIDAD = 3600;
var ELECTRON_MATERIAL = Silver
var ORBIT_MATERIAL = Cyan_rubber
var CORE_MATERIAL = Ruby

function drawScene() {
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // drawElectrons(4)
  let totalElectrons = TOTAL_ELECTRONS
  let showOrbits = SHOW_ORBITS
  const electronsForLevel = [2, 8, 18, 32, 32, 18, 8]
  for (let i = 0; i < electronsForLevel.length; i++) {
    let remainingElectrons = totalElectrons - electronsForLevel[i] > 0 ? electronsForLevel[i] : totalElectrons
    for (let j = 0; j < remainingElectrons; j++) {
      showOrbits ? drawOrbita(2 + i, generateAngle(180 / remainingElectrons) * j) : null
      drawElectron(i * 5, generateAngle(180 / remainingElectrons) * j, j % 2 === 0 ? 1 : -1, (i + 1) * (j + 1))
    }
    totalElectrons -= electronsForLevel[i]
  }
  drawCenterSphere()
}
function drawOrbita(orbitRadius, orbitAngle) {
  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.identity(modelMatrix);
  mat4.scale(modelMatrix, modelMatrix, [orbitRadius, orbitRadius, orbitRadius]);
  mat4.rotateX(modelMatrix, modelMatrix, orbitAngle);

  // mat4.rotateX(modelMatrix, modelMatrix, Math.PI * orbitRadius / 2);
  // mat4.rotateY(modelMatrix, modelMatrix, animacion);

  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  var normalMatrix = mat3.create();
  normalMatrix = getNormalMatrix(modelViewMatrix);
  setShaderNormalMatrix(normalMatrix);

  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  var projectionMatrix = mat4.create();
  projectionMatrix = getProjectionMatrix();
  setShaderProjectionMatrix(projectionMatrix);

  // se envia al Shader el material
  setShaderMaterial(ORBIT_MATERIAL);

  // se dibuja la primitiva seleccionada
  drawSolid(myTorus);
}

//FUNCIONES UI
var SELECTED_ELEMENT
function handleClick(symbol) {
  const element = findElementBySymbol(symbol)
  SELECTED_ELEMENT = element
  TOTAL_ELECTRONS = element.NumberofElectrons
  SelectedElement()
}

function displayOrbits() {
  SHOW_ORBITS = !SHOW_ORBITS
}

function changeSpeed(speed) {
  VELOCIDAD = 10100 - speed
}

function SelectedElement() {
  let container = document.getElementById("selectedElement")
  let content = `
  <div class="flex flex-col justify-center items-center relative w-40 h-40 bg-green-500 rounded">
    <strong class="text-4xl">${SELECTED_ELEMENT.Symbol}</strong>
    <span class="absolute top-3 right-3">${SELECTED_ELEMENT.AtomicNumber}</span>
    <p class="text-xl">${SELECTED_ELEMENT.Element}</p>
  </div>
  `
  container.innerHTML = content
}

function changeElectronMaterial(material) {
  ELECTRON_MATERIAL = ListMaterials[material]
}
function changeOrbitMaterial(material) {
  ORBIT_MATERIAL = ListMaterials[material]
}
function changeCoreMaterial(material) {
  CORE_MATERIAL = ListMaterials[material]
}

function initHandlers() {
  var mouseDown = false;
  var lastMouseX;
  var lastMouseY;

  var canvas = document.getElementById("myCanvas");

  canvas.addEventListener("mousedown",
    function (event) {
      mouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    },
    false);

  canvas.addEventListener("mouseup",
    function () {
      mouseDown = false;
    },
    false);

  canvas.addEventListener("mousemove",
    function (event) {
      if (!mouseDown) {
        return;
      }
      var newX = event.clientX;
      var newY = event.clientY;
      if (event.shiftKey == 1) {
        if (event.altKey == 1) {
          // fovy
          fovy -= (newY - lastMouseY) / 100.0;
          if (fovy < 0.001) {
            fovy = 0.1;
          }
        } else {
          // radius
          radius -= (newY - lastMouseY) / 10.0;
          if (radius < 0.01) {
            radius = 0.01;
          }
        }
      } else {
        // position
        myphi -= (newX - lastMouseX);
        zeta += (newY - lastMouseY);
        if (zeta < -80) {
          zeta = -80.0;
        }
        if (zeta > 80) {
          zeta = 80;
        }
      }
      lastMouseX = newX
      lastMouseY = newY;
      requestAnimationFrame(drawScene);
    },
    false);
  selectedPrimitive = exampleSphere;
  requestAnimationFrame(animation);
}
function setColor(index, value) {
  var myColor = value.substr(1); // para eliminar el # del #FCA34D
  var r = myColor.charAt(0) + '' + myColor.charAt(1);
  var g = myColor.charAt(2) + '' + myColor.charAt(3);
  var b = myColor.charAt(4) + '' + myColor.charAt(5);

  r = parseInt(r, 16) / 255.0;
  g = parseInt(g, 16) / 255.0;
  b = parseInt(b, 16) / 255.0;

  gl.uniform3f(index, r, g, b);
}

function initWebGL() {
  gl = getWebGLContext();

  if (!gl) {
    alert("WebGL no está disponible");
    return;
  }

  initShaders();
  initPrimitives();
  initRendering();
  initHandlers();

  // requestAnimationFrame(drawScene);
}

initWebGL();


//parametros
/*
- Colores 
- Material
- Iluminacion
- Texturas
- Velocidad

- Tabla periodica
 */