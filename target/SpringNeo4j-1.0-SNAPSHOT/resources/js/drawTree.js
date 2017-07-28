/**
 * Created by Bean on 27-Jul-17.
 */
function graph(position) {
    // Initialise the graph object
    var graph = this.graph = {
        "nodes":[],
        "links":[]
    };

    // Add and remove elements on the graph object
    this.addNode = function(id, labels, name, color){
        graph["nodes"].push({id: id, label: labels, title: name, color: color});
        update();
    }

    this.addLink = function (source, target, type) {
        graph["links"].push({"source":findNode(nodes, source),"target":findNode(nodes, target), "type":type});
        update();
    }

    function findNode(a, id) {
        for (var i = 0; i < a.length; i++) {
            if (a[i].id == id) return i;
        }
        return null;
    }

    // set up the D3 visualisation in the specified element
    var w = $(position).innerWidth(),
        h = $(position).innerHeight();

    var svg = d3.select(position).append("svg")
        .attr("width", w)
        .attr("height", h);

    var force = d3.layout.force()
        .nodes(graph.nodes)
        .links(graph.links)
        .size([w, h])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var update = function(){
        // Compute the distinct nodes from the links.
        links.forEach(function (link) {
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        var path = svg.selectAll("path")
            .data(graph.links())
            .enter().insert("path")
            .style("stroke", function (d) {
                if (d.type == "has") return "#6600FF";
                if (d.type == "written_in") return "#CC66FF";
                if (d.type == "appears") return "#FF66FF";
            })
            .attr("class", function (d) {
                return "link " + d.type;
            });

        //delete old links
        path.exit().remove();

        var circle = svg.append("g").selectAll("circle")
            .data(graph.nodes())
            .enter().append("circle")
            .attr("r", function (d) {
                if (d.label == "Root") return 12;
                if (d.label == "Timestamp") return 10;
                if (d.label == "Topic") return 8;
                if (d.label == "Paper") return 6;
            })
            .style("fill", function (d) {
                return d.color;
            })
            .call(force.drag);

        var text = svg.append("g").selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function (d) {
                if (d.label == "Paper") return d.id;
                return d.title;
            });

        //delete old nodes
        circle.exit().remove();
        text.exit().remove();

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", linkArc);
            circle.attr("transform", transform);
            text.attr("transform", transform);
        }

        function linkArc(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        }

        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        // Restart the force layout.
        force
            .nodes(graph.nodes)
            .links(graph.links)
            .start();
    }

    //Make it go
    update();
}

// functions to convert Neo4j res to d3 format
function idIndex(a, id) {
    for (var i = 0; i < a.length; i++) {
        if (a[i].id == id) return i;
    }
    return null;
}

function convertToJson(res) {
    console.log("res");
    console.log(JSON.stringify(res));
    var nodes = nodeArr, links = linkArr;
    res.results[0].data.forEach(function (row) {
        row.graph.nodes.forEach(function (n) {
            if (idIndex(nodes, n.id) == null) {
                if (n.properties.name) {
                    if (n.properties.name == "Topic Evolution") graph.addNode(
                        n.id,
                        n.labels[0],
                        n.properties.name,
                        "#FFCC00"
                    )
                    else graph.addNode(n.id, n.labels[0], n.properties.name, "#FF66FF");     //topic
                }
                else if (n.properties.title) graph.addNode(
                    n.id,
                    n.labels[0],
                    n.properties.title,
                    "#CC66FF"
                );     //paper
                else graph.addNode(n.id, n.labels[0], n.properties.value, "#6600FF");     //timestamp
            }
        });
        links = links.concat(row.graph.relationships.map(function (r) {
            graph.addLink(r.startNode, r.endNode, r.type);
            //return {source: idIndex(nodes, r.startNode), target: idIndex(nodes, r.endNode), type: r.type};
        }));
    });
}

$.ajaxSetup({
    headers: {
        "Authorization": 'Basic ' + window.btoa("neo4j" + ":" + "1234567")
    }
});

graph = new graph("#vis");
$.ajax({
    type: "POST",
    url: "http://localhost:7474/db/data/transaction/commit",
    data: JSON.stringify({
        statements: [{
            //statement: "MATCH (n) MATCH p=()-[]-(n) WHERE EXISTS(n.title) RETURN n.title, p limit 10",
            statement: "MATCH p=()-[r:has]-() return p",
//                parameters: params || {},
            resultDataContents: ["row", "graph"]
        }]
    }),
    dataType: "json",
    contentType: "application/json;charset=UTF-8",
    error: function (err) {
        console.log(err)
    },
    success: function (res) {
        console.log(res)
        convertToJson(res);
    }
});

graph.on("click", function (d) {
    console.log(d.title);
})