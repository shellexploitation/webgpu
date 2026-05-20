var SERVER_PATH = 'http://127.0.0.1:5000';

import { mat4, vec4 } from 'http://127.0.0.1:5000/static/js/wgpu-matrix.module.js';

// Define uniform data
const modelMat = mat4.translation([0.0, 0.0, -10.0]);
const viewMat = mat4.lookAt([12.0, 4.0, -3.0], [0.0, 0.0, -14.0], [0.0, 1.0, 0.0]);
const projMat = mat4.perspective(30.0 * Math.PI / 180.0, 1.33, 5.0, 25.0);
const uniformDataCh05 = Float32Array.of(...modelMat, ...viewMat, ...projMat);

const shaderCode05 = `
struct MVP_Matrices {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f
}

@group(0) @binding(0) var<uniform> mats: MVP_Matrices;

struct DataStruct {
    @builtin(position) pos: vec4f,
    @location(0) colors: vec3f
}

@vertex
fn vertexMain(@location(0) coords: vec3f, @location(1) colors: vec3f, @builtin(instance_index) instance: u32) -> DataStruct {
    var outData: DataStruct;

    /* Apply the model transformation */
    var world_coords = mats.modelMatrix * vec4f(coords, 1.0);
    
    /* Translate the second and third instances */
    world_coords.z = world_coords.z - f32(instance) * 5.0;
    
    /* Apply the view transformation */
    var eye_coords = mats.viewMatrix * world_coords;
    
    /* Apply the projection transformation */
    var clip_coords = mats.projectionMatrix * eye_coords;
    
    /* Create output structure */
    outData.pos = clip_coords;
    outData.colors = colors;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    return vec4f(fragData.colors, 1.0);
}
`;

const canvasIdCh01 = "canvas_example";

// Define vertex data
const vertexDataCh05 = new Float32Array([
    // Left face
    -1.0, -1.0, -1.0, 0.0, 0.0, 0.8,
    -1.0, 1.0, -1.0, 0.0, 0.0, 0.8,
    -1.0, 1.0, 1.0, 0.0, 0.0, 0.8,
    -1.0, -1.0, 1.0, 0.0, 0.0, 0.8,
    // Right face
    1.0, -1.0, -1.0, 0.8, 0.8, 0.0,
    1.0, 1.0, -1.0, 0.8, 0.8, 0.0,
    1.0, 1.0, 1.0, 0.8, 0.8, 0.0,
    1.0, -1.0, 1.0, 0.8, 0.8, 0.0,
    // Top face
    -1.0, -1.0, -1.0, 0.0, 0.8, 0.0,
    1.0, -1.0, -1.0, 0.0, 0.8, 0.0,
    1.0, -1.0, 1.0, 0.0, 0.8, 0.0,
    -1.0, -1.0, 1.0, 0.0, 0.8, 0.0,
    // Bottom face
    -1.0, 1.0, -1.0, 0.8, 0.0, 0.8,
    1.0, 1.0, -1.0, 0.8, 0.0, 0.8,
    1.0, 1.0, 1.0, 0.8, 0.0, 0.8,
    -1.0, 1.0, 1.0, 0.8, 0.0, 0.8,
    // Front face
    -1.0, -1.0, 1.0, 0.8, 0.0, 0.0,
    1.0, -1.0, 1.0, 0.8, 0.0, 0.0,
    1.0, 1.0, 1.0, 0.8, 0.0, 0.0,
    -1.0, 1.0, 1.0, 0.8, 0.0, 0.0,
    // Rear face
    -1.0, -1.0, -1.0, 0.0, 0.8, 0.8,
    1.0, -1.0, -1.0, 0.0, 0.8, 0.8,
    1.0, 1.0, -1.0, 0.0, 0.8, 0.8,
    -1.0, 1.0, -1.0, 0.0, 0.8, 0.8,
]);

// Define index data
const indexData05 = new Uint16Array([
    0, 1, 3, 2, 0xffff,
    7, 6, 4, 5, 0xffff,
    11, 10, 8, 9, 0xffff,
    12, 13, 15, 14, 0xffff,
    19, 18, 16, 17, 0xffff,
    20, 21, 23, 22, 0xffff
]);

function getHardwareDetail(adapter, device, canvas, context, encoder) {
    var msg_array = ["<h1>gpu presentation</h1>"];

    if (navigator.gpu) {
        msg_array.push("WebGPU supported");
    }

    if (adapter) {
        msg_array.push("GPUAdapter found");
    }

    if (device) {
        msg_array.push("GPUDevice created");
    }

    if (canvas) {
        msg_array.push("Accessed canvas in page");
    }

    if (context) {
        msg_array.push("Obtained WebGPU context for canvas");
    }

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    msg_array.push("gpu.getPreferredCanvasFormat():");
    msg_array.push(canvasFormat);

    msg_array.push("navigator.deviceMemory:");
    msg_array.push(navigator.deviceMemory);

    msg_array.push("navigator.connection:");
    msg_array.push(navigator.connection);

    // Check the maximum size of uniforms
    const maxSize = adapter.limits.maxUniformBufferBindingSize;
    msg_array.push("maxSize:");
    msg_array.push(maxSize);

    if (encoder) {
        msg_array.push("GPUCommandEncoder created");
    }

    // Display messages
    for (var i = 0; i < msg_array.length; i++) {
        document.write(msg_array[i] + "<br /><br />"); // conflict with gpu drawing?
    }
}

function createVertexBuffer(vertexData, device, renderPassEncoder) {
    if (!device) {
        throw new Error("[createVertexBuffer()] Failed to create a GPUDevice");
    }

    // Create a vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "vertex buffer",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Write attribute data to the vertex buffer
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Associate a vertex buffer with the render pass encoder
    renderPassEncoder.setVertexBuffer(0, vertexBuffer);
}

function createIndexBuffer(indexData, device, renderPassEncoder) {
    if (null == indexData) {
        return;
    }

    // Create index buffer
    const indexBuffer = device.createBuffer({
        label: "Index Buffer 0",
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(indexBuffer, 0, indexData);
    renderPassEncoder.setIndexBuffer(indexBuffer, "uint16");
}

function createUniformBuffer(device, uniformData) {
    if (null == uniformData) {
        return null;
    }

    // Create uniform buffer
    const uniformBuffer = device.createBuffer({
        label: "Uniform Buffer 0",
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    return uniformBuffer;
}

function createBindGroup(renderPipeline, renderPassEncoder, device, uniformBuffer) {
    // Access the bind group layout
    const bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    let bindGroupDescriptor = {
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer }
            }
        ]
    };

    // Create the bind group
    let bindGroup = device.createBindGroup(bindGroupDescriptor);

    // Associate bind group with render pass encoder
    renderPassEncoder.setBindGroup(0, bindGroup);
}

function createPipeline(shaderCode, device, renderPassEncoder, canvasFormat, uniformBuffer, bufferLayout, pipelineDescriptor) {
    // define one unit of the vertex
    /*
    const bufferLayout = {
        arrayStride: 24,
        attributes: [
            { format: "float32x3", offset: 0, shaderLocation: 0 },
            { format: "float32x3", offset: 12, shaderLocation: 1 }
        ],
    };
    */


    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "shader module",
        code: shaderCode
    });

    pipelineDescriptor.vertex.module = shaderModule;
    pipelineDescriptor.vertex.buffers = [bufferLayout];
    pipelineDescriptor.fragment.module = shaderModule;
    pipelineDescriptor.fragment.targets[0] = { format: { canvasFormat } };

    
    //pipelineDescriptor.primitive.topology = ""

    // render pipeline
    //const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
    const renderPipeline = device.createRenderPipeline({
        label: "pipeline",
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [bufferLayout]
        },

        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{ format: canvasFormat }]
        },

        //primitive: pipelineDescriptor.primitive
        /*
        primitive: {
            topology: "triangle-strip",
            stripIndexFormat: "uint16",
            frontFace: "cw",
            cullMode: "back"
        }
        */

    });
    

    //createBindGroup(renderPipeline, renderPassEncoder, device, uniformBuffer);

    // associate the pipeline with the render pass encoder
    renderPassEncoder.setPipeline(renderPipeline);
}


