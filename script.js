// Graph data structure
let nodes = [];
let edges = [];
let nodeCounter = 0;
let visitedEdges = new Set(); // Add tracking for visited edges

// D3.js setup
const width = window.innerWidth - 300;
const height = window.innerHeight - 40;
const svg = d3.select('#graph-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Add zoom behavior
const zoom = d3.zoom()
    .scaleExtent([0.1, 4]) // Min and max zoom scale
    .on('zoom', (event) => {
        g.attr('transform', event.transform);
    });

// Create a group element for zooming
const g = svg.append('g');

// Apply zoom behavior to SVG
svg.call(zoom);

// Force simulation
const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id)
        .distance(300) // Aumenta ulteriormente la distanza tra i nodi
        .strength(0.3)) // Riduce ulteriormente la forza degli archi
    .force('charge', d3.forceManyBody()
        .strength(-1500) // Aumenta significativamente la forza repulsiva
        .distanceMax(500)) // Aumenta la distanza massima di repulsione
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide()
        .radius(100) // Aumenta ulteriormente il raggio di collisione
        .strength(1)) // Massima forza di collisione
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05));

// Event listeners
document.getElementById('addNode').addEventListener('click', addNode);
document.getElementById('addEdge').addEventListener('click', startEdgeCreation);
document.getElementById('clear').addEventListener('click', clearGraph);
document.getElementById('dfs').addEventListener('click', () => runAlgorithm('dfs'));
document.getElementById('bfs').addEventListener('click', () => runAlgorithm('bfs'));
document.getElementById('dijkstra').addEventListener('click', () => runAlgorithm('dijkstra'));
document.getElementById('generateRandom').addEventListener('click', generateRandomGraph);
document.getElementById('edgeProbability').addEventListener('input', updateProbabilityValue);
document.getElementById('resetAnimation').addEventListener('click', resetAnimation);

// Zoom control event listeners
document.getElementById('zoomIn').addEventListener('click', () => {
    svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 1.3);
});

document.getElementById('zoomOut').addEventListener('click', () => {
    svg.transition()
        .duration(300)
        .call(zoom.scaleBy, 0.7);
});

document.getElementById('resetZoom').addEventListener('click', () => {
    svg.transition()
        .duration(300)
        .call(zoom.transform, d3.zoomIdentity);
});

// Add node function
function addNode() {
    document.getElementById('status').textContent = 'Click anywhere on the graph to add a node';
    
    // Get the container dimensions and transform
    const container = document.getElementById('graph-container');
    const containerRect = container.getBoundingClientRect();
    const transform = d3.zoomTransform(svg.node());
    
    // Add click event to the graph container
    const clickHandler = function(event) {
        // Calculate position relative to the container and apply inverse transform
        const x = (event.clientX - containerRect.left - transform.x) / transform.k;
        const y = (event.clientY - containerRect.top - transform.y) / transform.k;
        
        // Create new node with position
        const node = {
            id: `node-${nodeCounter++}`,
            label: nodeCounter.toString(),
            x: x,
            y: y
        };
        
        // Add node to the array
        nodes.push(node);
        
        // Update the visualization
        updateGraph();
        
        // Remove the click handler and reset UI
        cleanupNodeAddition();
    };
    
    // Add click event listener
    container.addEventListener('click', clickHandler);
    
    // Add visual feedback
    container.style.cursor = 'crosshair';
    document.getElementById('addNode').classed('active', true);
    
    // Add escape key handler to cancel node addition
    const escapeHandler = function(event) {
        if (event.key === 'Escape') {
            cleanupNodeAddition();
        }
    };
    
    document.addEventListener('keydown', escapeHandler);
    
    // Cleanup function
    function cleanupNodeAddition() {
        container.removeEventListener('click', clickHandler);
        document.removeEventListener('keydown', escapeHandler);
        container.style.cursor = 'default';
        document.getElementById('addNode').classed('active', false);
        document.getElementById('status').textContent = 'Node addition cancelled';
    }
}

// Edge creation
let sourceNode = null;
let tempEdge = null;

