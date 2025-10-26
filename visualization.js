/**
 * Clase para visualizar autómatas usando D3.js
 */
class AutomataVisualizer {
    constructor(svgSelector) {
        this.svg = d3.select(svgSelector);
        this.width = 800;
        this.height = 500;
        this.currentAutomaton = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        
        this.setupSVG();
        this.setupZoom();
        this.setupMarkers();
    }

    /**
     * Configura el SVG base
     */
    setupSVG() {
        this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background', '#ffffff')
            .style('border', '1px solid #e2e8f0')
            .style('border-radius', '0.5rem');

        // Añadir patrón de grilla sutil
        const defs = this.svg.select('defs').empty() ? this.svg.append('defs') : this.svg.select('defs');
        
        const pattern = defs.append('pattern')
            .attr('id', 'grid')
            .attr('width', 20)
            .attr('height', 20)
            .attr('patternUnits', 'userSpaceOnUse');
            
        pattern.append('path')
            .attr('d', 'M 20 0 L 0 0 0 20')
            .attr('fill', 'none')
            .attr('stroke', '#f1f5f9')
            .attr('stroke-width', 0.5);

        // Fondo con grilla
        this.svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'url(#grid)');

        // Grupo principal para zoom y pan
        this.mainGroup = this.svg.append('g')
            .attr('class', 'main-group');
    }

    /**
     * Configura el zoom y pan
     */
    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.mainGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    /**
     * Configura los marcadores para las flechas
     */
    setupMarkers() {
        const defs = this.svg.append('defs');

        // Marcador para flechas normales estilo Graphviz
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L8,0L0,4L2,0Z')
            .attr('fill', '#2c3e50');

        // Marcador para flechas activas estilo Graphviz
        defs.append('marker')
            .attr('id', 'arrowhead-active')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-4L8,0L0,4L2,0Z')
            .attr('fill', '#e74c3c');
    }

    /**
     * Visualiza un autómata
     * @param {FiniteAutomaton} automaton - Autómata a visualizar
     */
    visualize(automaton) {
        this.currentAutomaton = automaton;
        // Ajustar al contenedor antes de preparar datos
        this.fitToContainer();
        this.prepareData();
        this.createSimulation();
        this.render();
        // Centrar al finalizar el primer render
        setTimeout(() => this.centerGraph(), 0);
    }

    /**
     * Prepara los datos para la visualización
     */
    prepareData() {
        if (!this.currentAutomaton) return;

        const info = this.currentAutomaton.getInfo();
        
        // Crear nodos con posicionamiento tipo Graphviz
        this.nodes = info.states.map((state, index) => ({
            id: state,
            name: state,
            isInitial: state === info.initialState,
            isFinal: info.finalStates.includes(state),
            x: this.calculateGraphvizPosition(state, index, info.states.length).x,
            y: this.calculateGraphvizPosition(state, index, info.states.length).y,
            fx: null, // Permitir que se muevan inicialmente
            fy: null
        }));

        // Crear enlaces (transiciones) AGRUPADOS por (from->to) para una etiqueta por par
        this.links = [];
        const transitionGroups = new Map();

        info.transitions.forEach(tr => {
            const key = `${tr.from}__${tr.to}`;
            if (!transitionGroups.has(key)) {
                transitionGroups.set(key, { source: tr.from, target: tr.to, symbols: new Set() });
            }
            transitionGroups.get(key).symbols.add(tr.symbol);
        });

        // Determinar direcciones opuestas y construir links finales
        transitionGroups.forEach((group, key) => {
            const oppKey = `${group.target}__${group.source}`;
            const hasOpposite = transitionGroups.has(oppKey);
            this.links.push({
                source: group.source,
                target: group.target,
                symbols: Array.from(group.symbols),
                label: Array.from(group.symbols).join(', '),
                hasOpposite
            });
        });
    }

    /**
     * Calcula posiciones estilo Graphviz mejorado
     */
    calculateGraphvizPosition(state, index, totalStates) {
        const info = this.currentAutomaton.getInfo();
        const centerY = this.height / 2;
        const margin = 80;
        
        // Crear capas horizontales
        const layers = this.createLayers(info);
        
        // Encontrar en qué capa está este estado
        for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            const layer = layers[layerIndex];
            const stateIndex = layer.indexOf(state);
            
            if (stateIndex !== -1) {
                const layerWidth = this.width - (2 * margin);
                const layerX = margin + (layerIndex * layerWidth) / (layers.length - 1);
                
                // Distribuir verticalmente dentro de la capa
                if (layer.length === 1) {
                    return { x: layerX, y: centerY };
                } else {
                    const spacing = Math.min(100, (this.height - 2 * margin) / (layer.length - 1));
                    const startY = centerY - ((layer.length - 1) * spacing) / 2;
                    return { 
                        x: layerX, 
                        y: startY + (stateIndex * spacing)
                    };
                }
            }
        }
        
        // Fallback
        return { x: this.width / 2, y: centerY };
    }

    /**
     * Crea capas de estados para layout jerárquico
     */
    createLayers(info) {
        const layers = [];
        const visited = new Set();
        
        // Capa 0: Estado inicial
        if (info.initialState) {
            layers.push([info.initialState]);
            visited.add(info.initialState);
        }
        
        // Encontrar estados por niveles usando BFS
        let currentLayer = [info.initialState];
        
        while (currentLayer.length > 0 && visited.size < info.states.length) {
            const nextLayer = [];
            
            for (const state of currentLayer) {
                // Encontrar estados alcanzables desde este estado
                const reachableStates = info.transitions
                    .filter(t => t.from === state && !visited.has(t.to))
                    .map(t => t.to);
                
                for (const reachableState of reachableStates) {
                    if (!visited.has(reachableState) && !nextLayer.includes(reachableState)) {
                        nextLayer.push(reachableState);
                        visited.add(reachableState);
                    }
                }
            }
            
            if (nextLayer.length > 0) {
                layers.push(nextLayer);
                currentLayer = nextLayer;
            } else {
                break;
            }
        }
        
        // Añadir estados no visitados (desconectados) en la última capa
        const unvisited = info.states.filter(s => !visited.has(s));
        if (unvisited.length > 0) {
            layers.push(unvisited);
        }
        
        return layers;
    }

    /**
     * Crea la simulación de fuerzas
     */
    createSimulation() {
        if (this.simulation) {
            this.simulation.stop();
        }

        // Simulación muy suave para mantener posiciones calculadas
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => {
                    // Distancia variable según la diferencia de capas
                    const dx = Math.abs(d.source.x - d.target.x);
                    return Math.max(100, dx * 0.8);
                })
                .strength(0.1)) // Muy débil para no mover mucho
            .force('charge', d3.forceManyBody()
                .strength(-100)) // Repulsión muy suave
            .force('collision', d3.forceCollide()
                .radius(30))
            .alpha(0.1) // Movimiento mínimo
            .alphaDecay(0.1) // Convergencia rápida
            .on('end', () => {
                // Fijar posiciones una vez que termine la simulación
                this.nodes.forEach(d => {
                    d.fx = d.x;
                    d.fy = d.y;
                });
            });
    }

    /**
     * Renderiza la visualización
     */
    render() {
        // Limpiar contenido anterior
        this.mainGroup.selectAll('*').remove();

        // Crear enlaces
        const linkGroup = this.mainGroup.append('g')
            .attr('class', 'links');

        const link = linkGroup.selectAll('.link')
            .data(this.links)
            .enter().append('g')
            .attr('class', 'link-group');

        // Líneas de transición estilo Graphviz
        const linkPath = link.append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 1.5)
            .attr('marker-end', 'url(#arrowhead)');

        // Fondo blanco más prominente para las etiquetas (mejor legibilidad)
        const linkLabelBg = link.append('text')
            .attr('class', 'link-label-bg')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '13px')
            .attr('font-weight', '500')
            .attr('fill', 'white')
            .attr('stroke', 'white')
            .attr('stroke-width', 4) // Aumentado para mejor contraste
            .style('font-family', 'serif')
            .text(d => d.label);

        // Etiquetas de transición más cerca de las líneas
        const linkLabel = link.append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '13px')
            .attr('font-weight', '500')
            .attr('fill', '#2c3e50')
            .style('font-family', 'serif') // Fuente serif como en diagramas académicos
            .text(d => d.label);

        // Crear nodos
        const nodeGroup = this.mainGroup.append('g')
            .attr('class', 'nodes');

        const node = nodeGroup.selectAll('.node')
            .data(this.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));

        // Círculos de estados estilo Graphviz
        node.append('circle')
            .attr('r', 25)
            .attr('fill', '#f8f9fa')
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', d => {
                if (d.isInitial && d.isFinal) return 3;
                if (d.isInitial || d.isFinal) return 2.5;
                return 1.5;
            })
            .attr('stroke-dasharray', d => d.isFinal ? '3,3' : 'none');

        // Círculo doble para estados finales (estilo Graphviz)
        node.filter(d => d.isFinal)
            .append('circle')
            .attr('r', 20)
            .attr('fill', 'none')
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 1.5);

        // Etiquetas de estados con estilo académico
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '16px')
            .attr('font-weight', 'normal')
            .attr('fill', '#2c3e50')
            .style('font-family', 'serif')
            .style('font-style', 'italic') // Cursiva como en diagramas académicos
            .text(d => d.name);

        // Flecha de entrada para estado inicial (estilo Graphviz)
        node.filter(d => d.isInitial)
            .append('g')
            .attr('class', 'initial-arrow')
            .each(function() {
                const g = d3.select(this);
                // Línea de entrada
                g.append('line')
                    .attr('x1', -50)
                    .attr('y1', 0)
                    .attr('x2', -30)
                    .attr('y2', 0)
                    .attr('stroke', '#2c3e50')
                    .attr('stroke-width', 1.5)
                    .attr('marker-end', 'url(#arrowhead)');
            });

        // Actualizar posiciones en cada tick de la simulación
        this.simulation.on('tick', () => {
            // Actualizar posiciones de enlaces con curvas estilo Graphviz
            linkPath.attr('d', d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Ajustar puntos para que las flechas no se superpongan con los círculos
                const radius = 25;
                const sourceX = d.source.x + (dx / distance) * radius;
                const sourceY = d.source.y + (dy / distance) * radius;
                const targetX = d.target.x - (dx / distance) * radius;
                const targetY = d.target.y - (dy / distance) * radius;
                
                // Si es un self-loop
                if (d.source.id === d.target.id) {
                    const loopRadius = 35;
                    const offsetX = 25;
                    const offsetY = -25;
                    return `M${d.source.x + offsetX},${d.source.y + offsetY}
                           A${loopRadius},${loopRadius} 0 1,1 ${d.source.x + offsetX},${d.source.y - offsetY}`;
                }
                
                // Verificar si hay transición opuesta para ajustar curvatura
                const hasOpposite = this.links.some(link => 
                    link.source.id === d.target.id && link.target.id === d.source.id
                );
                
                // Para transiciones horizontales (entre capas)
                const isHorizontal = Math.abs(dx) > Math.abs(dy);
                
                if (isHorizontal) {
                    // Ajustar curvatura si hay transición opuesta
                    const curvature = hasOpposite ? 0.3 : 0.1;
                    const midX = (sourceX + targetX) / 2;
                    const midY = (sourceY + targetY) / 2;
                    const controlX = midX;
                    
                    // Si hay transición opuesta, curvar hacia arriba o abajo
                    let controlY = midY;
                    if (hasOpposite) {
                        // Determinar dirección de curvatura basada en el orden de los estados
                        const curveDirection = d.source.id < d.target.id ? -1 : 1;
                        controlY = midY + (curveDirection * 30); // Reducido a 30 para curvas más suaves
                    } else {
                        controlY = midY + (sourceY < targetY ? -30 : 30) * curvature;
                    }
                    
                    return `M${sourceX},${sourceY} Q${controlX},${controlY} ${targetX},${targetY}`;
                } else {
                    // Curva normal para otras transiciones
                    const curvature = hasOpposite ? 0.5 : 0.3;
                    const midX = (sourceX + targetX) / 2;
                    const midY = (sourceY + targetY) / 2;
                    
                    let controlX, controlY;
                    if (hasOpposite) {
                        // Curvar más pronunciadamente si hay transición opuesta
                        const curveDirection = d.source.id < d.target.id ? 1 : -1;
                        controlX = midX + (curveDirection * 40); // Reducido a 40 para curvas más naturales
                        controlY = midY;
                    } else {
                        controlX = midX - dy * curvature;
                        controlY = midY + dx * curvature;
                    }
                    
                    return `M${sourceX},${sourceY} Q${controlX},${controlY} ${targetX},${targetY}`;
                }
            });

            // Función para calcular posición de etiquetas siguiendo la curva exacta
            const updateLabelPosition = (selection) => {
                selection
                    .attr('x', d => {
                        if (d.source.id === d.target.id) {
                            // Para self-loops, posicionar la etiqueta arriba del loop
                            return d.source.x + 35;
                        }
                        
                        // Verificar si hay transición opuesta
                        const hasOpposite = this.links.some(link => 
                            link.source.id === d.target.id && link.target.id === d.source.id
                        );
                        
                        const midX = (d.source.x + d.target.x) / 2;
                        
                        if (hasOpposite) {
                            const dx = d.target.x - d.source.x;
                            const dy = d.target.y - d.source.y;
                            const isHorizontal = Math.abs(dx) > Math.abs(dy);
                            
                            if (!isHorizontal) {
                                // Para transiciones verticales con opuesta, desplazar X
                                const curveDirection = d.source.id < d.target.id ? 1 : -1;
                                return midX + (curveDirection * 25);
                            }
                        }
                        
                        return midX;
                    })
                    .attr('y', d => {
                        if (d.source.id === d.target.id) {
                            // Para self-loops
                            return d.source.y - 35;
                        }
                        
                        const dx = d.target.x - d.source.x;
                        const dy = d.target.y - d.source.y;
                        const midY = (d.source.y + d.target.y) / 2;
                        
                        // Verificar si hay transición opuesta
                        const hasOpposite = this.links.some(link => 
                            link.source.id === d.target.id && link.target.id === d.source.id
                        );
                        
                        // Ajustar posición siguiendo la curva específica de cada línea
                        const isHorizontal = Math.abs(dx) > Math.abs(dy);
                        if (isHorizontal) {
                            if (hasOpposite) {
                                // Calcular la posición Y exacta de la curva en el punto medio
                                const curveDirection = d.source.id < d.target.id ? -1 : 1;
                                const curveY = midY + (curveDirection * 30); // Mismo valor que en la curva
                                return curveY + (curveDirection * -8); // Etiqueta ligeramente desplazada de la curva
                            } else {
                                return midY + (dy > 0 ? -8 : 8);
                            }
                        } else {
                            if (hasOpposite) {
                                // Para transiciones verticales, mantener Y centrado
                                return midY - 5;
                            } else {
                                return midY - 8;
                            }
                        }
                    });
            };

            // Actualizar posiciones de ambas etiquetas
            updateLabelPosition(linkLabelBg);
            updateLabelPosition(linkLabel);

            // Actualizar posiciones de nodos
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    /**
     * Maneja el inicio del arrastre
     */
    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * Maneja el arrastre
     */
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    /**
     * Maneja el final del arrastre
     */
    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    /**
     * Resalta el camino de ejecución
     * @param {Array} path - Camino de ejecución
     */
    highlightPath(path) {
        // Resetear estilos
        this.mainGroup.selectAll('.node circle')
            .classed('active', false)
            .attr('fill', '#ffffff');

        this.mainGroup.selectAll('.link')
            .classed('active', false)
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');

        if (!path || path.length === 0) return;

        // Resaltar estados en el camino
        path.forEach((step, index) => {
            setTimeout(() => {
                this.mainGroup.selectAll('.node')
                    .filter(d => d.id === step.state)
                    .select('circle')
                    .classed('active', true)
                    .attr('fill', '#2563eb');

                // Resaltar transición
                if (index > 0) {
                    const prevStep = path[index - 1];
                    this.mainGroup.selectAll('.link')
                        .filter(d => d.source.id === prevStep.state && d.target.id === step.state)
                        .classed('active', true)
                        .attr('stroke', '#2563eb')
                        .attr('stroke-width', 3)
                        .attr('marker-end', 'url(#arrowhead-active)');
                }
            }, index * 500);
        });
    }

    /**
     * Centra la visualización
     */
    centerGraph() {
        // Usar el tamaño actual del contenedor del SVG
        const svgNode = this.svg.node();
        const parentRect = svgNode.parentElement.getBoundingClientRect();
        this.width = parentRect.width || this.width;
        this.height = Math.max(400, parentRect.height || this.height);

        const bounds = this.mainGroup.node().getBBox();
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;

        if (width === 0 || height === 0) return;

        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.9;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    /**
     * Resetea el zoom
     */
    resetZoom() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    /**
     * Ajusta el SVG al tamaño del contenedor
     */
    fitToContainer() {
        const svgNode = this.svg.node();
        const parentRect = svgNode.parentElement.getBoundingClientRect();
        const w = parentRect.width || this.width;
        const h = Math.max(450, parentRect.height || this.height);
        this.width = w;
        this.height = h;
        this.svg.attr('width', w).attr('height', h);
    }

    /**
     * Limpia la visualización
     */
    clear() {
        if (this.simulation) {
            this.simulation.stop();
        }
        this.mainGroup.selectAll('*').remove();
        this.currentAutomaton = null;
        this.nodes = [];
        this.links = [];
    }

    /**
     * Redimensiona la visualización
     * @param {number} width - Nuevo ancho
     * @param {number} height - Nueva altura
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        this.svg
            .attr('width', width)
            .attr('height', height);

        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(width / 2, height / 2))
                .alpha(0.3)
                .restart();
        }
    }
}
