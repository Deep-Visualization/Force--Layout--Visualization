function simulate(data, svg) {
    const width = parseInt(svg.attr("viewBox").split(' ')[2]);
    const height = parseInt(svg.attr("viewBox").split(' ')[3]);
    const main_group = svg.append("g").attr("transform", "translate(0, 50)");

    // Calculate node degrees
    let node_degree = {};
    data.links.forEach(d => {
        node_degree[d.source] = (node_degree[d.source] || 0) + 1;
        node_degree[d.target] = (node_degree[d.target] || 0) + 1;
    });

    // Define radius scale based on node degree
    const scale_radius = d3.scaleSqrt()
        .domain(d3.extent(Object.values(node_degree)))
        .range([3, 12]);

    // Calculate country counts
    const countryCounts = {};
    data.nodes.forEach(node => {
        const countries = node["Affiliation Countries"];
        if (countries) {
            countries.forEach(country => {
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            });
        }
    });

    // Get top 10 countries
    const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);

    // Color scale for countries
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(topCountries);

console.log("Top Countries: ", topCountries);

    // Get color by country
    const getColorByCountry = (countries) => {
        if (countries) {
            let maxCount = -1;
            let selectedCountry = null;
            for (const country of countries) {
                const index = topCountries.indexOf(country);
                if (index !== -1 && countryCounts[country] > maxCount) {
                    maxCount = countryCounts[country];
                    selectedCountry = country;
                }
            }
            if (selectedCountry !== null) {
                console.log(`Node with countries ${countries} gets color: purple`);
                return "purple"; // Highlight top countries with purple
            }
        }
        console.log(`Node with countries ${countries} gets color: orange`);
        return "#FF8C00";
    };
    

    // Append link elements
    const link_elements = main_group.append("g")
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke", "#aaa");

    // Append node elements
     // Append node elements
const node_elements = main_group.append("g")
.attr('transform', `translate(${width / 2},${height / 2})`)
.selectAll(".circle")
.data(data.nodes)
.enter()
.append('g')
.on("mouseover", function (event, d) {
    const affiliations = d["Affiliation"];
    // Highlight related nodes
    node_elements.selectAll("circle").style("opacity", nd => 
        nd["Affiliation"]?.some(a => affiliations.includes(a)) ? 1 : 0.2);

    // Show tooltip
    const tooltip = d3.select(".tooltip");
    tooltip.transition().duration(200).style("opacity", .9);
    tooltip.html(`Author: ${d.Authors}<br>Affiliation: ${d.Affiliation.join(", ")}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
})
.on("mouseout", function () {
    // Reset node opacity
    node_elements.selectAll("circle").style("opacity", 1);

    // Hide tooltip
    const tooltip = d3.select(".tooltip");
    tooltip.transition().duration(200).style("opacity", 0);
});

// Append circles for nodes
node_elements.append("circle")
.attr("r", d => scale_radius(node_degree[d.id] || 0))
.attr("fill", d => getColorByCountry(d["Affiliation Countries"]));


    // Force simulation
    const ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide", d3.forceCollide().radius(d => scale_radius(node_degree[d.id] || 0) * 1.2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody().strength(-50))
        .force("link", d3.forceLink(data.links).id(d => d.id).strength(0.5))
        .on("tick", ticked);

    // Update node and link positions on each tick
    function ticked() {
        node_elements.attr('transform', d => `translate(${d.x},${d.y})`);
        link_elements
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }

    // Zoom functionality
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", ({ transform }) => main_group.attr("transform", transform)));
}
