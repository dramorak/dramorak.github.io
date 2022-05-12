function drawFractal(node){
    // Stop drawing if the node is too small
    if(size < meta.sizeLimit){ return; }

    // draw current node
    node.draw();

    // For each branch, transform the node and call drawFractal on the transformed node.
    for(let i = 0; i < fractal.branches.length; i++){
        let transformation = fractal.branches[i];
        drawFractal(transformation.apply(node));
    }
}