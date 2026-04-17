// Create top-level asynchronous function
async function runExample() {

    var msg_array = ["<h1>gpu presentation</h1>"];

    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    } else {
        msg_array.push("WebGPU supported");
    }

    // Access the GPUAdapter
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No GPUAdapter found");
    } else {
        msg_array.push("GPUAdapter found");
    }

    // Access the GPU
    const device = await adapter.requestDevice();
    if (!device) {
        throw new Error("Failed to create a GPUDevice");
    } else {
        msg_array.push("GPUDevice created");
    }

    // Access the canvas
    const canvas = document.getElementById("canvas_example");
    if (!canvas) {
        throw new Error("Could not access canvas in page");
    } else {
        msg_array.push("Accessed canvas in page");
    }

    // Obtain a WebGPU context for the canvas
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw new Error("Could not obtain WebGPU context for canvas");
    } else {
        msg_array.push("Obtained WebGPU context for canvas");
    }

    // Get the best pixel format
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    // Configure the context with the device and format
    context.configure({
        device: device,
        format: canvasFormat,
    });

    /*
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
    // Display messages
    for (var i = 0; i < msg_array.length; i++) {
        document.write(msg_array[i] + "<br /><br />"); // conflict with gpu drawing?
    }
    */

    

    // Create a command encoder
    const encoder = device.createCommandEncoder();
    if (!encoder) {
        throw new Error("Failed to create a GPUCommandEncoder");
    } else {
        msg_array.push("GPUCommandEncoder created");
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

    const vertexData = new Float32Array([
        0.0, 0.5, 0.0, 1.0, 0.0, // First vertex
        -0.5, -0.5, 1.0, 0.0, 0.0, // Second vertex
        0.5, -0.5, 0.0, 0.0, 1.0 // Third vertex
    ]);

    // Create a vertex buffer
    const vertexBuffer = device.createBuffer({
        label: "Example vertex buffer",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Write attribute data to the vertex buffer
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);
    // Associate a vertex buffer with the render pass encoder
    renderPassEncoder.setVertexBuffer(0, vertexBuffer);

    // Define the layout of a vertex buffer
    const bufferLayout = {
        arrayStride: 20,
        attributes: [
            { format: "float32x2", offset: 0, shaderLocation: 0 },
            { format: "float32x3", offset: 8, shaderLocation: 1 }
        ],
    };

    const shaderCode = `
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

    // Create the shader module
    const shaderModule = device.createShaderModule({
        label: "Example shader module",
        code: shaderCode
    });

    /*
    const uniformData = new Float32Array([
        0.866, 0.5, 0.0, 0.0, // First column of matrix
        -0.5, 0.866, 0.0, 0.0, // Second column of matrix
        0.0, 0.0, 1.0, 0.0, // Third column of matrix
        0.0, 0.0, 0.0, 1.0, // Fourth column of matrix
    ]);

    const uniformBuffer = device.createBuffer({
        label: "Uniform Buffer 0",
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    */
    // render pipeline
    const renderPipeline = device.createRenderPipeline({
        label: "Example pipeline",
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
        /*
       primitive: {
           topology: "triangle-list",
           stripIndexFormat: "uint32",
           frontFace: "cw",
           cullMode: "back"
           }
       */
    });
    /*
    // Access the bind group layout
    bindGroupLayout = renderPipeline.getBindGroupLayout(0);

    // Create the bind group
    let bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer }
            }
        ]
    });

    // Associate bind group with render pass encoder
    renderPassEncoder.setBindGroup(0, bindGroup);
    */
    // associate the pipeline with the render pass encoder
    renderPassEncoder.setPipeline(renderPipeline);

    // Draw vertices and complete rendering
    renderPassEncoder.draw(3);

    // encoding end, stop recording the rendering commands
    renderPassEncoder.end();

    // submit the render commands to the gpu
    device.queue.submit([encoder.finish()]); // create the command buffer and submit to the gpu
}

// Run example function
runExample();
