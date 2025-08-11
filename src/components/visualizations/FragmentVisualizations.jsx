import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

// Componente para visualización de red neuronal de fragmentos
export const FragmentNetworkVisualization = ({ fragments, connections, userProgress }) => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationData, setSimulationData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Preparar datos para la simulación
    const nodes = fragments.map(fragment => ({
      id: fragment.id,
      title: fragment.title,
      category: fragment.category,
      activated: fragment.activated,
      complexity: fragment.complexity,
      masteryLevel: userProgress[fragment.id] || 0,
      radius: 20 + (fragment.complexity * 5)
    }));

    const links = connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      strength: conn.strength || 1,
      type: conn.type || 'related'
    }));

    // Crear simulación de fuerzas
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 5));

    // Limpiar SVG
    svg.selectAll('*').remove();

    // Crear contenedor para zoom
    const g = svg.append('g');

    // Agregar zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Crear enlaces
    const link = g.append('g')
      .selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .style('stroke', d => {
        switch(d.type) {
          case 'prerequisite': return '#ff6b6b';
          case 'related': return '#4ecdc4';
          case 'emergent': return '#ffd93d';
          default: return '#6c757d';
        }
      })
      .style('stroke-width', d => Math.sqrt(d.strength * 3))
      .style('opacity', 0.7);

    // Crear nodos
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Círculos de nodos
    node.append('circle')
      .attr('r', d => d.radius)
      .style('fill', d => {
        if (d.activated) {
          return `hsl(${d.masteryLevel * 120}, 70%, 50%)`;
        }
        return '#6c757d';
      })
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('opacity', d => d.activated ? 1 : 0.5);

    // Texto de nodos
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '10px')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.title.substring(0, 10) + (d.title.length > 10 ? '...' : ''));

    // Indicadores de complejidad
    node.append('circle')
      .attr('r', 3)
      .attr('cx', d => d.radius - 5)
      .attr('cy', d => -d.radius + 5)
      .style('fill', d => {
        const colors = ['#28a745', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1'];
        return colors[d.complexity - 1] || '#6c757d';
      });

    // Actualizar posiciones en cada tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Eventos de click
    node.on('click', (event, d) => {
      setSelectedNode(d);
      event.stopPropagation();
    });

    // Funciones de drag
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [fragments, connections, userProgress]);

  return (
    <div className="w-full h-full relative">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="600" 
        className="bg-slate-900 rounded-lg border border-slate-700"
      />
      
      {/* Panel de información del nodo seleccionado */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-xs"
        >
          <h3 className="text-white font-semibold mb-2">{selectedNode.title}</h3>
          <p className="text-gray-300 text-sm mb-2">{selectedNode.category}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Complejidad:</span>
              <span className="text-white">{selectedNode.complexity}/5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Dominio:</span>
              <span className="text-white">{(selectedNode.masteryLevel * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estado:</span>
              <span className={selectedNode.activated ? 'text-green-400' : 'text-yellow-400'}>
                {selectedNode.activated ? 'Activado' : 'Bloqueado'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Cerrar
          </button>
        </motion.div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
        <h4 className="text-white font-semibold mb-2 text-sm">Leyenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-300">Prerrequisitos</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-500 rounded mr-2"></div>
            <span className="text-gray-300">Relacionados</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-300">Emergentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para visualización de progreso de dominio
export const MasteryProgressVisualization = ({ fragments, userProgress }) => {
  const canvasRef = useRef();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Crear visualización de ondas sinápticas
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    fragments.forEach((fragment, index) => {
      const angle = (index / fragments.length) * 2 * Math.PI;
      const progress = userProgress[fragment.id] || 0;
      const radius = maxRadius * (0.3 + progress * 0.7);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Dibujar conexiones sinápticas
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `hsla(${progress * 120}, 70%, 50%, ${progress})`;
      ctx.lineWidth = 2 + progress * 3;
      ctx.stroke();

      // Dibujar nodos
      ctx.beginPath();
      ctx.arc(x, y, 5 + progress * 10, 0, 2 * Math.PI);
      ctx.fillStyle = `hsl(${progress * 120}, 70%, 50%)`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etiquetas
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(fragment.title.substring(0, 15), x, y - 20);
    });

    // Dibujar núcleo central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

  }, [fragments, userProgress]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="bg-slate-900 rounded-lg border border-slate-700"
    />
  );
};

export default { FragmentNetworkVisualization, MasteryProgressVisualization };