function startEdgeCreation() {
    document.getElementById('status').textContent = 'Click on a source node';
    
    // Remove any existing temporary edge
    if (tempEdge) {
        tempEdge.remove();
        tempEdge = null;
    }
    
    // Reset all nodes
    g.selectAll('.node').classed('active', false);
    
    // Get container dimensions and transform
    const container = document.getElementById('graph-container');
    const containerRect = container.getBoundingClientRect();
    const transform = d3.zoomTransform(svg.node());
    
    // Add click handlers to nodes
    g.selectAll('.node')
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            if (!sourceNode) {
                // Select source node
                sourceNode = d;
                d3.select(this).classed('active', true);
                document.getElementById('status').textContent = 'Click on a target node';
                
                // Create temporary edge
                tempEdge = g.append('line')
                    .attr('class', 'edge temp-edge')
                    .attr('x1', d.x)
                    .attr('y1', d.y)
                    .attr('x2', d.x)
                    .attr('y2', d.y);
            } else {
                // Select target node
                if (sourceNode !== d) {
                    // Add the edge with the correct structure
                    edges.push({
                        source: sourceNode,
                        target: d,
                        weight: 1
                    });
                    
                    // Update the visualization
                    updateGraph();
                    
                    // Clean up
                    if (tempEdge) {
                        tempEdge.remove();
                        tempEdge = null;
                    }
                    sourceNode = null;
                    g.selectAll('.node').classed('active', false);
                    g.selectAll('.node').style('cursor', 'default');
                    document.getElementById('status').textContent = 'Edge added successfully';
                } else {
                    document.getElementById('status').textContent = 'Cannot connect a node to itself';
                }
            }
        });
    
    // Add mouse move handler for temporary edge
    g.on('mousemove', function(event) {
        if (sourceNode && tempEdge) {
            const x = (event.clientX - containerRect.left - transform.x) / transform.k;
            const y = (event.clientY - containerRect.top - transform.y) / transform.k;
            
            tempEdge
                .attr('x2', x)
                .attr('y2', y);
        }
    });
    
    // Add escape key handler to cancel edge creation
    const escapeHandler = function(event) {
        if (event.key === 'Escape') {
            if (tempEdge) {
                tempEdge.remove();
                tempEdge = null;
            }
            sourceNode = null;
            g.selectAll('.node').classed('active', false);
            g.selectAll('.node').style('cursor', 'default');
            document.getElementById('status').textContent = 'Edge creation cancelled';
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    
    document.addEventListener('keydown', escapeHandler);
}

// Clear graph
function clearGraph() {
    nodes = [];
    edges = [];
    nodeCounter = 0;
    updateGraph();
}

// Add bounds force
function forceBounds() {
    const padding = 50;
    return function force(alpha) {
        for (const node of nodes) {
            // Ensure nodes stay within bounds
            const oldX = node.x;
            const oldY = node.y;
            
            // Get the graph container dimensions
            const container = document.getElementById('graph-container');
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            
            // Apply bounds to container dimensions
            node.x = Math.max(padding, Math.min(containerWidth - padding, node.x));
            node.y = Math.max(padding, Math.min(containerHeight - padding, node.y));
            
            // Add visual feedback when hitting boundaries
            if (oldX !== node.x || oldY !== node.y) {
                d3.select(`#${node.id}`)
                    .transition()
                    .duration(200)
                    .style('filter', 'drop-shadow(0 0 10px rgba(231, 76, 60, 0.5))')
                    .transition()
                    .duration(200)
                    .style('filter', 'drop-shadow(0 0 5px rgba(52, 152, 219, 0.3))');
            }
        }
    };
}

// Update start node select
function updateStartNodeSelect() {
    const select = document.getElementById('startNode');
    select.innerHTML = '<option value="">Select a node</option>';
    
    nodes.forEach(node => {
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = `Node ${node.label}`;
        select.appendChild(option);
    });
}

// Update graph visualization
function updateGraph() {
    // Clear existing elements
    g.selectAll('.edge').remove();
    g.selectAll('.node').remove();

    // Create edges
    const edge = g.selectAll('.edge')
        .data(edges)
        .enter()
        .append('line')
        .attr('class', 'edge')
        .attr('id', d => `${d.source.id}-${d.target.id}`);

    // Create nodes
    const node = g.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('id', d => d.id)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    node.append('circle')
        .attr('r', 20);

    node.append('text')
        .attr('dy', '.3em')
        .attr('text-anchor', 'middle')
        .text(d => d.label);

    // Update simulation
    simulation.nodes(nodes);
    simulation.force('link').links(edges);

    // Add edge repulsion during simulation
    simulation.on('tick', () => {
        edgeRepulsion();
        
        edge
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Increase stabilization time
    setTimeout(() => {
        simulation.alpha(1).restart();
        simulation.alphaDecay(0.01);
    }, 100);

    // Update start node select
    updateStartNodeSelect();
}

// Drag functions
function dragStarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

function dragEnded(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

// Reset animation
function resetAnimation() {
    // Reset all node and edge styles
    svg.selectAll('.node').classed('active', false);
    svg.selectAll('.edge').classed('active', false);
    svg.selectAll('.edge').classed('visited', false);
    
    // Reset visited edges set
    visitedEdges.clear();
    
    // Reset status message
    document.getElementById('status').textContent = 'Animation reset';
    
    // Re-enable all algorithm buttons
    document.getElementById('dfs').disabled = false;
    document.getElementById('bfs').disabled = false;
    document.getElementById('dijkstra').disabled = false;
}

// Update algorithm implementation
async function runAlgorithm(type) {
    if (nodes.length === 0) {
        document.getElementById('status').textContent = 'Please add some nodes first';
        return;
    }

    const startNodeId = document.getElementById('startNode').value;
    if (!startNodeId) {
        document.getElementById('status').textContent = 'Please select a start node';
        return;
    }

    const startNode = nodes.find(n => n.id === startNodeId);
    if (!startNode) {
        document.getElementById('status').textContent = 'Invalid start node';
        return;
    }

    // Disable all algorithm buttons during animation
    document.getElementById('dfs').disabled = true;
    document.getElementById('bfs').disabled = true;
    document.getElementById('dijkstra').disabled = true;

    // Reset graph styling and visited edges
    resetAnimation();

    if (type === 'dijkstra') {
        // Dijkstra's algorithm implementation
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set(nodes);
        
        // Initialize distances
        nodes.forEach(node => {
            distances.set(node, Infinity);
        });
        distances.set(startNode, 0);

        while (unvisited.size > 0) {
            // Find node with minimum distance
            let current = null;
            let minDist = Infinity;
            for (const node of unvisited) {
                if (distances.get(node) < minDist) {
                    minDist = distances.get(node);
                    current = node;
                }
            }

            if (current === null) break;

            // Highlight current node
            d3.select(`#${current.id}`).classed('active', true);

            // Find connected edges
            const connectedEdges = edges.filter(e => 
                e.source.id === current.id || e.target.id === current.id
            );

            // Process neighbors
            for (const edge of connectedEdges) {
                const neighbor = edge.source.id === current.id ? edge.target : edge.source;
                if (!unvisited.has(neighbor)) continue;

                const edgeId = `${edge.source.id}-${edge.target.id}`;
                const edgeElement = d3.select(`#${edgeId}`);
                
                // Animate edge
                if (!visitedEdges.has(edgeId)) {
                    visitedEdges.add(edgeId);
                    edgeElement.classed('visited', true);
                    edgeElement
                        .classed('active', true)
                        .style('stroke-dasharray', '5,5')
                        .style('stroke-dashoffset', 10)
                        .transition()
                        .duration(1000)
                        .style('stroke-dashoffset', 0)
                        .transition()
                        .duration(500)
                        .style('stroke-dasharray', 'none');
                }

                const newDist = distances.get(current) + (edge.weight || 1);
                if (newDist < distances.get(neighbor)) {
                    distances.set(neighbor, newDist);
                    previous.set(neighbor, current);
                }
            }

            unvisited.delete(current);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        // DFS and BFS implementation
        const visited = new Set();
        const stack = [startNode];
        visited.add(startNode.id);

        while (stack.length > 0) {
            const current = type === 'dfs' ? stack.pop() : stack.shift();
            
            // Highlight current node
            d3.select(`#${current.id}`).classed('active', true);
            
            // Find connected edges
            const connectedEdges = edges.filter(e => 
                e.source.id === current.id || e.target.id === current.id
            );

            // Animate connected edges
            for (const edge of connectedEdges) {
                const edgeId = `${edge.source.id}-${edge.target.id}`;
                const edgeElement = d3.select(`#${edgeId}`);
                
                // Check if edge has been visited
                if (!visitedEdges.has(edgeId)) {
                    visitedEdges.add(edgeId);
                    edgeElement.classed('visited', true);
                    
                    // Animate the edge with a gradient effect
                    edgeElement
                        .classed('active', true)
                        .style('stroke-dasharray', '5,5')
                        .style('stroke-dashoffset', 10)
                        .transition()
                        .duration(1000)
                        .style('stroke-dashoffset', 0)
                        .transition()
                        .duration(500)
                        .style('stroke-dasharray', 'none');
                }
            }

            // Find neighbors
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    stack.push(neighbor);
                }
            }

            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    document.getElementById('status').textContent = `${type.toUpperCase()} completed`;
    
    // Re-enable all algorithm buttons
    document.getElementById('dfs').disabled = false;
    document.getElementById('bfs').disabled = false;
    document.getElementById('dijkstra').disabled = false;
}

function getNeighbors(node) {
    return edges
        .filter(e => e.source.id === node.id || e.target.id === node.id)
        .map(e => e.source.id === node.id ? e.target : e.source);
}

// Random Graph Generation
function updateProbabilityValue() {
    const value = document.getElementById('edgeProbability').value;
    document.getElementById('probabilityValue').textContent = `${value}%`;
}

function generateRandomGraph() {
    const nodeCount = parseInt(document.getElementById('nodeCount').value);
    const probability = parseInt(document.getElementById('edgeProbability').value) / 100;

    // Clear existing graph
    nodes = [];
    edges = [];
    nodeCounter = 0;

    // Generate nodes with initial positions
    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        const node = {
            id: `node-${nodeCounter++}`,
            label: (i + 1).toString(),
            x: width / 2 + radius * Math.cos(angle),
            y: height / 2 + radius * Math.sin(angle)
        };
        nodes.push(node);
    }

    // Generate edges based on probability
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() < probability) {
                edges.push({
                    source: nodes[i],
                    target: nodes[j],
                    weight: Math.floor(Math.random() * 10) + 1
                });
            }
        }
    }

    // Stop any existing simulation
    simulation.stop();

    // Update visualization
    updateGraph();

    // Restart simulation with new data
    simulation.nodes(nodes);
    simulation.force('link').links(edges);
    simulation.alpha(0.3).restart();

    document.getElementById('status').textContent = `Generated random graph with ${nodeCount} nodes`;
}

// Funzione per calcolare la repulsione tra gli archi
function edgeRepulsion() {
    const k = 100; // Costante di repulsione
    const edges = simulation.force('link').links();
    
    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            const e1 = edges[i];
            const e2 = edges[j];
            
            // Calcola il punto medio di ogni arco
            const mid1 = {
                x: (e1.source.x + e1.target.x) / 2,
                y: (e1.source.y + e1.target.y) / 2
            };
            const mid2 = {
                x: (e2.source.x + e2.target.x) / 2,
                y: (e2.source.y + e2.target.y) / 2
            };
            
            // Calcola la distanza tra i punti medi
            const dx = mid2.x - mid1.x;
            const dy = mid2.y - mid1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) { // Soglia di repulsione
                const force = k / (distance * distance);
                const fx = force * dx / distance;
                const fy = force * dy / distance;
                
                // Applica la forza ai nodi
                e1.source.vx -= fx;
                e1.source.vy -= fy;
                e1.target.vx -= fx;
                e1.target.vy -= fy;
                e2.source.vx += fx;
                e2.source.vy += fy;
                e2.target.vx += fx;
                e2.target.vy += fy;
            }
        }
    }
} 
