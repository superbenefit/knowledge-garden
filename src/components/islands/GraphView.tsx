import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode, ContentType } from "@/lib/types";

interface Props {
  data: GraphData;
  currentId?: string;
  width?: number;
  height?: number;
}

/** Map content type to a CSS custom property value */
function nodeColor(type: ContentType, isDark: boolean): string {
  switch (type) {
    case "pattern":
    case "playbook":
    case "protocol":
    case "practice":
    case "primitive":
    case "guide":
      return "var(--color-secondary, #2a521e)";
    case "reference":
    case "article":
    case "study":
    case "link":
      return "var(--color-tertiary, #448424)";
    default:
      return isDark
        ? "var(--color-gray, #b8b8b8)"
        : "var(--color-darkgray, #4e4e4e)";
  }
}

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

export default function GraphView({
  data,
  currentId,
  width: propWidth,
  height: propHeight,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth ?? 800,
    height: propHeight ?? 450,
  });

  // Responsive sizing
  useEffect(() => {
    if (propWidth && propHeight) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = propWidth ?? entry.contentRect.width;
        const h = propHeight ?? Math.min(600, Math.max(300, w * 0.55));
        setDimensions({ width: w, height: h });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  // D3 force simulation
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || data.nodes.length === 0) return;

    const { width, height } = dimensions;
    const isDark = document.documentElement.classList.contains("dark");

    // Clear previous
    d3.select(svg).selectAll("*").remove();

    // Build node and link copies for D3 simulation
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.links.map((l) => ({ ...l }));

    // Build adjacency set for hover highlighting
    const adjacency = new Set<string>();
    for (const link of data.links) {
      adjacency.add(`${link.source}->${link.target}`);
      adjacency.add(`${link.target}->${link.source}`);
    }
    function isConnected(a: string, b: string): boolean {
      return a === b || adjacency.has(`${a}->${b}`);
    }

    // Set up SVG
    const svgSel = d3
      .select(svg)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Container group for zoom/pan
    const g = svgSel.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", event.transform.toString());
      });

    svgSel.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3.forceManyBody<SimNode>().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<SimNode>(12));

    // Draw links
    const linkSel = g
      .append("g")
      .attr("class", "graph-links")
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", isDark ? "#555" : "#ccc")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1);

    // Draw nodes
    const nodeSel = g
      .append("g")
      .attr("class", "graph-nodes")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.id === currentId ? 8 : 6))
      .attr("fill", (d) => nodeColor(d.type, isDark))
      .attr("stroke", (d) =>
        d.id === currentId
          ? isDark
            ? "#fff"
            : "#000"
          : "none",
      )
      .attr("stroke-width", (d) => (d.id === currentId ? 2 : 0))
      .attr("cursor", "pointer");

    // Labels (hidden by default, shown on hover)
    const labelSel = g
      .append("g")
      .attr("class", "graph-labels")
      .selectAll<SVGTextElement, SimNode>("text")
      .data(nodes)
      .join("text")
      .text((d) => d.title)
      .attr("font-size", 11)
      .attr("dx", 10)
      .attr("dy", 4)
      .attr("fill", isDark ? "#e5e5e5" : "#2b2b2b")
      .attr("pointer-events", "none")
      .attr("opacity", 0);

    // Hover interactions
    nodeSel
      .on("mouseenter", (_event, d) => {
        // Show label for hovered node
        labelSel.attr("opacity", (l) => (l.id === d.id ? 1 : 0));

        // Highlight connected, dim others
        nodeSel.attr("opacity", (n) => (isConnected(d.id, n.id) ? 1 : 0.15));
        linkSel.attr("stroke-opacity", (l) => {
          const src = typeof l.source === "object" ? l.source.id : l.source;
          const tgt = typeof l.target === "object" ? l.target.id : l.target;
          return src === d.id || tgt === d.id ? 0.8 : 0.05;
        });
      })
      .on("mouseleave", () => {
        labelSel.attr("opacity", 0);
        nodeSel.attr("opacity", 1);
        linkSel.attr("stroke-opacity", 0.3);
      });

    // Click to navigate
    nodeSel.on("click", (_event, d) => {
      window.location.href = `/${d.type}/${d.id}`;
    });

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeSel.call(drag);

    // Tick
    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      nodeSel.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

      labelSel.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [data, currentId, dimensions]);

  if (data.nodes.length === 0) {
    return (
      <div ref={containerRef} style={{ width: "100%", minHeight: 200 }}>
        <p style={{ color: "var(--color-gray, #b8b8b8)", textAlign: "center", padding: "2rem" }}>
          No graph data available.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: "block", background: "transparent" }}
      />
    </div>
  );
}