// Create top-level asynchronous function
async function runExample(canvasID, vertexData, indexData, shaderCode, bufferLayout, pipelineDescriptor, uniformData) {
    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Access the canvas
    const canvas = document.getElementById(canvasID);
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    }

    // Get the best pixel format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    // Configure the context with the device and format
    context.configure({
        device: device,
        format: canvasFormat,
    });

    // Create a command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    }

    // create a GPURenderPassEncoder
    const renderPassEncoder = encoder.beginRenderPass(
        {
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
                //clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
                storeOp: "store"
            }]
        });

    // vertex coords and colors
    /*
    const vertexCoords = new Float32Array([
        0.0, 0.5,
        -0.5, -0.5,
        0.5, -0.5
    ]);
    const vertexColors = new Float32Array([
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 1.0
    ]);
    */

    createVertexBuffer(vertexData, device, renderPassEncoder);

    createIndexBuffer(indexData, device, renderPassEncoder);
   
    const uniformBuffer = createUniformBuffer(device, uniformData);

    createPipeline(shaderCode, device, renderPassEncoder, canvasFormat, uniformBuffer, bufferLayout, pipelineDescriptor);

    // Draw vertices and complete rendering
    if (null == indexData) {
        renderPassEncoder.draw(3);
    } else {
         renderPassEncoder.drawIndexed(30, 3); //ch5 cubes
    }
   

    // encoding end, stop recording the rendering commands
    renderPassEncoder.end();

    // submit the render commands to the gpu
    device.queue.submit([encoder.finish()]); // create the command buffer and submit to the gpu
}

// Run example function
//runExample(canvasIdCh01, vertexDataCh05, indexData05, shaderCode05);

// ch01
const canvasIdCh01_triangle = "canvas_triangle_01";
const vertexDataCh01 = new Float32Array([
    0.0, 0.5, 0.0, 1.0, 0.0, // First vertex
    -0.5, -0.5, 1.0, 0.0, 0.0, // Second vertex
    0.5, -0.5, 0.0, 0.0, 1.0 // Third vertex
]);

const uniformDataCh01 = null;

const shaderCodeCh01Triangle = `
    // Declare variable that accesses a uniform buffer
    @group(0) @binding(0) var<uniform> rotMat: mat4x4f;

    struct DataStruct {
        @builtin(position) pos: vec4f,
        @location(0) colors: vec3f,
    }

    @vertex
    fn vertexMain(@location(0) coords: vec2f, @location(1) colors: vec3f) -> DataStruct {
        var outData: DataStruct;
        //outData.pos = rotMat * vec4f(coords, 0.0, 1.0);
        outData.pos = vec4f(coords, 0.0, 1.0);
        outData.colors = colors;
        return outData;
    }

    @fragment
    fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
        return vec4f(fragData.colors, 1.0);
    }`;

// Define the layout of a vertex buffer
const bufferLayoutCh01 = {
    arrayStride: 20,
    attributes: [
        { format: "float32x2", offset: 0, shaderLocation: 0 },
        { format: "float32x3", offset: 8, shaderLocation: 1 }
    ],
};

var pipelineDescriptorCh01 = {
    label: "Example pipeline",
    layout: "auto",
    vertex: {
        module: {}, // shaderModule
        entryPoint: "vertexMain",
        buffers: [] // bufferLayout
    },

    fragment: {
        module: {},//shaderModule
        entryPoint: "fragmentMain",
        targets: []
    },

    primitive: {
        topology: "",
        stripIndexFormat: "",
        frontFace: "",
        cullMode: ""
    }
    /*
   primitive: {
       topology: "triangle-list",
       stripIndexFormat: "uint32",
       frontFace: "cw",
       cullMode: "back"
       }
   */
};

runExample(canvasIdCh01_triangle, vertexDataCh01, null, shaderCodeCh01Triangle, bufferLayoutCh01, pipelineDescriptorCh01, uniformDataCh01);

//////////////////////////////////// ch06 shiny sphere ////////////////////////////////
const shaderCode_ch06 = `

/* Input to vertex shader */
struct InputData {
    mvpMatrix: mat4x4f,
    centerPos: vec4f,
    viewerPos: vec4f,
    lightPos: vec4f,    
    ambient: vec4f,
    diffuse: vec4f,
    specular: vec3f,
    shininess: f32
}

/* Access the uniform buffer */
@group(0) @binding(0) var<uniform> input: InputData;

/* Output to fragment shader */
struct OutputData {
    @builtin(position) pos: vec4f,
    @location(0) normalVec: vec4f,    
    @location(1) viewerVec: vec4f,
    @location(2) lightVec: vec4f,    
    @location(3) ambient: vec4f,
    @location(4) diffuse: vec4f,
    @location(5) specular: vec3f,
    @location(6) shininess: f32
}

@vertex
fn vertexMain(@location(0) coords: vec3f) -> OutputData {
    
    var outData: OutputData;
    
    /* Transform coordinates */
    outData.pos = input.mvpMatrix * vec4f(coords, 1.0);
        
    /* Compute normal vector */
    outData.normalVec = normalize(outData.pos - input.centerPos);

    /* Compute direction to viewer */
    outData.viewerVec = normalize(input.viewerPos - outData.pos);
    
    /* Compute direction to light source */
    outData.lightVec = normalize(input.lightPos - outData.pos);

    /* Set data for fragment shader */
    outData.ambient = input.ambient;
    outData.diffuse = input.diffuse;
    outData.specular = input.specular;
    outData.shininess = input.shininess;

    return outData;
}

@fragment
fn fragmentMain(fragData: OutputData) -> @location(0) vec4f {
    
    /* Set minimum and maximum vectors used in clamp */    
    let low_clamp = vec3f(0.0, 0.0, 0.0);
    let high_clamp = vec3f(1.0, 1.0, 1.0);    
    
    /* Step 1: Compute N . L */
    let n_dot_l = dot(fragData.normalVec.xyz, fragData.lightVec.xyz);
    
    /* Step 2: Compute H, the vector between L and V */
    let half_vector = normalize(fragData.lightVec.xyz + fragData.viewerVec.xyz);
    
    /* Step 3: Compute (N . H)^n' */
    var blinn = dot(fragData.normalVec.xyz, half_vector);
    blinn = clamp(blinn, 0.0, 1.0);
    blinn = pow(blinn, fragData.shininess);    
    
    /* Step 4: Compute sum of light components */
    var light_color = fragData.ambient.xyz + fragData.diffuse.xyz * n_dot_l + fragData.specular * blinn;
    light_color = clamp(light_color, low_clamp, high_clamp);
  
    /* Step 5: Blend light color and original color */
    let orig_color = vec3f(0.5, 0.6, 0.7);
    let color_sum = clamp((light_color + orig_color)/2.0, low_clamp, high_clamp);
    
    return vec4f(color_sum, 1.0);
}
`;

