export function arbre() {
  Promise.all([
    d3.text("./data/rpam_tree_id.csv"),
    d3.json("./data/tree.json")
  ]).then(function([csvText, jsonData]) {
    const infoMap = new Map();
    const lines = csvText.split(/\r?\n/);
    const header = lines.shift().split(",");
    const orgIndex = header.findIndex(h => h === "organisation");
    const regionIndex = header.findIndex(h => h === "region");
    const mrcIndex = header.findIndex(h => h === "mrc");
    const villeIndex = header.findIndex(h => h === "ville");

    lines.forEach(line => {
      if (line.trim() === "") return;
      const parts = line.split(",");
      if (parts.length <= orgIndex) return;

      const organisation = parts[orgIndex].trim();
      const region = parts[regionIndex] ? parts[regionIndex].trim() : "–";
      const mrc = parts[mrcIndex] ? parts[mrcIndex].trim() : "–";
      const ville = parts[villeIndex] ? parts[villeIndex].trim() : "–";
      const adresseParts = parts.slice(orgIndex + 1).map(s => s.trim()).filter(s => s.length > 0);
      const adresse = adresseParts.join(", ") || "–";

      if (organisation.length > 0) {
        infoMap.set(organisation, { region, mrc, ville, adresse });
      }
    });

    const margin = { top: 50, right: 300, bottom: 50, left: 120 };
    const containerEl = document.getElementById("tree-container");
    const width = (containerEl ? containerEl.clientWidth : window.innerWidth) - margin.left - margin.right;

    const root = d3.hierarchy(jsonData);
    const leavesCount = root.leaves().length;
    const nodeHeight = 40;
    const height = Math.max(leavesCount * nodeHeight*0.3, 600);

    const svg = d3.select("#tree-container")
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
      .attr("preserveAspectRatio", "xMidYMid meet");

    const container = svg.append("g");
    const g = container.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", event => container.attr("transform", event.transform));
    svg.call(zoom);

    const initialScale = 0.8;
    const initialTransform = d3.zoomIdentity.translate(width / 6, height / 8).scale(initialScale);
    svg.call(zoom.transform, initialTransform);

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    const treemap = d3.tree()
      .size([height, width])
      .separation((a, b) => (!a.children && !b.children) ? 2 : 1);

    const treeData = treemap(root);

    function getNodeColor(d) {
      let current = d;
      while (current.parent) {
        if (current.data.name === "Prélèvement") return "#e74c3c";
        if (current.data.name === "Transformation") return "#f39c12";
        if (current.data.name === "Distribution") return "#27ae60";
        current = current.parent;
      }
      return "#3498db";
    }

    function getFadedColor(color) {
      const colors = {
        "#e74c3c": "#f1c0c0",
        "#f39c12": "#f8d395",
        "#27ae60": "#9ed6b8",
        "#3498db": "#a8d0f0",
      };
      return colors[color] || "#d5d5d5";
    }

    const links = g.selectAll(".link")
      .data(treeData.descendants().slice(1))
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => `M${d.y},${d.x} C${(d.y + d.parent.y)/2},${d.x} ${(d.y + d.parent.y)/2},${d.parent.x} ${d.parent.y},${d.parent.x}`)
      .style("fill", "none")
      .style("stroke", "#d6d4d4")
      .style("stroke-width", "1.5px");

    const nodes = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    nodes.append("circle")
      .attr("r", d => d.children ? 8 : 5)
      .style("fill", d => getNodeColor(d))
      .style("stroke", "#fff")
      .style("stroke-width", "1px");

    nodes.append("text")
      .attr("dy", d => !d.children ? ".25em" : d.depth === 3 ? -15 : d.depth === 4 ? -10 : ".35em")
      .attr("x", d => !d.children ? 14 : (d.depth === 3 || d.depth === 4) ? 0 : -13)
      .style("text-anchor", d => !d.children ? "start" : (d.depth === 3 || d.depth === 4) ? "middle" : "end")
      .style("font-size", d => d.depth === 0 ? "14px" : d.depth === 1 ? "12px" : d.depth <= 3 ? "11px" : "10px")
      .style("font-weight", d => d.depth <= 2 ? "bold" : "normal")
      .text(d => d.data.name);

    nodes.on("mouseover", function(event, d) {
      const ancestors = d.ancestors();
      const descendants = d.descendants();
      const allRelated = new Set([...ancestors, ...descendants]);

      nodes.selectAll("circle")
        .classed("highlighted", node => allRelated.has(node))
        .classed("faded", node => !allRelated.has(node))
        .style("fill", node => allRelated.has(node) ? getNodeColor(node) : getFadedColor(getNodeColor(node)));

      links
        .classed("highlighted-link", link => allRelated.has(link))
        .classed("faded", link => !allRelated.has(link))
        .style("stroke", link => allRelated.has(link) ? getNodeColor(link) : "#e0e0e0");

      if (!d.children) {
        const info = infoMap.get(d.data.name.trim());
        if (info) {
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`
            <div style="min-width:260px;">
              <span style="font-size:15px; font-weight:bold;">${d.data.name}</span><br/>
              <span style="color:#000000; font-weight:bold;font-size:15px;">Région:</span> ${info.region}<br/>
              <span style="color:#000000; font-weight:bold;font-size:15px;">MRC:</span> ${info.mrc}<br/>
              <span style="color:#000000; font-weight:bold;font-size:15px;">Ville:</span> ${info.ville}<br/>
              <span style="color:#000000; font-weight:bold;font-size:15px;">Adresse:</span> ${info.adresse}
            </div>
          `)
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 20) + "px");
        }
        window.dispatchEvent(new CustomEvent("highlight-organisation", {
          detail: { organisation: d.data.name.trim() }
        }));
      }
    })
    .on("mouseout", function(event, d) {
      nodes.selectAll("circle")
        .classed("highlighted", false)
        .classed("faded", false)
        .style("fill", node => getNodeColor(node));
      links.classed("highlighted-link", false).classed("faded", false).style("stroke", "#d6d4d4");
      tooltip.transition().duration(500).style("opacity", 0);
      if (!d.children) {
        window.dispatchEvent(new CustomEvent("unhighlight-organisation", {
          detail: { organisation: d.data.name.trim() }
        }));
      }
    });

    // 🔄 Écoute des événements venant de la carte
    window.addEventListener("highlight-organisation", (e) => {
      const org = e.detail.organisation;
      g.selectAll(".node").select("circle")
        .filter(d => d.data.name === org)
        .transition().duration(200)
        .attr("r", 12)
        .style("stroke", "black")
        .style("stroke-width", "2px");
    });

    window.addEventListener("unhighlight-organisation", (e) => {
      const org = e.detail.organisation;
      g.selectAll(".node").select("circle")
        .filter(d => d.data.name === org)
        .transition().duration(200)
        .attr("r", d => d.children ? 8 : 5)
        .style("stroke", "#fff")
        .style("stroke-width", "1px");
    });

    d3.select("#zoom-in").on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });
    d3.select("#zoom-out").on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1/1.5);
    });
    d3.select("#zoom-reset").on("click", () => {
      svg.transition().duration(500).call(zoom.transform, initialTransform);
    });

    window.addEventListener("resize", () => {
      d3.select("#tree-container svg").remove();
      arbre();
    });
  });
}