// Create top-level asynchronous function
async function runExample_ch06() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the client"s GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Access the canvas
    const canvas = document.getElementById("canvas_example_ch06");
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    }

    // Configure the context with the device and format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });

    // Create the command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    }

    // Create the render pass encoder
    const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0.4, g: 0.4, b: 0.4, a: 1.0 },
            storeOp: "store"
        }]
    });

    // Define vertex data (coordinates and colors)
    const RAD = 1.5;
    const NUM_LATITUDE = 16;
    const NUM_LONGITUDE = 32;
    const NUM_VERTICES = NUM_LATITUDE * NUM_LONGITUDE + 2;
    const NUM_INDICES = NUM_LONGITUDE * (2 * NUM_LATITUDE + 3);
    const THETA_CONVERSION = (2.0 * Math.PI) / NUM_LONGITUDE;
    const PHI_CONVERSION = Math.PI / (NUM_LATITUDE + 1);

    // Set coordinates of top and bottom points
    const vData = new Float32Array(3 * NUM_VERTICES);
    vData[0] = 0.0; vData[1] = 0.0; vData[2] = RAD;
    vData[3] = 0.0; vData[4] = 0.0; vData[5] = -1.0 * RAD;

    // Create data arrays
    const iData = new Uint16Array(NUM_INDICES);

    // Iterate through slices
    let ptIndex = 0; let vertIndex = 2;
    let theta = 0.0; let phi = 0.0;
    let rad_cos_theta = 0.0; let rad_sin_theta = 0.0;

    for (let lon = 0; lon < NUM_LONGITUDE; lon++) {

        theta = lon * THETA_CONVERSION;
        rad_sin_theta = RAD * Math.sin(theta);
        rad_cos_theta = RAD * Math.cos(theta);

        // Add top vertex
        iData[ptIndex++] = 0;

        for (let lat = 1; lat <= NUM_LATITUDE; lat++) {

            // Set index values
            iData[ptIndex++] = vertIndex;
            iData[ptIndex++] = (vertIndex + NUM_LATITUDE) % (NUM_VERTICES - 2);

            // Compute phi
            phi = Math.PI / 2.0 - lat * PHI_CONVERSION;

            // Set vertex values
            vData[3 * vertIndex] = rad_cos_theta * Math.cos(phi);
            vData[3 * vertIndex + 1] = rad_sin_theta * Math.cos(phi);
            vData[3 * vertIndex++ + 2] = RAD * Math.sin(phi);
        }

        // Add bottom vertex
        iData[ptIndex++] = 1;

        // Add primitive restart
        if (lon != NUM_LONGITUDE - 1) {
            iData[ptIndex++] = 0xffff;
        }
    }

    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "Vertex Buffer 0",
        size: vData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(vertexBuffer, 0, vData);
    renderPass.setVertexBuffer(0, vertexBuffer);

    // Define layout of buffer data
    const bufferLayout = {
        arrayStride: 12,
        attributes: [
            { format: "float32x3", offset: 0, shaderLocation: 0 }
        ],
    };

    // Create index buffer
    const indexBuffer = device.createBuffer({
        label: "Index Buffer 0",
        size: iData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(indexBuffer, 0, iData);
    renderPass.setIndexBuffer(indexBuffer, "uint16");

    // Define transformation
    const modelMat = mat4.translation([0.0, 0.0, -10.0]);
    const projMat = mat4.perspective(30.0 * Math.PI / 180.0, 1.0, 5.0, 25.0);
    const viewMat = mat4.identity();
    const mvpMat = mat4.mul(mat4.mul(projMat, viewMat), modelMat);

    // Set positions
    const oldCenter = new Float32Array([0.0, 0.0, 0.0, 1.0]);
    const centerPos = vec4.transformMat4(oldCenter, mvpMat);
    const viewerPos = new Float32Array([0.0, 0.0, 0.0, 0.0]);
    const lightPos = new Float32Array([5.0, 15.0, 9.0, 0.0]);

    // Set light components
    const ambient = new Float32Array([0.7, 0.7, 0.7, 0.0]);
    const diffuse = new Float32Array([0.9, 0.9, 0.9, 0.0]);
    const specular = new Float32Array([1.0, 1.0, 1.0]);
    const shininess = new Float32Array([1.5]);

    // Combine data into uniform buffer
    const uniformData = Float32Array.of(...mvpMat, ...centerPos, ...viewerPos, ...lightPos, ...ambient, ...diffuse, ...specular, ...shininess);

    // Create uniform buffer
    const uniformBuffer = device.createBuffer({
        label: "Uniform Buffer 0",
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Shader Module 0",
        code: shaderCode_ch06
    });

    // Define the rendering procedure
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [bufferLayout]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: "triangle-strip",
            stripIndexFormat: "uint16",
            frontFace: "cw",
            cullMode: "back"
        }
    });
    renderPass.setPipeline(renderPipeline);

    // Access the bind group layout
    const bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }]
    });

    // Associate bind group with render pass encoder
    renderPass.setBindGroup(0, bindGroup);

    // Draw vertices and complete rendering
    renderPass.drawIndexed(NUM_INDICES);
    renderPass.end();

    // Submit the render commands to the GPU
    device.queue.submit([encoder.finish()]);
}

// Run example function
runExample_ch06();

/////////////////////////////// ch06 simple texture /////////////////////////////////////////
const shaderCode_ch06_simpletexture = `

struct DataStruct {
    @builtin(position) pos: vec4f,
    @location(0) uvPos: vec2f,
}

@group(0) @binding(0) var sam : sampler;
@group(0) @binding(1) var tex : texture_2d<f32>;

@vertex
fn vertexMain(@location(0) coords: vec2f, @location(1) uvCoords: vec2f) -> DataStruct {
    var outData: DataStruct;
    outData.pos = vec4f(coords, 0.0, 1.0);
    outData.uvPos = uvCoords;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    return textureSample(tex, sam, fragData.uvPos);
}
`;

// Create top-level asynchronous function
async function runExample_ch06_simpletexture() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Access the canvas
    const canvas = document.getElementById("canvas_example_ch06_simpletexture");
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    }

    // Configure the context with the device and format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });

    // Define vertex data (vertex coordinates and UV coordinates)
    const vertexData = new Float32Array([
        -1.0, 1.0, 0.0, 0.0,   // First vertex
        -1.0, -1.0, 0.0, 1.0,   // Second vertex
        1.0, 1.0, 1.0, 0.0,   // Third vertex
        1.0, -1.0, 1.0, 1.0    // Fourth vertex
    ]);

    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "Example vertex buffer",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Write data to buffer
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Define layout of buffer data
    const bufferLayout = {
        arrayStride: 16,
        attributes: [
            { format: "float32x2", offset: 0, shaderLocation: 0 },
            { format: "float32x2", offset: 8, shaderLocation: 1 }
        ],
    };

    // Create ImageBitmap from image file
    const response = await fetch(SERVER_PATH + "/static/image/smiley.png");
    
    const imageBitmap = await createImageBitmap(await response.blob());

    // Create texture object
    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: "rgba8unorm",
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    // Write data to texture
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    // Create sampler
    const sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
    });

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Example shader module",
        code: shaderCode_ch06_simpletexture
    });

    // Define the rendering procedure
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [bufferLayout]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: "triangle-strip"
        }
    });

    // Access the bind group layout
    const bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: sampler
        },
        {
            binding: 1,
            resource: texture.createView({
                dimension: "2d",
            })
        }]
    });

    // Called just before the window is repainted
    function newFrame(currentTime) {

        // Create the command encoder and the render pass encoder
        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
                storeOp: "store"
            }]
        });

        // Set the vertex buffer and pipeline
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setPipeline(renderPipeline);

        // Associate bind group with render pass encoder
        renderPass.setBindGroup(0, bindGroup);

        // Draw vertices
        renderPass.draw(4);
        renderPass.end();

        // Submit the render commands to the GPU
        device.queue.submit([encoder.finish()]);
        window.requestAnimationFrame(newFrame);
    }

    window.requestAnimationFrame(newFrame);
}

// Run example function
runExample_ch06_simpletexture();


//////////////////// ch07 text /////////////////////
const shaderCode_ch07_text = `

struct DataStruct {
    @builtin(position) pos: vec4f,
    @location(0) uvPos: vec2f,
}

@group(0) @binding(0) var sam : sampler;
@group(0) @binding(1) var tex : texture_2d<f32>;

@vertex
fn vertexMain(@location(0) coords: vec2f, @location(1) uvCoords: vec2f) -> DataStruct {
    var outData: DataStruct;
    outData.pos = vec4f(coords, 0.0, 1.0);
    outData.uvPos = uvCoords;
    return outData;
}

@fragment
fn fragmentMain(fragData: DataStruct) -> @location(0) vec4f {
    return textureSample(tex, sam, fragData.uvPos);
}
`;

// Create top-level asynchronous function
async function runExample_ch07_text() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Access the canvas
    const canvas = document.getElementById("canvas_example_ch07_text");
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    }

    // Configure the context with the device and format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });

    // Define vertex data
    const textMsg = "Hello, world!";
    let leftX = -0.9;
    const topY = 0.7;
    const bottomY = 0.5;
    const lineHeight = 32;
    const scale = (topY - bottomY) / lineHeight;

    // Create vertex data array
    const vertexData = new Float32Array(16 * textMsg.length); // why multiply 16?

    // Read character data
    const fileResponse = await fetch(SERVER_PATH + "/static/json/lato_data.json");
    const charData = await fileResponse.json();

    // Iterate through characters in message
    for (let i = 0; i < textMsg.length; i++) {

        // Get index of message character
        let currentChar = charData[textMsg.charCodeAt(i) - 32];

        // Set texture coordinates
        vertexData[16 * i + 2] = currentChar.x / 256.0;
        vertexData[16 * i + 3] = (currentChar.y + currentChar.height) / 256.0;
        vertexData[16 * i + 6] = currentChar.x / 256.0;
        vertexData[16 * i + 7] = currentChar.y / 256.0;
        vertexData[16 * i + 10] = (currentChar.x + currentChar.width) / 256.0;
        vertexData[16 * i + 11] = (currentChar.y + currentChar.height) / 256.0;
        vertexData[16 * i + 14] = (currentChar.x + currentChar.width) / 256.0;
        vertexData[16 * i + 15] = currentChar.y / 256.0;

        // Set vertex coordinates
        if (i == 0) {
            vertexData[0] = leftX;
            vertexData[1] = bottomY;
            vertexData[4] = leftX;
            vertexData[5] = topY - currentChar.yoffset * scale;
        }
        else {
            vertexData[16 * i] = leftX + currentChar.xoffset * scale;
            vertexData[16 * i + 1] = bottomY;
            vertexData[16 * i + 4] = vertexData[16 * i];
            vertexData[16 * i + 5] = topY - currentChar.yoffset * scale;
        }
        vertexData[16 * i + 8] = vertexData[16 * i] + currentChar.width * scale;
        vertexData[16 * i + 9] = bottomY;
        vertexData[16 * i + 12] = vertexData[16 * i + 8];
        vertexData[16 * i + 13] = topY - currentChar.yoffset * scale;

        // Set kerning
        let kerning = 0;
        if ('kerning' in currentChar) {

            // Get next character
            if (i != textMsg.length - 1) {
                let nextId = charData[textMsg.charCodeAt(i + 1) - 32].id;

                // Apply kerning if needed
                if (nextId in currentChar.kerning) {
                    kerning = parseInt(currentChar.kerning[nextId]);
                }
            }
        }

        // Update current horizontal position
        leftX += (currentChar.xadvance + kerning) * scale;
    }

    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "Vertex Buffer 0",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Write data to buffer
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Define layout of buffer data
    const bufferLayout = {
        arrayStride: 16,
        attributes: [
            { format: "float32x2", offset: 0, shaderLocation: 0 },
            { format: "float32x2", offset: 8, shaderLocation: 1 }
        ],
    };

    // Initialize index array for atlas text
    const numIndexes = ((5 * textMsg.length) % 2 == 0) ? 5 * textMsg.length : 5 * textMsg.length + 1;
    const indexData = new Uint16Array(numIndexes);
    for (let i = 0; i < textMsg.length; i++) {
        indexData[5 * i] = 4 * i + 1;
        indexData[5 * i + 1] = 4 * i;
        indexData[5 * i + 2] = 4 * i + 3;
        indexData[5 * i + 3] = 4 * i + 2;
        indexData[5 * i + 4] = 0xffff;
    }

    // Create index buffer
    const indexBuffer = device.createBuffer({
        label: "Index Buffer 0",
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(indexBuffer, 0, indexData);

    // Create ImageBitmap from image file
    const response = await fetch(SERVER_PATH + "/static/image/lato.png")
    const imageBitmap = await createImageBitmap(await response.blob());

    // Create texture object
    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height],
        format: "rgba8unorm",
        usage:
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST
    });

    // Write data to texture
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    // Create sampler
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Shader Module 0",
        code: shaderCode_ch07_text
    });

    // Define the rendering procedure
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [bufferLayout]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: "triangle-strip",
            stripIndexFormat: "uint16"
        }
    });

    // Access the bind group layout
    const bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: sampler
            },
            {
                binding: 1,
                resource: texture.createView({
                    dimension: "2d",
                })
            }]
    });

    // Called just before the window is repainted
    function newFrame(currentTime) {

        // Create the command encoder and the render pass encoder
        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
                storeOp: "store"
            }]
        });

        // Set the vertex buffer and pipeline
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setIndexBuffer(indexBuffer, "uint16");
        renderPass.setPipeline(renderPipeline);

        // Associate bind group with render pass encoder
        renderPass.setBindGroup(0, bindGroup);

        // Draw vertices and complete rendering
        renderPass.drawIndexed(5 * textMsg.length);
        renderPass.end();

        // Submit the render commands to the GPU
        device.queue.submit([encoder.finish()]);
        window.requestAnimationFrame(newFrame);
    }

    window.requestAnimationFrame(newFrame);
}

// Run example function
runExample_ch07_text();


////////// ch07 animation ////////////////////////////////////////////
const shaderCode_ch07_animation = `
@group(0) @binding(0) var<uniform> transform_matrix: mat4x4f;

@vertex
fn vertexMain(@location(0) coords: vec2f) -> @builtin(position) vec4f {
    return transform_matrix * vec4f(coords, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;

// Create top-level asynchronous function
async function runExample_ch07_animation() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the client"s GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Access the canvas
    const canvas = document.getElementById("canvas_example_ch07_animation");
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    }

    // Configure the context with the device and format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });

    // Define vertex data (coordinates and colors)
    const vertexData = new Float32Array([
        -0.625, 0.4330,  // First vertex
        -1.0, -0.2165,   // Second vertex
        -0.25, -0.2165   // Third vertex
    ]);
    let motionPerSec = (2.0 * 0.625) / 2.0;
    let motionChange = 0.0;
    let totalTime = 0.0;
    let oldTime = 0.0;
    let t = 0.0;
    let count2 = 0.0;

    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "Vertex Buffer 0",
        size: vertexData.byteLength,
        usage:
            GPUBufferUsage.VERTEX |
            GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Define layout of vertex buffer
    const bufferLayout = {
        arrayStride: 8,
        attributes: [
            { format: "float32x2", offset: 0, shaderLocation: 0 }
        ],
    };

    // Define uniform data
    let uniformData = mat4.identity();

    // Create uniform buffer
    const uniformBuffer = device.createBuffer({
        label: "Uniform Buffer 0",
        size: uniformData.byteLength,
        usage:
            GPUBufferUsage.UNIFORM |
            GPUBufferUsage.COPY_DST
    });

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Shader module 0",
        code: shaderCode_ch07_animation
    });

    // Define the rendering procedure
    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [bufferLayout]
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        }
    });

    // Access the bind group layout
    const bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }]
    });

    // Called just before the window is repainted
    function newFrame(currentTime) {

        // Skip first frame
        if (oldTime == 0.0) {
            oldTime = currentTime;
            window.requestAnimationFrame(newFrame);
            return;
        }

        // Compute elapsed time in seconds
        t = (currentTime - oldTime) / 1000;
        oldTime = currentTime;

        // Update total time
        totalTime += t;

        // Stop animation after four seconds
        if (totalTime > 120.0) {
            return;
        }

        count2 = Math.floor(totalTime / 2);
        var isOdd = count2 % 2;
        if (isOdd > 0) {
            motionChange = -t * motionPerSec;
        } else {
            motionChange = t * motionPerSec;
        }

        // Update the uniform buffer
        //motionChange = totalTime < 2.0 ? t * motionPerSec : -t * motionPerSec;
        uniformData = mat4.translate(uniformData, [motionChange, 0.0, 0.0]);
        device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        // Create the command encoder and the render pass encoder
        const encoder = device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0.9, g: 0.9, b: 0.9, a: 1.0 },
                storeOp: "store"
            }]
        });

        // Set the vertex buffer and pipeline
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setPipeline(renderPipeline);

        // Associate bind group with render pass encoder
        renderPass.setBindGroup(0, bindGroup);

        // Draw vertices
        renderPass.draw(3);
        renderPass.end();

        // Submit the render commands to the GPU
        device.queue.submit([encoder.finish()]);
        window.requestAnimationFrame(newFrame);
    }

    window.requestAnimationFrame(newFrame);
}

// Run example function
runExample_ch07_animation();


///////////////////////// ch 08 simple compute ///////////////////////////////////////
const shaderCode_ch08_simplecompute = `

@binding(0) @group(0) var<storage, read_write> data : array<f32, 32>;

override group_size: u32;

@compute @workgroup_size(group_size)
fn computeMain(
    @builtin(global_invocation_id) id : vec3<u32>,
    @builtin(workgroup_id) wg_id : vec3<u32>,
    @builtin(local_invocation_id) local_id : vec3<u32>)
{
    data[id.x] = f32(wg_id.x) * data[id.x] + f32(local_id.x);
}
`;

// Create top-level asynchronous function
async function runExample_ch08_simplecompute() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the client's GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Create the command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    }

    // Create compute buffer
    const computeBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: 128,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });

    // Access the mapped data
    const buff = computeBuffer.getMappedRange();

    // Set the content of the mapped data
    const inputVals = new Array(32);
    inputVals.fill(1.0);
    new Float32Array(buff).set(inputVals);

    // Update label in page
    const inputMsg = "Input vector: ";
    document.getElementById("inputVector").innerHTML = inputMsg.concat(inputVals.toString());

    // Unmap buffer
    computeBuffer.unmap();

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Shader module 0",
        code: shaderCode_ch08_simplecompute
    });

    // Create the compute pass encoder
    const computePass = encoder.beginComputePass({
        label: "Compute Pass 0"
    });

    // Define the compute procedure
    const computePipeline = device.createComputePipeline({
        label: "Compute Pipeline 0",
        layout: "auto",
        compute: {
            module: shaderModule,
            entryPoint: "computeMain",
            constants: {
                group_size: 4
            }
        }
    });
    computePass.setPipeline(computePipeline);

    // Access the bind group layout
    const bindGroupLayout = computePipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: computeBuffer }
        }]
    });
    computePass.setBindGroup(0, bindGroup);

    // Encode compute commands
    computePass.dispatchWorkgroups(8);

    // Complete encoding compute commands
    computePass.end();

    // Create mappable buffer
    const mappableBuffer = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Encode copy command
    encoder.copyBufferToBuffer(computeBuffer, 0, mappableBuffer, 0, 128);

    // Submit the commands to the GPU
    device.queue.submit([encoder.finish()]);

    // Read data from compute buffer
    await mappableBuffer.mapAsync(GPUMapMode.READ);
    const procData = mappableBuffer.getMappedRange();
    const floatData = new Float32Array(procData);

    // Display output in page
    const outputMsg = "Output vector: ";
    document.getElementById("outputVector").innerHTML = outputMsg.concat(floatData.toString());

    // Destroy the mapping
    mappableBuffer.unmap();
}

function SimpleCompute() {
    // Run example function
    //runExample_ch08_simplecompute();
}

//document.getElementById("Ch08_SimpleCompute").addEventListener('click', SimpleCompute);

document.getElementById("Ch08_SimpleCompute").onclick = function () {
    // Run example function
    runExample_ch08_simplecompute();
    //throw new Error("WebGPU not supported");
    //IrisDeepLearning();
}


/////////////// ch08 dot product //////////////////////////
const shaderCode_ch08_dotproduct = `

@binding(0) @group(0) var<storage, read> a : array<vec4u, 256>;
@binding(1) @group(0) var<storage, read> b : array<vec4u, 256>;
@binding(2) @group(0) var<storage, read_write> res : atomic<u32>;

override group_size: u32;

@compute @workgroup_size(group_size)
fn computeMain(@builtin(global_invocation_id) id : vec3<u32>) {

    // Compute dot product of vectors
    let prod = dot(a[id.x], b[id.x]);

    // Update result atomically
    atomicAdd(&res, prod);
}
`;

// Create top-level asynchronous function
async function runExample_ch08_dotproduct() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Check for timestamp support
    const timeSupport = adapter.features.has("timestamp-query");

    // Access the GPU
    const device = timeSupport ?
        await adapter.requestDevice({
            requiredFeatures: ["timestamp-query"]
        }) :
        await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Create the command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    }

    // Set the number of values
    const numVals = 1024;

    // Create the query set
    const querySet = timeSupport ?
        device.createQuerySet({
            label: "Query Set",
            count: 2,
            type: "timestamp"
        }) : None;

    // Create the query buffer
    const queryBuffer = timeSupport ?
        device.createBuffer({
            size: querySet.count * BigInt64Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
        }) : None

    // Create compute buffers
    const aBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: numVals * 4,
        usage:
            GPUBufferUsage.STORAGE
    });
    const aRange = aBuffer.getMappedRange();

    // Create compute buffers
    const bBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: numVals * 4,
        usage:
            GPUBufferUsage.STORAGE
    });
    const bRange = bBuffer.getMappedRange();

    // Create compute buffers
    const resBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const resRange = resBuffer.getMappedRange();

    // Create the data arrays
    const aArray = new Array(numVals);
    const bArray = new Array(numVals);
    const res = new Array([0]);

    // Initialize vectors
    for (let i = 0; i < numVals; i++) {
        aArray[i] = i + 1;
        bArray[i] = numVals - i;
    }

    // Create arrays in buffer memory
    new Uint32Array(aRange).set(aArray);
    new Uint32Array(bRange).set(bArray);
    new Uint32Array(resRange).set(res);

    // Unmap buffers
    aBuffer.unmap();
    bBuffer.unmap();
    resBuffer.unmap();

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Shader module 0",
        code: shaderCode_ch08_dotproduct
    });

    // Create the compute pass encoder
    const computePass = timeSupport ?
        encoder.beginComputePass({
            timestampWrites: {
                querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1
            }
        }) :
        encoder.beginComputePass({});

    // Define the compute procedure
    const computePipeline = device.createComputePipeline({
        label: "Compute Pipeline 0",
        layout: "auto",
        compute: {
            module: shaderModule,
            entryPoint: "computeMain",
            constants: {
                group_size: 256
            }
        }
    });
    computePass.setPipeline(computePipeline);

    // Access the bind group layout
    const bindGroupLayout = computePipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: aBuffer }
        },
        {
            binding: 1,
            resource: { buffer: bBuffer }
        },
        {
            binding: 2,
            resource: { buffer: resBuffer }
        }]
    });
    computePass.setBindGroup(0, bindGroup);

    // Encode compute commands
    computePass.dispatchWorkgroups(1);

    // Complete encoding compute commands
    computePass.end();

    // Create buffer to hold timestamp results
    const tsBuffer = timeSupport ?
        device.createBuffer({
            size: querySet.count * BigInt64Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        }) : None;

    if (timeSupport) {

        // Encode timestamp query command
        encoder.resolveQuerySet(querySet,
            0, querySet.count, queryBuffer, 0);

        // Encode command to copy timestamp data
        encoder.copyBufferToBuffer(queryBuffer, 0, tsBuffer, 0,
            querySet.count * BigInt64Array.BYTES_PER_ELEMENT);
    }

    // Create mappable buffer for dot product
    const mappableBuffer = device.createBuffer({
        size: 4,
        usage:
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.MAP_READ
    });

    // Encode copy command for dot product
    encoder.copyBufferToBuffer(resBuffer, 0, mappableBuffer, 0, 4);

    // Submit the commands to the GPU
    device.queue.submit([encoder.finish()]);

    // Read data from compute buffer
    await mappableBuffer.mapAsync(GPUMapMode.READ);
    const procData = mappableBuffer.getMappedRange();
    const resData = new Uint32Array(procData);

    // Display output in page
    const outputMsg = "Dot product: ";
    document.getElementById("result").innerHTML = outputMsg.concat(resData.toString());

    // Destroy the mapping
    mappableBuffer.unmap();

    if (timeSupport) {

        // Read data from compute buffer
        await tsBuffer.mapAsync(GPUMapMode.READ);
        const mapData = tsBuffer.getMappedRange();
        const tsData = new BigInt64Array(mapData);

        // Display output in page
        const t1 = Number(tsData[0]) / 1000000.0;
        const t2 = Number(tsData[1]) / 1000000.0;
        const t = t2 - t1;
        const tsMsg = "Time: ".concat(t2.toString()).concat(" - ").concat(t1.toString()).concat(" = ");
        document.getElementById("timestamp").innerHTML = tsMsg.concat(t.toString());

        // Destroy the mapping
        tsBuffer.unmap();
    }
}

document.getElementById("btn_Ch08_DotProduct").onclick = function () {
    runExample_ch08_dotproduct();
}


//////////////////// chapter 9 iris classifying ////////////////////////////
const computeLoss = `

// Training data
@binding(0) @group(0) var<storage, read_write> train_data : array<f32>;

// Training results
@binding(1) @group(0) var<storage, read_write> train_results : array<vec4f>;

// Weights
@binding(2) @group(0) var<storage, read_write> weights : array<f32>;

// Bias weights
@binding(3) @group(0) var<storage, read_write> bias_weights : array<f32>;

// Test data
@binding(4) @group(0) var<storage, read_write> test_data : array<f32>;

// Test results
@binding(5) @group(0) var<storage, read_write> test_results : array<f32>;

override group_size: u32;
override batch_size: u32;
override num_train_points: u32;
override num_test_points: u32;
override num_inputs: u32;
override l1_size: u32;
override l2_size: u32;
override l3_size: u32;
override num_weights: u32;
override num_bias: u32;
override num_epochs: u32;
override eta: f32;

var<workgroup> layer1: array<f32, l1_size * batch_size>;
var<workgroup> layer2: array<f32, l2_size * batch_size>;
var<workgroup> layer3: array<f32, l3_size * batch_size>;
var<workgroup> J: array<f32, num_weights * batch_size>;
var<workgroup> J_bias: array<f32, num_bias * batch_size>;

@compute @workgroup_size(group_size)
fn computeMain(@builtin(local_invocation_id) id : vec3<u32>) {

    var num_iterations = num_train_points/batch_size; // one batch for one iteration
    var batch_id = id.x / num_inputs;
    var node_id = id.x % num_inputs;    // ?
    var l1_id = batch_id * l1_size;
    var l2_id = batch_id * l2_size;
    var l3_id = batch_id * l3_size;
    var sum: f32; var d: f32;
    var sm1: f32; var sm2: f32; var sm3: f32;
    var i: u32; var j: u32; var k: u32; var l: u32;
    var weight_addr: u32; var bias_addr: u32;

    // Iterate through the entire training set several times
    for (var epoch: u32 = 0; epoch < num_epochs; epoch++) {

        // Process nine minibatches per training set
        for (var iter: u32 = 0; iter < num_iterations; iter++) {

            var train_id = iter * batch_size * num_inputs + batch_id * num_inputs;
            weight_addr = node_id * num_inputs;
            bias_addr = node_id;

            // First layer
            sum = 0.0;
            for (i = 0; i < num_inputs; i++) {
                sum += train_data[train_id + i] * weights[weight_addr + i];
            }
            sum += bias_weights[bias_addr];
            layer1[l1_id + node_id] = max(0.0, sum);
            weight_addr += l1_size * num_inputs;
            bias_addr += num_inputs;
            workgroupBarrier();

            // Second layer
            sum = 0.0;
            for (i = 0; i < l1_size; i++) {
                sum += layer1[l1_id + i] * weights[weight_addr + i];
            }
            sum += bias_weights[bias_addr];
            layer2[l2_id + node_id] = max(0.0, sum);
            weight_addr += l2_size * l1_size;
            bias_addr += l2_size;
            workgroupBarrier();

            // Third layer
            if(node_id < l3_size) {
                sum = 0.0;
                for (i = 0; i < l2_size; i++) {
                    sum += layer2[l2_id + i] * weights[weight_addr + i];
                }
                sum += bias_weights[bias_addr];
                layer3[l3_id + node_id] = sum;
            }
            workgroupBarrier();

            // Compute softmax and loss gradient
            if(node_id == 0) {

                // Compute the softmax outputs
                d = exp(layer3[l3_id]) + exp(layer3[l3_id+1]) + exp(layer3[l3_id+2]);
                sm1 = exp(layer3[l3_id])/d;
                sm2 = exp(layer3[l3_id+1])/d;
                sm3 = exp(layer3[l3_id+2])/d;

                // Compute loss gradients for output nodes
                var res = train_results[iter * batch_size + batch_id];
                layer3[l3_id] = sm1 - res[0];
                layer3[l3_id+1] = sm2 - res[1];
                layer3[l3_id+2] = sm3 - res[2];

                var l2_offset = num_inputs * l1_size;
                var l3_offset = l2_offset + l1_size * l2_size;

                // Set loss gradients and biases to zero
                for (i = 0; i < num_weights; i++) {
                    J[batch_id * num_weights + i] = 0.0;
                }
                for (i = 0; i < num_bias; i++) {
                    J_bias[batch_id * num_bias + i] = 0.0;
                }

                // Compute elements of loss gradient
                for (i = 0; i < l3_size; i++) {

                    J_bias[batch_id * num_bias + l1_size + l2_size + i] = layer3[l3_id + i];

                    for (j = 0; j < l2_size; j++) {

                        // Set the Layer 3 weights
                        J[batch_id * num_weights + l3_offset + i * l2_size + j] = layer3[l3_id + i] * layer2[l2_id + j];

                        // Set Layer 2 weights
                        if (layer2[l2_id + j] > 0) {

                            J_bias[batch_id * num_bias + l1_size + j] += layer3[l3_id + i] * weights[l3_offset + i * l2_size + j];

                            for (k = 0; k < l1_size; k++) {

                                J[batch_id * num_weights + l2_offset + j * l1_size + k] +=
                                    layer3[l3_id + i] * weights[l3_offset + i * l2_size + j] * layer1[l1_id + k];

                                // Set Layer 1 weights
                                if (layer1[l1_id + k] > 0) {

                                    J_bias[batch_id * num_bias + k] += layer3[l3_id + i] * weights[l3_offset + i * l2_size + j] *
                                    weights[l2_offset + j * l1_size + k];

                                    for (l = 0; l < num_inputs; l++) {

                                        J[batch_id * num_weights + k * num_inputs + l] +=
                                            layer3[l3_id + i] * weights[l3_offset + i * l2_size + j] *
                                            weights[l2_offset + j * l1_size + k] * train_data[train_id + l];
                                    }
                                }
                            }
                        }
                    }
                }
            }
            workgroupBarrier();

            // Update weights and biases
            if (id.x == 0) {

                // Iterate through weights
                for (i = 0; i < num_weights; i++) {
                    sum = 0.0;
                    for (j = 0; j < batch_size; j++) {
                        sum += J[j * num_weights + i];
                    }
                    weights[i] -= eta * sum;
                }

                // Iterate through biases
                for (i = 0; i < num_bias; i++) {
                    sum = 0.0;
                    for (j = 0; j < batch_size; j++) {
                        sum += J_bias[j * num_bias + i];
                    }
                    bias_weights[i] -= eta * sum;
                }
            }
            storageBarrier();
        }
    }

    // Iterate through test points
    for (var test: u32 = 0; test < num_test_points; test++) {

        var test_addr = test * num_inputs;

        // First layer
        if (batch_id == 0) {
            sum = 0.0;
            for (i = 0; i < num_inputs; i++) {
                sum += test_data[test_addr + i] * weights[node_id * num_inputs + i];
            }
            sum += bias_weights[node_id];
            layer1[node_id] = max(0.0, sum);
        }
        workgroupBarrier();

        // Second layer
        weight_addr = l1_size * num_inputs;
        bias_addr = l1_size;        
        if (batch_id == 0) {
            sum = 0.0;
            for (i = 0; i < l1_size; i++) {
                sum += layer1[i] * weights[weight_addr + node_id * l1_size + i];
            }
            sum += bias_weights[bias_addr + node_id];
            layer2[node_id] = max(0.0, sum);
        }
        workgroupBarrier();

        // Third layer
        weight_addr += l2_size * l1_size;
        bias_addr += l2_size;
        if((batch_id == 0) && (node_id < l3_size)) {
            sum = 0.0;
            for (i = 0; i < l2_size; i++) {
                sum += layer2[i] * weights[weight_addr + node_id * l2_size + i];
            }
            sum += bias_weights[bias_addr + node_id];
            layer3[node_id] = sum;
        }
        workgroupBarrier();

        // Update test result buffer
        if(id.x == 0) {
            d = exp(layer3[0]) + exp(layer3[1]) + exp(layer3[2]);
            test_results[test * 3] = exp(layer3[0])/d;
            test_results[test * 3 + 1] = exp(layer3[1])/d;
            test_results[test * 3 + 2] = exp(layer3[2])/d;
        }
        storageBarrier();        
    }
}
`;

const trainData = new Float32Array([5.1, 2.5, 3.0, 1.1, 5.8, 2.7, 3.9, 1.2, 5.4, 3.0, 4.5, 1.5, 6.2, 2.8, 4.8, 1.8, 6.1, 2.6, 5.6, 1.4, 6.7, 3.0, 5.2, 2.3, 6.0, 2.9, 4.5, 1.5, 4.3, 3.0, 1.1, 0.1, 4.7, 3.2, 1.3, 0.2, 6.5, 3.0, 5.2, 2.0, 7.2, 3.2, 6.0, 1.8, 6.3, 3.3, 4.7, 1.6, 6.9, 3.1, 5.4, 2.1, 6.0, 3.4, 4.5, 1.6, 5.5, 2.4, 3.8, 1.1, 7.4, 2.8, 6.1, 1.9, 6.3, 3.4, 5.6, 2.4, 6.5, 2.8, 4.6, 1.5, 7.3, 2.9, 6.3, 1.8, 5.1, 3.4, 1.5, 0.2, 5.4, 3.9, 1.7, 0.4, 5.2, 2.7, 3.9, 1.4, 6.9, 3.2, 5.7, 2.3, 5.5, 2.3, 4.0, 1.3, 6.0, 3.0, 4.8, 1.8, 5.6, 2.7, 4.2, 1.3, 5.6, 2.8, 4.9, 2.0, 6.8, 2.8, 4.8, 1.4, 6.9, 3.1, 4.9, 1.5, 7.2, 3.6, 6.1, 2.5, 6.3, 2.5, 4.9, 1.5, 5.9, 3.0, 4.2, 1.5, 6.7, 3.3, 5.7, 2.1, 5.7, 3.0, 4.2, 1.2, 6.4, 2.9, 4.3, 1.3, 5.0, 3.2, 1.2, 0.2, 5.0, 3.4, 1.5, 0.2, 6.2, 2.2, 4.5, 1.5, 5.9, 3.2, 4.8, 1.8, 5.6, 3.0, 4.1, 1.3, 5.4, 3.9, 1.3, 0.4, 5.0, 3.0, 1.6, 0.2, 5.9, 3.0, 5.1, 1.8, 5.0, 2.3, 3.3, 1.0, 6.4, 2.8, 5.6, 2.2, 4.8, 3.0, 1.4, 0.1, 5.4, 3.7, 1.5, 0.2, 6.4, 3.2, 5.3, 2.3, 4.6, 3.6, 1.0, 0.2, 5.0, 3.5, 1.3, 0.3, 4.8, 3.4, 1.9, 0.2, 6.3, 2.7, 4.9, 1.8, 6.3, 2.8, 5.1, 1.5, 5.2, 3.5, 1.5, 0.2, 6.1, 2.8, 4.0, 1.3, 6.7, 3.1, 4.7, 1.5, 6.0, 2.7, 5.1, 1.6, 5.1, 3.5, 1.4, 0.2, 5.5, 4.2, 1.4, 0.2, 6.5, 3.0, 5.5, 1.8, 4.4, 2.9, 1.4, 0.2, 7.9, 3.8, 6.4, 2.0, 6.4, 2.8, 5.6, 2.1, 6.9, 3.1, 5.1, 2.3, 5.0, 3.4, 1.6, 0.4, 6.0, 2.2, 5.0, 1.5, 6.1, 2.9, 4.7, 1.4, 5.6, 2.9, 3.6, 1.3, 4.5, 2.3, 1.3, 0.3, 5.7, 2.8, 4.1, 1.3, 5.2, 4.1, 1.5, 0.1, 6.1, 2.8, 4.7, 1.2, 6.8, 3.0, 5.5, 2.1, 6.1, 3.0, 4.9, 1.8, 5.8, 2.8, 5.1, 2.4, 5.5, 2.6, 4.4, 1.2, 4.9, 3.1, 1.5, 0.1, 6.5, 3.0, 5.8, 2.2, 5.8, 2.7, 5.1, 1.9, 4.6, 3.2, 1.4, 0.2, 6.6, 2.9, 4.6, 1.3, 6.3, 2.3, 4.4, 1.3, 6.3, 2.9, 5.6, 1.8, 4.9, 3.0, 1.4, 0.2, 5.7, 2.9, 4.2, 1.3, 5.0, 3.6, 1.4, 0.2, 7.7, 3.0, 6.1, 2.3, 7.2, 3.0, 5.8, 1.6, 6.2, 3.4, 5.4, 2.3, 5.1, 3.8, 1.6, 0.2, 6.0, 2.2, 4.0, 1.0, 6.4, 3.2, 4.5, 1.5, 5.5, 2.5, 4.0, 1.3, 5.6, 2.5, 3.9, 1.1, 5.0, 3.5, 1.6, 0.6, 6.7, 3.1, 5.6, 2.4, 7.0, 3.2, 4.7, 1.4, 6.7, 2.5, 5.8, 1.8, 5.4, 3.4, 1.7, 0.2, 4.9, 2.5, 4.5, 1.7, 6.4, 3.1, 5.5, 1.8, 5.8, 2.7, 5.1, 1.9, 4.8, 3.0, 1.4, 0.3, 6.6, 3.0, 4.4, 1.4, 4.8, 3.4, 1.6, 0.2, 6.2, 2.9, 4.3, 1.3, 5.5, 3.5, 1.3, 0.2, 5.7, 2.8, 4.5, 1.3, 4.8, 3.1, 1.6, 0.2, 5.8, 4.0, 1.2, 0.2, 6.3, 3.3, 6.0, 2.5, 5.4, 3.4, 1.5, 0.4, 4.9, 3.1, 1.5, 0.1, 4.4, 3.0, 1.3, 0.2, 5.1, 3.8, 1.9, 0.4, 4.7, 3.2, 1.6, 0.2, 5.0, 3.3, 1.4, 0.2, 5.1, 3.5, 1.4, 0.3, 5.8, 2.7, 4.1, 1.0, 5.3, 3.7, 1.5, 0.2, 6.8, 3.2, 5.9, 2.3, 5.1, 3.7, 1.5, 0.4, 7.7, 2.6, 6.9, 2.3, 5.7, 4.4, 1.5, 0.4, 5.7, 2.6, 3.5, 1.0, 7.7, 3.8, 6.7, 2.2, 5.7, 3.8, 1.7, 0.3, 7.1, 3.0, 5.9, 2.1, 4.9, 3.1, 1.5, 0.1, 7.6, 3.0, 6.6, 2.1, 6.3, 2.5, 5.0, 1.9, 5.7, 2.5, 5.0, 2.0, 5.0, 2.0, 3.5, 1.0, 6.5, 3.2, 5.1, 2.0, 4.9, 2.4, 3.3, 1.0, 5.6, 3.0, 4.5, 1.5, 4.4, 3.2, 1.3, 0.2, 5.1, 3.8, 1.5, 0.3, 5.8, 2.6, 4.0, 1.2, 5.2, 3.4, 1.4, 0.2, 5.5, 2.4, 3.7, 1.0, 6.7, 3.3, 5.7, 2.5, 6.4, 2.7, 5.3, 1.9, 5.1, 3.3, 1.7, 0.5]);

const trainResults = new Float32Array([0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0]);

const testData = new Float32Array([4.6, 3.4, 1.4, 0.3, 4.6, 3.1, 1.5, 0.2, 7.7, 2.8, 6.7, 2.0, 6.1, 3.0, 4.6, 1.4, 6.7, 3.1, 4.4, 1.4, 6.7, 3.0, 5.0, 1.7]);

// observed data
const testResults = new Float32Array([1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);

// Create top-level asynchronous function
async function runExample_ch09_iris_network() {

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    }

    // Access the client's GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    }

    // Create the command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    }

    // Define constants
    const batchSize = 16;
    const nodesPerLayer = 4; // one layer for one batch?
    const groupSize = batchSize * nodesPerLayer; // the whole computing task
    const numInputs = 4;
    const layer1Size = 4;
    const layer2Size = 4;
    const layer3Size = 3;
    const numTrainPoints = Math.trunc(trainData.length / numInputs);
    const numTestPoints = Math.trunc(testData.length / numInputs);
    const numWeights = layer1Size * numInputs + layer2Size * layer1Size + layer3Size * layer2Size;
    const numBias = layer1Size + layer2Size + layer3Size;
    const numEpochs = 150;
    const eta = 0.001;

    // Store training data
    const trainDataBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: trainData.length * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const trainDataRange = trainDataBuffer.getMappedRange();
    new Float32Array(trainDataRange).set(trainData);
    trainDataBuffer.unmap();

    // Store training results
    const trainResultBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: trainResults.length * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const trainResultsRange = trainResultBuffer.getMappedRange();
    new Float32Array(trainResultsRange).set(trainResults);
    trainResultBuffer.unmap();

    // Store node weights
    const sigma = Math.sqrt(2.0 / numInputs); // standard deviation
    const weightBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: numWeights * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });

    // Generate and store weights
    const weightData = new Array(numWeights);
    for (let i = 0; i < numWeights; i += 2) { // uniformly distributed weights
        let x1 = Math.random();
        let x2 = Math.random();
        weightData[i] = Math.sqrt(-2.0 * Math.log(x1)) * Math.cos(2 * Math.PI * x2) * sigma;
        weightData[i + 1] = Math.sqrt(-2.0 * Math.log(x1)) * Math.sin(2 * Math.PI * x2) * sigma;
    }
    const weightRange = weightBuffer.getMappedRange();
    new Float32Array(weightRange).set(weightData);
    weightBuffer.unmap();

    // Store bias weights
    let biasWeightData = new Array(numBias).fill(0.0);
    const biasWeightBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: numBias * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const biasWeightRange = biasWeightBuffer.getMappedRange();
    new Float32Array(biasWeightRange).set(biasWeightData);
    biasWeightBuffer.unmap();

    // Store test data
    const testDataBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: testData.length * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const testDataRange = testDataBuffer.getMappedRange();
    new Float32Array(testDataRange).set(testData);
    testDataBuffer.unmap();

    // Store test results computed by the GPU
    let testResultData = new Array(numTestPoints * 3).fill(0.0);
    const testResultBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: numTestPoints * 3 * 4,
        usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC
    });
    const testResultRange = testResultBuffer.getMappedRange();
    new Float32Array(testResultRange).set(testResultData);
    testResultBuffer.unmap();

    // Create the bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" },
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" },
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }, {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }, {
            binding: 4,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }, {
            binding: 5,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" }
        }]
    });

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: trainDataBuffer }
        },
        {
            binding: 1,
            resource: { buffer: trainResultBuffer }
        },
        {
            binding: 2,
            resource: { buffer: weightBuffer }
        },
        {
            binding: 3,
            resource: { buffer: biasWeightBuffer }
        },
        {
            binding: 4,
            resource: { buffer: testDataBuffer }
        },
        {
            binding: 5,
            resource: { buffer: testResultBuffer }
        }]
    });

    // Create the pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });

    // Create the shader module for the computeLoss shader
    const computeLossModule = device.createShaderModule({
        code: computeLoss
    });

    // Create the compute pass encoder
    const computePass = encoder.beginComputePass({
        label: "Compute Pass 0"
    });

    // Define the compute procedure
    const computePipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: {
            module: computeLossModule,
            entryPoint: "computeMain",
            constants: {
                group_size: groupSize,
                batch_size: batchSize,
                num_train_points: numTrainPoints,
                num_test_points: numTestPoints,
                num_inputs: numInputs,
                l1_size: layer1Size,
                l2_size: layer2Size,
                l3_size: layer3Size,
                num_weights: numWeights,
                num_bias: numBias,
                num_epochs: numEpochs,
                eta: eta
            }
        }
    });

    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);

    // Encode compute commands
    computePass.dispatchWorkgroups(1);

    // Complete encoding compute commands
    computePass.end();

    // Create mappable buffer
    const mappableBuffer = device.createBuffer({
        size: numTestPoints * 3 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Encode copy command
    encoder.copyBufferToBuffer(testResultBuffer, 0, mappableBuffer, 0, numTestPoints * 3 * 4);

    // Submit the commands to the GPU
    device.queue.submit([encoder.finish()]);

    // Read data from compute buffer
    await mappableBuffer.mapAsync(GPUMapMode.READ);
    const procData = mappableBuffer.getMappedRange();
    const floatData = new Float32Array(procData);

    let msg = "";
    for (let test = 0; test < numTestPoints; test++) {

        // Actual values
        var max_value = -999.0;
        var max_actual_index = -1;
        msg = msg.concat("Actual classification:&nbsp;&nbsp;");
        for (let i = 0; i < 3; i++) {
            msg = msg.concat(parseFloat(testResults[test * 3 + i]).toFixed(3)).concat(" ");
            if (testResults[test * 3 + i] > max_value) {
                max_value = testResults[test * 3 + i];
                max_actual_index = i;
            }
        }
        msg = msg.concat("<br />");

        // Actual values
        max_value = -999.0;
        var max_computed_index = -1;
        msg = msg.concat("Computed outputs:&nbsp;&nbsp;&nbsp;&nbsp;");
        for (let i = 0; i < 3; i++) {
            msg = msg.concat(parseFloat(floatData[test * 3 + i]).toFixed(3)).concat(" ");
            if (floatData[test * 3 + i] > max_value) { // classified data of the result
                max_value = testResults[test * 3 + i];
                max_computed_index = i;
            }
        }
        msg = msg.concat("<br />");

        // Display result
        if (max_actual_index == max_computed_index) {
            msg = msg.concat("Result: SUCCESS");
        } else {
            msg = msg.concat("Result: FAILURE");
        }
        msg = msg.concat("<br /><br />");
    }

    // Update label in page
    document.getElementById("results").innerHTML = msg;

    // Destroy the mapping
    mappableBuffer.unmap();
}

//document.getElementById("btn_Ch09_Iris_Network").addEventListener('click', IrisDeepLearning());

document.getElementById("btn_Ch09_Iris_Network").onclick = function () {
    // Run example function
    runExample_ch09_iris_network();
}
